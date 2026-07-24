import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { Avatar, EmptyState, LabelPill, Loader, SectionCard } from '../echoforge-ui';
import { useResolvedProject } from '../hooks/useResolvedProject';
import type { Issue, Note } from '../types';
import { classNames, formatDateTime, getProjectPath, issueAuthor, relativeTime } from '../utils';

export function IssueDetail({ addToast }: { addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const { namespace, project: projectPath, iid } = useParams();
  const { project, loading: projectLoading, error: projectError, refresh } = useResolvedProject(namespace, projectPath);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteBody, setNoteBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editTitle, setEditTitle] = useState(false);
  const [titleVal, setTitleVal] = useState('');
  const [editAssignee, setEditAssignee] = useState(false);
  const [assigneeVal, setAssigneeVal] = useState('');
  const [editWeight, setEditWeight] = useState(false);
  const [weightVal, setWeightVal] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!project || !iid) return;
      setLoading(true);
      setLoadError(null);
      try {
        const [issueRes, noteRes] = await Promise.all([
          api.getIssue(project.id, Number(iid)),
          api.listIssueNotes(project.id, Number(iid)),
        ]);
        setIssue(issueRes);
        setNotes(noteRes.notes);
      } catch (err) {
        setIssue(null);
        setLoadError(err instanceof Error ? err.message : 'Failed to load issue');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [iid, project]);

  const submitNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project || !iid || !noteBody.trim()) return;
    try {
      const note = await api.createIssueNote(project.id, Number(iid), noteBody.trim());
      setNotes((current) => [...current, note]);
      setNoteBody('');
      addToast('Comment added', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to add comment', 'error');
    }
  };

  const toggleState = async () => {
    if (!project || !issue || !iid) return;
    const next = issue.state === 'closed' ? 'opened' : 'closed';
    setBusy(true);
    try {
      const updated = await api.updateIssue(project.id, Number(iid), { state: next });
      setIssue(updated);
      addToast(next === 'closed' ? 'Issue closed' : 'Issue reopened', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update issue', 'error');
    } finally {
      setBusy(false);
    }
  };

  const saveTitle = async () => {
    if (!project || !issue || !iid || !titleVal.trim()) return;
    setBusy(true);
    try {
      const updated = await api.updateIssue(project.id, Number(iid), { title: titleVal.trim() });
      setIssue(updated); setEditTitle(false); addToast('Title updated', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update title', 'error');
    } finally { setBusy(false); }
  };

  const saveAssignee = async () => {
    if (!project || !issue || !iid) return;
    setBusy(true);
    try {
      const uname = assigneeVal.trim().replace(/^@/, '');
      let assignee_id: number | null = null;
      if (uname) { const u = await api.getUserByUsername(uname); assignee_id = u.id; }
      const updated = await api.updateIssue(project.id, Number(iid), { assignee_id });
      setIssue(updated); setEditAssignee(false); addToast('Assignee updated', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update assignee', 'error');
    } finally { setBusy(false); }
  };

  const saveWeight = async () => {
    if (!project || !issue || !iid) return;
    setBusy(true);
    try {
      const weight = weightVal.trim() === '' ? null : Number(weightVal);
      const updated = await api.updateIssue(project.id, Number(iid), { weight });
      setIssue(updated); setEditWeight(false); addToast('Weight updated', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update weight', 'error');
    } finally { setBusy(false); }
  };

  if (projectLoading) return <Loader label="Loading project…" />;
  if (projectError || !project) return <EmptyState title="Project not found" description={projectError ?? 'This project could not be resolved.'} action={<button className="gl-button btn btn-default" type="button" onClick={() => void refresh()}>Try again</button>} />;
  if (loading) return <Loader label="Loading issue…" />;
  if (loadError || !issue) return <EmptyState title="Issue unavailable" description={loadError ?? 'This issue could not be loaded.'} action={<Link to={`${getProjectPath(project)}/-/issues`} className="gl-button btn btn-default">Back to issues</Link>} />;

  const closed = issue.state === 'closed';

  return (
    <div className="issuable-detail-layout">
      <SectionCard className="gl2-issuable-header">
        <div className="gl2-issuable-title-row">
          <div>
            <div className="gl2-meta-row">Opened {relativeTime(issue.created_at)} by @{issueAuthor(issue)}</div>
            {editTitle ? (
              <span className="gl2-inline-edit">
                <input className="gl-form-input form-control" value={titleVal} onChange={(e) => setTitleVal(e.target.value)} data-testid="issue-title-input" />
                <button type="button" className="gl-button btn btn-confirm btn-sm" disabled={busy} onClick={() => void saveTitle()} data-testid="issue-title-save">Save</button>
                <button type="button" className="gl-button btn btn-default btn-sm" onClick={() => setEditTitle(false)}>Cancel</button>
              </span>
            ) : (
              <h1 className="gl2-issuable-title">{issue.title} <span className="gl2-reference">#{issue.iid}</span> <button type="button" className="gl-button btn btn-default btn-sm gl2-edit-btn" data-testid="issue-title-edit" onClick={() => { setTitleVal(issue.title); setEditTitle(true); }}>Edit title</button></h1>
            )}
          </div>
          <span className={classNames('gl2-status-pill', closed ? 'gl2-status-closed' : 'gl2-status-open')}>{closed ? 'Closed' : 'Open'}</span>
          <button
            type="button"
            className={classNames('gl-button', 'btn', closed ? 'btn-default' : 'btn-warning', 'gl2-issue-state-btn')}
            data-qa-selector="issue_state_toggle"
            disabled={busy}
            onClick={() => void toggleState()}
          >
            {busy ? 'Working…' : closed ? 'Reopen issue' : 'Close issue'}
          </button>
        </div>
      </SectionCard>

      <div className="detail-layout">
        <div>
          <SectionCard className="issue-detail-card page-section">
            <div className="card-body">
              {issue.labels.length ? <div className="gl2-label-row">{issue.labels.map((label) => <LabelPill key={label.id} label={label} />)}</div> : null}
              <div className="gl2-description-box">{issue.description ?? 'No description provided.'}</div>
            </div>
          </SectionCard>

          <SectionCard className="notes-card">
            <div className="card-header"><h3>Activity</h3><span>{notes.length} notes</span></div>
            {notes.length ? (
              <ul className="note-list">
                {notes.map((note) => (
                  <li key={note.id} className={classNames('note-item', note.system && 'system-note')}>
                    {note.system ? <span className="gl2-state-icon gl2-state-closed">✓</span> : <Avatar name={note.author?.name ?? note.author_username} url={note.author?.avatar_url} size={32} />}
                    <div>
                      <div className="note-meta"><strong>{note.author?.name ?? note.author_username}</strong><span>{formatDateTime(note.created_at)}</span>{note.system ? <span className="gl-badge">system</span> : null}</div>
                      <div className="note-body">{note.body}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <div className="card-body">No activity yet.</div>}
            <form className="note-form" onSubmit={submitNote}>
              <textarea className="gl-form-textarea" value={noteBody} onChange={(event) => setNoteBody(event.target.value)} placeholder="Write a comment…" />
              <div className="inline-actions">
                <button className="gl-button btn btn-success">Comment</button>
                <Link to={`${getProjectPath(project)}/-/issues`} className="gl-button btn btn-default">Back to issues</Link>
              </div>
            </form>
          </SectionCard>
        </div>

        <SectionCard className="project-sidebar-card gl2-metadata-sidebar">
          <div className="card-header"><h3>Issue details</h3></div>
          <div className="card-body">
            <dl>
              <dt>Assignee</dt><dd>{editAssignee ? (
                <span className="gl2-inline-edit">
                  <input className="gl-form-input form-control" placeholder="username" value={assigneeVal} onChange={(e) => setAssigneeVal(e.target.value)} data-testid="assignee-input" />
                  <button type="button" className="gl-button btn btn-confirm btn-sm" disabled={busy} onClick={() => void saveAssignee()} data-testid="assignee-save">Save</button>
                  <button type="button" className="gl-button btn btn-default btn-sm" onClick={() => setEditAssignee(false)}>Cancel</button>
                </span>
              ) : (
                <span className="gl2-sidebar-value">{issue.assignee ? <><Avatar name={issue.assignee.name} url={issue.assignee.avatar_url} size={24} />{issue.assignee.name}</> : (issue.assignee_username ?? 'Unassigned')} <button type="button" className="gl-button btn btn-default btn-sm gl2-edit-btn" data-testid="assignee-edit" onClick={() => { setAssigneeVal(issue.assignee?.username ?? ''); setEditAssignee(true); }}>Edit</button></span>
              )}</dd>
              <dt>Labels</dt><dd>{issue.labels.length ? <span className="gl2-sidebar-value">{issue.labels.map((label) => <LabelPill key={label.id} label={label} />)}</span> : 'None'}</dd>
              <dt>Milestone</dt><dd>{issue.milestone?.title ?? 'None'}</dd>
              <dt>Due date</dt><dd>{issue.due_date ?? '—'}</dd>
              <dt>Weight</dt><dd>{editWeight ? (
                <span className="gl2-inline-edit">
                  <input type="number" className="gl-form-input form-control" value={weightVal} onChange={(e) => setWeightVal(e.target.value)} data-testid="weight-input" />
                  <button type="button" className="gl-button btn btn-confirm btn-sm" disabled={busy} onClick={() => void saveWeight()} data-testid="weight-save">Save</button>
                  <button type="button" className="gl-button btn btn-default btn-sm" onClick={() => setEditWeight(false)}>Cancel</button>
                </span>
              ) : (
                <span className="gl2-sidebar-value">{issue.weight ?? '—'} <button type="button" className="gl-button btn btn-default btn-sm gl2-edit-btn" data-testid="weight-edit" onClick={() => { setWeightVal(issue.weight != null ? String(issue.weight) : ''); setEditWeight(true); }}>Edit</button></span>
              )}</dd>
              <dt>Confidential</dt><dd>{issue.confidential ? 'Yes' : 'No'}</dd>
              <dt>Created</dt><dd>{formatDateTime(issue.created_at)}</dd>
              <dt>Updated</dt><dd>{formatDateTime(issue.updated_at)}</dd>
            </dl>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
