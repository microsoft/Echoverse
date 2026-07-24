from sqlalchemy import event
from sqlmodel import SQLModel, Session, create_engine

_db_path: str = "./echoforge.db"
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
            connect_args={"check_same_thread": False, "timeout": 30},
            echo=False,
        )

        @event.listens_for(_engine, "connect")
        def _set_wal_mode(dbapi_conn, _):
            dbapi_conn.execute("PRAGMA journal_mode=WAL")
            dbapi_conn.execute("PRAGMA busy_timeout=30000")

    return _engine


# For backwards compatibility
@property
def engine():
    return get_engine()


def init_db():
    SQLModel.metadata.create_all(get_engine())


def get_session():
    with Session(get_engine()) as session:
        yield session


# Backwards compatibility: expose engine as module-level variable
class _EngineProxy:
    """Proxy to lazily get the engine."""
    def __getattr__(self, name):
        return getattr(get_engine(), name)

engine = _EngineProxy()
