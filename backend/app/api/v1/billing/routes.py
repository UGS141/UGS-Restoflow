from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from typing import List

from app.database import get_db, get_redis
from app.api.deps import check_subscription_active, get_current_user
from app.models.billing import BillSyncBatch, BillResponse, BillCreate, SplitBillRequest, VoidBillRequest, RefundBillRequest
from app.models.user import UserRole

router = APIRouter()

async def get_next_bill_number(tenant_id: str, branch_id: str, db, redis) -> str:
    """
    Generates a sequential invoice number per tenant/branch using atomic increments.
    Prefers Redis for performance, falls back to MongoDB sequence collection if Redis is unavailable.
    """
    seq_key = f"seq:bill:{tenant_id}:{branch_id}"
    try:
        # Atomic increment via Redis
        if redis:
            val = await redis.incr(seq_key)
            return f"INV-{branch_id.upper()}-{val:06d}"
    except Exception:
        pass # Redis error, fallback to MongoDB
        
    # Atomic increment via MongoDB sequence document
    seq_doc = await db.sequences.find_one_and_update(
        {"_id": seq_key},
        {"$inc": {"value": 1}},
        upsert=True,
        return_document=True
    )
    val = seq_doc["value"]
    return f"INV-{branch_id.upper()}-{val:06d}"

@router.post("/sync", status_code=status.HTTP_200_OK)
async def sync_offline_bills(
    batch: BillSyncBatch,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db),
    redis = Depends(get_redis)
):
    """
    Processes a batch of offline POS bills.
    Resolves duplicates using client-side UUIDs to ensure idempotency.
    Triggers inventory updates and KDS WebSocket alerts.
    """
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"
    
    synced_bills = []
    skipped_count = 0
    now = datetime.now(timezone.utc)
    
    for bill in batch.bills:
        # Idempotency check: see if bill UUID already exists in DB
        existing = await db.bills.find_one({"id": bill.id})
        if existing:
            skipped_count += 1
            continue

        # Get next human-readable invoice number
        bill_number = await get_next_bill_number(tenant_id, branch_id, db, redis)
        
        # Prepare DB document
        bill_doc = bill.model_dump()
        bill_doc.update({
            "tenant_id": tenant_id,
            "branch_id": branch_id,
            "bill_number": bill_number,
            "synced_at": now.isoformat()
        })
        
        # Insert bill record
        await db.bills.insert_one(bill_doc)
        synced_bills.append(bill_number)
        
        # --- Audit Log Event ---
        await db.audit_logs.insert_one({
            "timestamp": now.isoformat(),
            "actor_id": current_user["_id"],
            "actor_email": current_user["email"],
            "action": "bill_synced",
            "tenant_id": tenant_id,
            "branch_id": branch_id,
            "details": {
                "bill_uuid": bill.id,
                "bill_number": bill_number,
                "grand_total": bill.grand_total
            }
        })
        
        # --- Asynchronous Stock Deduction Event ---
        # We trigger stock deduction. In a microservice this would go to a broker,
        # here we push to a background process or update inventory collections.
        for item in bill.items:
            await db.inventory_deductions.insert_one({
                "tenant_id": tenant_id,
                "branch_id": branch_id,
                "menu_item_id": item.menu_item_id,
                "quantity": item.quantity,
                "processed": False,
                "created_at": now.isoformat()
            })
            
        # --- Real-Time Sync Notifications (Redis PubSub / WebSocket Broadcast) ---
        try:
            if redis:
                # Notify KDS and layout layers of the new synced order
                channel = f"pubsub:{tenant_id}:{branch_id}:orders"
                await redis.publish(channel, f"NEW_ORDER:{bill_number}:{bill.grand_total}")
        except Exception:
            pass

    return {
        "status": "success",
        "synced_count": len(synced_bills),
        "skipped_duplicates": skipped_count,
        "synced_invoices": synced_bills
    }

@router.get("/history", response_model=List[BillResponse])
async def get_billing_history(
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """
    Get billing invoice logs for the authenticated tenant branch.
    Sorted by sync timestamp descending.
    """
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id")
    
    # Filter search to current tenant and branch for data isolation
    query = {"tenant_id": tenant_id}
    if branch_id:
        query["branch_id"] = branch_id
        
    cursor = db.bills.find(query).sort("synced_at", -1).skip(offset).limit(limit)
    bills = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        bills.append(doc)
    return bills

@router.post("/{bill_id}/split", status_code=status.HTTP_200_OK)
async def split_bill_payments(
    bill_id: str,
    payload: SplitBillRequest,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """
    Split a bill into multiple custom shares with individual payment methods.
    Checks that the sum of splits matches the total payable amount.
    """
    tenant_id = current_user.get("tenant_id")
    bill = await db.bills.find_one({"tenant_id": tenant_id, "id": bill_id})
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found."
        )

    # Validate shares total
    total_split = sum(share.amount for share in payload.shares)
    if abs(total_split - bill["grand_total"]) > 0.05:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Split share sum (₹{total_split}) must equal grand total (₹{bill['grand_total']})."
        )

    now = datetime.now(timezone.utc)
    updated_shares = [share.model_dump() for share in payload.shares]
    
    await db.bills.update_one(
        {"tenant_id": tenant_id, "id": bill_id},
        {"$set": {
            "payment_method": "split",
            "payment_shares": updated_shares,
            "split_completed_at": now.isoformat()
        }}
    )

    # Log audit event
    await db.audit_logs.insert_one({
        "timestamp": now.isoformat(),
        "actor_id": current_user["_id"],
        "actor_email": current_user["email"],
        "action": "bill_split",
        "tenant_id": tenant_id,
        "details": {"bill_id": bill_id, "shares": updated_shares}
    })

    return {"status": "success", "message": "Bill payment splits registered successfully."}

