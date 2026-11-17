"""Environment lifecycle manager for the synthetic envs.

Each :class:`EnvInstance` uses OS-assigned free ports (:mod:`harness.ports`) so no
external service is required, and gets its own copy of the
seed database and its own backend/frontend port pair, so many instances of any
env can run concurrently.

Lifecycle:
    inst = EnvInstance("echostay", task_id="ATE0001")
    inst.start()          # copy DB, launch backend+frontend, wait until ready
    url = inst.url        # point your agent here
    ...                   # your agent drives the browser
    inst.close()          # stop servers, capture final DB, free the DB copy

or as a context manager:
    with EnvInstance("echostay", task_id="ATE0001") as inst:
        drive_agent(inst.url)
    # inst.final_db_path now holds the post-run database
"""

from __future__ import annotations

import http.client
import logging
import os
import shutil
import signal
import subprocess
import time
from typing import Any, Dict, Optional

from . import registry
from .ports import FreePortAllocator

_logger = logging.getLogger(__name__)

# Readiness timeouts (seconds). Overridable via env vars so slow images can be
# given more headroom without code changes.
BACKEND_READY_TIMEOUT_S = float(os.getenv("SYNTH_BACKEND_READY_TIMEOUT", "60"))
FRONTEND_READY_TIMEOUT_S = float(os.getenv("SYNTH_FRONTEND_READY_TIMEOUT", "90"))
_READY_POLL_INTERVAL_S = 0.5


def _http_status(port: int, path: str = "/", timeout: float = 2.0) -> Optional[int]:
    """GET ``localhost:port/path`` and return the HTTP status, or None if down."""
    conn = None
    try:
        conn = http.client.HTTPConnection("localhost", int(port), timeout=timeout)
        conn.request("GET", path)
        resp = conn.getresponse()
        try:
            resp.read(64)
        except Exception:
            pass
        return resp.status
    except Exception:
        return None
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass


def _wait_for_ready(
    port: int,
    process: Optional[subprocess.Popen],
    *,
    timeout: float,
    require_non_502: bool,
    label: str,
    logger: logging.Logger,
) -> None:
    """Block until ``port`` serves HTTP, the process dies, or ``timeout`` elapses.

    Backend readiness (``require_non_502=False``) means any HTTP response.
    Frontend readiness (``require_non_502=True``) means an end-to-end response
    that is not 502 — i.e. the proxy reached the backend. This closes the
    startup race where the proxy socket is open but the backend is not yet up.
    """
    deadline = time.time() + timeout
    last_status: Optional[int] = None
    while time.time() < deadline:
        if process is not None and process.poll() is not None:
            stderr_tail = ""
            try:
                if process.stderr is not None:
                    stderr_tail = process.stderr.read().decode("utf-8", "ignore")[
                        -2000:
                    ]
            except Exception:
                pass
            raise RuntimeError(
                f"{label} process exited early with code {process.returncode}. "
                f"stderr: {stderr_tail}"
            )
        last_status = _http_status(port)
        if last_status is not None and not (require_non_502 and last_status == 502):
            logger.info(f"{label} ready on port {port} (HTTP {last_status})")
            return
        time.sleep(_READY_POLL_INTERVAL_S)
    raise RuntimeError(
        f"{label} did not become ready on port {port} within {timeout:.0f}s "
        f"(last HTTP status: {last_status})"
    )


def _terminate(proc: Optional[subprocess.Popen]) -> None:
    """SIGTERM then SIGKILL a process group started with ``process_group=0``."""
    if proc is None or proc.poll() is not None:
        return
    try:
        os.killpg(proc.pid, signal.SIGTERM)
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            try:
                os.killpg(proc.pid, signal.SIGKILL)
            except OSError:
                pass
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                pass
    except OSError:
        pass


