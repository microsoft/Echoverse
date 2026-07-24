import hashlib
import json
import secrets
from datetime import date, datetime
from typing import Any, Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlmodel import Session, select

from backend.database import get_session, init_db
from backend.models import (
    Event,
    Issue,
    IssueLabel,
    Label,
    Member,
    MergeRequest,
    MergeRequestLabel,
    Milestone,
    Namespace,
    Note,
    Project,
    ProjectFile,
    Star,
    Todo,
    User,
)

router = APIRouter(prefix="/api", tags=["echoforge"])

DEFAULT_USER_ID = 1
active_sessions: dict[str, int] = {}


ACCESS_LEVELS = {
    10: "Guest",
    20: "Reporter",
    30: "Developer",
    40: "Maintainer",
    50: "Owner",
}


class RegisterRequest(BaseModel):
    username: str
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website_url: Optional[str] = None
    organization: Optional[str] = None
    avatar_url: Optional[str] = None


class StatusUpdate(BaseModel):
    emoji: Optional[str] = None
    message: Optional[str] = None


class ProjectCreate(BaseModel):
    name: str
    namespace_id: Optional[int] = None
    description: Optional[str] = None
    visibility_level: int = 20
    initialize_with_readme: bool = False


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    archived: Optional[bool] = None
    topics: Optional[list[str]] = None
    default_branch: Optional[str] = None


class MemberCreate(BaseModel):
    user_id: int
    access_level: int
    expires_at: Optional[date] = None


class MemberUpdate(BaseModel):
    access_level: int
    expires_at: Optional[date] = None


class IssueCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assignee_id: Optional[int] = None
    milestone_id: Optional[int] = None
    labels: Optional[list[Any]] = None
    due_date: Optional[date] = None
    weight: Optional[int] = None
    confidential: bool = False


class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    state: Optional[str] = None
    assignee_id: Optional[int] = None
    milestone_id: Optional[int] = None
    due_date: Optional[date] = None
    labels: Optional[list[Any]] = None
    weight: Optional[int] = None
    confidential: Optional[bool] = None


class NoteCreate(BaseModel):
    body: str


class MergeRequestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    source_branch: str
    target_branch: str
    assignee_id: Optional[int] = None


class MergeRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    state: Optional[str] = None
    assignee_id: Optional[int] = None


class MilestoneCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None


class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    state: Optional[str] = None


class LabelCreate(BaseModel):
    title: str
    color: str
    description: Optional[str] = None


class LabelUpdate(BaseModel):
    title: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None


class FileCreate(BaseModel):
    content: str
    branch: str = "main"
    commit_message: str


class FileUpdate(BaseModel):
    content: str
    branch: str = "main"
    commit_message: str


class GroupCreate(BaseModel):
    name: str
    path: str
    description: Optional[str] = None
    visibility_level: int = 20


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    path: Optional[str] = None
    description: Optional[str] = None
    visibility_level: Optional[int] = None


class SearchResponse(BaseModel):
    results: dict[str, list[dict[str, Any]]]


def set_default_user_id(user_id: int):
    global DEFAULT_USER_ID
    DEFAULT_USER_ID = user_id


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000)
    return f"pbkdf2_sha256$200000${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, iters, salt_hex, hash_hex = stored.split("$", 3)
    except (ValueError, AttributeError):
        return False
    if algo != "pbkdf2_sha256":
        return False
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(iters))
    return secrets.compare_digest(dk.hex(), hash_hex)


def slugify(value: str) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() else "-" for ch in value.strip())
    while "--" in cleaned:
        cleaned = cleaned.replace("--", "-")
    return cleaned.strip("-") or "project"


def parse_topics(value: Optional[str]) -> list[str]:
    if not value:
        return []
    try:
        data = json.loads(value)
        return data if isinstance(data, list) else []
    except json.JSONDecodeError:
        return []


def to_iso(value: Optional[datetime | date]) -> Optional[str]:
    return value.isoformat() if value else None


def get_current_user_id(session_token: Optional[str] = Cookie(None)) -> int:
    if session_token and session_token in active_sessions:
        return active_sessions[session_token]
    return DEFAULT_USER_ID


def get_user_or_404(session: Session, user_id: int) -> User:
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def get_namespace_or_404(session: Session, namespace_id: int) -> Namespace:
    namespace = session.get(Namespace, namespace_id)
    if not namespace:
        raise HTTPException(status_code=404, detail="Namespace not found")
    return namespace


def get_project_or_404(session: Session, project_id: int) -> Project:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def get_issue_or_404(session: Session, project_id: int, iid: int) -> Issue:
    issues = session.exec(select(Issue).where(Issue.project_id == project_id, Issue.iid == iid)).all()
    if not issues:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issues[0]


def get_merge_request_or_404(session: Session, project_id: int, iid: int) -> MergeRequest:
    merge_requests = session.exec(
        select(MergeRequest).where(MergeRequest.project_id == project_id, MergeRequest.iid == iid)
    ).all()
    if not merge_requests:
        raise HTTPException(status_code=404, detail="Merge request not found")
    return merge_requests[0]


def ensure_namespace_path_unique(session: Session, path: str, current_id: Optional[int] = None):
    matches = session.exec(select(Namespace).where(Namespace.path == path)).all()
    if matches and any(match.id != current_id for match in matches):
        raise HTTPException(status_code=400, detail="Namespace path already exists")


def ensure_project_path_unique(session: Session, namespace_id: int, path: str, current_id: Optional[int] = None):
    matches = session.exec(select(Project).where(Project.namespace_id == namespace_id, Project.path == path)).all()
    if matches and any(match.id != current_id for match in matches):
        raise HTTPException(status_code=400, detail="Project path already exists in namespace")


def ensure_user_namespace(session: Session, user_id: int) -> Namespace:
    namespaces = session.exec(
        select(Namespace).where(Namespace.owner_id == user_id, Namespace.type == "User")
    ).all()
    if namespaces:
        return namespaces[0]

    user = get_user_or_404(session, user_id)
    namespace = Namespace(
        name=user.username,
        path=user.username,
        type="User",
        visibility_level=20,
        owner_id=user.id,
    )
    session.add(namespace)
    session.commit()
    session.refresh(namespace)
    return namespace


def next_iid(session: Session, model: type[Issue] | type[MergeRequest], project_id: int) -> int:
    rows = session.exec(select(model).where(model.project_id == project_id)).all()
    return max((row.iid for row in rows), default=0) + 1


def touch_project(project: Project):
    project.updated_at = datetime.utcnow()
    project.last_activity_at = datetime.utcnow()


def record_event(
    session: Session,
    *,
    author_id: int,
    action: str,
    project_id: Optional[int] = None,
    target_type: Optional[str] = None,
    target_id: Optional[int] = None,
):
    session.add(
        Event(
            project_id=project_id,
            author_id=author_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
        )
    )


def get_project_labels(session: Session, project_id: int) -> list[Label]:
    return session.exec(select(Label).where(Label.project_id == project_id)).all()


