"""FastAPI Application Entry Point - Mission Control OS."""

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from sqlalchemy import text

from backend.api import routes
from backend.db.session import engine, init_db

APP_VERSION = "0.0.1"
APP_PHASE = "Phase 5 - Polish & Launch"
STARTED_AT = datetime.now(timezone.utc)

# Lifespan context for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    init_db()
    print("✓ Database initialized")
    yield
    # Shutdown
    print("✓ Application shutdown")

# Create FastAPI app
app = FastAPI(
    title="Mission Control OS",
    description="AI orchestration system with BATMAN/JARVIS/WAKANDA modes",
    version=APP_VERSION,
    lifespan=lifespan
)


def _parse_allowed_origins(raw: str) -> list[str]:
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return origins or ["http://localhost:3000"]

# CORS middleware.
# - allow_origins: explicit production-style origins from env (or default :3000).
# - allow_origin_regex: any localhost / 127.0.0.1 port for local dev (Next.js
#   may fall back to a random port via autoPort when 3000 is taken).
allowed_origins = _parse_allowed_origins(
    os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(routes.router, prefix="/api", tags=["missions"])

# Health check endpoint
@app.get("/health")
async def health_check():
    """Lightweight liveness check."""
    return {
        "status": "ok",
        "version": APP_VERSION,
        "phase": APP_PHASE,
    }


@app.get("/status")
async def status_check():
    """Non-secret runtime status snapshot for deployment monitors."""
    now = datetime.now(timezone.utc)
    return {
        "status": "ok",
        "version": APP_VERSION,
        "phase": APP_PHASE,
        "environment": os.getenv("ENV", "dev"),
        "started_at": STARTED_AT.isoformat(),
        "uptime_seconds": round((now - STARTED_AT).total_seconds(), 3),
        "probes": {
            "liveness": "/health",
            "status": "/status",
            "readiness": "/ready",
        },
    }


@app.get("/ready")
async def readiness_check():
    """Deployment readiness check with non-secret dependency status."""
    checked_at = datetime.now(timezone.utc).isoformat()
    env_name = os.getenv("ENV", "dev")
    database = _check_database()
    anthropic_api_key = _check_required_secret("ANTHROPIC_API_KEY")
    ready = (
        database["status"] == "ok"
        and anthropic_api_key["status"] == "ok"
    )

    payload = {
        "status": "ready" if ready else "degraded",
        "version": APP_VERSION,
        "phase": APP_PHASE,
        "environment": env_name,
        "checked_at": checked_at,
        "checks": {
            "database": database,
            "anthropic_api_key": anthropic_api_key,
            "api_router": {"status": "ok", "prefix": "/api"},
        },
    }
    status_code = 200 if ready else 503
    return JSONResponse(payload, status_code=status_code)


def _check_database() -> dict[str, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001
        return {
            "status": "error",
            "message": exc.__class__.__name__,
        }
    return {"status": "ok"}


def _check_required_secret(name: str) -> dict[str, str]:
    if os.getenv(name):
        return {"status": "ok"}
    return {
        "status": "missing",
        "message": f"{name} is not configured",
    }

# Documentation
@app.get("/")
async def root():
    """API root."""
    return {
        "message": "Mission Control OS API",
        "docs": "/docs",
        "openapi": "/openapi.json"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENV", "dev") == "dev"
    )
