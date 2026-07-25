from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import db_manager

# Set up logging configuration
logger = logging.getLogger("ugs_restoflow")

from app.services.websocket import ws_manager
import asyncio

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown logic for backend database services."""
    try:
        await db_manager.connect_and_check()
        logger.info("UGS-Restoflow Backend Services Initialized Successfully.")
        
        # Provision database collection indexes
        if db_manager.db is not None:
            from app.db_init import initialize_indexes
            await initialize_indexes(db_manager.db)
            
        # Start Redis Pub/Sub listener task in the background
        if db_manager.redis_client:
            ws_manager.pubsub_task = asyncio.create_task(
                ws_manager.start_redis_pubsub_listener(db_manager.redis_client)
            )
            logger.info("Redis Pub/Sub listener task spawned in background.")
    except Exception as e:
        logger.error(f"Startup Diagnostics Failed: {str(e)}")
        if settings.ENVIRONMENT == "production":
            raise e
    yield
    # Shutdown actions
    if ws_manager.pubsub_task:
        ws_manager.pubsub_task.cancel()
        try:
            await ws_manager.pubsub_task
        except asyncio.CancelledError:
            pass
    await db_manager.close()
    logger.info("UGS-Restoflow Backend Services Shut Down Successfully.")

app = FastAPI(
    title=settings.APP_NAME,
    description="UGS-Restoflow Cloud Restaurant OS API Gateway",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this to domain lists in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint with diagnostics
@app.get("/health", status_code=status.HTTP_200_OK, tags=["Health"])
async def health_check():
    """Verify backend and database connection state."""
    db_status = "unhealthy"
    redis_status = "unhealthy"
    
    if db_manager.db is not None:
        try:
            await db_manager.mongo_client.admin.command('ping')
            db_status = "healthy"
        except Exception:
            pass

    if db_manager.redis_client is not None:
        try:
            await db_manager.redis_client.ping()
            redis_status = "healthy"
        except Exception:
            pass
            
    is_healthy = db_status == "healthy" and redis_status == "healthy"
    
    if not is_healthy:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "unhealthy",
                "mongodb": db_status,
                "redis": redis_status,
                "diagnostics": "Check docker-compose logs or service connections."
            }
        )

    return {
        "status": "healthy",
        "mongodb": db_status,
        "redis": redis_status,
        "app_name": settings.APP_NAME,
        "environment": settings.ENVIRONMENT
    }

# Core API root endpoint
@app.get("/", tags=["Root"])
async def read_root():
    return {
        "message": f"Welcome to the {settings.APP_NAME} SaaS API Gateway.",
        "documentation": "/docs",
        "version": "v1"
    }

# Include API v1 Router Modules
from app.api.v1.auth.routes import router as auth_router
from app.api.v1.tenant.routes import router as tenant_router
from app.api.v1.billing.routes import router as billing_router
from app.api.v1.layout.routes import router as layout_router
from app.api.v1.menu.routes import router as menu_router
from app.api.v1.inventory.routes import router as inventory_router
from app.api.v1.crm.routes import router as crm_router
from app.api.v1.reports.routes import router as reports_router
from app.api.v1.printers.routes import router as printers_router
from app.api.v1.finance.routes import router as finance_router
from app.api.v1.audit.routes import router as audit_router
from app.api.v1.platform.routes import router as platform_router

app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Auth"])
app.include_router(tenant_router, prefix=f"{settings.API_V1_STR}/tenant", tags=["Tenant"])
app.include_router(billing_router, prefix=f"{settings.API_V1_STR}/billing", tags=["Billing"])
app.include_router(layout_router, prefix=f"{settings.API_V1_STR}/layout", tags=["Layout"])
app.include_router(menu_router, prefix=f"{settings.API_V1_STR}/menu", tags=["Menu"])
app.include_router(inventory_router, prefix=f"{settings.API_V1_STR}/inventory", tags=["Inventory"])
app.include_router(crm_router, prefix=f"{settings.API_V1_STR}/crm", tags=["CRM"])
app.include_router(reports_router, prefix=f"{settings.API_V1_STR}/reports", tags=["Reports"])
app.include_router(printers_router, prefix=f"{settings.API_V1_STR}/printers", tags=["Printers"])
app.include_router(finance_router, prefix=f"{settings.API_V1_STR}/finance", tags=["Finance"])
app.include_router(audit_router, prefix=f"{settings.API_V1_STR}/audit", tags=["Audit"])
app.include_router(platform_router, prefix=f"{settings.API_V1_STR}/platform", tags=["Platform"])

# WebSocket endpoint
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws/{tenant_id}/{branch_id}")
async def websocket_endpoint(websocket: WebSocket, tenant_id: str, branch_id: str):
    """Real-time communication gateway for tablets, KDS screens, and cashiers."""
    await ws_manager.connect(tenant_id, branch_id, websocket)
    try:
        while True:
            # Maintain active connection, listening for client heartbeat/messages
            data = await websocket.receive_text()
            logger.info(f"Socket [{tenant_id}:{branch_id}] received: {data}")
    except WebSocketDisconnect:
        ws_manager.disconnect(tenant_id, branch_id, websocket)

