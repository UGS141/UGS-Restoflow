import logging
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as aioredis
from app.config import settings

logger = logging.getLogger("ugs_restoflow")
logging.basicConfig(level=logging.INFO)

class DatabaseManager:
    def __init__(self):
        self.mongo_client: AsyncIOMotorClient = None
        self.db = None
        self.redis_client: aioredis.Redis = None

    async def connect_and_check(self):
        """
        Initializes MongoDB and Redis connections and performs diagnostic health checks.
        Raises RuntimeError with helpful instructions if services are down.
        """
        # --- MongoDB Connection ---
        try:
            logger.info("Connecting to MongoDB...")
            self.mongo_client = AsyncIOMotorClient(
                settings.MONGO_URI,
                serverSelectionTimeoutMS=2000  # Fail fast if unavailable
            )
            # Motor client is lazy, force check by running a ping command
            await self.mongo_client.admin.command('ping')
            # Extract DB name from URI or use default
            db_name = settings.MONGO_URI.split('/')[-1] or "ugs_restoflow"
            self.db = self.mongo_client[db_name]
            logger.info("Successfully connected to MongoDB.")
        except Exception as e:
            logger.critical("MongoDB Connection Failed!")
            raise RuntimeError(
                f"\n[UGS-Restoflow Diagnostics] MongoDB is unreachable.\n"
                f"Attempted URI: {settings.MONGO_URI}\n"
                f"Error details: {str(e)}\n"
                f"Resolution Steps:\n"
                f"  1. Run 'docker-compose up -d mongodb' to launch the database container.\n"
                f"  2. Verify your MONGO_URI env variable in app/config.py or .env.\n"
            ) from e

        # --- Redis Connection ---
        try:
            logger.info("Connecting to Redis...")
            self.redis_client = aioredis.from_url(
                settings.REDIS_URI,
                socket_timeout=2.0
            )
            await self.redis_client.ping()
            logger.info("Successfully connected to Redis.")
        except Exception as e:
            logger.critical("Redis Connection Failed!")
            raise RuntimeError(
                f"\n[UGS-Restoflow Diagnostics] Redis is unreachable.\n"
                f"Attempted URI: {settings.REDIS_URI}\n"
                f"Error details: {str(e)}\n"
                f"Resolution Steps:\n"
                f"  1. Run 'docker-compose up -d redis' to launch the Redis container.\n"
                f"  2. Verify your REDIS_URI env variable in app/config.py or .env.\n"
            ) from e

    async def close(self):
        """Gracefully closes all database connections."""
        if self.mongo_client:
            self.mongo_client.close()
            logger.info("MongoDB connection closed.")
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Redis connection closed.")

# Singleton database manager instance
db_manager = DatabaseManager()

def get_db():
    """Dependency provider for the MongoDB database instance."""
    if db_manager.db is None:
        raise RuntimeError("Database connection not initialized. Call db_manager.connect_and_check() first.")
    return db_manager.db

def get_redis():
    """Dependency provider for the Redis client instance."""
    if db_manager.redis_client is None:
        raise RuntimeError("Redis connection not initialized. Call db_manager.connect_and_check() first.")
    return db_manager.redis_client
