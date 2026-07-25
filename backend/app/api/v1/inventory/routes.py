from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.api.deps import check_subscription_active

router = APIRouter()

# --- Pydantic Schemas ---

class VendorCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    contact_person: str
    phone: str
    email: Optional[str] = None
    gst_number: Optional[str] = None

class POItem(BaseModel):
    raw_material_id: str
    quantity: float
    unit_price: float
    unit: str

class POCreate(BaseModel):
    vendor_id: str
    items: List[POItem]
    expected_delivery: Optional[str] = None

class StockAdjustmentCreate(BaseModel):
    raw_material_id: str
    quantity_change: float # Negative for wastage/loss, positive for adjustment
    reason: str

# --- Endpoints ---

@router.get("/")
async def get_inventory_stock(
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """List current raw material stock levels, reorder limits, and status."""
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"
    
    cursor = db.inventory.find({"tenant_id": tenant_id, "branch_id": branch_id})
    stock_list = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        stock_list.append(doc)
        
    return stock_list

@router.post("/vendor", status_code=status.HTTP_201_CREATED)
async def create_vendor(
    payload: VendorCreate,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """Registers a food and beverage supply vendor."""
    tenant_id = current_user.get("tenant_id")
    now = datetime.now(timezone.utc)
    
    vendor_doc = payload.model_dump()
    vendor_id = f"vend_{now.timestamp():.0f}"
    vendor_doc.update({
        "id": vendor_id,
        "tenant_id": tenant_id,
        "created_at": now.isoformat()
    })
    
    await db.vendors.insert_one(vendor_doc)
    return {"status": "success", "vendor_id": vendor_id}

@router.get("/vendors")
async def list_vendors(
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """List registered supply vendors."""
    tenant_id = current_user.get("tenant_id")
    cursor = db.vendors.find({"tenant_id": tenant_id})
    vendors = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        vendors.append(doc)
    return vendors

@router.post("/po", status_code=status.HTTP_201_CREATED)
async def create_purchase_order(
    payload: POCreate,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """Generates a new Purchase Order (PO) in pending state."""
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"
    now = datetime.now(timezone.utc)
    
    po_id = f"PO-{now.timestamp():.0f}"
    po_doc = payload.model_dump()
    po_doc.update({
        "id": po_id,
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "status": "pending",
        "created_at": now.isoformat(),
        "created_by": current_user["_id"]
    })
    
    await db.purchase_orders.insert_one(po_doc)
    return {"status": "success", "po_id": po_id}

@router.post("/po/{po_id}/receive", status_code=status.HTTP_200_OK)
async def receive_goods_grn(
    po_id: str,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """
    Logs a Goods Received Note (GRN), updates PO status,
    and increments stock counts in the inventory collection.
    """
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"
    
    po = await db.purchase_orders.find_one({"tenant_id": tenant_id, "id": po_id})
    if not po:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase Order not found."
        )
        
    if po.get("status") == "received":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Goods have already been received for this PO."
        )
        
    now = datetime.now(timezone.utc)
    
    # 1. Update PO status to received
    await db.purchase_orders.update_one(
        {"tenant_id": tenant_id, "id": po_id},
        {"$set": {"status": "received", "received_at": now.isoformat()}}
    )
    
    # 2. Iterate and increment active inventory levels
    for item in po.get("items", []):
        raw_material_id = item["raw_material_id"]
        qty = item["quantity"]
        
        # Atomically increment stock levels in MongoDB
        await db.inventory.find_one_and_update(
            {"tenant_id": tenant_id, "branch_id": branch_id, "raw_material_id": raw_material_id},
            {"$inc": {"current_stock": qty}, "$set": {"updated_at": now.isoformat()}},
            upsert=True
        )

    # 3. Log the Goods Received (GRN) audit event
    await db.audit_logs.insert_one({
        "timestamp": now.isoformat(),
        "actor_id": current_user["_id"],
        "actor_email": current_user["email"],
        "action": "grn_processed",
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "details": {"po_id": po_id, "items_received_count": len(po.get("items", []))}
    })
    
    return {"status": "success", "message": f"Goods received for {po_id}. Inventory quantities updated."}

@router.post("/stock-adjustment", status_code=status.HTTP_200_OK)
async def adjust_stock_manually(
    payload: StockAdjustmentCreate,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """
    Manually overrides or adjusts stock counts (e.g. wastage, spillages, loss audits).
    """
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"
    now = datetime.now(timezone.utc)

    # Update count
    result = await db.inventory.find_one_and_update(
        {"tenant_id": tenant_id, "branch_id": branch_id, "raw_material_id": payload.raw_material_id},
        {"$inc": {"current_stock": payload.quantity_change}, "$set": {"updated_at": now.isoformat()}},
        return_document=True
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Raw material ID '{payload.raw_material_id}' not found in inventory."
        )

    # Audit log
    await db.audit_logs.insert_one({
        "timestamp": now.isoformat(),
        "actor_id": current_user["_id"],
        "actor_email": current_user["email"],
        "action": "inventory_adjustment",
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "details": {
            "raw_material_id": payload.raw_material_id,
            "quantity_change": payload.quantity_change,
            "reason": payload.reason
        }
    })

    return {
        "status": "success",
        "raw_material_id": payload.raw_material_id,
        "new_stock": result.get("current_stock", 0)
    }
