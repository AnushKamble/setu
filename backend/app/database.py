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


from sqlalchemy import text


def init_db():
    """Create all database tables and add missing migration columns."""
    import backend.app.models  # Ensure all models are registered
    Base.metadata.create_all(bind=engine)

    # Lightweight migration for train_movements dynamic delay columns
    with engine.connect() as conn:
        for col, col_type in [
            ("original_entry_minute", "INTEGER"),
            ("original_exit_minute", "INTEGER"),
            ("delay_minutes", "INTEGER DEFAULT 0"),
            ("status", "VARCHAR(20) DEFAULT 'ON_TIME'")
        ]:
            try:
                conn.execute(text(f"ALTER TABLE train_movements ADD COLUMN {col} {col_type}"))
                conn.commit()
            except Exception:
                pass
        try:
            conn.execute(text("UPDATE train_movements SET original_entry_minute = entry_minute WHERE original_entry_minute IS NULL"))
            conn.execute(text("UPDATE train_movements SET original_exit_minute = exit_minute WHERE original_exit_minute IS NULL"))
            conn.execute(text("UPDATE train_movements SET delay_minutes = 0 WHERE delay_minutes IS NULL"))
            conn.execute(text("UPDATE train_movements SET status = 'ON_TIME' WHERE status IS NULL"))
            conn.commit()
        except Exception:
            pass


def reset_db():
    """Drop and recreate all database tables."""
    import backend.app.models  # Ensure all models are registered
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
