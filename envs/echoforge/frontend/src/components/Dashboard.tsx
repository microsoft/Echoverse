import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { CountPill, EmptyState, Icon, Loader, PageTitle, SectionCard, VisibilityBadge } from '../echoforge-ui';
import type { Issue, MergeRequest, Project, Stats, Todo, User } from '../types';
import { formatCount, getProjectPath, relativeTime } from '../utils';

export function Dashboard({ currentUser }: { currentUser: User | null }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [mergeRequests, setMergeRequests] = useState<MergeRequest[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todoTotal, setTodoTotal] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [projectResponse, statsResponse, issueResponse, mergeRequestResponse, todoResponse] = await Promise.allSettled([
          api.dashboardProjects(),
          api.getStats(),
          api.dashboardIssues(),
          api.dashboardMergeRequests(),
          api.listTodos({ state: 'pending', limit: 20 }),
        ]);
        // Degrade gracefully: a single failing/slow widget must not blank the whole
        // dashboard (that stranded agents on the landing page under load).
        if (projectResponse.status === 'fulfilled') setProjects(projectResponse.value.projects);
        if (statsResponse.status === 'fulfilled') setStats(statsResponse.value);
        if (issueResponse.status === 'fulfilled') setIssues(issueResponse.value.issues.filter((issue) => issue.state === 'opened'));
        if (mergeRequestResponse.status === 'fulfilled') setMergeRequests(mergeRequestResponse.value.merge_requests);
        if (todoResponse.status === 'fulfilled') { setTodos(todoResponse.value.todos); setTodoTotal(todoResponse.value.total); }
        // Only treat the page as unavailable if the core project list itself failed.
        if (projectResponse.status === 'rejected') {
          setError(projectResponse.reason instanceof Error ? projectResponse.reason.message : 'Failed to load dashboard');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) return <Loader label="Loading dashboard…" />;
  if (error) return <EmptyState title="Dashboard unavailable" description={error} action={<Link to="/projects" className="gl-button btn btn-default">Browse all projects</Link>} />;

  return (
    <div className="dashboard-layout gl2-your-work">
      <PageTitle
        title="Your work"
        controls={<Link to="/projects/new" className="gl-button btn btn-confirm">New project</Link>}
        description={currentUser ? `Welcome back, @${currentUser.username}` : 'Sign in to work with projects, issues, and merge requests.'}
      />

      <SectionCard className="gl2-welcome-panel">
        <h2>EchoForge work starts here</h2>
        <p>
          {currentUser
            ? 'Review your projects, assigned issues, merge requests, and to-dos from one grounded dashboard.'
            : 'Browse projects and sign in to manage work in the synthetic EchoForge workspace.'}
        </p>
      </SectionCard>

      {stats ? (
        <div className="metrics-grid">
          <SectionCard className="metric-card"><strong>{formatCount(stats.user_projects)}</strong><span>Your projects</span></SectionCard>
          <SectionCard className="metric-card"><strong>{formatCount(issues.length)}</strong><span>Assigned open issues</span></SectionCard>
          <SectionCard className="metric-card"><strong>{formatCount(mergeRequests.length)}</strong><span>Your merge requests</span></SectionCard>
          <SectionCard className="metric-card"><strong>{formatCount(todoTotal)}</strong><span>Pending todos</span></SectionCard>
        </div>
      ) : null}

      <div className="top-area">
        <ul className="nav gl-tabs-nav">
          <li className="nav-item"><Link to="/" className="nav-link gl-tab-nav-item gl-tab-nav-item-active">Projects <CountPill value={projects.length} /></Link></li>
          <li className="nav-item"><Link to="/projects" className="nav-link gl-tab-nav-item">Explore</Link></li>
          <li className="nav-item"><Link to="/dashboard/todos" className="nav-link gl-tab-nav-item">Todos <CountPill value={todoTotal} /></Link></li>
        </ul>
        <div className="nav-controls">
          <Link to="/projects" className="gl-button btn btn-default">View all projects</Link>
        </div>
      </div>

      <div className="gl2-work-grid">
        <SectionCard className="list-card">
          <div className="card-header"><h3>Projects</h3><CountPill value={projects.length} /></div>
          {projects.length ? (
            <ul className="projects-list list-unstyled">
              {projects.map((project) => (
                <li key={project.id} className="project-row">
                  <div className="project-cell">
                    <Link to={`/${project.full_path}`} className="project">
                      <span className="gl-avatar gl-avatar-fallback gl-avatar-square">{project.name[0]?.toUpperCase()}</span>
                    </Link>
                  </div>
                  <div className="project-cell project-details">
                    <div>
                      <Link to={`/${project.full_path}`} className="project-name-link">
                        <span className="namespace-name">{project.namespace?.name ?? project.namespace_path} / </span>
                        <span className="project-name">{project.name}</span>
                      </Link>
                      <span style={{ marginLeft: '0.55rem' }}><VisibilityBadge level={project.visibility_level} /></span>
                    </div>
                    <div className="project-description">{project.description ?? 'No description provided.'}</div>
                    <div className="project-meta-list">
                      <span className="meta-link">★ {formatCount(project.star_count)}</span>
                      <span className="meta-link">⑂ {formatCount(project.forks_count)}</span>
                      <Link className="meta-link" to={`/${project.full_path}/-/issues`}>Issues</Link>
                      <Link className="meta-link" to={`/${project.full_path}/-/merge_requests`}>Merge requests</Link>
                    </div>
                  </div>
                  <div className="project-cell">
                    <div className="project-controls">
                      <div className="project-meta-list">
                        <span className="meta-link">Branch {project.default_branch}</span>
                      </div>
                      <div className="updated-note">Updated {relativeTime(project.last_activity_at ?? project.updated_at)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No projects yet" description="Create a new project to populate your dashboard like a real EchoForge home view." action={<Link to="/projects/new" className="gl-button btn btn-confirm">Create project</Link>} />
          )}
        </SectionCard>

        <div className="dashboard-layout">
          <SectionCard className="list-card">
            <div className="card-header"><h3>Assigned open issues</h3><CountPill value={issues.length} /></div>
            {issues.length ? (
              <ul className="gl2-compact-list">
                {issues.slice(0, 5).map((issue) => (
                  <li key={issue.id}>
                    <div className="gl2-compact-title"><Link to={`${issue.project ? getProjectPath(issue.project) : ''}/-/issues/${issue.iid}`}>#{issue.iid} {issue.title}</Link></div>
                    <div className="gl2-compact-meta">{issue.project?.full_path ?? 'Project'} · updated {relativeTime(issue.updated_at)}</div>
                  </li>
                ))}
              </ul>
            ) : <div className="card-body">No assigned open issues.</div>}
          </SectionCard>

          <SectionCard className="list-card">
            <div className="card-header"><h3>Merge requests</h3><CountPill value={mergeRequests.length} /></div>
            {mergeRequests.length ? (
              <ul className="gl2-compact-list">
                {mergeRequests.slice(0, 5).map((mergeRequest) => (
                  <li key={mergeRequest.id}>
                    <div className="gl2-compact-title"><Link to={`${mergeRequest.project ? getProjectPath(mergeRequest.project) : ''}/-/merge_requests/${mergeRequest.iid}`}>!{mergeRequest.iid} {mergeRequest.title}</Link></div>
                    <div className="gl2-compact-meta">{mergeRequest.source_branch} → {mergeRequest.target_branch} · {mergeRequest.state}</div>
                  </li>
                ))}
              </ul>
            ) : <div className="card-body">No merge requests assigned to or authored by you.</div>}
          </SectionCard>

          <SectionCard className="list-card">
            <div className="card-header"><h3>To-dos</h3><CountPill value={todoTotal} /></div>
            {todos.length ? (
              <ul className="gl2-compact-list">
                {todos.slice(0, 5).map((todo) => (
                  <li key={todo.id}>
                    <div className="gl2-compact-title"><Icon name="todo" className="tiny-icon" /> {todo.body ?? `${todo.action} ${todo.target_type}`}</div>
                    <div className="gl2-compact-meta">{todo.project?.full_path ?? todo.project_name} · {relativeTime(todo.created_at)}</div>
                  </li>
                ))}
              </ul>
            ) : <div className="card-body">No pending to-dos.</div>}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
