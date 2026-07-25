from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.api.deps import check_subscription_active
from app.models.user import UserRole

router = APIRouter()

# --- Pydantic Schemas ---

class FeatureFlagsUpdate(BaseModel):
    qr_ordering: bool = True
    crm_loyalty: bool = True
    ai_copilot: bool = False
    kds_display: bool = True

class SupportReply(BaseModel):
    ticket_id: str
    reply_message: str

class BroadcastAnnouncement(BaseModel):
    target_plan: str # "all", "free_trial", "premium"
    title: str
    message: str

# --- Security Dependency ---

def check_super_admin(current_user: dict = Depends(check_subscription_active)):
    """Asserts that the authenticated user possesses platform-wide super admin permissions."""
    if current_user.get("role") != UserRole.SUPER_ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Platform Administrator credentials required."
        )
    return current_user

# --- Routes ---

@router.get("/tenants")
async def list_restaurants(
    admin_user = Depends(check_super_admin),
    db = Depends(get_db)
):
    """List all restaurant tenant organizations registered on the SaaS platform."""
    cursor = db.tenants.find({})
    tenants = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        
        # Count branches & employees
        tenant_id = doc["id"]
        branches_count = await db.users.distinct("branch_id", {"tenant_id": tenant_id})
        employees_count = await db.users.count_documents({"tenant_id": tenant_id})
        
        doc["branch_count"] = len(branches_count)
        doc["employee_count"] = employees_count
        tenants.append(doc)
    return tenants

@router.post("/tenants/{tenant_id}/suspend")
async def suspend_tenant(
    tenant_id: str,
    admin_user = Depends(check_super_admin),
    db = Depends(get_db)
):
    """Temporarily blocks a tenant restaurant's software access."""
    result = await db.tenants.update_one(
        {"id": tenant_id},
        {"$set": {"is_active": False, "suspended_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found.")
        
    # Log audit event
    await db.audit_logs.insert_one({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor_id": admin_user["_id"],
        "actor_email": admin_user["email"],
        "action": "tenant_suspended",
        "tenant_id": "platform",
        "details": {"suspended_tenant_id": tenant_id}
    })
    return {"status": "success", "message": f"Tenant '{tenant_id}' suspended."}

@router.post("/tenants/{tenant_id}/activate")
async def activate_tenant(
    tenant_id: str,
    admin_user = Depends(check_super_admin),
    db = Depends(get_db)
):
    """Restores active status to a suspended tenant organization."""
    result = await db.tenants.update_one(
        {"id": tenant_id},
        {"$set": {"is_active": True}, "$unset": {"suspended_at": ""}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found.")
        
    # Log audit
    await db.audit_logs.insert_one({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor_id": admin_user["_id"],
        "actor_email": admin_user["email"],
        "action": "tenant_activated",
        "tenant_id": "platform",
        "details": {"activated_tenant_id": tenant_id}
    })
    return {"status": "success", "message": f"Tenant '{tenant_id}' activated."}

@router.post("/tenants/{tenant_id}/features")
async def update_feature_flags(
    tenant_id: str,
    payload: FeatureFlagsUpdate,
    admin_user = Depends(check_super_admin),
    db = Depends(get_db)
):
    """Manages active operational modules for a restaurant client."""
    result = await db.tenants.update_one(
        {"id": tenant_id},
        {"$set": {"feature_flags": payload.model_dump()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found.")
        
    return {"status": "success", "feature_flags": payload.model_dump()}

@router.get("/monitoring/health")
async def get_system_health(
    admin_user = Depends(check_super_admin)
):
    """Gathers real-time performance indicators of the SaaS cluster."""
    # Simulates server hardware diagnostic queries
    return {
        "status": "healthy",
        "cpu_usage_pct": 34.2,
        "ram_usage_gb": 4.8,
        "ram_total_gb": 8.0,
        "mongodb_ping": "1.2ms",
        "redis_ping": "0.8ms",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.post("/broadcast")
async def send_broadcast(
    payload: BroadcastAnnouncement,
    admin_user = Depends(check_super_admin),
    db = Depends(get_db)
):
    """Dispatches a platform-wide inbox alert to client restaurants."""
    now = datetime.now(timezone.utc)
    broadcast_doc = {
        "id": f"broad_{now.timestamp():.0f}",
        "target_plan": payload.target_plan,
        "title": payload.title,
        "message": payload.message,
        "dispatched_at": now.isoformat(),
        "dispatched_by": admin_user["email"]
    }
    
    await db.broadcasts.insert_one(broadcast_doc)
    return {"status": "success", "broadcast_id": broadcast_doc["id"]}
