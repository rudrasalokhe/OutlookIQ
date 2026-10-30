"""
Authentication and Institutional User Profile API
Integrates with MongoDB (or resilient fallback) with JWT token security.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, List
import uuid

import bcrypt
import jwt
from fastapi import APIRouter, HTTPException, Depends, Header, status
from pydantic import BaseModel, Field

from backend.config import settings
from backend.services.mongo import mongo_manager

router = APIRouter(prefix="/auth", tags=["Authentication & Profile"])

# Pydantic Schemas
class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    full_name: str = "Quantitative Analyst"
    organization: str = "Institutional Research Desk"
    role: str = "Senior Analyst"
    investment_focus: str = "Large Cap Tech & Semis"
    guidance_tolerance: str = "Strict"

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    organization: Optional[str] = None
    role: Optional[str] = None
    investment_focus: Optional[str] = None
    guidance_tolerance: Optional[str] = None
    watchlist: Optional[List[str]] = None

class MongoConnectRequest(BaseModel):
    mongo_uri: str
    database_name: Optional[str] = "outlookiq"


# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_id: str, email: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expires,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        # Provide demo institutional account if unauthenticated
        demo_user = mongo_manager.find_user_by_email("analyst@outlookiq.internal")
        if not demo_user:
            demo_user = mongo_manager.create_user({
                "email": "analyst@outlookiq.internal",
                "hashed_password": hash_password("demo123"),
                "full_name": "Rudra Salokhe",
                "organization": "Apex Capital Management",
                "role": "Lead Quantitative Strategist",
                "tier": "Institutional Tier",
                "investment_focus": "Big Tech & AI Semiconductors",
                "guidance_tolerance": "Strict Corridors (±2.5%)",
                "watchlist": ["NVDA", "MSFT", "AAPL", "GOOGL", "AMZN"]
            })
        return demo_user

    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        user = mongo_manager.find_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired. Please log in again.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Authentication error: {str(e)}")


# Endpoints
@router.get("/status")
def get_auth_and_db_status():
    """Diagnostic endpoint checking MongoDB connectivity and store statistics."""
    return mongo_manager.get_status()

@router.post("/connect-mongo")
def connect_mongo_dynamic(req: MongoConnectRequest):
    """Dynamically configure MongoDB connection string at runtime."""
    settings.MONGO_URI = req.mongo_uri
    if req.database_name:
        settings.MONGO_DB_NAME = req.database_name
    status_res = mongo_manager.reload()
    return status_res

@router.post("/register")
def register_user(req: RegisterRequest):
    existing = mongo_manager.find_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An account with this email already exists.")

    new_user = mongo_manager.create_user({
        "email": req.email,
        "hashed_password": hash_password(req.password),
        "full_name": req.full_name,
        "organization": req.organization,
        "role": req.role,
        "investment_focus": req.investment_focus,
        "guidance_tolerance": req.guidance_tolerance,
        "watchlist": ["NVDA", "MSFT", "AAPL"]
    })

    token = create_access_token(new_user["_id"], new_user["email"])
    clean_user = {k: v for k, v in new_user.items() if k != "hashed_password"}

    mongo_manager.record_audit_log(new_user["_id"], "USER_REGISTERED", {"email": req.email})
    return {
        "token": token,
        "user": clean_user,
        "message": "Institutional account created successfully."
    }

@router.post("/login")
def login_user(req: LoginRequest):
    user = mongo_manager.find_user_by_email(req.email)
    if not user or not verify_password(req.password, user.get("hashed_password", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    token = create_access_token(user["_id"], user["email"])
    clean_user = {k: v for k, v in user.items() if k != "hashed_password"}

    mongo_manager.record_audit_log(user["_id"], "USER_LOGIN", {"ip": "client"})
    return {
        "token": token,
        "user": clean_user,
        "message": "Authenticated successfully."
    }

@router.get("/me")
def get_current_profile(user: dict = Depends(get_current_user)):
    clean_user = {k: v for k, v in user.items() if k != "hashed_password"}
    db_status = mongo_manager.get_status()
    return {
        "user": clean_user,
        "database": db_status
    }

@router.put("/profile")
def update_profile(req: ProfileUpdateRequest, user: dict = Depends(get_current_user)):
    updates = req.model_dump(exclude_unset=True)
    updated = mongo_manager.update_user_profile(user["_id"], updates)
    if not updated:
        raise HTTPException(status_code=400, detail="Failed to update profile.")

    mongo_manager.record_audit_log(user["_id"], "PROFILE_UPDATED", {"fields": list(updates.keys())})
    clean_user = {k: v for k, v in updated.items() if k != "hashed_password"}
    return {
        "user": clean_user,
        "message": "Profile updated successfully."
    }

@router.post("/api-key/rotate")
def rotate_api_key(user: dict = Depends(get_current_user)):
    new_key = f"oq_live_{uuid.uuid4().hex[:24]}"
    updated = mongo_manager.update_user_profile(user["_id"], {"api_key": new_key})
    mongo_manager.record_audit_log(user["_id"], "API_KEY_ROTATED", {})
    return {
        "api_key": new_key,
        "message": "New institutional API key generated."
    }
