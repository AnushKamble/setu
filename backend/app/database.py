import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.app.config import settings

# Engine configuration
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency for yielding database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all database tables."""
    import backend.app.models  # Ensure all models are registered
    Base.metadata.create_all(bind=engine)


def reset_db():
    """Drop and recreate all database tables."""
    import backend.app.models  # Ensure all models are registered
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
