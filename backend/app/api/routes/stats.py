from collections import Counter
from datetime import datetime

from fastapi import APIRouter

from backend.app.services.log_service import get_attacks


router = APIRouter()


@router.get("/stats")
def stats():
    attacks = get_attacks()

    if not attacks:
        return {
            "total_attacks": 0,
            "unique_ips": 0,
            "unique_usernames": 0,
            "top_username": None,
            "top_ip": None,
            "latest_attack": None,
        }

    usernames = [attack["username"] for attack in attacks]
    ips = [attack["ip"] for attack in attacks]

    top_username = Counter(usernames).most_common(1)[0][0]
    top_ip = Counter(ips).most_common(1)[0][0]

    return {
        "total_attacks": len(attacks),
        "unique_ips": len(set(ips)),
        "unique_usernames": len(set(usernames)),
        "top_username": top_username,
        "top_ip": top_ip,
        "latest_attack": attacks[0],
    }


@router.get("/stats/timeline")
def attack_timeline():
    attacks = get_attacks(limit=1000)

    daily_counts = Counter()

    for attack in attacks:
        timestamp = attack["timestamp"]

        if isinstance(timestamp, datetime):
            date = timestamp.date().isoformat()
        else:
            date = str(timestamp)[:10]

        daily_counts[date] += 1

    return [
        {
            "date": date,
            "attacks": daily_counts[date],
        }
        for date in sorted(daily_counts)
    ]