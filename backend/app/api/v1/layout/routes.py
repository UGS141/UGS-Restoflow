from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.database import get_db, get_redis
from app.api.deps import check_subscription_active
from app.models.layout import FloorPlanCreate, FloorPlanResponse, TableStatus

router = APIRouter()

@router.post("/save", response_model=FloorPlanResponse)
async def save_floor_plan(
    payload: FloorPlanCreate,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """
    Saves or updates a visual Floor Plan layout for a branch.
    Re-inserts or upserts grid designs based on zone.
    """
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"
    
    plan_data = payload.model_dump()
    plan_data.update({
        "tenant_id": tenant_id,
        "branch_id": branch_id
    })

    # Upsert by floor zone name for this branch
    result = await db.floor_plans.find_one_and_update(
        {"tenant_id": tenant_id, "branch_id": branch_id, "name": payload.name},
        {"$set": plan_data},
        upsert=True,
        return_document=True
    )
    
    result["_id"] = str(result["_id"])
    return result

@router.get("/floors", response_model=List[FloorPlanResponse])
async def get_floor_plans(
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """Retrieves all visual floor zones and table coordinate mappings for a branch."""
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"
    
    cursor = db.floor_plans.find({"tenant_id": tenant_id, "branch_id": branch_id})
    plans = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        plans.append(doc)
    return plans

@router.post("/table/{table_id}/status")
async def update_table_status(
    table_id: str,
    status_val: TableStatus,
    assigned_waiter_id: str = None,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db),
    redis = Depends(get_redis)
):
    """
    Updates the operational state of a table (Available, Reserved, Occupied, Cleaning).
    Broadcasts the state change to all active cashier and waiter devices in real time.
    """
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"

    # Search and update inside matching floor plan table items
    query = {
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "tables.id": table_id
    }
    
    update = {
        "$set": {
            "tables.$.status": status_val.value,
            "tables.$.assigned_waiter_id": assigned_waiter_id
        }
    }
    
    updated_plan = await db.floor_plans.find_one_and_update(
        query, update, return_document=True
    )
    
    if not updated_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Table '{table_id}' not found in any floor layouts."
        )

    # Real-time WebSocket pub-sub notification
    try:
        if redis:
            channel = f"pubsub:{tenant_id}:{branch_id}:tables"
            await redis.publish(channel, f"TABLE_UPDATE:{table_id}:{status_val.value}:{assigned_waiter_id or 'none'}")
    except Exception:
        pass

    return {
        "status": "success",
        "table_id": table_id,
        "new_status": status_val.value
    }
