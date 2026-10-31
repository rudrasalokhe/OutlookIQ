"""
MongoDB Service Manager for OutlookIQ
Provides persistent document storage for user accounts, institutional profiles,
watchlists, and audit logs with resilient fallback support.
"""

import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import uuid

from backend.config import settings

logger = logging.getLogger(__name__)

import json
from pathlib import Path

# Persistent fallback storage if MongoDB Atlas IP is pending whitelist
USERS_FILE = Path(__file__).resolve().parent.parent / "storage" / "users.json"
_memory_users: Dict[str, Dict[str, Any]] = {}
_memory_watchlists: Dict[str, List[str]] = {}
_memory_logs: List[Dict[str, Any]] = []

def _load_persisted_users():
    global _memory_users
    if USERS_FILE.exists():
        try:
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                _memory_users = json.load(f)
        except Exception as e:
            logger.warning(f"Could not load users from {USERS_FILE}: {e}")

def _save_persisted_users():
    try:
        USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(_memory_users, f, indent=2)
    except Exception as e:
        logger.warning(f"Could not save users to {USERS_FILE}: {e}")

_load_persisted_users()

class MongoManager:
    def __init__(self):
        self._client = None
        self._db = None
        self._connected = False
        self._last_error = ""
        self._init_connection()

    def _init_connection(self):
        if not settings.MONGO_URI:
            self._connected = False
            self._last_error = "MONGO_URI not configured in .env"
            logger.info("MongoDB URI not provided. Using in-memory fallback store.")
            return

        try:
            from pymongo import MongoClient
            import certifi
            self._client = MongoClient(
                settings.MONGO_URI,
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=1000,
                connectTimeoutMS=1000
            )
            # Test connection with ping
            self._client.admin.command('ping')
            self._db = self._client[settings.MONGO_DB_NAME]
            self._connected = True
            self._last_error = ""

            # Ensure indexes safely
            try:
                self._db.users.create_index("email", unique=True)
                self._db.audit_logs.create_index("user_id")
            except Exception:
                pass
            logger.info(f"Successfully connected to MongoDB database: {settings.MONGO_DB_NAME}")
        except Exception as e:
            self._connected = False
            self._last_error = str(e)
            logger.warning(f"Could not connect to MongoDB ({e}). Falling back to memory store.")

    def reload(self):
        """Re-attempt connection (e.g. after user updates .env)."""
        self._init_connection()
        return self.get_status()

    def get_status(self) -> Dict[str, Any]:
        count = 0
        if self._connected and self._db is not None:
            try:
                count = self._db.users.count_documents({})
            except Exception:
                count = len(_memory_users)
        else:
            count = len(_memory_users)

        return {
            "connected": self._connected,
            "uri_configured": bool(settings.MONGO_URI),
            "database": settings.MONGO_DB_NAME if self._connected else "local_fallback",
            "message": "Connected to MongoDB" if self._connected else f"Offline: {self._last_error or 'Awaiting MONGO_URI'}",
            "user_count": count
        }

    # ================= User Operations =================

    def find_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        norm_email = email.lower().strip()
        if self._connected and self._db is not None:
            try:
                user = self._db.users.find_one({"email": norm_email})
                if user:
                    user["_id"] = str(user["_id"])
                    return user
            except Exception as e:
                logger.error(f"MongoDB read error: {e}")

        # Check fallback
        for u in _memory_users.values():
            if u.get("email") == norm_email:
                return dict(u)
        return None

    def find_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        if self._connected and self._db is not None:
            try:
                from bson import ObjectId
                # Try both ObjectId and string ID
                query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
                user = self._db.users.find_one(query)
                if user:
                    user["_id"] = str(user["_id"])
                    return user
            except Exception:
                pass

        if user_id in _memory_users:
            return dict(_memory_users[user_id])
        return None

    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        user_id = str(uuid.uuid4())
        doc = {
            "_id": user_id,
            "email": user_data["email"].lower().strip(),
            "hashed_password": user_data["hashed_password"],
            "full_name": user_data.get("full_name", "Quantitative Analyst"),
            "organization": user_data.get("organization", "Institutional Research"),
            "role": user_data.get("role", "Senior Analyst"),
            "tier": user_data.get("tier", "Institutional Tier"),
            "investment_focus": user_data.get("investment_focus", "Large Cap Tech & Semis"),
            "guidance_tolerance": user_data.get("guidance_tolerance", "Strict"),
            "api_key": f"oq_live_{uuid.uuid4().hex[:24]}",
            "watchlist": user_data.get("watchlist", ["NVDA", "MSFT", "AAPL"]),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        if self._connected and self._db is not None:
            try:
                self._db.users.insert_one(dict(doc))
                doc["_id"] = str(doc["_id"])
            except Exception as e:
                logger.error(f"MongoDB insert error: {e}. Storing in memory fallback.")

        _memory_users[user_id] = doc
        _save_persisted_users()
        return doc

    def update_user_profile(self, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        # Protect credentials from arbitrary profile update
        updates.pop("hashed_password", None)
        updates.pop("_id", None)

        if self._connected and self._db is not None:
            try:
                from bson import ObjectId
                query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
                self._db.users.update_one(query, {"$set": updates})
            except Exception as e:
                logger.error(f"MongoDB update error: {e}")

        if user_id in _memory_users:
            _memory_users[user_id].update(updates)
            _save_persisted_users()
            return dict(_memory_users[user_id])
        return self.find_user_by_id(user_id)

    def record_audit_log(self, user_id: str, action: str, details: Dict[str, Any]) -> None:
        log_entry = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "action": action,
            "details": details,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        if self._connected and self._db is not None:
            try:
                self._db.audit_logs.insert_one(log_entry)
                return
            except Exception as e:
                logger.error(f"Failed to record audit log in Mongo: {e}")

        _memory_logs.append(log_entry)


mongo_manager = MongoManager()
