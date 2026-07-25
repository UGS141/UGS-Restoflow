import socket
import logging
from typing import Dict, Any, List
from datetime import datetime, timezone
import asyncio

from app.database import db_manager

logger = logging.getLogger("ugs_restoflow_printers")

class PrinterService:
    """
    Modular abstraction layer for thermal and label ESC/POS receipt printing.
    Manages direct TCP/IP sockets, status tests, and maintains a fallback retry queue.
    """
    
    # Simple in-memory fallback queue for offline printers
    retry_queue: List[Dict[str, Any]] = []

    @staticmethod
    async def ping_network_printer(ip: str, port: int = 9100, timeout: float = 1.5) -> str:
        """
        Attempts to open a socket connection to a network thermal printer.
        Returns 'online' if socket opens, else 'offline'.
        """
        loop = asyncio.get_event_loop()
        try:
            # Run socket connection in executor to avoid blocking main async loop
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(timeout)
            
            # Non-blocking connection test
            await loop.run_in_executor(None, s.connect, (ip, port))
            s.close()
            return "online"
        except (socket.timeout, ConnectionRefusedError, OSError) as e:
            logger.warning(f"Printer health ping failed at {ip}:{port}. Details: {str(e)}")
            return "offline"

    @classmethod
    async def send_raw_escpos(cls, ip: str, data: bytes, port: int = 9100) -> bool:
        """
        Sends raw bytes containing ESC/POS commands directly to a thermal printer.
        """
        loop = asyncio.get_event_loop()
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(2.5)
            await loop.run_in_executor(None, s.connect, (ip, port))
            await loop.run_in_executor(None, s.sendall, data)
            s.close()
            return True
        except Exception as e:
            logger.error(f"Failed to transmit print job to {ip}:{port}. Queueing for retry. Error: {str(e)}")
            # Add to retry queue
            cls.retry_queue.append({
                "ip": ip,
                "port": port,
                "data": data,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "retries": 0
            })
            return False

    @classmethod
    async def trigger_test_page(cls, ip: str, port: int = 9100) -> bool:
        """
        Compiles and sends a basic receipt format with text alignments
        and paper cut codes (ESC/POS: \x1b\x69).
        """
        # ESC/POS commands formatting
        init_printer = b"\x1b\x40"      # ESC @
        align_center = b"\x1b\x61\x01"  # ESC a 1
        font_large = b"\x1d\x21\x11"    # GS ! 17 (Double width/height)
        font_normal = b"\x1d\x21\x00"   # GS ! 0
        feed_paper = b"\n\n\n\n"
        cut_paper = b"\x1d\x56\x41\x03" # GS V 65 3 (Feed & Cut)
        
        raw_payload = (
            init_printer +
            align_center +
            font_large +
            b"UGS-Restoflow\n" +
            font_normal +
            b"Enterprise Restaurant OS\n" +
            b"-----------------------------\n" +
            b"Printer Connection Test: SUCCESS\n" +
            b"IP Node: " + ip.encode() + b"\n" +
            b"Time: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S").encode() + b"\n" +
            b"-----------------------------\n" +
            feed_paper +
            cut_paper
        )
        return await cls.send_raw_escpos(ip, raw_payload, port)

    @classmethod
    async def retry_queued_jobs(cls):
        """
        Background worker task to flush queued print jobs once printers recover online state.
        """
        if not cls.retry_queue:
            return
            
        logger.info(f"Syncing printer queue: {len(cls.retry_queue)} pending jobs.")
        still_pending = []
        
        for job in cls.retry_queue:
            ip = job["ip"]
            port = job["port"]
            
            # Check printer status
            status = await cls.ping_network_printer(ip, port)
            if status == "online":
                success = await cls.send_raw_escpos(ip, job["data"], port)
                if not success:
                    job["retries"] += 1
                    if job["retries"] < 3: # max retries
                        still_pending.append(job)
            else:
                job["retries"] += 1
                if job["retries"] < 3:
                    still_pending.append(job)
                    
        cls.retry_queue = still_pending
