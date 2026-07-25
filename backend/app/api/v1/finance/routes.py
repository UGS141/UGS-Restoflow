from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.api.deps import check_subscription_active

router = APIRouter()

# --- Pydantic Schemas ---

class RegisterOpen(BaseModel):
    opening_balance: float = Field(..., ge=0)

class RegisterClose(BaseModel):
    closing_balance: float = Field(..., ge=0)

class TransactionCreate(BaseModel):
    type: str = Field(..., description="income, expense, vendor_payment, cash_in, cash_out")
    amount: float = Field(..., gt=0)
    category: str # e.g. Salaries, Raw Ingredients, Rent
    description: str
    reference_id: Optional[str] = None

# --- Routes ---

@router.get("/register/status")
async def check_register_status(
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """Checks if a cash register shift is active for the current cashier."""
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"
    user_id = current_user.get("_id")
    
    register = await db.cash_registers.find_one({
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "cashier_id": user_id,
        "status": "open"
    })
    
    if not register:
        return {"status": "closed", "register": None}
        
    register["_id"] = str(register["_id"])
    return {"status": "open", "register": register}

@router.post("/register/open", status_code=status.HTTP_201_CREATED)
async def open_cash_register(
    payload: RegisterOpen,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """Opens a new cash shift register for the cashier."""
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"
    user_id = current_user.get("_id")
    
    # Assert no register is already open
    existing = await db.cash_registers.find_one({
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "cashier_id": user_id,
        "status": "open"
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active cash register shift open."
        )
        
    now = datetime.now(timezone.utc)
    register_doc = {
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "cashier_id": user_id,
        "status": "open",
        "opened_at": now.isoformat(),
        "opening_balance": payload.opening_balance,
        "cash_in_hand": payload.opening_balance,
        "created_at": now.isoformat()
    }
    
    await db.cash_registers.insert_one(register_doc)
    
    # Audit log
    await db.audit_logs.insert_one({
        "timestamp": now.isoformat(),
        "actor_id": user_id,
        "actor_email": current_user["email"],
        "action": "cash_register_opened",
        "tenant_id": tenant_id,
        "details": {"opening_balance": payload.opening_balance}
    })
    
    return {"status": "success", "message": "Register opened. Cash sales tracking active."}

@router.post("/register/close", status_code=status.HTTP_200_OK)
async def close_cash_register(
    payload: RegisterClose,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """Closes register, calculates final drawer balance discrepancies."""
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"
    user_id = current_user.get("_id")
    
    register = await db.cash_registers.find_one({
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "cashier_id": user_id,
        "status": "open"
    })
    if not register:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active cash register found to close."
        )
        
    now = datetime.now(timezone.utc)
    
    # Calculate all cash sales under this register timeframe
    opened_at = register["opened_at"]
    bills_cursor = db.bills.find({
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "status": "paid",
        "payment_method": "cash",
        "offline_created_at": {"$gte": opened_at}
    })
    
    cash_sales_total = 0.0
    async for bill in bills_cursor:
        cash_sales_total += bill.get("grand_total", 0.0)
        
    # Calculate expenses logged under this register timeframe
    tx_cursor = db.financial_transactions.find({
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "type": {"$in": ["expense", "cash_out"]},
        "timestamp": {"$gte": opened_at}
    })
    expenses_total = 0.0
    async for tx in tx_cursor:
        expenses_total += tx.get("amount", 0.0)
        
    expected_cash = register["opening_balance"] + cash_sales_total - expenses_total
    discrepancy = payload.closing_balance - expected_cash
    
    closing_summary = {
        "total_sales": cash_sales_total,
        "cash_sales": cash_sales_total,
        "expenses_total": expenses_total,
        "expected_cash": expected_cash,
        "actual_cash": payload.closing_balance,
        "discrepancy": discrepancy
    }
    
    await db.cash_registers.update_one(
        {"tenant_id": tenant_id, "branch_id": branch_id, "cashier_id": user_id, "status": "open"},
        {"$set": {
            "status": "closed",
            "closed_at": now.isoformat(),
            "closing_balance": payload.closing_balance,
            "daily_closing_summary": closing_summary
        }}
    )
    
    # Audit log
    await db.audit_logs.insert_one({
        "timestamp": now.isoformat(),
        "actor_id": user_id,
        "actor_email": current_user["email"],
        "action": "cash_register_closed",
        "tenant_id": tenant_id,
        "details": closing_summary
    })
    
    return {
        "status": "success",
        "message": "Register closed successfully.",
        "summary": closing_summary
    }

@router.post("/transaction", status_code=status.HTTP_201_CREATED)
async def log_financial_transaction(
    payload: TransactionCreate,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """Logs income, payroll salaries, rent expenses, or raw material supply bills."""
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"
    now = datetime.now(timezone.utc)
    
    tx_doc = payload.model_dump()
    tx_id = f"TXN-{now.timestamp():.0f}"
    tx_doc.update({
        "id": tx_id,
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "timestamp": now.isoformat(),
        "actor_id": current_user["_id"]
    })
    
    await db.financial_transactions.insert_one(tx_doc)
    return {"status": "success", "transaction_id": tx_id}

@router.get("/transactions")
async def list_transactions(
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """List financial statement records for accounting audits."""
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"
    
    cursor = db.financial_transactions.find({"tenant_id": tenant_id, "branch_id": branch_id}).sort("timestamp", -1)
    txs = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        txs.append(doc)
    return txs
