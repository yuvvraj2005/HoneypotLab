from app.core.database import Base, engine
from app.models.attack import Attack


Base.metadata.create_all(bind=engine)

print("Database tables created successfully.")