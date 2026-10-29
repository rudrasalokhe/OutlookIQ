"""
OutlookIQ FastAPI Application Entrypoint.
Initializes database tables, runs seed logic, configures CORS, and registers API routes.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import settings
from backend.database import engine, Base, SessionLocal
from backend.services.seed_data import seed_database

# Import routers
from backend.routes.health import router as health_router
from backend.routes.companies import router as companies_router
from backend.routes.promises import router as promises_router
from backend.routes.analytics import router as analytics_router
from backend.routes.comparison import router as comparison_router
from backend.routes.documents import router as documents_router
from backend.routes.analyze import router as analyze_router
from backend.routes.chat import router as chat_router

# Ensure tables exist at startup
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Ensure database schema
    Base.metadata.create_all(bind=engine)

    # 2. Seed initial verified company & guidance records if database is empty
    db = SessionLocal()
    try:
        from backend.models.company import Company
        if db.query(Company).count() == 0:
            print("Populating initial institutional financial records...")
            seed_database(db)
        else:
            print(f"Database online with {db.query(Company).count()} companies.")
    finally:
        db.close()

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Institutional corporate guidance tracking & deterministic RAG verification engine.",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health_router, prefix=settings.API_PREFIX)
app.include_router(companies_router, prefix=settings.API_PREFIX)
app.include_router(promises_router, prefix=settings.API_PREFIX)
app.include_router(analytics_router, prefix=settings.API_PREFIX)
app.include_router(comparison_router, prefix=settings.API_PREFIX)
app.include_router(documents_router, prefix=settings.API_PREFIX)
app.include_router(analyze_router, prefix=settings.API_PREFIX)
app.include_router(chat_router, prefix=settings.API_PREFIX)

# Also expose /health at root for health check probes
@app.get("/health")
def root_health():
    return {"status": "healthy", "service": settings.PROJECT_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
