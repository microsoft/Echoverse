import type {
  AuthResponse,
  Group,
  Issue,
  Label,
  Member,
  MergeRequest,
  Milestone,
  Note,
  PaginatedIssues,
  PaginatedMergeRequests,
  PaginatedProjects,
  PaginatedTodos,
  Project,
  ProjectFile,
  SearchResults,
  Stats,
  Todo,
  TreeEntry,
  User,
} from './types';

const API_URL = '/api';
const projectPathCache = new Map<string, Promise<Project | null>>();

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeoutId);
  }
}

function queryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.set(key, String(value));
  });
  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : '';
}

function normalizeProject(project: Record<string, unknown>): Project {
  const namespace = (project.namespace ?? null) as { path?: string; id?: number } | null;
  return {
    id: Number(project.id),
    name: String(project.name ?? ''),
    path: String(project.path ?? ''),
    full_path: String(project.full_path ?? `${namespace?.path ?? ''}/${String(project.path ?? '')}`),
    namespace_id: Number(project.namespace_id ?? namespace?.id ?? 0),
    namespace_path: String(namespace?.path ?? ''),
    creator_id: Number(project.creator_id ?? 0),
    description: (project.description as string | null | undefined) ?? null,
    visibility_level: Number(project.visibility_level ?? 20),
    star_count: Number(project.star_count ?? 0),
    forks_count: Number(project.forks_count ?? 0),
    archived: Boolean(project.archived),
    default_branch: String(project.default_branch ?? 'main'),
    topics: Array.isArray(project.topics) ? (project.topics as string[]) : [],
    created_at: String(project.created_at ?? ''),
    updated_at: String(project.updated_at ?? ''),
    last_activity_at: (project.last_activity_at as string | undefined) ?? undefined,
    merge_requests_enabled: project.merge_requests_enabled as boolean | undefined,
    issues_enabled: project.issues_enabled as boolean | undefined,
    wiki_enabled: project.wiki_enabled as boolean | undefined,
    namespace: (project.namespace as Project['namespace']) ?? undefined,
    creator: (project.creator as User) ?? undefined,
    starred: (project.starred as boolean | undefined) ?? undefined,
    is_starred: (project.starred as boolean | undefined) ?? undefined,
    forked_from_project_id: (project.forked_from_project_id as number | undefined) ?? undefined,
  };
}

function normalizeIssue(issue: Record<string, unknown>): Issue {
  const author = (issue.author ?? null) as User | null;
  const assignee = (issue.assignee ?? null) as User | null;
  return {
    id: Number(issue.id),
    iid: Number(issue.iid),
    title: String(issue.title ?? ''),
    description: (issue.description as string | null | undefined) ?? null,
    project_id: Number(issue.project_id ?? 0),
    author_id: Number(issue.author_id ?? author?.id ?? 0),
    author_username: author?.username ?? String(issue.author_username ?? 'unknown'),
    assignee_id: (issue.assignee_id as number | null | undefined) ?? assignee?.id ?? null,
    assignee_username: assignee?.username ?? (issue.assignee_username as string | null | undefined) ?? null,
    milestone_id: (issue.milestone_id as number | null | undefined) ?? null,
    state: String(issue.state ?? 'opened'),
    created_at: String(issue.created_at ?? ''),
    updated_at: String(issue.updated_at ?? ''),
    due_date: (issue.due_date as string | null | undefined) ?? null,
    labels: Array.isArray(issue.labels) ? (issue.labels as Label[]) : [],
    note_count: Number(issue.notes_count ?? issue.note_count ?? 0),
    notes_count: Number(issue.notes_count ?? issue.note_count ?? 0),
    author: author ?? undefined,
    assignee: assignee ?? undefined,
    milestone: (issue.milestone as Milestone | null | undefined) ?? null,
    project: issue.project ? normalizeProject(issue.project as Record<string, unknown>) : undefined,
    closed_at: (issue.closed_at as string | null | undefined) ?? null,
    weight: (issue.weight as number | null | undefined) ?? null,
    confidential: Boolean(issue.confidential),
  };
}