def resolve_labels(session: Session, project_id: int, labels: list[Any]) -> list[Label]:
    available = get_project_labels(session, project_id)
    by_id = {label.id: label for label in available}
    by_title = {label.title.lower(): label for label in available}
    resolved: list[Label] = []
    for item in labels:
        label = None
        if isinstance(item, int):
            label = by_id.get(item)
        elif isinstance(item, str):
            label = by_title.get(item.lower())
        if not label:
            raise HTTPException(status_code=400, detail=f"Unknown label: {item}")
        if label not in resolved:
            resolved.append(label)
    return resolved


def sync_issue_labels(session: Session, issue: Issue, labels: Optional[list[Any]]):
    if labels is None:
        return
    existing_links = session.exec(select(IssueLabel).where(IssueLabel.issue_id == issue.id)).all()
    for link in existing_links:
        session.delete(link)
    for label in resolve_labels(session, issue.project_id, labels):
        session.add(IssueLabel(issue_id=issue.id, label_id=label.id))


def serialize_user(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "email": user.email,
        "admin": user.admin,
        "state": user.state,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "location": user.location,
        "website_url": user.website_url,
        "organization": user.organization,
        "status_emoji": user.status_emoji,
        "status_message": user.status_message,
        "created_at": to_iso(user.created_at),
        "updated_at": to_iso(user.updated_at),
    }


def serialize_namespace(namespace: Namespace) -> dict[str, Any]:
    return {
        "id": namespace.id,
        "name": namespace.name,
        "path": namespace.path,
        "type": namespace.type,
        "visibility_level": namespace.visibility_level,
        "description": namespace.description,
        "parent_id": namespace.parent_id,
        "owner_id": namespace.owner_id,
        "avatar_url": namespace.avatar_url,
        "created_at": to_iso(namespace.created_at),
        "updated_at": to_iso(namespace.updated_at),
    }


def serialize_member(session: Session, member: Member) -> dict[str, Any]:
    user = get_user_or_404(session, member.user_id)
    return {
        "id": member.id,
        "user_id": member.user_id,
        "source_id": member.source_id,
        "source_type": member.source_type,
        "access_level": member.access_level,
        "access_level_name": ACCESS_LEVELS.get(member.access_level, "Custom"),
        "created_at": to_iso(member.created_at),
        "updated_at": to_iso(member.updated_at),
        "expires_at": to_iso(member.expires_at),
        "user": serialize_user(user),
    }


def serialize_project(session: Session, project: Project) -> dict[str, Any]:
    namespace = get_namespace_or_404(session, project.namespace_id)
    creator = get_user_or_404(session, project.creator_id)
    starred_by_default_user = bool(
        session.exec(
            select(Star).where(Star.project_id == project.id, Star.user_id == DEFAULT_USER_ID)
        ).all()
    )
    return {
        "id": project.id,
        "name": project.name,
        "path": project.path,
        "namespace_id": project.namespace_id,
        "creator_id": project.creator_id,
        "description": project.description,
        "visibility_level": project.visibility_level,
        "star_count": project.star_count,
        "forks_count": project.forks_count,
        "archived": project.archived,
        "created_at": to_iso(project.created_at),
        "updated_at": to_iso(project.updated_at),
        "last_activity_at": to_iso(project.last_activity_at),
        "default_branch": project.default_branch,
        "topics": parse_topics(project.topics),
        "merge_requests_enabled": project.merge_requests_enabled,
        "issues_enabled": project.issues_enabled,
        "wiki_enabled": project.wiki_enabled,
        "full_path": f"{namespace.path}/{project.path}",
        "namespace": serialize_namespace(namespace),
        "creator": serialize_user(creator),
        "starred": starred_by_default_user,
    }


def serialize_label(label: Label) -> dict[str, Any]:
    return {
        "id": label.id,
        "title": label.title,
        "color": label.color,
        "description": label.description,
        "project_id": label.project_id,
        "group_id": label.group_id,
        "created_at": to_iso(label.created_at),
        "updated_at": to_iso(label.updated_at),
    }


def serialize_milestone(milestone: Milestone) -> dict[str, Any]:
    return {
        "id": milestone.id,
        "title": milestone.title,
        "description": milestone.description,
        "project_id": milestone.project_id,
        "group_id": milestone.group_id,
        "start_date": to_iso(milestone.start_date),
        "due_date": to_iso(milestone.due_date),
        "state": milestone.state,
        "created_at": to_iso(milestone.created_at),
        "updated_at": to_iso(milestone.updated_at),
    }


def serialize_issue(session: Session, issue: Issue) -> dict[str, Any]:
    project = get_project_or_404(session, issue.project_id)
    author = get_user_or_404(session, issue.author_id)
    assignee = session.get(User, issue.assignee_id) if issue.assignee_id else None
    milestone = session.get(Milestone, issue.milestone_id) if issue.milestone_id else None
    issue_labels = session.exec(select(IssueLabel).where(IssueLabel.issue_id == issue.id)).all()
    labels = [session.get(Label, link.label_id) for link in issue_labels]
    notes_count = len(
        session.exec(
            select(Note).where(Note.noteable_type == "Issue", Note.noteable_id == issue.id)
        ).all()
    )
    return {
        "id": issue.id,
        "iid": issue.iid,
        "title": issue.title,
        "description": issue.description,
        "project_id": issue.project_id,
        "author_id": issue.author_id,
        "assignee_id": issue.assignee_id,
        "milestone_id": issue.milestone_id,
        "state": issue.state,
        "created_at": to_iso(issue.created_at),
        "updated_at": to_iso(issue.updated_at),
        "closed_at": to_iso(issue.closed_at),
        "due_date": to_iso(issue.due_date),
        "weight": issue.weight,
        "confidential": issue.confidential,
        "author": serialize_user(author),
        "assignee": serialize_user(assignee) if assignee else None,
        "milestone": serialize_milestone(milestone) if milestone else None,
        "labels": [serialize_label(label) for label in labels if label],
        "notes_count": notes_count,
        "project": serialize_project(session, project),
    }


def serialize_merge_request(session: Session, merge_request: MergeRequest) -> dict[str, Any]:
    project = get_project_or_404(session, merge_request.project_id)
    author = get_user_or_404(session, merge_request.author_id)
    assignee = session.get(User, merge_request.assignee_id) if merge_request.assignee_id else None
    notes_count = len(
        session.exec(
            select(Note).where(
                Note.noteable_type == "MergeRequest", Note.noteable_id == merge_request.id
            )
        ).all()
    )
    return {
        "id": merge_request.id,
        "iid": merge_request.iid,
        "title": merge_request.title,
        "description": merge_request.description,
        "project_id": merge_request.project_id,
        "author_id": merge_request.author_id,
        "assignee_id": merge_request.assignee_id,
        "source_branch": merge_request.source_branch,
        "target_branch": merge_request.target_branch,
        "source_project_id": merge_request.source_project_id,
        "state": merge_request.state,
        "merge_status": merge_request.merge_status,
        "created_at": to_iso(merge_request.created_at),
        "updated_at": to_iso(merge_request.updated_at),
        "merged_at": to_iso(merge_request.merged_at),
        "merged_by_id": merge_request.merged_by_id,
        "author": serialize_user(author),
        "assignee": serialize_user(assignee) if assignee else None,
        "notes_count": notes_count,
        "project": serialize_project(session, project),
    }


