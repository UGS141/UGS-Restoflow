import asyncio
import logging
from fastapi import WebSocket
from typing import Dict, List, Set
import redis.asyncio as aioredis
from app.config import settings

logger = logging.getLogger("ugs_restoflow")

class WebSocketManager:
    def __init__(self):
        # Maps "tenant_id:branch_id" -> Set of active WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.pubsub_task: asyncio.Task = None

    async def connect(self, tenant_id: str, branch_id: str, websocket: WebSocket):
        """Register a new device connection for a specific branch."""
        await websocket.accept()
        key = f"{tenant_id}:{branch_id}"
        if key not in self.active_connections:
            self.active_connections[key] = set()
        self.active_connections[key].add(websocket)
        logger.info(f"Device connected to socket. Tenant/Branch key: {key}. Total active: {len(self.active_connections[key])}")

    def disconnect(self, tenant_id: str, branch_id: str, websocket: WebSocket):
        """Deregister an active device connection."""
        key = f"{tenant_id}:{branch_id}"
        if key in self.active_connections:
            self.active_connections[key].discard(websocket)
            if not self.active_connections[key]:
                del self.active_connections[key]
        logger.info(f"Device disconnected from socket. Tenant/Branch key: {key}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send message to a single specific device."""
        await websocket.send_text(message)

    async def broadcast_to_branch(self, tenant_id: str, branch_id: str, message: str):
        """Send message to all active devices in a specific restaurant branch."""
        key = f"{tenant_id}:{branch_id}"
        if key in self.active_connections:
            # Gather tasks to run concurrent sends
            dead_sockets = []
            for connection in self.active_connections[key]:
                try:
                    await connection.send_text(message)
                except Exception:
                    dead_sockets.append(connection)
            
            # Clean up dead sockets
            for socket in dead_sockets:
                self.disconnect(tenant_id, branch_id, socket)

    async def start_redis_pubsub_listener(self, redis_client: aioredis.Redis):
        """
        Background listener task. Subscribes to Redis channels and
        broadcasts messages to appropriate connected WebSockets.
        Ensures multi-node clusters sync notifications seamlessly.
        """
        if not redis_client:
            logger.warning("Redis client not initialized. Local pub/sub listener is bypassed.")
            return

        pubsub = redis_client.pubsub()
        # Pattern subscribe to all channels matching 'pubsub:*'
        await pubsub.psubscribe("pubsub:*")
        logger.info("Active Redis Pub/Sub listener connected to channel patterns.")

        try:
            async for message in pubsub.listen():
                if message["type"] == "pmessage":
                    channel = message["channel"].decode("utf-8") # e.g. pubsub:tenant_123:branch_main:orders
                    data = message["data"].decode("utf-8")
                    
                    # Extract tenant and branch from channel name
                    parts = channel.split(":")
                    if len(parts) >= 4:
                        tenant_id = parts[1]
                        branch_id = parts[2]
                        event_type = parts[3] # orders, tables, etc.
                        
                        payload = f'{{"event": "{event_type}", "data": "{data}"}}'
                        await self.broadcast_to_branch(tenant_id, branch_id, payload)
        except asyncio.CancelledError:
            logger.info("Redis Pub/Sub listener task was cancelled.")
        except Exception as e:
            logger.error(f"Redis Pub/Sub listener encountered an error: {str(e)}")
        finally:
            await pubsub.punsubscribe("pubsub:*")
            await pubsub.close()

# Singleton websocket manager
ws_manager = WebSocketManager()
