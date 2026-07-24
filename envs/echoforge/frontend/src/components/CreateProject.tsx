import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { PageTitle, SectionCard } from '../echoforge-ui';
import type { Group, Project, User } from '../types';
import { getProjectPath } from '../utils';

interface NamespaceOption {
  id: number;
  label: string;
  helper: string;
}

export function CreateProject({ currentUser, addToast }: { currentUser: User | null; addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [namespaces, setNamespaces] = useState<NamespaceOption[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('20');
  const [initializeWithReadme, setInitializeWithReadme] = useState(true);
  const [namespaceId, setNamespaceId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        const [allProjects, groups] = await Promise.all([api.listProjects({ limit: 200 }), api.getGroups()]);
        const options: NamespaceOption[] = [];
        const seen = new Set<number>();
        const userNamespace = allProjects.projects.find((project) => project.namespace?.path === currentUser.username)?.namespace;
        if (userNamespace) {
          options.push({ id: userNamespace.id, label: userNamespace.name, helper: `Personal namespace • @${currentUser.username}` });
          seen.add(userNamespace.id);
        } else {
          options.push({ id: currentUser.id, label: currentUser.username, helper: 'Personal namespace fallback' });
          seen.add(currentUser.id);
        }
        groups.groups.forEach((group: Group) => {
          if (!seen.has(group.id)) options.push({ id: group.id, label: group.name, helper: 'Group namespace' });
        });
        setNamespaces(options);
        setNamespaceId(String(options[0]?.id ?? currentUser.id));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [currentUser]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const project: Project = await api.createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        namespace_id: Number(namespaceId),
        visibility_level: Number(visibility),
        initialize_with_readme: initializeWithReadme,
      });
      addToast(`Created ${project.name}`, 'success');
      navigate(getProjectPath(project));
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to create project', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageTitle title="New project" description="Create a new project/repository with a namespace, visibility level, and optional README." />
      <SectionCard className="form-card">
        <div className="card-body">
          {loading ? <p>Loading namespaces…</p> : null}
          {!currentUser ? <p>Please sign in to create a project.</p> : null}
          {currentUser ? (
            <form onSubmit={submit} className="form-grid">
              <div className="field-group">
                <label className="field-label">Project name</label>
                <input className="gl-form-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. synthetic-runner" required />
              </div>
              <div className="field-group">
                <label className="field-label">Project description</label>
                <textarea className="gl-form-textarea" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What is this project about?" />
              </div>
              <div className="two-column-grid">
                <div className="field-group">
                  <label className="field-label">Project URL</label>
                  <select className="gl-form-select" value={namespaceId} onChange={(event) => setNamespaceId(event.target.value)}>
                    {namespaces.map((namespace) => <option key={namespace.id} value={namespace.id}>{namespace.label} — {namespace.helper}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Visibility level</label>
                  <select className="gl-form-select" value={visibility} onChange={(event) => setVisibility(event.target.value)}>
                    <option value="0">Private</option>
                    <option value="20">Internal</option>
                    <option value="30">Public</option>
                  </select>
                </div>
              </div>
              <label className="inline-checkbox">
                <input type="checkbox" checked={initializeWithReadme} onChange={(event) => setInitializeWithReadme(event.target.checked)} />
                Initialize repository with a README
              </label>
              <div className="inline-actions">
                <button disabled={submitting || loading} className="gl-button btn btn-success">{submitting ? 'Creating project…' : 'Create project'}</button>
                <button type="button" className="gl-button btn btn-default" onClick={() => navigate(-1)}>Cancel</button>
              </div>
            </form>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
