import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { Avatar, CountPill, EmptyState, Loader, SectionCard, VisibilityBadge } from '../echoforge-ui';
import type { Project, User } from '../types';
import { formatCount, relativeTime } from '../utils';

export function ProfilePage({ currentUser }: { currentUser: User | null }) {
  const { username } = useParams();
  const [viewUser, setViewUser] = useState<User | null>(username ? null : currentUser);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const target = username ?? currentUser?.username;
      if (!target) { setLoading(false); return; }
      setLoading(true);
      setLoadError(null);
      try {
        const user = username ? await api.getUserByUsername(username) : currentUser;
        setViewUser(user ?? null);
        const response = await api.getUserProjects(target);
        setProjects(response.projects);
      } catch (err) {
        setViewUser(null); setProjects([]);
        setLoadError(err instanceof Error ? err.message : 'Failed to load this user profile');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [username, currentUser]);

  const recentProjects = useMemo(() => [...projects].sort((a, b) => new Date(b.last_activity_at ?? b.updated_at).getTime() - new Date(a.last_activity_at ?? a.updated_at).getTime()).slice(0, 5), [projects]);

  if (loading) return <Loader label="Loading profile…" />;
  if (loadError || !viewUser) return <EmptyState title="Profile unavailable" description={loadError ?? 'This user profile could not be loaded.'} action={<Link to="/" className="gl-button btn btn-default">Go to dashboard</Link>} />;

  const isSelf = currentUser != null && viewUser.id === currentUser.id;

  return (
    <div>
      <SectionCard className="gl2-profile-hero page-section">
        <div className="gl2-profile-layout">
          <Avatar name={viewUser.name} url={viewUser.avatar_url} size={112} />
          <div>
            <h1 className="gl2-profile-name" data-testid="profile-name">{viewUser.name}</h1>
            <div className="gl2-profile-username" data-testid="profile-username">@{viewUser.username}</div>
            {viewUser.status_message ? <div className="gl2-profile-status"><span>{viewUser.status_emoji}</span><span>{viewUser.status_message}</span></div> : null}
            {viewUser.bio ? <p className="gl2-description">{viewUser.bio}</p> : null}
            <div className="gl2-profile-facts">
              {viewUser.location ? <span data-testid="profile-location">📍 {viewUser.location}</span> : null}
              {viewUser.organization ? <span data-testid="profile-organization">🏢 {viewUser.organization}</span> : null}
              {viewUser.website_url ? <a href={viewUser.website_url} target="_blank" rel="noreferrer">{viewUser.website_url}</a> : null}
            </div>
          </div>
          {isSelf ? <div className="gl2-project-actions"><Link to="/-/profile" className="gl-button btn btn-default">Edit profile</Link></div> : null}
        </div>
      </SectionCard>

      <div className="gl2-overview-grid">
        <SectionCard className="list-card">
          <div className="card-header"><h3>Projects</h3><CountPill value={projects.length} /></div>
          {projects.length ? (
            <ul className="projects-list list-unstyled">
              {projects.map((project) => (
                <li key={project.id} className="project-row">
                  <div className="project-cell"><span className="gl-avatar gl-avatar-fallback gl-avatar-square">{project.name[0]?.toUpperCase()}</span></div>
                  <div className="project-cell project-details">
                    <Link to={`/${project.full_path}`} className="project-name-link">{project.name}</Link>
                    <div className="project-description">{project.description ?? 'No description provided.'}</div>
                    <div className="project-meta-list"><VisibilityBadge level={project.visibility_level} /><span>★ {formatCount(project.star_count)}</span><span>⑂ {formatCount(project.forks_count)}</span></div>
                  </div>
                  <div className="project-cell updated-note">Updated {relativeTime(project.updated_at)}</div>
                </li>
              ))}
            </ul>
          ) : <div className="card-body">No visible projects yet.</div>}
        </SectionCard>

        <SectionCard className="profile-card">
          <div className="card-header"><h3>Activity</h3></div>
          {recentProjects.length ? (
            <ul className="gl2-activity-list">
              {recentProjects.map((project) => (
                <li key={project.id}>
                  <div className="gl2-compact-title"><Link to={`/${project.full_path}`}>{project.full_path}</Link></div>
                  <div className="gl2-compact-meta">Last project activity {relativeTime(project.last_activity_at ?? project.updated_at)}</div>
                </li>
              ))}
            </ul>
          ) : <div className="card-body">No project activity available.</div>}
        </SectionCard>
      </div>
    </div>
  );
}
