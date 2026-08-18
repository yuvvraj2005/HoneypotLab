from collections import Counter

from fastapi import APIRouter

from app.services.log_service import get_attacks


router = APIRouter()


@router.get("/stats")
def stats():
    attacks = get_attacks()

    usernames = [attack["username"] for attack in attacks]
    ips = [attack["ip"] for attack in attacks]

    return {
        "total_attacks": len(attacks),
        "unique_ips": len(set(ips)),
        "unique_usernames": len(set(usernames)),
        "top_username": Counter(usernames).most_common(1)[0][0] if usernames else None,
    }