function normalizeMergeRequest(item: Record<string, unknown>): MergeRequest {
  const author = (item.author ?? null) as User | null;
  const assignee = (item.assignee ?? null) as User | null;
  return {
    id: Number(item.id),
    iid: Number(item.iid),
    title: String(item.title ?? ''),
    description: (item.description as string | null | undefined) ?? null,
    project_id: Number(item.project_id ?? 0),
    author_id: Number(item.author_id ?? author?.id ?? 0),
    author_username: author?.username ?? String(item.author_username ?? 'unknown'),
    source_branch: String(item.source_branch ?? ''),
    target_branch: String(item.target_branch ?? ''),
    state: String(item.state ?? 'opened'),
    merge_status: String(item.merge_status ?? 'can_be_merged'),
    created_at: String(item.created_at ?? ''),
    assignee_id: (item.assignee_id as number | null | undefined) ?? assignee?.id ?? null,
    updated_at: (item.updated_at as string | undefined) ?? undefined,
    merged_at: (item.merged_at as string | null | undefined) ?? null,
    merged_by_id: (item.merged_by_id as number | null | undefined) ?? null,
    note_count: Number(item.notes_count ?? item.note_count ?? 0),
    notes_count: Number(item.notes_count ?? item.note_count ?? 0),
    author: author ?? undefined,
    assignee: assignee ?? undefined,
    project: item.project ? normalizeProject(item.project as Record<string, unknown>) : undefined,
  };
}

function normalizeNote(note: Record<string, unknown>): Note {
  const author = (note.author ?? null) as User | null;
  return {
    id: Number(note.id),
    body: String(note.body ?? ''),
    author_id: Number(note.author_id ?? author?.id ?? 0),
    author_username: author?.username ?? 'unknown',
    created_at: String(note.created_at ?? ''),
    system: Boolean(note.system),
    noteable_type: (note.noteable_type as string | undefined) ?? undefined,
    noteable_id: (note.noteable_id as number | undefined) ?? undefined,
    updated_at: (note.updated_at as string | undefined) ?? undefined,
    author: author ?? undefined,
  };
}

function normalizeMember(member: Record<string, unknown>): Member {
  const user = (member.user ?? null) as User | null;
  return {
    id: Number(member.id),
    user_id: Number(member.user_id ?? user?.id ?? 0),
    username: user?.username ?? '',
    name: user?.name ?? '',
    access_level: Number(member.access_level ?? 0),
    access_level_name: String(member.access_level_name ?? 'Guest'),
    created_at: (member.created_at as string | undefined) ?? undefined,
    updated_at: (member.updated_at as string | undefined) ?? undefined,
    expires_at: (member.expires_at as string | null | undefined) ?? null,
    source_id: (member.source_id as number | undefined) ?? undefined,
    source_type: (member.source_type as string | undefined) ?? undefined,
    user: user ?? undefined,
  };
}

function normalizeTodo(todo: Record<string, unknown>): Todo {
  const project = todo.project ? normalizeProject(todo.project as Record<string, unknown>) : undefined;
  return {
    id: Number(todo.id),
    project_id: Number(todo.project_id ?? project?.id ?? 0),
    project_name: project?.name ?? '',
    target_type: String(todo.target_type ?? ''),
    target_id: Number(todo.target_id ?? 0),
    action: String(todo.action ?? ''),
    state: String(todo.state ?? 'pending'),
    body: (todo.body as string | null | undefined) ?? null,
    created_at: String(todo.created_at ?? ''),
    project,
    author: (todo.author as User | undefined) ?? undefined,
  };
}

