import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { CountPill, EmptyState, Loader, PageTitle, SectionCard } from '../echoforge-ui';
import { useResolvedProject } from '../hooks/useResolvedProject';
import type { Issue, Milestone } from '../types';
import { classNames, formatDate } from '../utils';

export function MilestoneList({ addToast }: { addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const { namespace, project: projectPath } = useParams();
  const { project, loading: projectLoading, error: projectError, refresh } = useResolvedProject(namespace, projectPath);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [form, setForm] = useState({ title: '', description: '', start_date: '', due_date: '' });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    if (!project) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [milestoneResponse, issueResponse] = await Promise.all([
        api.listMilestones(project.id),
        api.listIssues(project.id, { limit: 10000 }),
      ]);
      setMilestones(milestoneResponse.milestones);
      setIssues(issueResponse.issues);
    } catch (err) {
      setMilestones([]);
      setIssues([]);
      setLoadError(err instanceof Error ? err.message : 'Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [project]);

  const countsByMilestone = useMemo(() => {
    const counts = new Map<number, { opened: number; closed: number }>();
    issues.forEach((issue) => {
      if (!issue.milestone_id) return;
      const current = counts.get(issue.milestone_id) ?? { opened: 0, closed: 0 };
      if (issue.state === 'closed') current.closed += 1;
      else current.opened += 1;
      counts.set(issue.milestone_id, current);
    });
    return counts;
  }, [issues]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) return;
    try {
      const milestone = await api.createMilestone(project.id, {
        title: form.title,
        description: form.description || undefined,
        start_date: form.start_date || undefined,
        due_date: form.due_date || undefined,
      });
      setMilestones((current) => [...current, milestone]);
      setForm({ title: '', description: '', start_date: '', due_date: '' });
      addToast(`Created milestone ${milestone.title}`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to create milestone', 'error');
    }
  };

  if (projectLoading) return <Loader label="Loading project…" />;
  if (projectError || !project) return <EmptyState title="Project not found" description={projectError ?? 'This project could not be resolved.'} action={<button className="gl-button btn btn-default" type="button" onClick={() => void refresh()}>Try again</button>} />;
  if (loading) return <Loader label="Loading milestones…" />;
  if (loadError) return <EmptyState title="Milestones unavailable" description={loadError} action={<button className="gl-button btn btn-default" type="button" onClick={() => void load()}>Retry</button>} />;

  return (
    <div>
      <PageTitle title="Milestones" description={`${project.name} milestone planning`} />
      <SectionCard className="form-card page-section">
        <div className="card-header"><h3>New milestone</h3></div>
        <div className="card-body">
          <form onSubmit={submit} className="form-grid">
            <div className="two-column-grid">
              <div className="field-group">
                <label className="field-label">Title</label>
                <input className="gl-form-input" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
              </div>
              <div className="field-group">
                <label className="field-label">Start date</label>
                <input className="gl-form-input" type="date" value={form.start_date} onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))} />
              </div>
            </div>
            <div className="two-column-grid">
              <div className="field-group">
                <label className="field-label">Due date</label>
                <input className="gl-form-input" type="date" value={form.due_date} onChange={(event) => setForm((current) => ({ ...current, due_date: event.target.value }))} />
              </div>
              <div className="field-group">
                <label className="field-label">Description</label>
                <input className="gl-form-input" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </div>
            </div>
            <div className="inline-actions"><button className="gl-button btn btn-success">Create milestone</button></div>
          </form>
        </div>
      </SectionCard>
      <SectionCard className="list-card">
        {milestones.length ? (
          <ul className="content-list issuable-list">
            {milestones.map((milestone) => {
              const counts = countsByMilestone.get(milestone.id) ?? { opened: 0, closed: 0 };
              const total = counts.opened + counts.closed;
              const percent = total ? Math.round((counts.closed / total) * 100) : 0;
              return (
                <li key={milestone.id} className="gl2-milestone-row">
                  <div className="issuable-main-info">
                    <div className="issue-title title">{milestone.title}</div>
                    <div className="gl2-meta-row">
                      <MilestoneStatus state={milestone.state} />
                      <span>Start {formatDate(milestone.start_date)}</span>
                      <span>Due {formatDate(milestone.due_date)}</span>
                    </div>
                    <div className="issuable-description">{milestone.description || 'No description provided.'}</div>
                  </div>
                  <div className="gl2-progress-wrap">
                    <div className="gl2-progress-meta"><span>{percent}% complete</span><span><CountPill value={counts.opened} /> open · <CountPill value={counts.closed} /> closed</span></div>
                    <div className="gl2-progress-bar"><div className="gl2-progress-value" style={{ width: `${percent}%` }} /></div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <EmptyState title="No milestones yet" description="Create a milestone to start planning delivery dates." />}
      </SectionCard>
    </div>
  );
}

function MilestoneStatus({ state }: { state: string }) {
  const closed = state === 'closed';
  return <span className={classNames('gl2-status-pill', closed ? 'gl2-status-closed' : 'gl2-status-open')}>{closed ? 'Closed' : 'Active'}</span>;
}
