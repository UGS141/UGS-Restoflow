from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone, timedelta
from typing import List

from app.database import get_db
from app.api.deps import RoleChecker, get_current_user
from app.models.user import UserRole
from app.models.tenant import TenantResponse, SubscriptionUpdate, SubscriptionStatus, PlanType

router = APIRouter()

# Instantiate role verifier dependency for Super Admin tasks
require_super_admin = RoleChecker([UserRole.SUPER_ADMIN])

@router.get("/all", response_model=List[TenantResponse])
async def get_all_tenants(
    current_user: dict = Depends(require_super_admin),
    db = Depends(get_db)
):
    """
    List all SaaS tenants registered in the UGS-Restoflow platform.
    Requires Super Admin authentication.
    """
    cursor = db.tenants.find()
    tenants = []
    async for tenant in cursor:
        tenant["_id"] = str(tenant["_id"])
        tenants.append(tenant)
    return tenants

@router.post("/{tenant_id}/subscription", response_model=TenantResponse)
async def update_tenant_subscription(
    tenant_id: str,
    payload: SubscriptionUpdate,
    current_user: dict = Depends(require_super_admin),
    db = Depends(get_db)
):
    """
    Manually update a tenant's subscription plan, status, and expiry timeline.
    Used by Super Admins for license activation, payments, and plan renewals.
    """
    tenant = await db.tenants.find_one({"id": tenant_id})
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found."
        )

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=payload.duration_days)
    grace_ends_at = expires_at + timedelta(days=7)  # Standard 7-day grace period

    updated_subscription = {
        "plan": payload.plan.value,
        "status": payload.status.value,
        "starts_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "grace_ends_at": grace_ends_at.isoformat()
    }

    # Record audit log entry
    audit_log = {
        "timestamp": now.isoformat(),
        "actor_id": current_user["_id"],
        "actor_email": current_user["email"],
        "action": "subscription_update",
        "tenant_id": tenant_id,
        "details": {
            "previous_plan": tenant.get("subscription", {}).get("plan"),
            "new_plan": payload.plan.value,
            "duration_days": payload.duration_days
        }
    }

    await db.audit_logs.insert_one(audit_log)

    result = await db.tenants.find_one_and_update(
        {"id": tenant_id},
        {"$set": {"subscription": updated_subscription}},
        return_document=True
    )
    
    result["_id"] = str(result["_id"])
    return result

@router.get("/{tenant_id}/audit-logs")
async def get_tenant_audit_logs(
    tenant_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    View platform audit logs for a specific tenant.
    Allows owners to audit cashier operations, or super admins to audit overall system changes.
    """
    # Enforce data isolation: standard users can only view their own tenant logs.
    if current_user.get("role") != UserRole.SUPER_ADMIN.value:
        if current_user.get("tenant_id") != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only view audit logs for your own tenant."
            )
            
    cursor = db.audit_logs.find({"tenant_id": tenant_id}).sort("timestamp", -1).limit(100)
    logs = []
    async for log in cursor:
        log["_id"] = str(log["_id"])
        logs.append(log)
    return logs

# Setup Wizard endpoint
from app.models.tenant import SetupWizardPayload

@router.post("/setup-wizard", status_code=status.HTTP_250_CREATED or status.HTTP_200_OK)
async def setup_wizard(
    payload: SetupWizardPayload,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Onboarding wizard for first-time setup of a restaurant branch.
    Configures GST, business hours, payment systems, and populates the floor plans database.
    """
    if current_user.get("role") != UserRole.OWNER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Restaurant Owners are authorized to execute the onboarding setup wizard."
        )

    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"
    now = datetime.now(timezone.utc)

    # 1. Update the SaaS Tenant Profile
    tenant_settings = {
        "gst_number": payload.gst_number,
        "currency": payload.currency,
        "business_hours": payload.business_hours,
        "payment_methods": payload.payment_methods,
        "setup_complete": True,
        "updated_at": now.isoformat()
    }

    await db.tenants.find_one_and_update(
        {"id": tenant_id},
        {"$set": {
            "name": payload.restaurant_name,
            "settings": tenant_settings
        }}
    )

    # 2. Provision initial Floor Layouts and Table structures
    created_floors = []
    for floor_idx, floor_name in enumerate(payload.floors):
        tables = []
        for tbl_idx in range(1, payload.tables_per_floor + 1):
            table_id = f"T_{floor_idx + 1}_{tbl_idx}"
            tables.append({
                "id": table_id,
                "number": f"T{tbl_idx:02d}",
                "capacity": 4,
                "status": "available",
                "position": {
                    "x": 1 + ((tbl_idx - 1) % 6) * 2,
                    "y": 1 + ((tbl_idx - 1) // 6) * 2,
                    "w": 1,
                    "h": 1
                },
                "assigned_waiter_id": None
            })
        
        floor_plan = {
            "name": floor_name,
            "zone": "main" if floor_idx == 0 else "vip" if "vip" in floor_name.lower() else "outdoor",
            "tables": tables,
            "tenant_id": tenant_id,
            "branch_id": branch_id
        }
        
        # Save floor plans
        await db.floor_plans.find_one_and_update(
            {"tenant_id": tenant_id, "branch_id": branch_id, "name": floor_name},
            {"$set": floor_plan},
            upsert=True
        )
        created_floors.append(floor_name)

    # 3. Log the onboarding audit record
    await db.audit_logs.insert_one({
        "timestamp": now.isoformat(),
        "actor_id": current_user["_id"],
        "actor_email": current_user["email"],
        "action": "setup_wizard_complete",
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "details": {
            "restaurant_name": payload.restaurant_name,
            "gst_number": payload.gst_number,
            "floors_created": created_floors,
            "tables_per_floor": payload.tables_per_floor
        }
    })

    return {
        "status": "success",
        "message": "Restaurant onboarding setup wizard complete. Billing endpoints activated.",
        "tenant_id": tenant_id,
        "onboarded_floors": created_floors
    }

