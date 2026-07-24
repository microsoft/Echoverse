"""Database models for datepicker_env."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class TaskRecord(SQLModel, table=True):
    """A datepicker task with its ground truth answer."""
    task_id: str = Field(primary_key=True)
    env_name: str = Field(index=True)          # Which frontend env (e.g., "travel-booking")
    task_json: str                              # Full task spec as JSON
    canonical_answer: str                       # Correct answer as JSON
    instruction_text: str = ""                  # What the agent sees
    datepicker_type: str = ""                   # single_date, range, dob, datetime, month_year, constrained
    category: str = ""                          # travel, banking, medical, etc.
    seed: int = 0
    status: str = "active"                      # active | completed | failed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DateSubmission(SQLModel, table=True):
    """A user/agent submission for a specific task."""
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: str = Field(index=True)
    selected_value: str                         # What was submitted (ISO 8601)
    raw_payload: str = "{}"                     # Full picker state as JSON
    is_partial: bool = False                    # True if incomplete selection
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
