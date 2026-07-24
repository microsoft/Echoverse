"""Port allocation for concurrent environment instances.

Default strategy is OS-assigned free ports via ``socket.bind(('', 0))`` — the
lightweight process + port model used by comparable DB-backed agent benchmarks
(e.g. AppWorld). No Redis, no external service. This lets any number of env
instances run simultaneously, each on its own backend/frontend port pair.

An optional Redis-backed pool is available behind ``RedisPortPool`` for large
distributed runs, but it is never imported unless explicitly requested, so
``redis`` is not a hard dependency.
"""

from __future__ import annotations

import contextlib
import socket
from typing import List, Tuple


def _find_free_port() -> int:
    """Return a currently-free TCP port assigned by the OS.

    There is an inherent (small) race between closing this socket and the child
    process binding the port. Allocating the two ports back-to-back and starting
    the servers immediately keeps the window tiny; readiness checks in the
    launcher catch the rare collision.
    """
    with contextlib.closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(("", 0))
        return s.getsockname()[1]


def alloc_port_pair() -> Tuple[int, int]:
    """Allocate a distinct (backend_port, frontend_port) pair."""
    backend = _find_free_port()
    frontend = _find_free_port()
    while frontend == backend:
        frontend = _find_free_port()
    return backend, frontend


class FreePortAllocator:
    """Default allocator: OS-assigned free ports, no shared state."""

    def alloc(self) -> Tuple[int, int]:
        return alloc_port_pair()

    def free(self, ports: List[int]) -> None:  # noqa: D401 - no-op for free ports
        """No-op: OS free ports need no explicit release."""
        return None


class RedisPortPool:
    """Optional Redis-backed port pool for large distributed runs.

    Pops two ports from the ``available_website_ports`` set and returns them on
    ``free``. Only instantiate this if you have pre-seeded a Redis pool; the
    default :class:`FreePortAllocator` needs no such setup.
    """

    def __init__(self, host: str = "localhost", port: int = 3000, db: int = 0):
        import redis  # imported lazily so redis is not a hard dependency

        self._r = redis.Redis(host=host, port=port, db=db)
        self._set = "available_website_ports"

    def alloc(self) -> Tuple[int, int]:
        a = self._r.spop(self._set)
        b = self._r.spop(self._set)
        if a is None or b is None:
            if a is not None:
                self._r.sadd(self._set, a)
            if b is not None:
                self._r.sadd(self._set, b)
            raise RuntimeError(f"No available ports in Redis set '{self._set}'.")
        return int(a.decode()), int(b.decode())

    def free(self, ports: List[int]) -> None:
        for p in ports:
            if p is not None:
                self._r.sadd(self._set, p)