def serialize_note(session: Session, note: Note) -> dict[str, Any]:
    author = get_user_or_404(session, note.author_id)
    return {
        "id": note.id,
        "body": note.body,
        "noteable_type": note.noteable_type,
        "noteable_id": note.noteable_id,
        "author_id": note.author_id,
        "system": note.system,
        "created_at": to_iso(note.created_at),
        "updated_at": to_iso(note.updated_at),
        "author": serialize_user(author),
    }


def serialize_todo(session: Session, todo: Todo) -> dict[str, Any]:
    author = get_user_or_404(session, todo.author_id)
    project = get_project_or_404(session, todo.project_id)
    return {
        "id": todo.id,
        "user_id": todo.user_id,
        "project_id": todo.project_id,
        "target_type": todo.target_type,
        "target_id": todo.target_id,
        "action": todo.action,
        "state": todo.state,
        "body": todo.body,
        "author_id": todo.author_id,
        "created_at": to_iso(todo.created_at),
        "author": serialize_user(author),
        "project": serialize_project(session, project),
    }


def project_tree_entries(files: list[ProjectFile], base_path: str) -> list[dict[str, Any]]:
    normalized = base_path.strip("/")
    prefix = f"{normalized}/" if normalized else ""
    entries: dict[str, dict[str, Any]] = {}
    for project_file in files:
        if not project_file.file_path.startswith(prefix):
            continue
        relative = project_file.file_path[len(prefix):]
        if not relative:
            continue
        head = relative.split("/")[0]
        entry_path = f"{prefix}{head}" if prefix else head
        if entry_path in entries:
            continue
        is_tree = "/" in relative
        entries[entry_path] = {
            "name": head,
            "path": entry_path,
            "type": "tree" if is_tree else "blob",
            "branch": project_file.branch,
        }
    return sorted(entries.values(), key=lambda item: (item["type"], item["path"]))


@router.post("/auth/register")
def register(
    payload: RegisterRequest,
    response: Response,
    session: Session = Depends(get_session),
):
    if session.exec(select(User).where(User.username == payload.username)).all():
        raise HTTPException(status_code=400, detail="Username already exists")
    if session.exec(select(User).where(User.email == payload.email)).all():
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        username=payload.username,
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        admin=False,
        state="active",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    ensure_user_namespace(session, user.id)

    session_token = secrets.token_hex(16)
    active_sessions[session_token] = user.id
    response.set_cookie("session_token", session_token, httponly=True)
    return {"user": serialize_user(user), "session_token": session_token}


