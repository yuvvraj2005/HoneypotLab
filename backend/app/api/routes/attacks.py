from fastapi import APIRouter

from app.schemas.attack import AttackResponse
from app.services.log_service import get_attacks


router = APIRouter()


@router.get("/attacks", response_model=list[AttackResponse])
def attacks():
    return get_attacks()