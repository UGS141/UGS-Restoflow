from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.api.deps import check_subscription_active

router = APIRouter()

# --- Pydantic Schemas ---

class CustomerCreate(BaseModel):
    phone: str = Field(..., min_length=10, max_length=10) # 10-digit mobile
    name: str = Field(..., min_length=2)
    email: Optional[str] = None
    birthday: Optional[str] = None # MM-DD format
    anniversary: Optional[str] = None

class WalletTransaction(BaseModel):
    amount: float # Positive to credit, negative to debit
    description: str

class LoyaltyRedeem(BaseModel):
    points: int

# --- Routes ---

@router.get("/customer/{phone}")
async def get_customer_profile(
    phone: str,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """Retrieves customer record, visit metrics, and wallet statement."""
    tenant_id = current_user.get("tenant_id")
    
    customer = await db.customers.find_one({"tenant_id": tenant_id, "phone": phone})
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with phone number '{phone}' not registered."
        )
        
    customer["_id"] = str(customer["_id"])
    return customer

@router.post("/customer", status_code=status.HTTP_201_CREATED)
async def create_or_update_customer(
    payload: CustomerCreate,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """Registers a customer profile or updates basic details."""
    tenant_id = current_user.get("tenant_id")
    now = datetime.now(timezone.utc)
    
    customer_data = payload.model_dump()
    customer_data.update({
        "tenant_id": tenant_id,
        "updated_at": now.isoformat()
    })

    # Find and update or insert if new
    result = await db.customers.find_one_and_update(
        {"tenant_id": tenant_id, "phone": payload.phone},
        {"$setOnInsert": {
            "loyalty_points": 0,
            "wallet_balance": 0.0,
            "wallet_transactions": [],
            "membership_tier": "bronze",
            "created_at": now.isoformat()
        }, "$set": customer_data},
        upsert=True,
        return_document=True
    )
    
    result["_id"] = str(result["_id"])
    return result

@router.post("/customer/{phone}/wallet", status_code=status.HTTP_200_OK)
async def transact_wallet_balance(
    phone: str,
    payload: WalletTransaction,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """
    Credits or debits cash credit balances to/from the customer's wallet.
    Logs transaction events with timestamps.
    """
    tenant_id = current_user.get("tenant_id")
    customer = await db.customers.find_one({"tenant_id": tenant_id, "phone": phone})
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found."
        )

    current_balance = customer.get("wallet_balance", 0.0)
    new_balance = current_balance + payload.amount
    
    if new_balance < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient wallet balance. Available: ₹{current_balance:.2f}."
        )

    now = datetime.now(timezone.utc)
    txn_doc = {
        "amount": payload.amount,
        "description": payload.description,
        "timestamp": now.isoformat()
    }

    # Atomically adjust wallet balance and append transactions array
    updated = await db.customers.find_one_and_update(
        {"tenant_id": tenant_id, "phone": phone},
        {"$inc": {"wallet_balance": payload.amount}, "$push": {"wallet_transactions": txn_doc}},
        return_document=True
    )

    # Log audit event
    await db.audit_logs.insert_one({
        "timestamp": now.isoformat(),
        "actor_id": current_user["_id"],
        "actor_email": current_user["email"],
        "action": "customer_wallet_transact",
        "tenant_id": tenant_id,
        "details": {"phone": phone, "amount_change": payload.amount, "new_balance": updated.get("wallet_balance")}
    })

    return {
        "status": "success",
        "phone": phone,
        "previous_balance": current_balance,
        "new_balance": updated.get("wallet_balance", 0.0)
    }

@router.post("/customer/{phone}/points", status_code=status.HTTP_200_OK)
async def redeem_loyalty_points(
    phone: str,
    payload: LoyaltyRedeem,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """
    Redeems accrued loyalty points.
    Typically, 1 point = ₹1 discount credit.
    """
    tenant_id = current_user.get("tenant_id")
    customer = await db.customers.find_one({"tenant_id": tenant_id, "phone": phone})
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found."
        )

    current_points = customer.get("loyalty_points", 0)
    if current_points < payload.points:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient loyalty points. Available: {current_points} points."
        )

    now = datetime.now(timezone.utc)
    updated = await db.customers.find_one_and_update(
        {"tenant_id": tenant_id, "phone": phone},
        {"$inc": {"loyalty_points": -payload.points}},
        return_document=True
    )

    # Audit log
    await db.audit_logs.insert_one({
        "timestamp": now.isoformat(),
        "actor_id": current_user["_id"],
        "actor_email": current_user["email"],
        "action": "loyalty_points_redeemed",
        "tenant_id": tenant_id,
        "details": {"phone": phone, "points_redeemed": payload.points, "remaining_points": updated.get("loyalty_points")}
    })

    return {
        "status": "success",
        "phone": phone,
        "points_redeemed": payload.points,
        "remaining_points": updated.get("loyalty_points", 0)
    }
