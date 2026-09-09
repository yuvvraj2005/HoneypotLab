from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes.home import router as home_router
from backend.app.api.routes.attacks import router as attacks_router
from backend.app.api.routes.stats import router as stats_router
from backend.app.api.routes.alerts import router as alerts_router
from backend.app.api.routes.sessions import router as sessions_router
from backend.app.api.routes.iocs import router as iocs_router


app = FastAPI(
    title="HoneypotLab API",
    description="SSH honeypot attack monitoring backend",
    version="1.0.0",
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


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "HoneypotLab API",
    }