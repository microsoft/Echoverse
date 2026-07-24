import argparse
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.database import init_db, set_db_path
from backend.routes import router, set_default_user_id

static_dir: Path | None = None
_source_db: str | None = None


def _safe_path(base: Path, *parts: str) -> Path | None:
    """Resolve ``base``/``parts`` and return it only if it stays inside ``base``.

    Prevents path traversal: any ``..`` or absolute component that escapes ``base``
    yields ``None``.
    """
    base_real = os.path.realpath(base)
    target_real = os.path.realpath(os.path.join(base_real, *(str(p) for p in parts)))
    if target_real == base_real or target_real.startswith(base_real + os.sep):
        return Path(target_real)
    return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="EchoStay API", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router)

    return app


def mount_static(app: FastAPI, static_path: Path):
    global static_dir
    static_dir = static_path
    if static_dir.exists():
        app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")
        listing_images_dir = static_path / "listing-images"
        if listing_images_dir.exists():
            app.mount("/listing-images", StaticFiles(directory=listing_images_dir), name="listing-images")

        @app.get("/{full_path:path}")
        async def serve_spa(request: Request, full_path: str):
            file_path = _safe_path(static_dir, full_path)
            if file_path is not None and file_path.is_file():
                return FileResponse(file_path)
            return FileResponse(static_dir / "index.html")


app = create_app()


def main():
    import uvicorn

    parser = argparse.ArgumentParser(description="EchoStay App")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    parser.add_argument("--db", default="./echostay.db", help="Path to SQLite database file")
    parser.add_argument("--user", type=int, default=1, help="Default user ID")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    args = parser.parse_args()

    global _source_db
    _source_db = args.db
    set_db_path(args.db)
    set_default_user_id(args.user)

    static_path = Path(__file__).parent.parent / "frontend" / "dist"
    mount_static(app, static_path)

    print(f"\n  EchoStay App running at http://{args.host}:{args.port}")
    print(f"  Database: {args.db}")
    print(f"  Default user ID: {args.user}")
    print(f"  API docs at http://{args.host}:{args.port}/docs\n")

    uvicorn.run(
        "backend.app:app" if args.reload else app,
        host=args.host,
        port=args.port,
        reload=args.reload
    )


if __name__ == "__main__":
    main()
