import asyncio
import logging
from datetime import datetime, timezone, timedelta
from bson import ObjectId

# Set up logger
logger = logging.getLogger("ugs_restoflow_seeder")
logging.basicConfig(level=logging.INFO)

# Set up path overrides if running script standalone
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import db_manager
from app.core.security import hash_password
from app.models.user import UserRole
from app.models.tenant import PlanType, SubscriptionStatus

async def run_seed():
    """
    Clears current collections and provisions a production-ready
    multi-tenant mock environment for UGS-Restoflow.
    """
    logger.info("Initializing connection to database...")
    await db_manager.connect_and_check()
    db = db_manager.db
    
    tenant_id = "ten_demo"
    branch_id = "br_main"
    now = datetime.now(timezone.utc)
    
    # 1. Clear current database collections
    logger.info("Purging existing database collections for clean seed...")
    await db.users.delete_many({})
    await db.tenants.delete_many({})
    await db.floor_plans.delete_many({})
    await db.menu_items.delete_many({})
    await db.menu_categories.delete_many({})
    await db.inventory.delete_many({})
    await db.vendors.delete_many({})
    await db.customers.delete_many({})
    await db.bills.delete_many({})
    await db.audit_logs.delete_many({})
    await db.purchase_orders.delete_many({})
    await db.sequences.delete_many({})

    # 2. Seed Tenant (Restaurant Settings)
    logger.info("Seeding tenant profile...")
    expires_at = now + timedelta(days=30)
    grace_ends_at = expires_at + timedelta(days=7)
    
    tenant_doc = {
        "id": tenant_id,
        "name": "Gourmet Garden Cafe",
        "owner_email": "owner@gourmetgarden.com",
        "is_active": True,
        "subscription": {
            "plan": PlanType.FREE_TRIAL.value,
            "status": SubscriptionStatus.ACTIVE.value,
            "starts_at": now.isoformat(),
            "expires_at": expires_at.isoformat(),
            "grace_ends_at": grace_ends_at.isoformat()
        },
        "settings": {
            "gst_number": "07AAAAA1111A1Z1",
            "currency": "INR",
            "business_hours": "11:00 AM - 11:00 PM",
            "payment_methods": ["cash", "card", "upi", "wallet"],
            "setup_complete": True,
            "updated_at": now.isoformat()
        },
        "created_at": now.isoformat()
    }
    await db.tenants.insert_one(tenant_doc)

    # 3. Seed Users (Role based accounts)
    logger.info("Seeding personnel profile credentials...")
    users = [
        {
            "email": "owner@gourmetgarden.com",
            "full_name": "Rohan Mehta",
            "role": UserRole.OWNER.value,
            "hashed_password": hash_password("owner123"),
            "tenant_id": tenant_id,
            "branch_id": branch_id,
            "is_active": True,
            "created_at": now.isoformat()
        },
        {
            "email": "manager@gourmetgarden.com",
            "full_name": "Aman Verma",
            "role": UserRole.MANAGER.value,
            "hashed_password": hash_password("manager123"),
            "tenant_id": tenant_id,
            "branch_id": branch_id,
            "is_active": True,
            "created_at": now.isoformat()
        },
        {
            "email": "cashier@gourmetgarden.com",
            "full_name": "Karan Singh",
            "role": UserRole.CASHIER.value,
            "hashed_password": hash_password("cashier123"),
            "tenant_id": tenant_id,
            "branch_id": branch_id,
            "is_active": True,
            "created_at": now.isoformat()
        },
        {
            "email": "chef@gourmetgarden.com",
            "full_name": "Chef Sanjay",
            "role": UserRole.KITCHEN.value,
            "hashed_password": hash_password("chef123"),
            "tenant_id": tenant_id,
            "branch_id": branch_id,
            "is_active": True,
            "created_at": now.isoformat()
        },
        {
            "email": "waiter@gourmetgarden.com",
            "full_name": "Rahul Dev",
            "role": UserRole.WAITER.value,
            "hashed_password": hash_password("waiter123"),
            "tenant_id": tenant_id,
            "branch_id": branch_id,
            "is_active": True,
            "created_at": now.isoformat()
        },
        {
            "email": "accountant@gourmetgarden.com",
            "full_name": "Neha Sen",
            "role": UserRole.ACCOUNTANT.value,
            "hashed_password": hash_password("accountant123"),
            "tenant_id": tenant_id,
            "branch_id": branch_id,
            "is_active": True,
            "created_at": now.isoformat()
        },
        {
            "email": "admin@ugsrestoflow.com",
            "full_name": "Priya Sharma",
            "role": UserRole.SUPER_ADMIN.value,
            "hashed_password": hash_password("admin123"),
            "tenant_id": "platform",
            "branch_id": "platform",
            "is_active": True,
            "created_at": now.isoformat()
        }
    ]
    await db.users.insert_many(users)

    # 4. Seed Floor Layout Plan
    logger.info("Seeding floor plans layout...")
    floor_plan = {
        "name": "Main Dining Room",
        "zone": "main",
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "tables": [
            {
                "id": "T01",
                "number": "T01",
                "capacity": 2,
                "status": "available",
                "position": {"x": 2, "y": 2, "w": 1, "h": 1},
                "assigned_waiter_id": "waiter@gourmetgarden.com"
            },
            {
                "id": "T02",
                "number": "T02",
                "capacity": 4,
                "status": "occupied",
                "position": {"x": 5, "y": 2, "w": 1, "h": 1},
                "assigned_waiter_id": "waiter@gourmetgarden.com"
            },
            {
                "id": "T03",
                "number": "T03",
                "capacity": 6,
                "status": "reserved",
                "position": {"x": 2, "y": 5, "w": 1, "h": 1},
                "assigned_waiter_id": "waiter@gourmetgarden.com"
            }
        ]
    }
    await db.floor_plans.insert_one(floor_plan)

    # 5. Seed Menu Categories and Items
    logger.info("Seeding menu categories and items...")
    categories = [
        {"id": "cat_main", "name": "Main Course", "subcategories": ["Curries", "Rice"], "tenant_id": tenant_id},
        {"id": "cat_starters", "name": "Starters", "subcategories": ["Kebabs", "Dry fry"], "tenant_id": tenant_id},
        {"id": "cat_drinks", "name": "Drinks", "subcategories": ["Beverages"], "tenant_id": tenant_id},
        {"id": "cat_desserts", "name": "Desserts", "subcategories": ["Sweets"], "tenant_id": tenant_id}
    ]
    await db.menu_categories.insert_many(categories)

    menu_items = [
        {
            "id": "m_paneer",
            "name": "Paneer Butter Masala",
            "category_id": "cat_main",
            "price": 280.0,
            "variants": [],
            "modifiers": [],
            "tax_rate": 5.0,
            "has_recipe": True,
            "sku": "ITEM-PAN-BUT",
            "tenant_id": tenant_id
        },
        {
            "id": "m_roti",
            "name": "Butter Tandoori Roti",
            "category_id": "cat_main",
            "price": 40.0,
            "variants": [],
            "modifiers": [],
            "tax_rate": 5.0,
            "has_recipe": True,
            "sku": "ITEM-ROT-BUT",
            "tenant_id": tenant_id
        },
        {
            "id": "m_biryani",
            "name": "Hyderabadi Veg Biryani",
            "category_id": "cat_main",
            "price": 320.0,
            "variants": [],
            "modifiers": [],
            "tax_rate": 5.0,
            "has_recipe": False,
            "sku": "ITEM-VEG-BIR",
            "tenant_id": tenant_id
        },
        {
            "id": "s_samosa",
            "name": "Cocktail Samosa (4pcs)",
            "category_id": "cat_starters",
            "price": 120.0,
            "variants": [],
            "modifiers": [],
            "tax_rate": 5.0,
            "has_recipe": False,
            "sku": "ITEM-SAM-COK",
            "tenant_id": tenant_id
        }
    ]
    await db.menu_items.insert_many(menu_items)

    # 6. Seed Inventory (Raw Materials & Vendors)
    logger.info("Seeding raw materials inventory...")
    vendors = [
        {
            "id": "v_milk_dairy",
            "name": "Krishna Milk Dairy",
            "contact_person": "Gopal Kumar",
            "phone": "9812345678",
            "email": "gopal@krishnadairy.com",
            "tenant_id": tenant_id
        }
    ]
    await db.vendors.insert_many(vendors)

    inventory_items = [
        {
            "raw_material_id": "raw_paneer",
            "name": "Fresh Paneer (Cottage Cheese)",
            "sku": "RAW-PAN-01",
            "current_stock": 4.5,  # Low stock level (min is 10.0)
            "min_stock_level": 10.0,
            "unit": "kg",
            "tenant_id": tenant_id,
            "branch_id": branch_id,
            "updated_at": now.isoformat()
        },
        {
            "raw_material_id": "raw_butter",
            "name": "Salted Amul Butter",
            "sku": "RAW-BUT-02",
            "current_stock": 15.0,
            "min_stock_level": 5.0,
            "unit": "kg",
            "tenant_id": tenant_id,
            "branch_id": branch_id,
            "updated_at": now.isoformat()
        },
        {
            "raw_material_id": "raw_flour",
            "name": "Tandoori Atta / Flour",
            "sku": "RAW-FLO-03",
            "current_stock": 50.0,
            "min_stock_level": 25.0,
            "unit": "kg",
            "tenant_id": tenant_id,
            "branch_id": branch_id,
            "updated_at": now.isoformat()
        }
    ]
    await db.inventory.insert_many(inventory_items)

    # Seed Recipes
    recipes = [
        {
            "menu_item_id": "m_paneer",
            "ingredients": [
                {"raw_material_id": "raw_paneer", "quantity": 0.150, "unit": "kg"},
                {"raw_material_id": "raw_butter", "quantity": 0.030, "unit": "kg"}
            ],
            "tenant_id": tenant_id
        },
        {
            "menu_item_id": "m_roti",
            "ingredients": [
                {"raw_material_id": "raw_flour", "quantity": 0.080, "unit": "kg"},
                {"raw_material_id": "raw_butter", "quantity": 0.010, "unit": "kg"}
            ],
            "tenant_id": tenant_id
        }
    ]
    await db.recipes.insert_many(recipes)

    # 7. Seed Customer Wallets & History
    logger.info("Seeding customer profile lists...")
    customer = {
        "phone": "9876543210",
        "name": "Rahul Sharma",
        "email": "rahul.sharma@gmail.com",
        "membership_tier": "gold",
        "loyalty_points": 450,
        "wallet_balance": 2500.0,
        "wallet_transactions": [
            {"amount": 2500.0, "description": "Opening load promotion credit", "timestamp": now.isoformat()}
        ],
        "visits": 12,
        "tenant_id": tenant_id,
        "created_at": now.isoformat()
    }
    await db.customers.insert_one(customer)

    # 8. Seed Sample Historical Bills (for charts)
    logger.info("Seeding historical checkout bills...")
    for day in range(5, 0, -1):
        bill_time = now - timedelta(days=day)
        bill_uuid = f"bill_mock_id_{day}"
        bill_number = f"INV-MAIN-{1000 + day}"
        
        bill_doc = {
            "id": bill_uuid,
            "bill_number": bill_number,
            "tenant_id": tenant_id,
            "branch_id": branch_id,
            "items": [
                {
                    "menu_item_id": "m_paneer",
                    "name": "Paneer Butter Masala",
                    "price": 280.0,
                    "quantity": 2,
                    "taxes": [
                        {"name": "CGST", "rate": 2.5, "amount": 14.0},
                        {"name": "SGST", "rate": 2.5, "amount": 14.0}
                    ]
                }
            ],
            "subtotal": 560.0,
            "tax_total": 28.0,
            "discount_total": 0.0,
            "grand_total": 588.0,
            "payment_method": "cash" if day % 2 == 0 else "upi",
            "status": "paid",
            "offline_created_at": bill_time.isoformat(),
            "synced_at": now.isoformat(),
            "cashier_id": "cashier@gourmetgarden.com"
        }
        await db.bills.insert_one(bill_doc)

    logger.info("UGS-Restoflow Demo Database Seeded Successfully.")
    await db_manager.close()

if __name__ == "__main__":
    asyncio.run(run_seed())
