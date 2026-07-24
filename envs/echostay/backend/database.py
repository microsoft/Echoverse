from sqlmodel import SQLModel, Session, create_engine

_db_path: str = "./echostay.db"
_engine = None


def set_db_path(path: str):
    """Set the database file path. Must be called before init_db()."""
    global _db_path, _engine
    _db_path = path
    _engine = None


def get_engine():
    """Get or create the database engine."""
    global _engine
    if _engine is None:
        database_url = f"sqlite:///{_db_path}"
        _engine = create_engine(
            database_url,
            connect_args={"check_same_thread": False},
            echo=False
        )
    return _engine


def init_db():
    """Create all tables from SQLModel metadata."""
    SQLModel.metadata.create_all(get_engine())


def get_session():
    """FastAPI dependency for database sessions."""
    with Session(get_engine()) as session:
        yield session
