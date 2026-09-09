from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import SessionLocal
from backend.app.models.ioc import IOC


router = APIRouter(
    prefix="/iocs",
    tags=["IOCs"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get("")
def get_iocs(
    ioc_type: str | None = Query(default=None),
    session_id: str | None = Query(default=None),
    ip: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(IOC)

    if ioc_type:
        query = query.filter(IOC.ioc_type == ioc_type)

    if session_id:
        query = query.filter(IOC.session_id == session_id)

    if ip:
        query = query.filter(IOC.ip == ip)

    iocs = (
        query
        .order_by(IOC.timestamp.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": ioc.id,
            "timestamp": ioc.timestamp,
            "session_id": ioc.session_id,
            "ip": ioc.ip,
            "ioc_type": ioc.ioc_type,
            "value": ioc.value,
            "source_command": ioc.source_command,
        }
        for ioc in iocs
    ]


@router.get("/{ioc_id}")
def get_ioc(
    ioc_id: int,
    db: Session = Depends(get_db),
):
    ioc = (
        db.query(IOC)
        .filter(IOC.id == ioc_id)
        .first()
    )

    if not ioc:
        return {
            "error": "IOC not found"
        }

    return {
        "id": ioc.id,
        "timestamp": ioc.timestamp,
        "session_id": ioc.session_id,
        "ip": ioc.ip,
        "ioc_type": ioc.ioc_type,
        "value": ioc.value,
        "source_command": ioc.source_command,
    }