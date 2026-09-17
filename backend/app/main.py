from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes.home import router as home_router
from backend.app.api.routes.attacks import router as attacks_router
from backend.app.api.routes.stats import router as stats_router
from backend.app.api.routes.alerts import router as alerts_router
from backend.app.api.routes.sessions import router as sessions_router
from backend.app.api.routes.iocs import router as iocs_router
from backend.app.api.routes.integration import router as integration_router

from backend.app.core.database import Base, engine, DATABASE_PATH


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure the database directory exists on a fresh filesystem (e.g. Render).
    # SQLite will not create parent directories automatically.
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

    # Import all models so that SQLAlchemy registers their table metadata
    # with Base before create_all() is called. Order does not matter here
    # because there are no FK relationships between these tables.
    import backend.app.models.attack       # noqa: F401  – registers "attacks"
    import backend.app.models.command_log  # noqa: F401  – registers "command_logs"
    import backend.app.models.alert        # noqa: F401  – registers "alerts"
    import backend.app.models.ioc          # noqa: F401  – registers "iocs"

    # Create every table that does not already exist.
    # Using checkfirst=True (the default for create_all) means this is safe
    # to run on startup even when the database already has data – existing
    # tables are never dropped or modified.
    Base.metadata.create_all(bind=engine)

    yield
    # Nothing to tear down for SQLite.


app = FastAPI(
    title="HoneypotLab API",
    description="SSH honeypot attack monitoring backend",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(home_router)
app.include_router(attacks_router)
app.include_router(stats_router)
app.include_router(alerts_router)
app.include_router(sessions_router)
app.include_router(iocs_router)
app.include_router(integration_router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "HoneypotLab API",
    }