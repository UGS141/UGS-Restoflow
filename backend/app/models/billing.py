from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class PaymentMethod(str, Enum):
    CASH = "cash"
    CARD = "card"
    UPI = "upi"
    SPLIT = "split"

class BillStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    REFUNDED = "refunded"

class TaxItem(BaseModel):
    name: str
    rate: float  # Percentage (e.g. 2.5 for 2.5% CGST)
    amount: float

class BillItem(BaseModel):
    menu_item_id: str
    name: str
    variant_name: Optional[str] = None
    price: float
    quantity: int
    taxes: List[TaxItem] = []

class BillCreate(BaseModel):
    id: str = Field(..., description="Client-generated unique transaction UUID")
    table_id: Optional[str] = None
    items: List[BillItem]
    subtotal: float
    tax_total: float
    discount_total: float
    grand_total: float
    payment_method: PaymentMethod
    status: BillStatus = BillStatus.PAID
    offline_created_at: datetime
    cashier_id: str

class BillResponse(BillCreate):
    tenant_id: str
    branch_id: str
    bill_number: str
    synced_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class BillSyncBatch(BaseModel):
    bills: List[BillCreate]

class SplitShare(BaseModel):
    amount: float
    payment_method: PaymentMethod
    paid: bool = False

class SplitBillRequest(BaseModel):
    shares: List[SplitShare]

class VoidBillRequest(BaseModel):
    reason: str = Field(..., min_length=4)
    manager_id: str

class RefundBillRequest(BaseModel):
    reason: str = Field(..., min_length=4)
    refund_amount: float
    returned_items: List[str] = [] # List of item IDs returned to inventory

