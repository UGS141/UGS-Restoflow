from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.api.deps import check_subscription_active

router = APIRouter()

@router.get("/logs")
async def get_audit_logs(
    action: Optional[str] = Query(None),
    actor_email: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """
    Search and filter platform-wide security audit trails.
    Connection to compound tenant index secures multi-tenant boundaries.
    """
    tenant_id = current_user.get("tenant_id")
    
    # Base security query
    query = {"tenant_id": tenant_id}
    
    if action:
        query["action"] = action
        
    if actor_email:
        query["actor_email"] = actor_email
        
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date + "T23:59:59"
        query["timestamp"] = date_filter
        
    cursor = db.audit_logs.find(query).sort("timestamp", -1).skip(offset).limit(limit)
    logs = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        logs.append(doc)
        
    return logs
