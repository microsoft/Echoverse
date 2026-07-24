"""SQLModel + SQLite setup for datepicker_env.

The engine auto-reconnects if the DB file is replaced (inode change).
This prevents the recurring "readonly database" error after reseeding.
"""
from __future__ import annotations

import os
from pathlib import Path

from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy import Engine

_engine: Engine | None = None
_db_path: str = "./datepicker_grounded.db"
_db_inode: int = 0  # tracks the file inode to detect replacement

# Secondary engines keyed by resolved db path. Used by the /eval browse page to
# open a task from a DB other than the primary one, since a task's db_file may
# name a DB other than the primary that shares the task_id namespace.
_engines: dict[str, Engine] = {}


def get_engine_for(db_file: str) -> Engine:
    """Return a cached engine for an arbitrary db file (resolved next to the primary DB).

    Falls back to the primary engine when db_file is empty or names the primary DB.
    """
    if not db_file:
        return get_engine()
    base = os.path.realpath(Path(_db_path).resolve().parent)
    # Strip any directory components from the requested name, then resolve and
    # verify the result stays inside `base` (defends against path traversal).
    candidate = os.path.realpath(os.path.join(base, os.path.basename(db_file)))
    if not candidate.startswith(base + os.sep):
        # Only DBs sitting directly next to the primary DB are allowed.
        return get_engine()
    if os.path.dirname(candidate) != base:
        return get_engine()
    if candidate == os.path.realpath(str(Path(_db_path).resolve())):
        return get_engine()
    p = Path(candidate)
    key = str(p)
    eng = _engines.get(key)
    if eng is None:
        eng = create_engine(
            f"sqlite:///{p}",
            echo=False,
            connect_args={"check_same_thread": False},
        )
        _engines[key] = eng
    return eng


def set_db_path(path: str) -> None:
    """Set DB path. Resets engine so next get_engine() uses the new path."""
    global _db_path, _engine, _db_inode
    _db_path = path
    _engine = None
    _db_inode = 0


def get_engine() -> Engine:
    """Get or create the SQLAlchemy engine.

    If the DB file has been replaced (different inode), the old engine
    is disposed and a new one is created. This handles the case where
    seed.py deletes and recreates the DB while the server is running.
    """
    global _engine, _db_inode

    # Check if the DB file was replaced
    try:
        current_inode = os.stat(_db_path).st_ino
    except FileNotFoundError:
        current_inode = 0

    if _engine is not None and _db_inode != 0 and current_inode != _db_inode:
        # DB file was replaced — dispose old engine
        _engine.dispose()
        _engine = None

    if _engine is None:
        _engine = create_engine(
            f"sqlite:///{_db_path}",
            echo=False,
            connect_args={"check_same_thread": False},
        )
        # Use WAL journal mode so sqldiff can read while backend writes
        from sqlalchemy import event
        @event.listens_for(_engine, "connect")
        def _set_wal(dbapi_conn, connection_record):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA busy_timeout=5000")
            cursor.close()
        _db_inode = current_inode

    return _engine


def init_db() -> Engine:
    """Create tables and return the engine."""
    import backend.models  # noqa: F401
    eng = get_engine()
    SQLModel.metadata.create_all(eng)
    return eng


def get_session():
    """Yield a SQLModel Session (FastAPI dependency)."""
    with Session(get_engine()) as session:
        yield session
