import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { EmptyState, LabelPill, Loader, PageTitle, SectionCard } from '../echoforge-ui';
import { useResolvedProject } from '../hooks/useResolvedProject';
import type { Label, Member, Milestone } from '../types';
import { getProjectPath, memberDisplayName } from '../utils';

export function CreateIssue({ addToast }: { addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const navigate = useNavigate();
  const { namespace, project: projectPath } = useParams();
  const { project, loading, error, refresh } = useResolvedProject(namespace, projectPath);
  const [members, setMembers] = useState<Member[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [form, setForm] = useState({ title: '', description: '', assignee_id: '', milestone_id: '', due_date: '', labels: [] as number[] });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!project) return;
      const [memberRes, milestoneRes, labelRes] = await Promise.all([
        api.listProjectMembers(project.id),
        api.listMilestones(project.id),
        api.listLabels(project.id),
      ]);
      setMembers(memberRes.members);
      setMilestones(milestoneRes.milestones);
      setLabels(labelRes.labels);
    };
    void load();
  }, [project]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) return;
    setSubmitting(true);
    try {
      const issue = await api.createIssue(project.id, {
        title: form.title,
        description: form.description || undefined,
        assignee_id: form.assignee_id ? Number(form.assignee_id) : undefined,
        milestone_id: form.milestone_id ? Number(form.milestone_id) : undefined,
        labels: form.labels,
        due_date: form.due_date || undefined,
      });
      addToast(`Created issue #${issue.iid}`, 'success');
      navigate(`${getProjectPath(project)}/-/issues/${issue.iid}`);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to create issue', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader label="Loading project…" />;
  if (error || !project) return <EmptyState title="Project not found" description={error ?? 'This project could not be resolved.'} action={<button className="gl-button btn btn-default" type="button" onClick={() => void refresh()}>Try again</button>} />;

  return (
    <div>
      <PageTitle title="New issue" description={`Create an issue in ${project.name}`} />
      <SectionCard className="form-card">
        <div className="card-body">
          <form onSubmit={submit} className="form-grid">
            <div className="field-group">
              <label className="field-label">Title</label>
              <input className="gl-form-input" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
            </div>
            <div className="field-group">
              <label className="field-label">Description</label>
              <textarea className="gl-form-textarea" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </div>
            <div className="two-column-grid">
              <div className="field-group">
                <label className="field-label">Assignee</label>
                <select className="gl-form-select" value={form.assignee_id} onChange={(event) => setForm((current) => ({ ...current, assignee_id: event.target.value }))}>
                  <option value="">Unassigned</option>
                  {members.map((member) => <option key={member.id} value={member.user_id}>{memberDisplayName(member)}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Milestone</label>
                <select className="gl-form-select" value={form.milestone_id} onChange={(event) => setForm((current) => ({ ...current, milestone_id: event.target.value }))}>
                  <option value="">No milestone</option>
                  {milestones.map((milestone) => <option key={milestone.id} value={milestone.id}>{milestone.title}</option>)}
                </select>
              </div>
            </div>
            <div className="two-column-grid">
              <div className="field-group">
                <label className="field-label">Labels</label>
                <div className="project-topics">
                  {labels.map((label) => {
                    const active = form.labels.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        type="button"
                        className="gl-button btn btn-default"
                        onClick={() => setForm((current) => ({
                          ...current,
                          labels: active ? current.labels.filter((item) => item !== label.id) : [...current.labels, label.id],
                        }))}
                      >
                        <LabelPill label={label} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Due date</label>
                <input type="date" className="gl-form-input" value={form.due_date} onChange={(event) => setForm((current) => ({ ...current, due_date: event.target.value }))} />
              </div>
            </div>
            <div className="inline-actions">
              <button disabled={submitting} className="gl-button btn btn-success">{submitting ? 'Creating issue…' : 'Create issue'}</button>
              <button type="button" className="gl-button btn btn-default" onClick={() => navigate(-1)}>Cancel</button>
            </div>
          </form>
        </div>
      </SectionCard>
    </div>
  );
}
