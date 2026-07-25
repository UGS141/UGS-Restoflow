import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from app.database import db_manager

logger = logging.getLogger("ugs_restoflow")

class NotificationService:
    """
    Centralized dispatch center for alerts in UGS-Restoflow.
    Dispatches in-app notifications, email receipts, SMS warnings,
    and handles modular hooks for future WhatsApp integration.
    """
    @staticmethod
    async def send_in_app(
        tenant_id: str,
        user_id: str,
        title: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Logs a real-time system notification in the database.
        Connected to compound indexes for fast inbox fetching.
        """
        try:
            db = db_manager.db
            if db is None:
                logger.warning("Notification bypass: database not initialized.")
                return False

            now = datetime.now(timezone.utc)
            notification_doc = {
                "tenant_id": tenant_id,
                "user_id": user_id,
                "title": title,
                "message": message,
                "is_read": False,
                "metadata": metadata or {},
                "created_at": now.isoformat()
            }
            
            await db.notifications.insert_one(notification_doc)
            logger.info(f"In-app notification logged for user {user_id}: {title}")
            return True
        except Exception as e:
            logger.error(f"Error logging in-app notification: {str(e)}")
            return False

    @staticmethod
    async def send_email(to_email: str, subject: str, body: str) -> bool:
        """
        Sends an email alert.
        In production: Hooks into SMTP, SendGrid, or AWS SES.
        """
        logger.info(f"Sending SMTP email to {to_email}. Subject: '{subject}'")
        # Template placeholder for SMTP/SES hooks
        return True

    @staticmethod
    async def send_sms(phone_number: str, text: str) -> bool:
        """
        Sends an SMS alert.
        In production: Hooks into Twilio or MSG91.
        """
        logger.info(f"Sending SMS to {phone_number}. Content: '{text}'")
        # Template placeholder for Twilio integration
        return True

    @staticmethod
    async def send_whatsapp(phone_number: str, template_name: str, parameters: Dict[str, str]) -> bool:
        """
        Sends a WhatsApp notification.
        In production: Hooks into Meta Cloud API.
        """
        logger.info(f"Sending WhatsApp notification to {phone_number} using template '{template_name}'")
        # Template placeholder for Meta Cloud API integration
        return True
