import { useEffect, useState } from 'react';
import { api } from '../api';
import { EmptyState, Loader, PageTitle, SectionCard, VisibilityBadge } from '../echoforge-ui';
import type { Group } from '../types';

export function GroupList() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getGroups();
        const fullGroups = await Promise.all(response.groups.map((group) => api.getGroup(group.id)));
        setGroups(fullGroups);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load groups');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) return <Loader label="Loading groups…" />;
  if (error) return <EmptyState title="Groups unavailable" description={error} />;

  return (
    <div>
      <PageTitle title="Groups" description="Browse shared namespaces and their project spaces." />
      <div className="split-panels">
        {groups.length ? groups.map((group) => (
          <SectionCard key={group.id} className="group-card">
            <div className="card-body">
              <div className="top-area" style={{ marginBottom: '0.5rem' }}>
                <h3>{group.name}</h3>
                <VisibilityBadge level={group.visibility_level} />
              </div>
              <div className="project-description">/{group.path}</div>
              <div className="project-description">{group.description ?? 'No group description yet.'}</div>
              <div className="project-meta-list"><span>{group.projects_count ?? 0} projects</span><span>{group.members_count ?? 0} members</span></div>
            </div>
          </SectionCard>
        )) : <EmptyState title="No groups available" description="Create or seed a group namespace to start collaborating." />}
      </div>
    </div>
  );
}
