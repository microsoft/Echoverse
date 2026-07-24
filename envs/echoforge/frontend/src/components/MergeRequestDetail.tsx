import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { Avatar, EmptyState, Loader, SectionCard } from '../echoforge-ui';
import { useResolvedProject } from '../hooks/useResolvedProject';
import type { MergeRequest, Note } from '../types';
import { classNames, formatDateTime, getProjectPath, mrAuthor, relativeTime } from '../utils';

export function MergeRequestDetail({ addToast }: { addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const { namespace, project: projectPath, iid } = useParams();
  const { project, loading: projectLoading, error: projectError, refresh } = useResolvedProject(namespace, projectPath);
  const [mergeRequest, setMergeRequest] = useState<MergeRequest | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteBody, setNoteBody] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'changes'>('overview');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!project || !iid) return;
      setLoading(true);
      setLoadError(null);
      try {
        const [mergeRequestRes, noteRes] = await Promise.all([
          api.getMergeRequest(project.id, Number(iid)),
          api.listMergeRequestNotes(project.id, Number(iid)),
        ]);
        setMergeRequest(mergeRequestRes);
        setNotes(noteRes.notes);
      } catch (err) {
        setMergeRequest(null);
        setLoadError(err instanceof Error ? err.message : 'Failed to load merge request');
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
      const note = await api.createMergeRequestNote(project.id, Number(iid), noteBody.trim());
      setNotes((current) => [...current, note]);
      setNoteBody('');
      addToast('Comment added', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to add comment', 'error');
    }
  };

  if (projectLoading) return <Loader label="Loading project…" />;
  if (projectError || !project) return <EmptyState title="Project not found" description={projectError ?? 'This project could not be resolved.'} action={<button className="gl-button btn btn-default" type="button" onClick={() => void refresh()}>Try again</button>} />;
  if (loading) return <Loader label="Loading merge request…" />;
  if (loadError || !mergeRequest) return <EmptyState title="Merge request unavailable" description={loadError ?? 'This merge request could not be loaded.'} action={<Link to={`${getProjectPath(project)}/-/merge_requests`} className="gl-button btn btn-default">Back to merge requests</Link>} />;

  return (
    <div className="issuable-detail-layout">
      <SectionCard className="gl2-issuable-header">
        <div className="gl2-issuable-title-row">
          <div>
            <div className="gl2-meta-row">Opened {relativeTime(mergeRequest.created_at)} by @{mrAuthor(mergeRequest)}</div>
            <h1 className="gl2-issuable-title">{mergeRequest.title} <span className="gl2-reference">!{mergeRequest.iid}</span></h1>
            <div className="gl2-meta-row">
              <span className="gl2-branch-chip">{mergeRequest.source_branch}</span>
              <span>into</span>
              <span className="gl2-branch-chip">{mergeRequest.target_branch}</span>
            </div>
          </div>
          <MergeRequestStatus state={mergeRequest.state} />
        </div>
      </SectionCard>

      <div className="detail-layout">
        <div>
          <ul className="nav gl-tabs-nav gl2-mr-tabs">
            <li className="nav-item"><button type="button" className={classNames('nav-link gl-tab-nav-item', activeTab === 'overview' && 'gl-tab-nav-item-active')} onClick={() => setActiveTab('overview')}>Overview</button></li>
            <li className="nav-item"><button type="button" className={classNames('nav-link gl-tab-nav-item', activeTab === 'changes' && 'gl-tab-nav-item-active')} onClick={() => setActiveTab('changes')}>Changes</button></li>
          </ul>

          {activeTab === 'overview' ? (
            <>
              <SectionCard className="issue-detail-card page-section">
                <div className="card-body">
                  <div className="gl2-description-box">{mergeRequest.description ?? 'No description provided.'}</div>
                </div>
              </SectionCard>
              <SectionCard className="notes-card">
                <div className="card-header"><h3>Discussion</h3><span>{notes.length} notes</span></div>
                {notes.length ? (
                  <ul className="note-list">
                    {notes.map((note) => (
                      <li key={note.id} className={classNames('note-item', note.system && 'system-note')}>
                        {note.system ? <span className="gl2-state-icon gl2-state-merged">✓</span> : <Avatar name={note.author?.name ?? note.author_username} url={note.author?.avatar_url} size={32} />}
                        <div>
                          <div className="note-meta"><strong>{note.author?.name ?? note.author_username}</strong><span>{formatDateTime(note.created_at)}</span>{note.system ? <span className="gl-badge">system</span> : null}</div>
                          <div className="note-body">{note.body}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : <div className="card-body">No discussion yet.</div>}
                <form className="note-form" onSubmit={submitNote}>
                  <textarea className="gl-form-textarea" value={noteBody} onChange={(event) => setNoteBody(event.target.value)} placeholder="Write a comment…" />
                  <div className="inline-actions">
                    <button className="gl-button btn btn-success">Comment</button>
                    <Link to={`${getProjectPath(project)}/-/merge_requests`} className="gl-button btn btn-default">Back to merge requests</Link>
                  </div>
                </form>
              </SectionCard>
            </>
          ) : (
            <SectionCard className="notes-card">
              <div className="card-header"><h3>Changes</h3></div>
              <div className="gl2-empty-diff">
                <h3>No diff data</h3>
                <p>This synthetic EchoForge environment has merge request metadata and discussion, but no repository diff payloads.</p>
              </div>
            </SectionCard>
          )}
        </div>

        <SectionCard className="project-sidebar-card gl2-metadata-sidebar">
          <div className="card-header"><h3>Merge request details</h3></div>
          <div className="card-body">
            <dl>
              <dt>Assignee</dt><dd>{mergeRequest.assignee ? <span className="gl2-sidebar-value"><Avatar name={mergeRequest.assignee.name} url={mergeRequest.assignee.avatar_url} size={24} />{mergeRequest.assignee.name}</span> : 'Unassigned'}</dd>
              <dt>Labels</dt><dd>None</dd>
              <dt>Milestone</dt><dd>None</dd>
              <dt>Merge status</dt><dd><span className="gl-badge badge-info">{mergeRequest.merge_status.split('_').join(' ')}</span></dd>
              <dt>Source branch</dt><dd><span className="gl2-branch-chip">{mergeRequest.source_branch}</span></dd>
              <dt>Target branch</dt><dd><span className="gl2-branch-chip">{mergeRequest.target_branch}</span></dd>
              <dt>Author</dt><dd>@{mrAuthor(mergeRequest)}</dd>
              <dt>Updated</dt><dd>{formatDateTime(mergeRequest.updated_at ?? mergeRequest.created_at)}</dd>
            </dl>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function MergeRequestStatus({ state }: { state: string }) {
  const className = state === 'merged' ? 'gl2-status-merged' : state === 'closed' ? 'gl2-status-mr-closed' : 'gl2-status-open';
  return <span className={classNames('gl2-status-pill', className)}>{state === 'opened' ? 'Open' : state}</span>;
}
