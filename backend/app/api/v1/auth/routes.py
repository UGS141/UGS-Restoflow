from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import jwt

from app.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.models.user import UserCreate, UserLogin, UserResponse, TokenResponse, TokenRefreshRequest, UserRole
from app.models.tenant import PlanType, SubscriptionStatus
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/register-tenant", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_tenant(tenant_data: UserCreate, db = Depends(get_db)):
    """
    Sign up a new Restaurant Owner tenant.
    Creates a tenant record with a free trial and a corresponding owner user.
    """
    # Verify unique email
    existing_user = await db.users.find_one({"email": tenant_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Enforce owner role for new tenant registration
    if tenant_data.role != UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant registrations must be initiated by an Owner role."
        )

    # 1. Generate unique Tenant ID
    tenant_id = f"ten_{ObjectId()}"
    
    # 2. Define subscription durations (30 days free trial)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=30)
    grace_ends_at = expires_at + timedelta(days=7) # 7 days grace period

    tenant_record = {
        "id": tenant_id,
        "name": f"{tenant_data.full_name}'s Restaurant",
        "owner_email": tenant_data.email,
        "is_active": True,
        "subscription": {
            "plan": PlanType.FREE_TRIAL.value,
            "status": SubscriptionStatus.ACTIVE.value,
            "starts_at": now.isoformat(),
            "expires_at": expires_at.isoformat(),
            "grace_ends_at": grace_ends_at.isoformat()
        },
        "created_at": now.isoformat()
    }
    
    await db.tenants.insert_one(tenant_record)

    # 3. Create the Owner User
    user_record = {
        "email": tenant_data.email,
        "full_name": tenant_data.full_name,
        "role": tenant_data.role.value,
        "hashed_password": hash_password(tenant_data.password),
        "tenant_id": tenant_id,
        "branch_id": tenant_data.branch_id or "br_main",
        "is_active": True,
        "created_at": now.isoformat()
    }
    
    result = await db.users.insert_one(user_record)
    user_record["_id"] = str(result.inserted_id)
    return user_record

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db = Depends(get_db)):
    """Authenticates users and provides JWT tokens."""
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is deactivated."
        )

    user_id = str(user["_id"])
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "role": user.get("role"),
        "tenant_id": user.get("tenant_id"),
        "branch_id": user.get("branch_id"),
        "full_name": user.get("full_name"),
        "email": user.get("email")
    }

@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(payload: TokenRefreshRequest, db = Depends(get_db)):
    """Refreshes access and refresh tokens using a valid refresh token."""
    try:
        decoded = decode_token(payload.refresh_token)
        user_id = decoded.get("sub")
        token_type = decoded.get("type")
        
        if token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type. Refresh token required."
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired or invalid. Please log in again."
        )

    from bson import ObjectId
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = await db.users.find_one({"_id": user_id})

    if not user or not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive."
        )

    new_access = create_access_token(user_id)
    new_refresh = create_refresh_token(user_id)

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "role": user.get("role"),
        "tenant_id": user.get("tenant_id"),
        "branch_id": user.get("branch_id"),
        "full_name": user.get("full_name"),
        "email": user.get("email")
    }

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Returns the authenticated user's profile."""
    return current_user