export const api = {
  register: (data: { username: string; name: string; email: string; password: string }) =>
    fetchJson<AuthResponse>(`${API_URL}/auth/register`, { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    fetchJson<AuthResponse>(`${API_URL}/auth/login`, { method: 'POST', body: JSON.stringify(data) }),

  logout: () => fetchJson<{ ok: boolean }>(`${API_URL}/auth/logout`, { method: 'POST' }),

  getCurrentUser: () => fetchJson<User>(`${API_URL}/auth/me`),
  getUser: () => fetchJson<User>(`${API_URL}/user`),
  updateUser: (data: Partial<Pick<User, 'name' | 'bio' | 'location' | 'website_url' | 'organization' | 'avatar_url'>>) =>
    fetchJson<User>(`${API_URL}/user`, { method: 'PUT', body: JSON.stringify(data) }),
  updateUserStatus: (data: { emoji?: string | null; message?: string | null }) =>
    fetchJson<User>(`${API_URL}/user/status`, { method: 'PUT', body: JSON.stringify(data) }),
  getUserByUsername: (username: string) => fetchJson<User>(`${API_URL}/users/${encodeURIComponent(username)}`),
  getUserProjects: async (username: string) => {
    const response = await fetchJson<{ projects: Record<string, unknown>[] }>(`${API_URL}/users/${encodeURIComponent(username)}/projects`);
    return { projects: response.projects.map(normalizeProject) };
  },

  listProjects: async (params: {
    visibility?: number;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
    owned?: boolean;
    starred?: boolean;
  } = {}): Promise<PaginatedProjects> => {
    const response = await fetchJson<PaginatedProjects & { projects: Record<string, unknown>[] }>(`${API_URL}/projects${queryString(params)}`);
    return { ...response, projects: response.projects.map(normalizeProject) };
  },

  getProject: async (projectId: number): Promise<Project> => normalizeProject(await fetchJson<Record<string, unknown>>(`${API_URL}/projects/${projectId}`)),
  createProject: async (data: { name: string; namespace_id: number; description?: string; visibility_level: number; initialize_with_readme: boolean }) =>
    normalizeProject(await fetchJson<Record<string, unknown>>(`${API_URL}/projects`, { method: 'POST', body: JSON.stringify(data) })),
  updateProject: async (projectId: number, data: { name?: string; description?: string; archived?: boolean; topics?: string[]; default_branch?: string }) =>
    normalizeProject(await fetchJson<Record<string, unknown>>(`${API_URL}/projects/${projectId}`, { method: 'PUT', body: JSON.stringify(data) })),
  deleteProject: (projectId: number) => fetchJson<{ ok: boolean }>(`${API_URL}/projects/${projectId}`, { method: 'DELETE' }),
  starProject: async (projectId: number) => normalizeProject(await fetchJson<Record<string, unknown>>(`${API_URL}/projects/${projectId}/star`, { method: 'POST' })),
  unstarProject: async (projectId: number) => normalizeProject(await fetchJson<Record<string, unknown>>(`${API_URL}/projects/${projectId}/star`, { method: 'DELETE' })),
  forkProject: async (projectId: number) => normalizeProject(await fetchJson<Record<string, unknown>>(`${API_URL}/projects/${projectId}/fork`, { method: 'POST' })),
  findProjectByPath: async (namespacePath: string, projectPath: string): Promise<Project | null> => {
    const cacheKey = `${namespacePath}/${projectPath}`;
    const cached = projectPathCache.get(cacheKey);
    if (cached) return cached;

    const lookup = (async () => {
      const response = await api.listProjects({ limit: 200, search: projectPath, sort: 'updated_desc' });
      const project = response.projects.find((item) => item.namespace?.path === namespacePath && item.path === projectPath)
        ?? response.projects.find((item) => item.full_path === cacheKey);
      if (project) return project;
      const fallback = await api.listProjects({ limit: 200, sort: 'updated_desc' });
      return fallback.projects.find((item) => item.namespace?.path === namespacePath && item.path === projectPath)
        ?? fallback.projects.find((item) => item.full_path === cacheKey)
        ?? null;
    })();

    projectPathCache.set(cacheKey, lookup);
    try {
      return await lookup;
    } finally {
      projectPathCache.delete(cacheKey);
    }
  },

  listProjectMembers: async (projectId: number) => {
    const response = await fetchJson<{ members: Record<string, unknown>[] }>(`${API_URL}/projects/${projectId}/members`);
    return { members: response.members.map(normalizeMember) };
  },
  addProjectMember: async (projectId: number, data: { user_id: number; access_level: number; expires_at?: string | null }) =>
    normalizeMember(await fetchJson<Record<string, unknown>>(`${API_URL}/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify(data) })),
  updateProjectMember: async (projectId: number, memberId: number, data: { access_level: number; expires_at?: string | null }) =>
    normalizeMember(await fetchJson<Record<string, unknown>>(`${API_URL}/projects/${projectId}/members/${memberId}`, { method: 'PUT', body: JSON.stringify(data) })),
  deleteProjectMember: (projectId: number, memberId: number) =>
    fetchJson<{ ok: boolean }>(`${API_URL}/projects/${projectId}/members/${memberId}`, { method: 'DELETE' }),

  listIssues: async (projectId: number, params: { state?: string; assignee_id?: number; milestone_id?: number; labels?: string; search?: string; sort?: string; page?: number; limit?: number } = {}): Promise<PaginatedIssues> => {
    const response = await fetchJson<PaginatedIssues & { issues: Record<string, unknown>[] }>(`${API_URL}/projects/${projectId}/issues${queryString(params)}`);
    return { ...response, issues: response.issues.map(normalizeIssue) };
  },
  getIssue: async (projectId: number, iid: number) => normalizeIssue(await fetchJson<Record<string, unknown>>(`${API_URL}/projects/${projectId}/issues/${iid}`)),
  createIssue: async (projectId: number, data: { title: string; description?: string; assignee_id?: number | null; milestone_id?: number | null; labels?: Array<number | string>; due_date?: string | null; weight?: number | null; confidential?: boolean }) =>
    normalizeIssue(await fetchJson<Record<string, unknown>>(`${API_URL}/projects/${projectId}/issues`, { method: 'POST', body: JSON.stringify(data) })),
  updateIssue: async (projectId: number, iid: number, data: { title?: string; description?: string; state?: string; assignee_id?: number | null; milestone_id?: number | null; due_date?: string | null; labels?: Array<number | string>; weight?: number | null; confidential?: boolean }) =>
    normalizeIssue(await fetchJson<Record<string, unknown>>(`${API_URL}/projects/${projectId}/issues/${iid}`, { method: 'PUT', body: JSON.stringify(data) })),
  deleteIssue: (projectId: number, iid: number) => fetchJson<{ ok: boolean }>(`${API_URL}/projects/${projectId}/issues/${iid}`, { method: 'DELETE' }),
  listIssueNotes: async (projectId: number, iid: number) => {
    const response = await fetchJson<{ notes: Record<string, unknown>[] }>(`${API_URL}/projects/${projectId}/issues/${iid}/notes`);
    return { notes: response.notes.map(normalizeNote) };
  },
  createIssueNote: async (projectId: number, iid: number, body: string) =>
    normalizeNote(await fetchJson<Record<string, unknown>>(`${API_URL}/projects/${projectId}/issues/${iid}/notes`, { method: 'POST', body: JSON.stringify({ body }) })),

  listMergeRequests: async (projectId: number, params: { state?: string; author_id?: number; assignee_id?: number; sort?: string; page?: number; limit?: number } = {}): Promise<PaginatedMergeRequests> => {
    const response = await fetchJson<PaginatedMergeRequests & { merge_requests: Record<string, unknown>[] }>(`${API_URL}/projects/${projectId}/merge_requests${queryString(params)}`);
    return { ...response, merge_requests: response.merge_requests.map(normalizeMergeRequest) };
  },
  getMergeRequest: async (projectId: number, iid: number) => normalizeMergeRequest(await fetchJson<Record<string, unknown>>(`${API_URL}/projects/${projectId}/merge_requests/${iid}`)),
  createMergeRequest: async (projectId: number, data: { title: string; description?: string; source_branch: string; target_branch: string; assignee_id?: number | null }) =>
    normalizeMergeRequest(await fetchJson<Record<string, unknown>>(`${API_URL}/projects/${projectId}/merge_requests`, { method: 'POST', body: JSON.stringify(data) })),
  updateMergeRequest: async (projectId: number, iid: number, data: { title?: string; description?: string; state?: string; assignee_id?: number | null }) =>
    normalizeMergeRequest(await fetchJson<Record<string, unknown>>(`${API_URL}/projects/${projectId}/merge_requests/${iid}`, { method: 'PUT', body: JSON.stringify(data) })),
  listMergeRequestNotes: async (projectId: number, iid: number) => {
    const response = await fetchJson<{ notes: Record<string, unknown>[] }>(`${API_URL}/projects/${projectId}/merge_requests/${iid}/notes`);
    return { notes: response.notes.map(normalizeNote) };
  },
  createMergeRequestNote: async (projectId: number, iid: number, body: string) =>
    normalizeNote(await fetchJson<Record<string, unknown>>(`${API_URL}/projects/${projectId}/merge_requests/${iid}/notes`, { method: 'POST', body: JSON.stringify({ body }) })),

  listMilestones: (projectId: number) => fetchJson<{ milestones: Milestone[] }>(`${API_URL}/projects/${projectId}/milestones`),
  createMilestone: (projectId: number, data: { title: string; description?: string; start_date?: string | null; due_date?: string | null }) =>
    fetchJson<Milestone>(`${API_URL}/projects/${projectId}/milestones`, { method: 'POST', body: JSON.stringify(data) }),
  updateMilestone: (projectId: number, milestoneId: number, data: { title?: string; description?: string; start_date?: string | null; due_date?: string | null; state?: string }) =>
    fetchJson<Milestone>(`${API_URL}/projects/${projectId}/milestones/${milestoneId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMilestone: (projectId: number, milestoneId: number) => fetchJson<{ ok: boolean }>(`${API_URL}/projects/${projectId}/milestones/${milestoneId}`, { method: 'DELETE' }),

  listLabels: (projectId: number) => fetchJson<{ labels: Label[] }>(`${API_URL}/projects/${projectId}/labels`),
  createLabel: (projectId: number, data: { title: string; color: string; description?: string }) =>
    fetchJson<Label>(`${API_URL}/projects/${projectId}/labels`, { method: 'POST', body: JSON.stringify(data) }),
  updateLabel: (projectId: number, labelId: number, data: { title?: string; color?: string; description?: string }) =>
    fetchJson<Label>(`${API_URL}/projects/${projectId}/labels/${labelId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLabel: (projectId: number, labelId: number) => fetchJson<{ ok: boolean }>(`${API_URL}/projects/${projectId}/labels/${labelId}`, { method: 'DELETE' }),

  getRepositoryTree: (projectId: number, params: { path?: string; branch?: string } = {}) =>
    fetchJson<{ tree: TreeEntry[] }>(`${API_URL}/projects/${projectId}/repository/tree${queryString(params)}`),
  getRepositoryFile: (projectId: number, filePath: string, branch = 'main') =>
    fetchJson<ProjectFile>(`${API_URL}/projects/${projectId}/repository/files/${filePath}${queryString({ branch })}`),
  createRepositoryFile: (projectId: number, filePath: string, data: { content: string; branch?: string; commit_message: string }) =>
    fetchJson<Pick<ProjectFile, 'id' | 'file_path' | 'branch' | 'last_commit_message'>>(`${API_URL}/projects/${projectId}/repository/files/${filePath}`, { method: 'POST', body: JSON.stringify(data) }),
  updateRepositoryFile: (projectId: number, filePath: string, data: { content: string; branch?: string; commit_message: string }) =>
    fetchJson<Pick<ProjectFile, 'id' | 'file_path' | 'branch' | 'last_commit_message'>>(`${API_URL}/projects/${projectId}/repository/files/${filePath}`, { method: 'PUT', body: JSON.stringify(data) }),
  getProjectReadme: async (projectId: number, branch = 'main'): Promise<ProjectFile | null> => {
    const candidates = ['README.md', 'Readme.md', 'README.rst', 'docs/README.md'];
    for (const candidate of candidates) {
      try {
        return await api.getRepositoryFile(projectId, candidate, branch);
      } catch {
        // try next path
      }
    }
    return null;
  },

  getGroups: async () => {
    const response = await fetchJson<{ groups: Group[] }>(`${API_URL}/groups`);
    return { groups: response.groups };
  },
  getGroup: (groupId: number) => fetchJson<Group>(`${API_URL}/groups/${groupId}`),
  createGroup: (data: { name: string; path: string; description?: string; visibility_level?: number }) =>
    fetchJson<Group>(`${API_URL}/groups`, { method: 'POST', body: JSON.stringify(data) }),
  updateGroup: (groupId: number, data: { name?: string; path?: string; description?: string; visibility_level?: number }) =>
    fetchJson<Group>(`${API_URL}/groups/${groupId}`, { method: 'PUT', body: JSON.stringify(data) }),
  listGroupMembers: async (groupId: number) => {
    const response = await fetchJson<{ members: Record<string, unknown>[] }>(`${API_URL}/groups/${groupId}/members`);
    return { members: response.members.map(normalizeMember) };
  },
  addGroupMember: async (groupId: number, data: { user_id: number; access_level: number; expires_at?: string | null }) =>
    normalizeMember(await fetchJson<Record<string, unknown>>(`${API_URL}/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify(data) })),
  listGroupProjects: async (groupId: number) => {
    const response = await fetchJson<{ projects: Record<string, unknown>[] }>(`${API_URL}/groups/${groupId}/projects`);
    return { projects: response.projects.map(normalizeProject) };
  },

  listTodos: async (params: { state?: string; page?: number; limit?: number } = {}): Promise<PaginatedTodos> => {
    const response = await fetchJson<PaginatedTodos & { todos: Record<string, unknown>[] }>(`${API_URL}/todos${queryString(params)}`);
    return { ...response, todos: response.todos.map(normalizeTodo) };
  },
  markTodoDone: async (todoId: number) => normalizeTodo(await fetchJson<Record<string, unknown>>(`${API_URL}/todos/${todoId}/mark_done`, { method: 'POST' })),
  markAllTodosDone: ( ) => fetchJson<{ updated: number }>(`${API_URL}/todos/mark_all_done`, { method: 'POST' }),

  dashboardIssues: async () => {
    const response = await fetchJson<{ issues: Record<string, unknown>[] }>(`${API_URL}/dashboard/issues`);
    return { issues: response.issues.map(normalizeIssue) };
  },
  dashboardMergeRequests: async () => {
    const response = await fetchJson<{ merge_requests: Record<string, unknown>[] }>(`${API_URL}/dashboard/merge_requests`);
    return { merge_requests: response.merge_requests.map(normalizeMergeRequest) };
  },
  dashboardProjects: async () => {
    const response = await fetchJson<{ projects: Record<string, unknown>[] }>(`${API_URL}/dashboard/projects`);
    return { projects: response.projects.map(normalizeProject) };
  },

  search: async (q: string, scope?: string): Promise<SearchResults> => {
    const response = await fetchJson<SearchResults & {
      projects?: Record<string, unknown>[];
      issues?: Record<string, unknown>[];
      merge_requests?: Record<string, unknown>[];
    }>(`${API_URL}/search${queryString({ q, scope })}`);
    return {
      ...response,
      projects: response.projects?.map(normalizeProject),
      issues: response.issues?.map(normalizeIssue),
      merge_requests: response.merge_requests?.map(normalizeMergeRequest),
    };
  },

  adminReset: () => fetchJson<{ ok: boolean }>(`${API_URL}/admin/reset`, { method: 'POST' }),
  adminDb: () => fetchJson<{ users: number; namespaces: number; projects: number; issues: number; merge_requests: number; notes: number; todos: number }>(`${API_URL}/admin/db`),
  adminEval: () => fetchJson<{ status: string; project_count: number; issue_count: number; merge_request_count: number; popular_projects: Record<string, unknown>[] }>(`${API_URL}/admin/eval`),
  getStats: async (): Promise<Stats> => {
    const [db, dashboardProjects, todos] = await Promise.all([
      api.adminDb(),
      api.dashboardProjects(),
      api.listTodos({ limit: 100 }),
    ]);
    return {
      total_projects: db.projects,
      total_issues: db.issues,
      total_merge_requests: db.merge_requests,
      user_projects: dashboardProjects.projects.length,
      user_todos: todos.total,
    };
  },
};