@router.post("/{bill_id}/void", status_code=status.HTTP_200_OK)
async def void_bill(
    bill_id: str,
    payload: VoidBillRequest,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """
    Voids an invoice. Requires supervisor approval.
    """
    # Enforce privilege level: Managers/Owners/Super Admins only can void bills
    if current_user.get("role") not in [UserRole.OWNER.value, UserRole.MANAGER.value, UserRole.SUPER_ADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized. Supervisor permissions required to void bills."
        )

    tenant_id = current_user.get("tenant_id")
    bill = await db.bills.find_one({"tenant_id": tenant_id, "id": bill_id})
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found."
        )

    if bill.get("status") == "void":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice is already void."
        )

    now = datetime.now(timezone.utc)
    await db.bills.update_one(
        {"tenant_id": tenant_id, "id": bill_id},
        {"$set": {
            "status": "void",
            "voided_at": now.isoformat(),
            "void_reason": payload.reason,
            "authorized_by": payload.manager_id
        }}
    )

    # Re-increment inventory stock if raw materials were deducted (refund flow)
    for item in bill.get("items", []):
        await db.inventory_deductions.insert_one({
            "tenant_id": tenant_id,
            "branch_id": bill.get("branch_id", "br_main"),
            "menu_item_id": item["menu_item_id"],
            "quantity": -item["quantity"], # Negative quantity re-stocks
            "processed": False,
            "created_at": now.isoformat()
        })

    # Log audit event
    await db.audit_logs.insert_one({
        "timestamp": now.isoformat(),
        "actor_id": current_user["_id"],
        "actor_email": current_user["email"],
        "action": "bill_voided",
        "tenant_id": tenant_id,
        "details": {"bill_id": bill_id, "reason": payload.reason, "authorized_by": payload.manager_id}
    })

    return {"status": "success", "message": "Bill marked as VOID. Inventory adjustments queued."}

@router.post("/{bill_id}/refund", status_code=status.HTTP_200_OK)
async def refund_bill(
    bill_id: str,
    payload: RefundBillRequest,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """
    Processes refunds for invoice transactions and logs inventory return flows.
    """
    if current_user.get("role") not in [UserRole.OWNER.value, UserRole.MANAGER.value, UserRole.SUPER_ADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supervisor authorization required to issue refunds."
        )

    tenant_id = current_user.get("tenant_id")
    bill = await db.bills.find_one({"tenant_id": tenant_id, "id": bill_id})
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found."
        )

    now = datetime.now(timezone.utc)
    
    # Save refund record
    refund_record = {
        "bill_id": bill_id,
        "tenant_id": tenant_id,
        "branch_id": bill.get("branch_id", "br_main"),
        "refund_amount": payload.refund_amount,
        "reason": payload.reason,
        "returned_items": payload.returned_items,
        "created_at": now.isoformat(),
        "cashier_id": current_user["_id"]
    }
    await db.refunds.insert_one(refund_doc := refund_record)

    # Mark bill as refunded
    await db.bills.update_one(
        {"tenant_id": tenant_id, "id": bill_id},
        {"$set": {"status": "refunded", "refunded_amount": payload.refund_amount}}
    )

    # Restock inventory items returned to catalog
    for item in bill.get("items", []):
        if item["menu_item_id"] in payload.returned_items:
            await db.inventory_deductions.insert_one({
                "tenant_id": tenant_id,
                "branch_id": bill.get("branch_id", "br_main"),
                "menu_item_id": item["menu_item_id"],
                "quantity": -item["quantity"], # Negative = add back
                "processed": False,
                "created_at": now.isoformat()
            })

    # Log audit event
    await db.audit_logs.insert_one({
        "timestamp": now.isoformat(),
        "actor_id": current_user["_id"],
        "actor_email": current_user["email"],
        "action": "bill_refunded",
        "tenant_id": tenant_id,
        "details": {"bill_id": bill_id, "refund_amount": payload.refund_amount, "reason": payload.reason}
    })

    return {"status": "success", "message": "Refund processed. Returned items queued for restock."}
