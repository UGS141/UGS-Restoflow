from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.api.deps import check_subscription_active
from app.services.printers import PrinterService

router = APIRouter()

# --- Pydantic Schemas ---

class PrinterRegister(BaseModel):
    id: str = Field(..., description="Unique slug like pr_kitchen_1")
    name: str = Field(..., min_length=2, max_length=50)
    type: str = Field("kitchen", description="billing, kitchen, parcel, token, label")
    interface_type: str = Field("network", description="network, usb")
    ip_address: Optional[str] = None
    port: int = 9100
    is_active: bool = True

# --- Routes ---

@router.get("/")
async def list_printers(
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """List registered printers and their static configurations."""
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"
    
    cursor = db.printers.find({"tenant_id": tenant_id, "branch_id": branch_id})
    printers = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        printers.append(doc)
    return printers

@router.post("/", status_code=status.HTTP_201_CREATED)
async def register_or_update_printer(
    payload: PrinterRegister,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """Adds a new printer configuration or updates existing records."""
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"
    
    doc = payload.model_dump()
    doc.update({
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "updated_at": datetime.now(timezone.utc).isoformat()
    })
    
    result = await db.printers.find_one_and_update(
        {"tenant_id": tenant_id, "branch_id": branch_id, "id": payload.id},
        {"$set": doc},
        upsert=True,
        return_document=True
    )
    
    result["_id"] = str(result["_id"])
    return result

@router.get("/{printer_id}/status")
async def get_printer_status(
    printer_id: str,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """Pings a network printer socket to run dynamic connectivity tests."""
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"
    
    printer = await db.printers.find_one({
        "tenant_id": tenant_id, 
        "branch_id": branch_id, 
        "id": printer_id
    })
    
    if not printer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Printer configuration not found."
        )
        
    ip = printer.get("ip_address")
    port = printer.get("port", 9100)
    
    if not ip or printer.get("interface_type") != "network":
        return {"id": printer_id, "status": "online", "message": "Static local USB check bypassed"}
        
    status_result = await PrinterService.ping_network_printer(ip, port)
    
    # Update printer status in database
    await db.printers.update_one(
        {"tenant_id": tenant_id, "branch_id": branch_id, "id": printer_id},
        {"$set": {"status": status_result}}
    )
    
    return {"id": printer_id, "status": status_result}

@router.post("/{printer_id}/test")
async def trigger_printer_test(
    printer_id: str,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """Sends a sample formatted receipt page to verify font sizing and cutters."""
    tenant_id = current_user.get("tenant_id")
    branch_id = current_user.get("branch_id") or "br_main"
    
    printer = await db.printers.find_one({
        "tenant_id": tenant_id, 
        "branch_id": branch_id, 
        "id": printer_id
    })
    
    if not printer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Printer not found."
        )
        
    ip = printer.get("ip_address")
    port = printer.get("port", 9100)
    
    if not ip or printer.get("interface_type") != "network":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Direct USB/Bluetooth testing requires local agent drivers."
        )
        
    success = await PrinterService.trigger_test_page(ip, port)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Printer unreachable. Job added to retry backlog queue."
        )
        
    return {"status": "success", "message": "Test receipt payload transmitted successfully."}