@router.post("/auth/login")
def login(
    payload: LoginRequest,
    response: Response,
    session: Session = Depends(get_session),
):
    users = session.exec(select(User).where(User.email == payload.email)).all()
    if not users or not verify_password(payload.password, users[0].password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = users[0]
    session_token = secrets.token_hex(16)
    active_sessions[session_token] = user.id
    response.set_cookie("session_token", session_token, httponly=True)
    return {"user": serialize_user(user), "session_token": session_token}


@router.post("/auth/logout")
def logout(response: Response, session_token: Optional[str] = Cookie(None)):
    if session_token:
        active_sessions.pop(session_token, None)
    response.delete_cookie("session_token")
    return {"ok": True}


@router.get("/auth/me")
def auth_me(
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    return serialize_user(get_user_or_404(session, current_user_id))


@router.get("/user")
def get_current_user(
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    return serialize_user(get_user_or_404(session, current_user_id))


@router.put("/user")
def update_user(
    payload: UserUpdate,
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    user = get_user_or_404(session, current_user_id)
    for field in ["name", "bio", "location", "website_url", "organization", "avatar_url"]:
        value = getattr(payload, field)
        if value is not None:
            setattr(user, field, value)
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    return serialize_user(user)


@router.put("/user/status")
def update_user_status(
    payload: StatusUpdate,
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    user = get_user_or_404(session, current_user_id)
    user.status_emoji = payload.emoji
    user.status_message = payload.message
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    return serialize_user(user)


@router.get("/users/{username}")
def get_user_by_username(username: str, session: Session = Depends(get_session)):
    users = session.exec(select(User).where(User.username == username)).all()
    if not users:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_user(users[0])


@router.get("/users/{username}/projects")
def get_user_projects(username: str, session: Session = Depends(get_session)):
    users = session.exec(select(User).where(User.username == username)).all()
    if not users:
        raise HTTPException(status_code=404, detail="User not found")
    user = users[0]
    projects = session.exec(select(Project).where(Project.creator_id == user.id)).all()
    return {"projects": [serialize_project(session, project) for project in projects]}


@router.get("/projects")
def list_projects(
    visibility: Optional[int] = None,
    search: Optional[str] = None,
    sort: str = "updated_desc",
    page: int = 1,
    limit: int = 20,
    owned: bool = False,
    starred: bool = False,
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    projects = session.exec(select(Project)).all()
    if visibility is not None:
        projects = [project for project in projects if project.visibility_level == visibility]
    if search:
        needle = search.lower()
        projects = [
            project
            for project in projects
            if needle in project.name.lower()
            or needle in project.path.lower()
            or needle in (project.description or "").lower()
        ]
    if owned:
        projects = [project for project in projects if project.creator_id == current_user_id]
    if starred:
        starred_ids = {
            star.project_id
            for star in session.exec(select(Star).where(Star.user_id == current_user_id)).all()
        }
        projects = [project for project in projects if project.id in starred_ids]

    reverse = True
    key = None
    if sort == "name_asc":
        reverse = False
        key = lambda project: project.name.lower()
    elif sort == "name_desc":
        key = lambda project: project.name.lower()
    elif sort == "created_asc":
        reverse = False
        key = lambda project: project.created_at
    elif sort == "created_desc":
        key = lambda project: project.created_at
    elif sort == "stars_asc":
        reverse = False
        key = lambda project: project.star_count
    elif sort == "stars_desc":
        key = lambda project: project.star_count
    elif sort == "last_activity_asc":
        reverse = False
        key = lambda project: project.last_activity_at
    else:
        key = lambda project: project.updated_at
    projects = sorted(projects, key=key, reverse=reverse)

    total = len(projects)
    start = max(page - 1, 0) * limit
    end = start + limit
    return {
        "projects": [serialize_project(session, project) for project in projects[start:end]],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/projects/{project_id}")
def get_project(project_id: int, session: Session = Depends(get_session)):
    return serialize_project(session, get_project_or_404(session, project_id))


@router.post("/projects")
def create_project(
    payload: ProjectCreate,
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    # Default namespace to the current user's namespace
    ns_id = payload.namespace_id
    if ns_id is None:
        user = session.get(User, current_user_id)
        if not user:
            raise HTTPException(404, "User not found")
        user_ns = session.exec(
            select(Namespace).where(Namespace.path == user.username, Namespace.type == "User")
        ).first()
        if not user_ns:
            raise HTTPException(400, "No namespace found for user")
        ns_id = user_ns.id
    namespace = get_namespace_or_404(session, ns_id)
    path = slugify(payload.name)
    ensure_project_path_unique(session, namespace.id, path)
    project = Project(
        name=payload.name,
        path=path,
        namespace_id=ns_id,
        creator_id=current_user_id,
        description=payload.description,
        visibility_level=payload.visibility_level,
        topics=json.dumps([]),
    )
    session.add(project)
    session.commit()
    session.refresh(project)

    session.add(
        Member(
            user_id=current_user_id,
            source_id=project.id,
            source_type="Project",
            access_level=50,
        )
    )
    if payload.initialize_with_readme:
        session.add(
            ProjectFile(
                project_id=project.id,
                file_path="README.md",
                content=f"# {payload.name}\n",
                branch=project.default_branch,
                last_commit_message="Initial commit",
                committed_by_id=current_user_id,
            )
        )
        record_event(
            session,
            author_id=current_user_id,
            project_id=project.id,
            action="pushed",
            target_type="Project",
            target_id=project.id,
        )
    record_event(
        session,
        author_id=current_user_id,
        project_id=project.id,
        action="created",
        target_type="Project",
        target_id=project.id,
    )
    session.commit()
    session.refresh(project)
    return serialize_project(session, project)


@router.put("/projects/{project_id}")
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    session: Session = Depends(get_session),
):
    project = get_project_or_404(session, project_id)
    if payload.name is not None:
        project.name = payload.name
        new_path = slugify(payload.name)
        ensure_project_path_unique(session, project.namespace_id, new_path, project.id)
        project.path = new_path
    if payload.description is not None:
        project.description = payload.description
    if payload.archived is not None:
        project.archived = payload.archived
    if payload.topics is not None:
        project.topics = json.dumps(payload.topics)
    if payload.default_branch is not None:
        project.default_branch = payload.default_branch
    touch_project(project)
    session.add(project)
    session.commit()
    session.refresh(project)
    return serialize_project(session, project)


def delete_project_children(session: Session, project_id: int):
    for model in [ProjectFile, Star, Todo, Event]:
        for row in session.exec(select(model).where(model.project_id == project_id)).all():
            session.delete(row)
    for label in session.exec(select(Label).where(Label.project_id == project_id)).all():
        for issue_label in session.exec(select(IssueLabel).where(IssueLabel.label_id == label.id)).all():
            session.delete(issue_label)
        for merge_request_label in session.exec(select(MergeRequestLabel).where(MergeRequestLabel.label_id == label.id)).all():
            session.delete(merge_request_label)
        session.delete(label)
    for milestone in session.exec(select(Milestone).where(Milestone.project_id == project_id)).all():
        session.delete(milestone)
    for issue in session.exec(select(Issue).where(Issue.project_id == project_id)).all():
        for note in session.exec(select(Note).where(Note.noteable_type == "Issue", Note.noteable_id == issue.id)).all():
            session.delete(note)
        for issue_label in session.exec(select(IssueLabel).where(IssueLabel.issue_id == issue.id)).all():
            session.delete(issue_label)
        session.delete(issue)
    for merge_request in session.exec(select(MergeRequest).where(MergeRequest.project_id == project_id)).all():
        for note in session.exec(
            select(Note).where(Note.noteable_type == "MergeRequest", Note.noteable_id == merge_request.id)
        ).all():
            session.delete(note)
        for merge_request_label in session.exec(
            select(MergeRequestLabel).where(MergeRequestLabel.merge_request_id == merge_request.id)
        ).all():
            session.delete(merge_request_label)
        session.delete(merge_request)
    for member in session.exec(
        select(Member).where(Member.source_type == "Project", Member.source_id == project_id)
    ).all():
        session.delete(member)


@router.delete("/projects/{project_id}")
def delete_project(project_id: int, session: Session = Depends(get_session)):
    project = get_project_or_404(session, project_id)
    delete_project_children(session, project_id)
    session.delete(project)
    session.commit()
    return {"ok": True}


@router.post("/projects/{project_id}/star")
def star_project(
    project_id: int,
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    project = get_project_or_404(session, project_id)
    existing = session.exec(
        select(Star).where(Star.project_id == project_id, Star.user_id == current_user_id)
    ).all()
    if not existing:
        session.add(Star(user_id=current_user_id, project_id=project_id))
        project.star_count += 1
        touch_project(project)
        session.add(project)
        session.commit()
        session.refresh(project)
    return serialize_project(session, project)


@router.delete("/projects/{project_id}/star")
def unstar_project(
    project_id: int,
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    project = get_project_or_404(session, project_id)
    existing = session.exec(
        select(Star).where(Star.project_id == project_id, Star.user_id == current_user_id)
    ).all()
    for star in existing:
        session.delete(star)
        project.star_count = max(project.star_count - 1, 0)
    touch_project(project)
    session.add(project)
    session.commit()
    session.refresh(project)
    return serialize_project(session, project)


@router.post("/projects/{project_id}/fork")
def fork_project(
    project_id: int,
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    source = get_project_or_404(session, project_id)
    namespace = ensure_user_namespace(session, current_user_id)
    fork_path = source.path
    suffix = 1
    while session.exec(select(Project).where(Project.namespace_id == namespace.id, Project.path == fork_path)).all():
        suffix += 1
        fork_path = f"{source.path}-fork-{suffix}"
    fork = Project(
        name=source.name,
        path=fork_path,
        namespace_id=namespace.id,
        creator_id=current_user_id,
        description=source.description,
        visibility_level=source.visibility_level,
        default_branch=source.default_branch,
        topics=source.topics,
        merge_requests_enabled=source.merge_requests_enabled,
        issues_enabled=source.issues_enabled,
        wiki_enabled=source.wiki_enabled,
    )
    session.add(fork)
    session.commit()
    session.refresh(fork)
    session.add(
        Member(user_id=current_user_id, source_id=fork.id, source_type="Project", access_level=50)
    )
    for file in session.exec(select(ProjectFile).where(ProjectFile.project_id == source.id)).all():
        session.add(
            ProjectFile(
                project_id=fork.id,
                file_path=file.file_path,
                content=file.content,
                branch=file.branch,
                last_commit_message=f"Forked from {source.path}",
                committed_by_id=current_user_id,
            )
        )
    source.forks_count += 1
    touch_project(source)
    session.add(source)
    record_event(
        session,
        author_id=current_user_id,
        project_id=fork.id,
        action="created",
        target_type="Project",
        target_id=fork.id,
    )
    session.commit()
    response = serialize_project(session, fork)
    response["forked_from_project_id"] = source.id
    return response


@router.get("/projects/{project_id}/members")
def list_project_members(project_id: int, session: Session = Depends(get_session)):
    get_project_or_404(session, project_id)
    members = session.exec(
        select(Member).where(Member.source_type == "Project", Member.source_id == project_id)
    ).all()
    return {"members": [serialize_member(session, member) for member in members]}


@router.post("/projects/{project_id}/members")
def add_project_member(
    project_id: int,
    payload: MemberCreate,
    session: Session = Depends(get_session),
):
    get_project_or_404(session, project_id)
    get_user_or_404(session, payload.user_id)
    existing = session.exec(
        select(Member).where(
            Member.source_type == "Project",
            Member.source_id == project_id,
            Member.user_id == payload.user_id,
        )
    ).all()
    if existing:
        member = existing[0]
        member.access_level = payload.access_level
        member.expires_at = payload.expires_at
        member.updated_at = datetime.utcnow()
    else:
        member = Member(
            user_id=payload.user_id,
            source_id=project_id,
            source_type="Project",
            access_level=payload.access_level,
            expires_at=payload.expires_at,
        )
        session.add(member)
    session.commit()
    session.refresh(member)
    return serialize_member(session, member)


@router.put("/projects/{project_id}/members/{member_id}")
def update_project_member(
    project_id: int,
    member_id: int,
    payload: MemberUpdate,
    session: Session = Depends(get_session),
):
    get_project_or_404(session, project_id)
    member = session.get(Member, member_id)
    if not member or member.source_type != "Project" or member.source_id != project_id:
        raise HTTPException(status_code=404, detail="Member not found")
    member.access_level = payload.access_level
    member.expires_at = payload.expires_at
    member.updated_at = datetime.utcnow()
    session.add(member)
    session.commit()
    session.refresh(member)
    return serialize_member(session, member)


@router.delete("/projects/{project_id}/members/{member_id}")
def delete_project_member(project_id: int, member_id: int, session: Session = Depends(get_session)):
    get_project_or_404(session, project_id)
    member = session.get(Member, member_id)
    if not member or member.source_type != "Project" or member.source_id != project_id:
        raise HTTPException(status_code=404, detail="Member not found")
    session.delete(member)
    session.commit()
    return {"ok": True}


@router.get("/projects/{project_id}/issues")
def list_issues(
    project_id: int,
    state: Optional[str] = None,
    assignee_id: Optional[int] = None,
    milestone_id: Optional[int] = None,
    labels: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = "created_desc",
    page: int = 1,
    limit: int = 20,
    session: Session = Depends(get_session),
):
    get_project_or_404(session, project_id)
    issues = session.exec(select(Issue).where(Issue.project_id == project_id)).all()
    if state:
        issues = [issue for issue in issues if issue.state == state]
    if assignee_id is not None:
        issues = [issue for issue in issues if issue.assignee_id == assignee_id]
    if milestone_id is not None:
        issues = [issue for issue in issues if issue.milestone_id == milestone_id]
    if labels:
        wanted = {value.strip().lower() for value in labels.split(",") if value.strip()}
        filtered = []
        for issue in issues:
            issue_label_titles = {
                label["title"].lower() for label in serialize_issue(session, issue)["labels"]
            }
            if wanted.issubset(issue_label_titles):
                filtered.append(issue)
        issues = filtered
    if search:
        needle = search.lower()
        issues = [
            issue
            for issue in issues
            if needle in issue.title.lower() or needle in (issue.description or "").lower()
        ]
    reverse = not sort.endswith("_asc")
    if sort.startswith("updated"):
        key = lambda issue: issue.updated_at
    elif sort.startswith("due_date"):
        key = lambda issue: issue.due_date or date.max
    elif sort.startswith("iid"):
        key = lambda issue: issue.iid
    else:
        key = lambda issue: issue.created_at
    issues = sorted(issues, key=key, reverse=reverse)
    total = len(issues)
    start = max(page - 1, 0) * limit
    end = start + limit
    return {
        "issues": [serialize_issue(session, issue) for issue in issues[start:end]],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/projects/{project_id}/issues/{iid}")
def get_issue(project_id: int, iid: int, session: Session = Depends(get_session)):
    return serialize_issue(session, get_issue_or_404(session, project_id, iid))


@router.post("/projects/{project_id}/issues")
def create_issue(
    project_id: int,
    payload: IssueCreate,
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    project = get_project_or_404(session, project_id)
    issue = Issue(
        iid=next_iid(session, Issue, project_id),
        title=payload.title,
        description=payload.description,
        project_id=project_id,
        author_id=current_user_id,
        assignee_id=payload.assignee_id,
        milestone_id=payload.milestone_id,
        due_date=payload.due_date,
        weight=payload.weight,
        confidential=payload.confidential,
    )
    session.add(issue)
    session.commit()
    session.refresh(issue)
    sync_issue_labels(session, issue, payload.labels)
    if payload.assignee_id:
        session.add(
            Todo(
                user_id=payload.assignee_id,
                project_id=project_id,
                target_type="Issue",
                target_id=issue.id,
                action="assigned",
                state="pending",
                body=payload.title,
                author_id=current_user_id,
            )
        )
    touch_project(project)
    session.add(project)
    record_event(
        session,
        author_id=current_user_id,
        project_id=project_id,
        action="created",
        target_type="Issue",
        target_id=issue.id,
    )
    session.commit()
    return serialize_issue(session, issue)


@router.put("/projects/{project_id}/issues/{iid}")
def update_issue(
    project_id: int,
    iid: int,
    payload: IssueUpdate,
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    issue = get_issue_or_404(session, project_id, iid)
    project = get_project_or_404(session, project_id)
    if payload.title is not None:
        issue.title = payload.title
    if payload.description is not None:
        issue.description = payload.description
    if payload.state is not None:
        if payload.state not in {"opened", "closed"}:
            raise HTTPException(status_code=400, detail="Invalid issue state")
        issue.state = payload.state
        issue.closed_at = datetime.utcnow() if payload.state == "closed" else None
    if payload.assignee_id is not None:
        issue.assignee_id = payload.assignee_id
    if payload.milestone_id is not None:
        issue.milestone_id = payload.milestone_id
    if payload.due_date is not None:
        issue.due_date = payload.due_date
    if payload.weight is not None:
        issue.weight = payload.weight
    if payload.confidential is not None:
        issue.confidential = payload.confidential
    issue.updated_at = datetime.utcnow()
    sync_issue_labels(session, issue, payload.labels)
    session.add(issue)
    touch_project(project)
    session.add(project)
    record_event(
        session,
        author_id=current_user_id,
        project_id=project_id,
        action="closed" if payload.state == "closed" else "updated",
        target_type="Issue",
        target_id=issue.id,
    )
    session.commit()
    session.refresh(issue)
    return serialize_issue(session, issue)


@router.delete("/projects/{project_id}/issues/{iid}")
def delete_issue(project_id: int, iid: int, session: Session = Depends(get_session)):
    issue = get_issue_or_404(session, project_id, iid)
    for note in session.exec(select(Note).where(Note.noteable_type == "Issue", Note.noteable_id == issue.id)).all():
        session.delete(note)
    for link in session.exec(select(IssueLabel).where(IssueLabel.issue_id == issue.id)).all():
        session.delete(link)
    for todo in session.exec(
        select(Todo).where(Todo.target_type == "Issue", Todo.target_id == issue.id)
    ).all():
        session.delete(todo)
    session.delete(issue)
    session.commit()
    return {"ok": True}


@router.get("/projects/{project_id}/issues/{iid}/notes")
def list_issue_notes(project_id: int, iid: int, session: Session = Depends(get_session)):
    issue = get_issue_or_404(session, project_id, iid)
    notes = session.exec(
        select(Note).where(Note.noteable_type == "Issue", Note.noteable_id == issue.id)
    ).all()
    return {"notes": [serialize_note(session, note) for note in notes]}


@router.post("/projects/{project_id}/issues/{iid}/notes")
def create_issue_note(
    project_id: int,
    iid: int,
    payload: NoteCreate,
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    issue = get_issue_or_404(session, project_id, iid)
    note = Note(
        body=payload.body,
        noteable_type="Issue",
        noteable_id=issue.id,
        author_id=current_user_id,
        system=False,
    )
    session.add(note)
    record_event(
        session,
        author_id=current_user_id,
        project_id=project_id,
        action="commented",
        target_type="Issue",
        target_id=issue.id,
    )
    session.commit()
    session.refresh(note)
    return serialize_note(session, note)


@router.get("/projects/{project_id}/merge_requests")
def list_merge_requests(
    project_id: int,
    state: Optional[str] = None,
    author_id: Optional[int] = None,
    assignee_id: Optional[int] = None,
    sort: str = "created_desc",
    page: int = 1,
    limit: int = 20,
    session: Session = Depends(get_session),
):
    get_project_or_404(session, project_id)
    merge_requests = session.exec(select(MergeRequest).where(MergeRequest.project_id == project_id)).all()
    if state:
        merge_requests = [item for item in merge_requests if item.state == state]
    if author_id is not None:
        merge_requests = [item for item in merge_requests if item.author_id == author_id]
    if assignee_id is not None:
        merge_requests = [item for item in merge_requests if item.assignee_id == assignee_id]
    reverse = not sort.endswith("_asc")
    key = lambda item: item.updated_at if sort.startswith("updated") else item.created_at
    merge_requests = sorted(merge_requests, key=key, reverse=reverse)
    total = len(merge_requests)
    start = max(page - 1, 0) * limit
    end = start + limit
    return {
        "merge_requests": [serialize_merge_request(session, item) for item in merge_requests[start:end]],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/projects/{project_id}/merge_requests/{iid}")
def get_merge_request(project_id: int, iid: int, session: Session = Depends(get_session)):
    return serialize_merge_request(session, get_merge_request_or_404(session, project_id, iid))


@router.post("/projects/{project_id}/merge_requests")
def create_merge_request(
    project_id: int,
    payload: MergeRequestCreate,
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    project = get_project_or_404(session, project_id)
    merge_request = MergeRequest(
        iid=next_iid(session, MergeRequest, project_id),
        title=payload.title,
        description=payload.description,
        project_id=project_id,
        author_id=current_user_id,
        assignee_id=payload.assignee_id,
        source_branch=payload.source_branch,
        target_branch=payload.target_branch,
        source_project_id=project_id,
        state="opened",
        merge_status="can_be_merged",
    )
    session.add(merge_request)
    session.commit()
    session.refresh(merge_request)
    if payload.assignee_id:
        session.add(
            Todo(
                user_id=payload.assignee_id,
                project_id=project_id,
                target_type="MergeRequest",
                target_id=merge_request.id,
                action="assigned",
                state="pending",
                body=payload.title,
                author_id=current_user_id,
            )
        )
    touch_project(project)
    session.add(project)
    record_event(
        session,
        author_id=current_user_id,
        project_id=project_id,
        action="created",
        target_type="MergeRequest",
        target_id=merge_request.id,
    )
    session.commit()
    return serialize_merge_request(session, merge_request)


@router.put("/projects/{project_id}/merge_requests/{iid}")
def update_merge_request(
    project_id: int,
    iid: int,
    payload: MergeRequestUpdate,
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    merge_request = get_merge_request_or_404(session, project_id, iid)
    project = get_project_or_404(session, project_id)
    if payload.title is not None:
        merge_request.title = payload.title
    if payload.description is not None:
        merge_request.description = payload.description
    if payload.assignee_id is not None:
        merge_request.assignee_id = payload.assignee_id
    if payload.state is not None:
        if payload.state not in {"opened", "closed", "merged"}:
            raise HTTPException(status_code=400, detail="Invalid merge request state")
        merge_request.state = payload.state
        if payload.state == "merged":
            merge_request.merged_at = datetime.utcnow()
            merge_request.merged_by_id = current_user_id
            merge_request.merge_status = "can_be_merged"
        elif payload.state == "closed":
            merge_request.merged_at = None
            merge_request.merged_by_id = None
    merge_request.updated_at = datetime.utcnow()
    session.add(merge_request)
    touch_project(project)
    session.add(project)
    record_event(
        session,
        author_id=current_user_id,
        project_id=project_id,
        action="merged" if payload.state == "merged" else "updated",
        target_type="MergeRequest",
        target_id=merge_request.id,
    )
    session.commit()
    session.refresh(merge_request)
    return serialize_merge_request(session, merge_request)


@router.get("/projects/{project_id}/merge_requests/{iid}/notes")
def list_merge_request_notes(project_id: int, iid: int, session: Session = Depends(get_session)):
    merge_request = get_merge_request_or_404(session, project_id, iid)
    notes = session.exec(
        select(Note).where(Note.noteable_type == "MergeRequest", Note.noteable_id == merge_request.id)
    ).all()
    return {"notes": [serialize_note(session, note) for note in notes]}


@router.post("/projects/{project_id}/merge_requests/{iid}/notes")
def create_merge_request_note(
    project_id: int,
    iid: int,
    payload: NoteCreate,
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    merge_request = get_merge_request_or_404(session, project_id, iid)
    note = Note(
        body=payload.body,
        noteable_type="MergeRequest",
        noteable_id=merge_request.id,
        author_id=current_user_id,
        system=False,
    )
    session.add(note)
    record_event(
        session,
        author_id=current_user_id,
        project_id=project_id,
        action="commented",
        target_type="MergeRequest",
        target_id=merge_request.id,
    )
    session.commit()
    session.refresh(note)
    return serialize_note(session, note)


@router.get("/projects/{project_id}/milestones")
def list_milestones(project_id: int, session: Session = Depends(get_session)):
    get_project_or_404(session, project_id)
    milestones = session.exec(select(Milestone).where(Milestone.project_id == project_id)).all()
    return {"milestones": [serialize_milestone(item) for item in milestones]}


@router.post("/projects/{project_id}/milestones")
def create_milestone(project_id: int, payload: MilestoneCreate, session: Session = Depends(get_session)):
    get_project_or_404(session, project_id)
    milestone = Milestone(
        title=payload.title,
        description=payload.description,
        project_id=project_id,
        start_date=payload.start_date,
        due_date=payload.due_date,
    )
    session.add(milestone)
    session.commit()
    session.refresh(milestone)
    return serialize_milestone(milestone)


@router.put("/projects/{project_id}/milestones/{milestone_id}")
def update_milestone(
    project_id: int,
    milestone_id: int,
    payload: MilestoneUpdate,
    session: Session = Depends(get_session),
):
    get_project_or_404(session, project_id)
    milestone = session.get(Milestone, milestone_id)
    if not milestone or milestone.project_id != project_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
    for field in ["title", "description", "start_date", "due_date", "state"]:
        value = getattr(payload, field)
        if value is not None:
            setattr(milestone, field, value)
    milestone.updated_at = datetime.utcnow()
    session.add(milestone)
    session.commit()
    session.refresh(milestone)
    return serialize_milestone(milestone)


@router.delete("/projects/{project_id}/milestones/{milestone_id}")
def delete_milestone(project_id: int, milestone_id: int, session: Session = Depends(get_session)):
    get_project_or_404(session, project_id)
    milestone = session.get(Milestone, milestone_id)
    if not milestone or milestone.project_id != project_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
    session.delete(milestone)
    session.commit()
    return {"ok": True}


@router.get("/projects/{project_id}/labels")
def list_labels(project_id: int, session: Session = Depends(get_session)):
    get_project_or_404(session, project_id)
    labels = get_project_labels(session, project_id)
    return {"labels": [serialize_label(label) for label in labels]}


@router.post("/projects/{project_id}/labels")
def create_label(project_id: int, payload: LabelCreate, session: Session = Depends(get_session)):
    get_project_or_404(session, project_id)
    label = Label(
        title=payload.title,
        color=payload.color,
        description=payload.description,
        project_id=project_id,
    )
    session.add(label)
    session.commit()
    session.refresh(label)
    return serialize_label(label)


@router.put("/projects/{project_id}/labels/{label_id}")
def update_label(
    project_id: int,
    label_id: int,
    payload: LabelUpdate,
    session: Session = Depends(get_session),
):
    get_project_or_404(session, project_id)
    label = session.get(Label, label_id)
    if not label or label.project_id != project_id:
        raise HTTPException(status_code=404, detail="Label not found")
    for field in ["title", "color", "description"]:
        value = getattr(payload, field)
        if value is not None:
            setattr(label, field, value)
    label.updated_at = datetime.utcnow()
    session.add(label)
    session.commit()
    session.refresh(label)
    return serialize_label(label)


@router.delete("/projects/{project_id}/labels/{label_id}")
def delete_label(project_id: int, label_id: int, session: Session = Depends(get_session)):
    get_project_or_404(session, project_id)
    label = session.get(Label, label_id)
    if not label or label.project_id != project_id:
        raise HTTPException(status_code=404, detail="Label not found")
    for link in session.exec(select(IssueLabel).where(IssueLabel.label_id == label_id)).all():
        session.delete(link)
    for link in session.exec(select(MergeRequestLabel).where(MergeRequestLabel.label_id == label_id)).all():
        session.delete(link)
    session.delete(label)
    session.commit()
    return {"ok": True}


@router.get("/projects/{project_id}/repository/tree")
def list_repository_tree(
    project_id: int,
    path: str = "",
    branch: str = "main",
    session: Session = Depends(get_session),
):
    get_project_or_404(session, project_id)
    files = session.exec(
        select(ProjectFile).where(ProjectFile.project_id == project_id, ProjectFile.branch == branch)
    ).all()
    return {"tree": project_tree_entries(files, path)}


@router.get("/projects/{project_id}/repository/files/{file_path:path}")
def get_repository_file(
    project_id: int,
    file_path: str,
    branch: str = "main",
    session: Session = Depends(get_session),
):
    get_project_or_404(session, project_id)
    files = session.exec(
        select(ProjectFile).where(
            ProjectFile.project_id == project_id,
            ProjectFile.branch == branch,
            ProjectFile.file_path == file_path,
        )
    ).all()
    if not files:
        raise HTTPException(status_code=404, detail="File not found")
    project_file = files[0]
    return {
        "id": project_file.id,
        "project_id": project_file.project_id,
        "file_path": project_file.file_path,
        "content": project_file.content,
        "branch": project_file.branch,
        "last_commit_message": project_file.last_commit_message,
        "committed_by_id": project_file.committed_by_id,
        "created_at": to_iso(project_file.created_at),
        "updated_at": to_iso(project_file.updated_at),
    }


@router.post("/projects/{project_id}/repository/files/{file_path:path}")
def create_repository_file(
    project_id: int,
    file_path: str,
    payload: FileCreate,
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    project = get_project_or_404(session, project_id)
    existing = session.exec(
        select(ProjectFile).where(
            ProjectFile.project_id == project_id,
            ProjectFile.branch == payload.branch,
            ProjectFile.file_path == file_path,
        )
    ).all()
    if existing:
        raise HTTPException(status_code=400, detail="File already exists")
    project_file = ProjectFile(
        project_id=project_id,
        file_path=file_path,
        content=payload.content,
        branch=payload.branch,
        last_commit_message=payload.commit_message,
        committed_by_id=current_user_id,
    )
    session.add(project_file)
    touch_project(project)
    session.add(project)
    record_event(
        session,
        author_id=current_user_id,
        project_id=project_id,
        action="pushed",
        target_type="ProjectFile",
        target_id=project.id,
    )
    session.commit()
    session.refresh(project_file)
    return {
        "id": project_file.id,
        "file_path": project_file.file_path,
        "branch": project_file.branch,
        "last_commit_message": project_file.last_commit_message,
    }


@router.put("/projects/{project_id}/repository/files/{file_path:path}")
def update_repository_file(
    project_id: int,
    file_path: str,
    payload: FileUpdate,
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    project = get_project_or_404(session, project_id)
    files = session.exec(
        select(ProjectFile).where(
            ProjectFile.project_id == project_id,
            ProjectFile.branch == payload.branch,
            ProjectFile.file_path == file_path,
        )
    ).all()
    if not files:
        raise HTTPException(status_code=404, detail="File not found")
    project_file = files[0]
    project_file.content = payload.content
    project_file.last_commit_message = payload.commit_message
    project_file.committed_by_id = current_user_id
    project_file.updated_at = datetime.utcnow()
    session.add(project_file)
    touch_project(project)
    session.add(project)
    record_event(
        session,
        author_id=current_user_id,
        project_id=project_id,
        action="pushed",
        target_type="ProjectFile",
        target_id=project.id,
    )
    session.commit()
    session.refresh(project_file)
    return {
        "id": project_file.id,
        "file_path": project_file.file_path,
        "branch": project_file.branch,
        "last_commit_message": project_file.last_commit_message,
    }


@router.get("/groups")
def list_groups(session: Session = Depends(get_session)):
    groups = session.exec(select(Namespace).where(Namespace.type == "Group")).all()
    return {"groups": [serialize_namespace(group) for group in groups]}


@router.get("/groups/{group_id}")
def get_group(group_id: int, session: Session = Depends(get_session)):
    group = get_namespace_or_404(session, group_id)
    if group.type != "Group":
        raise HTTPException(status_code=404, detail="Group not found")
    members_count = len(
        session.exec(select(Member).where(Member.source_type == "Namespace", Member.source_id == group_id)).all()
    )
    projects_count = len(session.exec(select(Project).where(Project.namespace_id == group_id)).all())
    payload = serialize_namespace(group)
    payload["members_count"] = members_count
    payload["projects_count"] = projects_count
    return payload


@router.post("/groups")
def create_group(payload: GroupCreate, session: Session = Depends(get_session)):
    ensure_namespace_path_unique(session, payload.path)
    group = Namespace(
        name=payload.name,
        path=payload.path,
        type="Group",
        visibility_level=payload.visibility_level,
        description=payload.description,
    )
    session.add(group)
    session.commit()
    session.refresh(group)
    return serialize_namespace(group)


@router.put("/groups/{group_id}")
def update_group(group_id: int, payload: GroupUpdate, session: Session = Depends(get_session)):
    group = get_namespace_or_404(session, group_id)
    if group.type != "Group":
        raise HTTPException(status_code=404, detail="Group not found")
    if payload.path is not None:
        ensure_namespace_path_unique(session, payload.path, group.id)
        group.path = payload.path
    for field in ["name", "description", "visibility_level"]:
        value = getattr(payload, field)
        if value is not None:
            setattr(group, field, value)
    group.updated_at = datetime.utcnow()
    session.add(group)
    session.commit()
    session.refresh(group)
    return serialize_namespace(group)


@router.get("/groups/{group_id}/members")
def list_group_members(group_id: int, session: Session = Depends(get_session)):
    group = get_namespace_or_404(session, group_id)
    if group.type != "Group":
        raise HTTPException(status_code=404, detail="Group not found")
    members = session.exec(
        select(Member).where(Member.source_type == "Namespace", Member.source_id == group_id)
    ).all()
    return {"members": [serialize_member(session, member) for member in members]}


@router.post("/groups/{group_id}/members")
def add_group_member(group_id: int, payload: MemberCreate, session: Session = Depends(get_session)):
    group = get_namespace_or_404(session, group_id)
    if group.type != "Group":
        raise HTTPException(status_code=404, detail="Group not found")
    get_user_or_404(session, payload.user_id)
    existing = session.exec(
        select(Member).where(
            Member.source_type == "Namespace",
            Member.source_id == group_id,
            Member.user_id == payload.user_id,
        )
    ).all()
    if existing:
        member = existing[0]
        member.access_level = payload.access_level
        member.expires_at = payload.expires_at
        member.updated_at = datetime.utcnow()
    else:
        member = Member(
            user_id=payload.user_id,
            source_id=group_id,
            source_type="Namespace",
            access_level=payload.access_level,
            expires_at=payload.expires_at,
        )
        session.add(member)
    session.commit()
    session.refresh(member)
    return serialize_member(session, member)


@router.get("/groups/{group_id}/projects")
def list_group_projects(group_id: int, session: Session = Depends(get_session)):
    group = get_namespace_or_404(session, group_id)
    if group.type != "Group":
        raise HTTPException(status_code=404, detail="Group not found")
    projects = session.exec(select(Project).where(Project.namespace_id == group_id)).all()
    return {"projects": [serialize_project(session, project) for project in projects]}


@router.get("/todos")
def list_todos(
    state: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    todos = session.exec(select(Todo).where(Todo.user_id == current_user_id)).all()
    if state:
        todos = [todo for todo in todos if todo.state == state]
    todos = sorted(todos, key=lambda todo: todo.created_at, reverse=True)
    total = len(todos)
    start = max(page - 1, 0) * limit
    end = start + limit
    return {
        "todos": [serialize_todo(session, todo) for todo in todos[start:end]],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.post("/todos/{todo_id}/mark_done")
def mark_todo_done(todo_id: int, session: Session = Depends(get_session)):
    todo = session.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    todo.state = "done"
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return serialize_todo(session, todo)


@router.post("/todos/mark_all_done")
def mark_all_todos_done(
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    todos = session.exec(select(Todo).where(Todo.user_id == current_user_id, Todo.state == "pending")).all()
    for todo in todos:
        todo.state = "done"
        session.add(todo)
    session.commit()
    return {"updated": len(todos)}


@router.get("/dashboard/issues")
def dashboard_issues(
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    issues = session.exec(select(Issue).where(Issue.assignee_id == current_user_id)).all()
    return {"issues": [serialize_issue(session, issue) for issue in issues]}


@router.get("/dashboard/merge_requests")
def dashboard_merge_requests(
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    merge_requests = session.exec(select(MergeRequest)).all()
    merge_requests = [
        item
        for item in merge_requests
        if item.author_id == current_user_id or item.assignee_id == current_user_id
    ]
    return {"merge_requests": [serialize_merge_request(session, item) for item in merge_requests]}


@router.get("/dashboard/projects")
def dashboard_projects(
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    projects = session.exec(select(Project).where(Project.creator_id == current_user_id)).all()
    return {"projects": [serialize_project(session, project) for project in projects]}


@router.get("/search")
def global_search(
    q: str,
    scope: Optional[str] = None,
    session: Session = Depends(get_session),
):
    needle = q.lower()
    results: dict[str, list[dict[str, Any]]] = {}

    if scope in (None, "projects"):
        projects = session.exec(select(Project)).all()
        results["projects"] = [
            serialize_project(session, project)
            for project in projects
            if needle in project.name.lower() or needle in (project.description or "").lower()
        ]
    if scope in (None, "issues"):
        issues = session.exec(select(Issue)).all()
        results["issues"] = [
            serialize_issue(session, issue)
            for issue in issues
            if needle in issue.title.lower() or needle in (issue.description or "").lower()
        ]
    if scope in (None, "merge_requests"):
        merge_requests = session.exec(select(MergeRequest)).all()
        results["merge_requests"] = [
            serialize_merge_request(session, item)
            for item in merge_requests
            if needle in item.title.lower() or needle in (item.description or "").lower()
        ]
    if scope in (None, "users"):
        users = session.exec(select(User)).all()
        results["users"] = [
            serialize_user(user)
            for user in users
            if needle in user.username.lower() or needle in user.name.lower() or needle in user.email.lower()
        ]
    return results


@router.get("/admin/db")
def admin_db(session: Session = Depends(get_session)):
    return {
        "users": len(session.exec(select(User)).all()),
        "namespaces": len(session.exec(select(Namespace)).all()),
        "projects": len(session.exec(select(Project)).all()),
        "issues": len(session.exec(select(Issue)).all()),
        "merge_requests": len(session.exec(select(MergeRequest)).all()),
        "notes": len(session.exec(select(Note)).all()),
        "todos": len(session.exec(select(Todo)).all()),
    }


@router.get("/admin/eval")
def admin_eval(session: Session = Depends(get_session)):
    projects = session.exec(select(Project)).all()
    issues = session.exec(select(Issue)).all()
    merge_requests = session.exec(select(MergeRequest)).all()
    return {
        "status": "ok",
        "project_count": len(projects),
        "issue_count": len(issues),
        "merge_request_count": len(merge_requests),
        "popular_projects": sorted(
            [serialize_project(session, project) for project in projects],
            key=lambda item: item["star_count"],
            reverse=True,
        )[:5],
    }
