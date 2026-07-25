from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"     # Platform wide
    OWNER = "owner"                 # Tenant owner
    MANAGER = "manager"             # Branch manager
    CASHIER = "cashier"             # POS billing operator
    KITCHEN = "kitchen"             # KDS operator
    WAITER = "waiter"               # Order taker
    ACCOUNTANT = "accountant"       # Financial manager

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole
    tenant_id: Optional[str] = None
    branch_id: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str = Field(..., alias="_id")
    created_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: UserRole
    tenant_id: Optional[str] = None
    branch_id: Optional[str] = None
    full_name: str
    email: str

class TokenRefreshRequest(BaseModel):
    refresh_token: str
