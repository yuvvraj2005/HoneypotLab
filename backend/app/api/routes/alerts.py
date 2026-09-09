from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import SessionLocal
from backend.app.models.alert import Alert


router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get("")
def get_alerts(
    severity: str | None = Query(default=None),
    event_type: str | None = Query(default=None),
    ip: str | None = Query(default=None),
    session_id: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(Alert)

    if severity:
        query = query.filter(Alert.severity == severity)

    if event_type:
        query = query.filter(Alert.event_type == event_type)

    if ip:
        query = query.filter(Alert.ip == ip)

    if session_id:
        query = query.filter(Alert.session_id == session_id)

    alerts = (
        query
        .order_by(Alert.timestamp.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": alert.id,
            "timestamp": alert.timestamp,
            "session_id": alert.session_id,
            "ip": alert.ip,
            "username": alert.username,
            "command": alert.command,
            "event_type": alert.event_type,
            "severity": alert.severity,
            "description": alert.description,
            "mitre_technique": alert.mitre_technique,
            "mitre_name": alert.mitre_name,
        }
        for alert in alerts
    ]


@router.get("/{alert_id}")
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
):
    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id)
        .first()
    )

    if not alert:
        return {
            "error": "Alert not found"
        }

    return {
        "id": alert.id,
        "timestamp": alert.timestamp,
        "session_id": alert.session_id,
        "ip": alert.ip,
        "username": alert.username,
        "command": alert.command,
        "event_type": alert.event_type,
        "severity": alert.severity,
        "description": alert.description,
        "mitre_technique": alert.mitre_technique,
        "mitre_name": alert.mitre_name,
    }