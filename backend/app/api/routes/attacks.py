from fastapi import APIRouter, HTTPException, Query

from backend.app.schemas.attack import AttackResponse
from backend.app.services.log_service import (
    get_attack_by_id,
    get_attacks,
)


router = APIRouter()


@router.get("/attacks", response_model=list[AttackResponse])
def attacks(
    limit: int = Query(default=100, ge=1, le=1000),
    ip: str | None = None,
    username: str | None = None,
):
    return get_attacks(
        limit=limit,
        ip=ip,
        username=username,
    )


@router.get("/attacks/{attack_id}", response_model=AttackResponse)
def attack_detail(attack_id: int):
    attack = get_attack_by_id(attack_id)

    if not attack:
        raise HTTPException(
            status_code=404,
            detail="Attack not found",
        )

    return attack