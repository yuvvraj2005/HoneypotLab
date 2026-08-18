from fastapi import FastAPI

from app.api.routes.home import router as home_router
from app.api.routes.attacks import router as attacks_router
from app.api.routes.stats import router as stats_router


app = FastAPI()

app.include_router(home_router)
app.include_router(attacks_router)
app.include_router(stats_router)