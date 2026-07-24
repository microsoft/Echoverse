import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { CountPill, EmptyState, LabelPill, Loader, PageTitle, SectionCard } from '../echoforge-ui';
import { useResolvedProject } from '../hooks/useResolvedProject';
import type { Issue, Label } from '../types';

export function LabelList({ addToast }: { addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const { namespace, project: projectPath } = useParams();
  const { project, loading: projectLoading, error: projectError, refresh } = useResolvedProject(namespace, projectPath);
  const [labels, setLabels] = useState<Label[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', color: '#FC6D26', description: '' });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    if (!project) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [labelResponse, issueResponse] = await Promise.all([
        api.listLabels(project.id),
        api.listIssues(project.id, { limit: 10000 }),
      ]);
      setLabels(labelResponse.labels);
      setIssues(issueResponse.issues);
    } catch (err) {
      setLabels([]);
      setIssues([]);
      setLoadError(err instanceof Error ? err.message : 'Failed to load labels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [project]);

  const usage = useMemo(() => {
    const counts = new Map<number, number>();
    issues.forEach((issue) => {
      issue.labels.forEach((label) => counts.set(label.id, (counts.get(label.id) ?? 0) + 1));
    });
    return counts;
  }, [issues]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) return;
    try {
      const label = editingId ? await api.updateLabel(project.id, editingId, form) : await api.createLabel(project.id, form);
      setLabels((current) => [...current.filter((item) => item.id !== label.id), label]);
      setEditingId(null);
      setForm({ title: '', color: '#FC6D26', description: '' });
      addToast(editingId ? 'Label updated' : 'Label created', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to save label', 'error');
    }
  };

  const edit = (label: Label) => {
    setEditingId(label.id);
    setForm({ title: label.title, color: label.color, description: label.description ?? '' });
  };

  if (projectLoading) return <Loader label="Loading project…" />;
  if (projectError || !project) return <EmptyState title="Project not found" description={projectError ?? 'This project could not be resolved.'} action={<button className="gl-button btn btn-default" type="button" onClick={() => void refresh()}>Try again</button>} />;
  if (loading) return <Loader label="Loading labels…" />;
  if (loadError) return <EmptyState title="Labels unavailable" description={loadError} action={<button className="gl-button btn btn-default" type="button" onClick={() => void load()}>Retry</button>} />;

  return (
    <div>
      <PageTitle title="Labels" description={`${project.name} labels`} />
      <SectionCard className="form-card page-section">
        <div className="card-header"><h3>{editingId ? 'Edit label' : 'New label'}</h3></div>
        <div className="card-body">
          <form onSubmit={save} className="three-column-grid">
            <div className="field-group"><label className="field-label">Name</label><input className="gl-form-input" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required /></div>
            <div className="field-group"><label className="field-label">Color</label><input className="gl-form-input" type="color" value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} /></div>
            <div className="field-group"><label className="field-label">Description</label><input className="gl-form-input" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></div>
            <div className="inline-actions"><button className="gl-button btn btn-success">{editingId ? 'Update label' : 'Create label'}</button></div>
          </form>
        </div>
      </SectionCard>
      <SectionCard className="list-card gl2-label-list">
        {labels.length ? (
          <ul className="content-list issuable-list">
            {labels.map((label) => (
              <li key={label.id} className="gl2-label-row-item">
                <div className="issuable-main-info">
                  <div className="gl2-label-heading">
                    <span className="gl2-label-swatch" style={{ backgroundColor: label.color }} />
                    <LabelPill label={label} />
                    <span className="gl-badge badge-muted"><CountPill value={usage.get(label.id) ?? 0} /> issues</span>
                  </div>
                  <div className="issuable-description">{label.description || 'No description provided.'}</div>
                </div>
                <div className="issuable-meta"><button type="button" className="gl-button btn btn-default" onClick={() => edit(label)}>Edit</button></div>
              </li>
            ))}
          </ul>
        ) : <EmptyState title="No labels yet" description="Create labels to organize issues and merge requests." />}
      </SectionCard>
    </div>
  );
}