class EnvInstance:
    """A single running environment instance bound to one task.

    Parameters
    ----------
    env_name:
        One of the registered env names (see :data:`harness.registry.REGISTRY`).
    task_id:
        Identifier used to name the per-task DB copy and, for envs that select
        behavior per task (datepickers / nested_filter), passed to the backend.
    db_path:
        Seed database to copy. Defaults to the env's registered seed DB.
    extra_backend_args:
        Extra ``--key value`` args for the backend. The env's fixed args (e.g.
        the acting user) and the per-task arg are merged in automatically.
    output_dir:
        Where ``final_db_state.db`` is written on close. Defaults to a temp dir
        next to the DB copy.
    envs_root:
        Directory containing the env folders (defaults to the repo's ``envs/``).
    port_allocator:
        Port strategy. Defaults to OS-assigned free ports; pass a custom
        allocator to override.
    """

    def __init__(
        self,
        env_name: str,
        task_id: str = "default",
        *,
        db_path: Optional[str] = None,
        extra_backend_args: Optional[Dict[str, Any]] = None,
        output_dir: Optional[str] = None,
        envs_root: Optional[str] = None,
        port_allocator: Any = None,
        logger: Optional[logging.Logger] = None,
    ):
        self.spec = registry.get_env_spec(env_name)
        self.env_name = env_name
        self.task_id = task_id
        self.env_dir = registry.env_dir(env_name, envs_root)
        self.db_path = os.path.abspath(
            db_path or registry.default_db_path(env_name, envs_root)
        )
        self.output_dir = output_dir
        self._allocator = port_allocator or FreePortAllocator()
        self._log = logger or _logger

        # Merge fixed env args + per-task arg + caller overrides.
        merged: Dict[str, Any] = dict(self.spec.fixed_backend_args)
        if self.spec.task_arg_key:
            merged[self.spec.task_arg_key] = task_id
        if extra_backend_args:
            merged.update(extra_backend_args)
        self.extra_backend_args = merged

        self.backend_port: Optional[int] = None
        self.frontend_port: Optional[int] = None
        self._backend_proc: Optional[subprocess.Popen] = None
        self._frontend_proc: Optional[subprocess.Popen] = None
        self.save_db_path: Optional[str] = None
        self.final_db_path: Optional[str] = None
        self._started = False

    # -- properties ---------------------------------------------------------
    @property
    def url(self) -> str:
        """The URL the agent should drive (the frontend)."""
        if self.frontend_port is None:
            raise RuntimeError("Instance not started.")
        return f"http://localhost:{self.frontend_port}/"

    # -- internals ----------------------------------------------------------
    def _copy_db(self) -> str:
        """Copy the seed DB to a per-task working copy (never mutate the seed)."""
        if not os.path.exists(self.db_path):
            raise FileNotFoundError(
                f"Seed database not found: {self.db_path}. "
                "Large env DBs (echostay/echoforge) must be downloaded first "
                "(see the release docs)."
            )
        base = self.db_path[:-3] if self.db_path.endswith(".db") else self.db_path
        save_path = f"{base}_{self.task_id}_pid{os.getpid()}.db"
        if os.path.exists(save_path):
            os.remove(save_path)
        shutil.copy(self.db_path, save_path)
        self._log.info(f"Copied {self.db_path} -> {save_path}")
        return save_path

    def _start_backend(self) -> subprocess.Popen:
        command = [
            "uv",
            "run",
            "python",
            "-m",
            "backend.app",
            "--host",
            "localhost",
            "--port",
            str(self.backend_port),
            "--db",
            str(self.save_db_path),
        ]
        for key, val in self.extra_backend_args.items():
            command += [f"--{key}", str(val)]
        proc = subprocess.Popen(
            command,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            cwd=self.env_dir,
            process_group=0,
        )
        _wait_for_ready(
            self.backend_port,
            proc,
            timeout=BACKEND_READY_TIMEOUT_S,
            require_non_502=False,
            label="Backend",
            logger=self._log,
        )
        return proc

    def _start_frontend(self) -> subprocess.Popen:
        frontend_dir = os.path.join(self.env_dir, "frontend")
        env = os.environ.copy()
        env["CHOKIDAR_USEPOLLING"] = "true"
        env["VITE_PORT"] = str(self.frontend_port)
        env["VITE_API_PORT"] = str(self.backend_port)
        proc = subprocess.Popen(
            ["npm", "run", "dev"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            env=env,
            cwd=frontend_dir,
            process_group=0,
        )
        _wait_for_ready(
            self.frontend_port,
            proc,
            timeout=FRONTEND_READY_TIMEOUT_S,
            require_non_502=True,
            label="Frontend",
            logger=self._log,
        )
        return proc

    def _ensure_frontend_deps(self) -> None:
        """Run ``npm install`` if the frontend's node_modules is missing."""
        frontend_dir = os.path.join(self.env_dir, "frontend")
        if not os.path.isdir(frontend_dir):
            return
        if os.path.isdir(os.path.join(frontend_dir, "node_modules")):
            return
        self._log.info(f"Running npm install in {frontend_dir} ...")
        subprocess.run(["npm", "install"], cwd=frontend_dir, check=True)

    # -- lifecycle ----------------------------------------------------------
    def start(self) -> "EnvInstance":
        """Copy the DB, allocate ports, and launch backend + frontend."""
        if self._started:
            return self
        self._ensure_frontend_deps()
        self.backend_port, self.frontend_port = self._allocator.alloc()
        self._log.info(
            f"Allocated ports backend={self.backend_port} "
            f"frontend={self.frontend_port}"
        )
        try:
            self.save_db_path = self._copy_db()
            self._backend_proc = self._start_backend()
            self._frontend_proc = self._start_frontend()
            self._started = True
            return self
        except Exception:
            self._rollback()
            raise

    def _rollback(self) -> None:
        _terminate(self._frontend_proc)
        _terminate(self._backend_proc)
        self._frontend_proc = None
        self._backend_proc = None
        if self.save_db_path and os.path.exists(self.save_db_path):
            try:
                os.remove(self.save_db_path)
            except OSError:
                pass
        self._allocator.free(
            [p for p in (self.backend_port, self.frontend_port) if p is not None]
        )

    def capture_final_db(self, output_dir: Optional[str] = None) -> str:
        """Copy the working DB to ``<output_dir>/final_db_state.db``.

        This is the post-run database the verifier diffs against the seed. Call
        after the agent finishes and before :meth:`close` removes the copy
        (``close`` calls this automatically if not already done).
        """
        if not self.save_db_path or not os.path.exists(self.save_db_path):
            raise RuntimeError("No working DB to capture; instance not started?")
        out = output_dir or self.output_dir or os.path.dirname(self.save_db_path)
        os.makedirs(out, exist_ok=True)
        dest = os.path.join(out, "final_db_state.db")
        # Snapshot through SQLite's backup API so the copy is a consistent
        # database that includes every committed write, even those still in
        # the WAL (the backend is still running and may block a checkpoint).
        self._snapshot_db(self.save_db_path, dest)
        self.final_db_path = dest
        self._log.info(f"Captured final DB -> {dest}")
        return dest

    @staticmethod
    def _snapshot_db(src_path: str, dest_path: str) -> None:
        """Copy the SQLite database at ``src_path`` to ``dest_path``.

        Uses the online backup API rather than a file copy. The envs run
        SQLite in WAL mode, and while the backend is alive its pooled
        connections can hold read snapshots that stop a checkpoint from
        folding the newest frames into the main file. Copying only the main
        file at that point drops committed writes (or yields a corrupt file,
        since a partially checkpointed main file is not self-consistent
        without its ``-wal``). The backup API reads the logical database
        through the WAL, so the destination always reflects every committed
        transaction and never needs a sidecar file.
        """
        import sqlite3

        if os.path.exists(dest_path):
            os.remove(dest_path)
        for sidecar in (f"{dest_path}-wal", f"{dest_path}-shm"):
            if os.path.exists(sidecar):
                os.remove(sidecar)
        src = sqlite3.connect(src_path)
        try:
            dst = sqlite3.connect(dest_path)
            try:
                src.backup(dst)
                # The destination inherits WAL mode from the source header;
                # switch it back so the snapshot is a single standalone file.
                dst.execute("PRAGMA journal_mode=DELETE;")
            finally:
                dst.close()
        finally:
            src.close()

    @staticmethod
    def _checkpoint_wal(db_path: str) -> None:
        """Best-effort WAL checkpoint. Kept for callers that still use it; new
        code should use :meth:`_snapshot_db`, which does not depend on the
        checkpoint succeeding."""
        import sqlite3

        try:
            conn = sqlite3.connect(db_path)
            try:
                conn.execute("PRAGMA wal_checkpoint(TRUNCATE);")
            finally:
                conn.close()
        except Exception:
            pass

    def close(self, capture: bool = True) -> None:
        """Stop servers, capture the final DB, and clean up the working copy."""
        if capture and self.save_db_path and os.path.exists(self.save_db_path):
            if self.final_db_path is None:
                try:
                    self.capture_final_db()
                except Exception as exc:  # pragma: no cover - best effort
                    self._log.warning(f"Final DB capture failed: {exc}")
        _terminate(self._frontend_proc)
        _terminate(self._backend_proc)
        self._frontend_proc = None
        self._backend_proc = None
        # Remove per-task DB copy + SQLite journals.
        if self.save_db_path:
            for path in (
                self.save_db_path,
                f"{self.save_db_path}-wal",
                f"{self.save_db_path}-shm",
            ):
                if os.path.exists(path):
                    try:
                        os.remove(path)
                    except OSError:
                        pass
        self._allocator.free(
            [p for p in (self.backend_port, self.frontend_port) if p is not None]
        )
        self.backend_port = None
        self.frontend_port = None
        self._started = False

    # -- context manager ----------------------------------------------------
    def __enter__(self) -> "EnvInstance":
        return self.start()

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()
