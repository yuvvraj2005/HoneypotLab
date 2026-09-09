from backend.app.core.database import Base, engine

# Import all models so SQLAlchemy registers them
from backend.app.models.attack import Attack
from backend.app.models.command_log import CommandLog
from backend.app.models.alert import Alert
from backend.app.models.ioc import IOC


Base.metadata.create_all(bind=engine)

print("Database tables created successfully.")