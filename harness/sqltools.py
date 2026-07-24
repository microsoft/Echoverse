"""SQL utilities for synthetic environment verification.

Provides ``run_sqldiff`` (used by the LLM write-task judge).
"""

import subprocess


def run_sqldiff(saved_db: str, current_db: str) -> str:
    """Run sqldiff and return the SQL diff string."""
    try:
        result = subprocess.run(
            ["sqldiff", saved_db, current_db],
            capture_output=True,
            text=True,
            timeout=30,
        )
    except FileNotFoundError as exc:
        raise RuntimeError(
            "sqldiff binary not found. Ensure 'sqldiff' is installed and on PATH."
        ) from exc
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError("sqldiff execution timed out after 30 seconds.") from exc
    except Exception as e:
        raise RuntimeError(f"Error during sqldiff. Error: {str(e)}") from e

    if result.returncode != 0:
        stderr = (result.stderr or "").strip()
        raise RuntimeError(
            f"sqldiff failed with return code {result.returncode}"
            + (f": {stderr}" if stderr else ".")
        )
    return result.stdout.strip()
