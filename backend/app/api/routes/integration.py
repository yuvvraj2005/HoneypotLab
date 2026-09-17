from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.attack import Attack
from backend.app.models.alert import Alert
from backend.app.models.ioc import IOC


router = APIRouter(prefix="/integration", tags=["Integration"])


@router.get("/security-summary")
def security_summary(db: Session = Depends(get_db)):
    total_attacks = db.query(Attack).count()
    security_alerts = db.query(Alert).count()
    critical_alerts = (
        db.query(Alert)
        .filter(Alert.severity == "CRITICAL")
        .count()
    )
    ioc_count = db.query(IOC).count()

    if critical_alerts > 0:
        status = "critical"
    elif security_alerts > 0:
        status = "warning"
    else:
        status = "secure"

    return {
        "status": status,
        "total_attacks": total_attacks,
        "security_alerts": security_alerts,
        "critical_alerts": critical_alerts,
        "ioc_count": ioc_count,
    }
