import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger("ugs_restoflow")

async def initialize_indexes(db: AsyncIOMotorDatabase):
    """
    Creates compound and unique indexes on MongoDB collections
    to optimize multi-tenant query speeds and enforce constraints.
    """
    try:
        logger.info("Initializing database indexes...")
        
        # Users - unique global email for security JWT matching
        await db.users.create_index("email", unique=True)
        await db.users.create_index([("tenant_id", 1), ("role", 1)])
        
        # Bills - client UUID is unique, invoices ordered by sync time
        await db.bills.create_index("id", unique=True)
        await db.bills.create_index([("tenant_id", 1), ("branch_id", 1), ("synced_at", -1)])
        await db.bills.create_index([("tenant_id", 1), ("bill_number", 1)])
        
        # Customers - unique phone numbers per tenant to isolate loyalty wallets
        await db.customers.create_index([("tenant_id", 1), ("phone", 1)], unique=True)
        await db.customers.create_index([("tenant_id", 1), ("membership_tier", 1)])
        
        # Menu Items - unique item codes per restaurant
        await db.menu_items.create_index([("tenant_id", 1), ("id", 1)], unique=True)
        await db.menu_items.create_index([("tenant_id", 1), ("category_id", 1)])
        
        # Inventory - composite index for specific raw material levels per branch
        await db.inventory.create_index([("tenant_id", 1), ("branch_id", 1), ("raw_material_id", 1)], unique=True)
        
        # Floor Plans & Tables status search
        await db.floor_plans.create_index([("tenant_id", 1), ("branch_id", 1)])
        
        # Kitchen KOT - chronological order based on pending state
        await db.kots.create_index([("tenant_id", 1), ("branch_id", 1), ("status", 1), ("timestamp", 1)])
        
        # Purchase Orders & Vendor links
        await db.purchase_orders.create_index([("tenant_id", 1), ("status", 1)])
        
        # Notifications tracking
        await db.notifications.create_index([("tenant_id", 1), ("user_id", 1), ("is_read", 1)])
        
        # Audit Logs chronological search
        await db.audit_logs.create_index([("tenant_id", 1), ("timestamp", -1)])
        
        logger.info("All UGS-Restoflow indexes initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to provision database indexes: {str(e)}")
        raise e
