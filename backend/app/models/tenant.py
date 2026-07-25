from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class PlanType(str, Enum):
    FREE_TRIAL = "free_trial"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    GRACE_PERIOD = "grace_period"

class SubscriptionSchema(BaseModel):
    plan: PlanType = PlanType.FREE_TRIAL
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE
    starts_at: datetime
    expires_at: datetime
    grace_ends_at: Optional[datetime] = None

class TenantBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    owner_email: EmailStr
    is_active: bool = True

class TenantCreate(TenantBase):
    owner_name: str
    password: str = Field(..., min_length=6)

class TenantResponse(TenantBase):
    id: str = Field(..., alias="_id")
    subscription: SubscriptionSchema
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class SubscriptionUpdate(BaseModel):
    plan: PlanType
    status: SubscriptionStatus
    duration_days: int

class SetupWizardPayload(BaseModel):
    restaurant_name: str = Field(..., min_length=2, max_length=100)
    gst_number: str = Field(..., min_length=15, max_length=15, description="GSTIN must be 15 alphanumeric characters")
    currency: str = "INR"
    floors: List[str] = Field(default=["Main Floor"])
    tables_per_floor: int = Field(default=5, ge=1, le=20)
    payment_methods: List[str] = Field(default=["cash", "card", "upi"])
    business_hours: str = "11:00 AM - 11:00 PM"

