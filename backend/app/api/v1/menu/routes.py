from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timezone

from app.database import get_db
from app.api.deps import check_subscription_active

router = APIRouter()

# --- Pydantic Request Schemas ---

class ModifierItem(BaseModel):
    name: str
    price: float

class ModifierGroupSchema(BaseModel):
    name: str # e.g. "Select Crust", "Add-ons"
    min_selection: int = 0
    max_selection: int = 1
    items: List[ModifierItem]

class VariantSchema(BaseModel):
    name: str # e.g. "Regular", "Large"
    price: float
    sku: Optional[str] = None

class AvailabilitySchedule(BaseModel):
    days_active: List[int] = Field(default=[0,1,2,3,4,5,6], description="0=Monday, 6=Sunday")
    start_time: str = "00:00" # HH:MM format
    end_time: str = "23:59"

class RecipeIngredient(BaseModel):
    raw_material_id: str
    quantity: float
    unit: str

class RecipeCreate(BaseModel):
    menu_item_id: str
    ingredients: List[RecipeIngredient]

class MenuItemCreate(BaseModel):
    id: str = Field(..., description="Unique code e.g. m_paneer_butter")
    name: str = Field(..., min_length=2, max_length=100)
    category_id: str
    subcategory_id: Optional[str] = None
    price: float
    variants: List[VariantSchema] = []
    modifiers: List[ModifierGroupSchema] = []
    availability: Optional[AvailabilitySchedule] = None
    tax_rate: float = 5.0 # 5% default GST
    sku: Optional[str] = None

# --- Routes ---

@router.get("/all")
async def get_entire_menu(
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """List all categories, items, and recipe indicators for a tenant."""
    tenant_id = current_user.get("tenant_id")
    
    # Retrieve items and categories
    items_cursor = db.menu_items.find({"tenant_id": tenant_id})
    categories_cursor = db.menu_categories.find({"tenant_id": tenant_id})
    
    items = []
    async for doc in items_cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)
        
    categories = []
    async for doc in categories_cursor:
        doc["_id"] = str(doc["_id"])
        categories.append(doc)
        
    return {
        "items": items,
        "categories": categories
    }

@router.post("/item", status_code=status.HTTP_201_CREATED)
async def create_or_update_menu_item(
    payload: MenuItemCreate,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """
    Creates or updates a menu item with its variants, modifiers, and GST taxes.
    """
    tenant_id = current_user.get("tenant_id")
    now = datetime.now(timezone.utc)
    
    item_data = payload.model_dump()
    item_data.update({
        "tenant_id": tenant_id,
        "updated_at": now.isoformat()
    })

    result = await db.menu_items.find_one_and_update(
        {"tenant_id": tenant_id, "id": payload.id},
        {"$set": item_data},
        upsert=True,
        return_document=True
    )
    
    result["_id"] = str(result["_id"])
    return result

@router.post("/recipe", status_code=status.HTTP_200_OK)
async def save_recipe_ingredients(
    payload: RecipeCreate,
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """
    Maps ingredient raw materials and quantity deductions to a specific menu item.
    """
    tenant_id = current_user.get("tenant_id")
    now = datetime.now(timezone.utc)
    
    recipe_data = payload.model_dump()
    recipe_data.update({
        "tenant_id": tenant_id,
        "updated_at": now.isoformat()
    })

    # Save recipe map
    await db.recipes.find_one_and_update(
        {"tenant_id": tenant_id, "menu_item_id": payload.menu_item_id},
        {"$set": recipe_data},
        upsert=True
    )
    
    # Mark menu item as having recipe enabled
    await db.menu_items.update_one(
        {"tenant_id": tenant_id, "id": payload.menu_item_id},
        {"$set": {"has_recipe": True}}
    )
    
    return {"status": "success", "message": f"Recipe mapped for menu item: {payload.menu_item_id}"}

@router.post("/category", status_code=status.HTTP_201_CREATED)
async def create_menu_category(
    id: str,
    name: str,
    subcategories: List[str] = [],
    current_user: dict = Depends(check_subscription_active),
    db = Depends(get_db)
):
    """Creates a new menu category & subcategory mapping."""
    tenant_id = current_user.get("tenant_id")
    
    cat_doc = {
        "id": id,
        "name": name,
        "subcategories": subcategories,
        "tenant_id": tenant_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.menu_categories.find_one_and_update(
        {"tenant_id": tenant_id, "id": id},
        {"$set": cat_doc},
        upsert=True
    )
    
    return {"status": "success", "category_id": id}
