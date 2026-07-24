import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { CountPill, EmptyState, Loader, PageTitle, SectionCard, VisibilityBadge } from '../echoforge-ui';
import type { Project, User } from '../types';
import { formatCount, relativeTime } from '../utils';

export function ProjectList({ currentUser }: { currentUser: User | null }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get('search') ?? '');
  const [reloadKey, setReloadKey] = useState(0);
  const sort = searchParams.get('sort') ?? 'updated_desc';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await api.listProjects({
          limit: 100,
          search: query || undefined,
          sort,
        });
        setProjects(response.projects);
      } catch (err) {
        setProjects([]);
        setLoadError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [query, reloadKey, sort]);

  if (loading) return <Loader label="Loading projects…" />;
  if (loadError) return <EmptyState title="Projects unavailable" description={loadError} action={<button className="gl-button btn btn-default" type="button" onClick={() => setReloadKey((value) => value + 1)}>Retry</button>} />;

  return (
    <div>
      <PageTitle title="Projects" controls={<Link to="/projects/new" className="gl-button btn btn-confirm">New project</Link>} />

      <div className="top-area">
        <ul className="nav gl-tabs-nav">
          <li className="nav-item"><Link to="/projects" className="nav-link gl-tab-nav-item gl-tab-nav-item-active">All <CountPill value={projects.length} /></Link></li>
          <li className="nav-item"><Link to="/" className="nav-link gl-tab-nav-item">Personal</Link></li>
        </ul>
        <div className="nav-controls">
          <input className="form-control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by name" />
          <select className="gl-form-select" value={sort} onChange={(event) => setSearchParams((current) => {
            const next = new URLSearchParams(current);
            next.set('sort', event.target.value);
            return next;
          })}>
            <option value="updated_desc">Updated date</option>
            <option value="created_desc">Last created</option>
            <option value="name_asc">Name</option>
            <option value="stars_desc">Most stars</option>
          </select>
        </div>
      </div>

      <SectionCard className="list-card">
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
                    {currentUser?.username === project.namespace_path ? <span className="gl-badge" style={{ marginLeft: '0.55rem' }}>Owner</span> : null}
                  </div>
                  <div className="project-description">{project.description ?? 'No description provided.'}</div>
                  <div className="project-meta-list">
                    <Link className="meta-link" to={`/${project.full_path}/-/issues`}>Issues</Link>
                    <Link className="meta-link" to={`/${project.full_path}/-/merge_requests`}>Merge requests</Link>
                    <span className="meta-link">Updated {relativeTime(project.last_activity_at ?? project.updated_at)}</span>
                  </div>
                </div>
                <div className="project-cell">
                  <div className="project-controls">
                    <div className="project-meta-list">
                      <span className="meta-link">★ {formatCount(project.star_count)}</span>
                      <span className="meta-link">⑂ {formatCount(project.forks_count)}</span>
                    </div>
                    <div className="updated-note">Default branch {project.default_branch}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No projects match your filter" description="Try a different search term or create a new project." action={<Link to="/projects/new" className="gl-button btn btn-confirm">Create project</Link>} />
        )}
      </SectionCard>
    </div>
  );
}
