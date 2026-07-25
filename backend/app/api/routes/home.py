from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def home():
    return {
        "message": "Welcome to HoneypotLab Backend!"
    }


@router.get("/about")
def about():
    return {
        "project": "HoneypotLab",
        "phase": 2,
        "purpose": "Cybersecurity Honeypot Dashboard Backend"
    }
