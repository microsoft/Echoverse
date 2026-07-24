import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { Avatar, EmptyState, Loader, PageTitle, SectionCard } from '../echoforge-ui';
import { useResolvedProject } from '../hooks/useResolvedProject';
import type { Member } from '../types';
import { memberDisplayName, memberUsername } from '../utils';

const levels = [
  { value: 10, label: 'Guest' },
  { value: 20, label: 'Reporter' },
  { value: 30, label: 'Developer' },
  { value: 40, label: 'Maintainer' },
  { value: 50, label: 'Owner' },
];

const accessLevelNames: Record<number, string> = {
  10: 'Guest',
  20: 'Reporter',
  30: 'Developer',
  40: 'Maintainer',
  50: 'Owner',
};

export function MemberList({ addToast }: { addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const { namespace, project: projectPath } = useParams();
  const { project, loading: projectLoading, error: projectError, refresh } = useResolvedProject(namespace, projectPath);
  const [members, setMembers] = useState<Member[]>([]);
  const [username, setUsername] = useState('');
  const [accessLevel, setAccessLevel] = useState('30');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    if (!project) return;
    setLoading(true);
    setLoadError(null);
    try {
      const response = await api.listProjectMembers(project.id);
      setMembers(response.members);
    } catch (err) {
      setMembers([]);
      setLoadError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [project]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project || !username.trim()) return;
    try {
      const user = await api.getUserByUsername(username.trim());
      const member = await api.addProjectMember(project.id, { user_id: user.id, access_level: Number(accessLevel) });
      setMembers((current) => [...current.filter((entry) => entry.user_id !== member.user_id), member]);
      setUsername('');
      addToast(`Added ${user.username} to project`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to add member', 'error');
    }
  };

  if (projectLoading) return <Loader label="Loading project…" />;
  if (projectError || !project) return <EmptyState title="Project not found" description={projectError ?? 'This project could not be resolved.'} action={<button className="gl-button btn btn-default" type="button" onClick={() => void refresh()}>Try again</button>} />;
  if (loading) return <Loader label="Loading members…" />;
  if (loadError) return <EmptyState title="Members unavailable" description={loadError} action={<button className="gl-button btn btn-default" type="button" onClick={() => void load()}>Retry</button>} />;

  return (
    <div>
      <PageTitle title="Members" description={`${project.name} collaborators`} />
      <SectionCard className="form-card page-section">
        <div className="card-header"><h3>Invite member</h3></div>
        <div className="card-body">
          <form onSubmit={submit} className="three-column-grid">
            <div className="field-group"><label className="field-label">Username</label><input className="gl-form-input" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="username" required /></div>
            <div className="field-group"><label className="field-label">Role</label><select className="gl-form-select" value={accessLevel} onChange={(event) => setAccessLevel(event.target.value)}>{levels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}</select></div>
            <div className="field-group" style={{ alignSelf: 'end' }}><button className="gl-button btn btn-success">Add member</button></div>
          </form>
        </div>
      </SectionCard>
      <SectionCard className="list-card">
        {members.length ? (
          <ul className="content-list issuable-list">
            {members.map((member) => (
              <li key={member.id} className="gl2-member-row">
                <div className="issuable-main-info">
                  <div className="gl2-member-title">
                    <Avatar name={memberDisplayName(member)} url={member.user?.avatar_url} size={40} />
                    <span>
                      <strong>{memberDisplayName(member)}</strong>
                      <span className="gl2-context-subtitle">@{memberUsername(member)}</span>
                    </span>
                  </div>
                </div>
                <div className="issuable-meta"><span className="gl-badge gl2-access-badge">{accessLevelNames[member.access_level] ?? member.access_level_name}</span></div>
              </li>
            ))}
          </ul>
        ) : <EmptyState title="No members yet" description="Add collaborators by username to start sharing access to this project." />}
      </SectionCard>
    </div>
  );
}
