from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from sqlalchemy import Column, Index, Text, UniqueConstraint
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    name: str
    email: str = Field(unique=True, index=True)
    password_hash: Optional[str] = None
    admin: bool = False
    state: str = "active"
    avatar_url: Optional[str] = None
    bio: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    location: Optional[str] = None
    website_url: Optional[str] = None
    organization: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    status_emoji: Optional[str] = None
    status_message: Optional[str] = None


class Namespace(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    path: str = Field(index=True)
    type: str = "User"
    visibility_level: int = 20
    description: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    parent_id: Optional[int] = Field(default=None, foreign_key="namespace.id")
    owner_id: Optional[int] = Field(default=None, foreign_key="user.id")
    avatar_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Project(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint("namespace_id", "path"),
        Index("ix_project_namespace_id", "namespace_id"),
        Index("ix_project_creator_id", "creator_id"),
        Index("ix_project_visibility_level", "visibility_level"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    path: str
    namespace_id: int = Field(foreign_key="namespace.id")
    creator_id: int = Field(foreign_key="user.id")
    description: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    visibility_level: int = 20
    star_count: int = 0
    forks_count: int = 0
    archived: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_activity_at: datetime = Field(default_factory=datetime.utcnow)
    default_branch: str = "main"
    topics: str = "[]"
    merge_requests_enabled: bool = True
    issues_enabled: bool = True
    wiki_enabled: bool = True


class Milestone(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    project_id: Optional[int] = Field(default=None, foreign_key="project.id")
    group_id: Optional[int] = Field(default=None, foreign_key="namespace.id")
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    state: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Issue(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint("project_id", "iid"),
        Index("ix_issue_project_id", "project_id"),
        Index("ix_issue_author_id", "author_id"),
        Index("ix_issue_state", "state"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    iid: int
    title: str
    description: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    project_id: int = Field(foreign_key="project.id")
    author_id: int = Field(foreign_key="user.id")
    assignee_id: Optional[int] = Field(default=None, foreign_key="user.id")
    milestone_id: Optional[int] = Field(default=None, foreign_key="milestone.id")
    state: str = "opened"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    closed_at: Optional[datetime] = None
    due_date: Optional[date] = None
    weight: Optional[int] = None
    confidential: bool = False


class MergeRequest(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint("project_id", "iid"),
        Index("ix_merge_request_project_id", "project_id"),
        Index("ix_merge_request_author_id", "author_id"),
        Index("ix_merge_request_state", "state"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    iid: int
    title: str
    description: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    project_id: int = Field(foreign_key="project.id")
    author_id: int = Field(foreign_key="user.id")
    assignee_id: Optional[int] = Field(default=None, foreign_key="user.id")
    source_branch: str
    target_branch: str
    source_project_id: int = Field(foreign_key="project.id")
    state: str = "opened"
    merge_status: str = "can_be_merged"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    merged_at: Optional[datetime] = None
    merged_by_id: Optional[int] = Field(default=None, foreign_key="user.id")


class Note(SQLModel, table=True):
    __table_args__ = (
        Index("ix_note_noteable", "noteable_type", "noteable_id"),
        Index("ix_note_author_id", "author_id"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    body: str = Field(sa_column=Column(Text, nullable=False))
    noteable_type: str
    noteable_id: Optional[int] = None
    author_id: int = Field(foreign_key="user.id")
    system: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Member(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint("user_id", "source_id", "source_type"),
        Index("ix_member_source", "source_type", "source_id"),
        Index("ix_member_user_id", "user_id"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    source_id: int
    source_type: str
    access_level: int = 30
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[date] = None


class Label(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    color: str
    description: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    project_id: Optional[int] = Field(default=None, foreign_key="project.id")
    group_id: Optional[int] = Field(default=None, foreign_key="namespace.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class IssueLabel(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("issue_id", "label_id"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    issue_id: int = Field(foreign_key="issue.id")
    label_id: int = Field(foreign_key="label.id")


class MergeRequestLabel(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("merge_request_id", "label_id"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    merge_request_id: int = Field(foreign_key="mergerequest.id")
    label_id: int = Field(foreign_key="label.id")


class Todo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    project_id: int = Field(foreign_key="project.id")
    target_type: str
    target_id: int
    action: str
    state: str = "pending"
    body: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    author_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Star(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("user_id", "project_id"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    project_id: int = Field(foreign_key="project.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ProjectFile(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("project_id", "branch", "file_path"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    file_path: str
    content: str = Field(sa_column=Column(Text, nullable=False))
    branch: str = "main"
    last_commit_message: str
    committed_by_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: Optional[int] = Field(default=None, foreign_key="project.id")
    author_id: int = Field(foreign_key="user.id")
    action: str
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
