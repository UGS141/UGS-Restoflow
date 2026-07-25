from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from datetime import datetime, timezone
from typing import List

from app.config import settings
from app.database import get_db
from app.core.security import decode_token
from app.models.user import UserRole

security_scheme = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db = Depends(get_db)
) -> dict:
    """
    Decodes the JWT bearer token, checks database, and returns the current user record.
    """
    token = credentials.credentials
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        token_type = payload.get("type")
        
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type. Access token required."
            )
            
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials payload."
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again."
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials."
        )

    # Resolve from DB
    from bson import ObjectId
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = await db.users.find_one({"_id": user_id})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated."
        )
        
    # Convert _id to string for convenience
    user["_id"] = str(user["_id"])
    return user

class RoleChecker:
    """
    Role verification dependency constructor.
    """
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") not in [role.value for role in self.allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to access this endpoint."
            )
        return current_user

async def check_subscription_active(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
) -> dict:
    """
    Enforces active subscriptions. If a tenant's license is expired, blocks standard actions.
    Super Admin operations are exempted.
    """
    # Super admins are exempt from subscription locks
    if current_user.get("role") == UserRole.SUPER_ADMIN.value:
        return current_user
        
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any SaaS tenant."
        )
        
    tenant = await db.tenants.find_one({"id": tenant_id})
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant account not found."
        )
        
    sub = tenant.get("subscription", {})
    status_str = sub.get("status", "expired")
    expires_at_str = sub.get("expires_at")
    
    if expires_at_str:
        if isinstance(expires_at_str, datetime):
            expires_at = expires_at_str
        else:
            expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
    else:
        expires_at = datetime.min.replace(tzinfo=timezone.utc)
        
    now = datetime.now(timezone.utc)
    
    # Check status and date expiration
    if status_str == "expired" or (now > expires_at and status_str != "grace_period"):
        # Let's check if we are in grace period
        grace_ends_at_str = sub.get("grace_ends_at")
        if grace_ends_at_str:
            if isinstance(grace_ends_at_str, datetime):
                grace_ends_at = grace_ends_at_str
            else:
                grace_ends_at = datetime.fromisoformat(grace_ends_at_str.replace("Z", "+00:00"))
        else:
            grace_ends_at = expires_at
            
        if now <= grace_ends_at:
            # Still in grace period
            return current_user
            
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "subscription_expired",
                "message": "Your UGS-Restoflow subscription has expired. Please contact support or renew your license.",
                "expires_at": expires_at.isoformat(),
                "grace_ends_at": grace_ends_at.isoformat()
            }
        )
        
    return current_user
