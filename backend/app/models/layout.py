from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class TableStatus(str, Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    OCCUPIED = "occupied"
    CLEANING = "cleaning"

class GridPosition(BaseModel):
    x: int
    y: int
    w: int = 1
    h: int = 1

class TableSchema(BaseModel):
    id: str = Field(..., description="Unique table identifier (e.g. T1, T2)")
    number: str
    capacity: int
    status: TableStatus = TableStatus.AVAILABLE
    position: GridPosition
    assigned_waiter_id: Optional[str] = None

class FloorZone(str, Enum):
    MAIN = "main"
    VIP = "vip"
    OUTDOOR = "outdoor"
    BAR = "bar"

class FloorPlanCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    zone: FloorZone = FloorZone.MAIN
    tables: List[TableSchema] = []

class FloorPlanResponse(FloorPlanCreate):
    id: str = Field(..., alias="_id")
    tenant_id: str
    branch_id: str

    class Config:
        populate_by_name = True
