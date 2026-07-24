import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { Avatar, CountPill, EmptyState, Icon, Loader, PageTitle, SectionCard } from '../echoforge-ui';
import { useResolvedProject } from '../hooks/useResolvedProject';
import type { MergeRequest } from '../types';
import { classNames, getProjectPath, mrAuthor, relativeTime } from '../utils';

export function MergeRequestList() {
  const { namespace, project: projectPath } = useParams();
  const { project, loading: projectLoading, error: projectError, refresh } = useResolvedProject(namespace, projectPath);
  const [mergeRequests, setMergeRequests] = useState<MergeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<'opened' | 'closed' | 'merged' | 'all'>('opened');
  const [counts, setCounts] = useState({ opened: 0, merged: 0, closed: 0, all: 0 });

  useEffect(() => {
    const loadCounts = async () => {
      if (!project) return;
      try {
        const [openRes, mergedRes, closedRes, allRes] = await Promise.all([
          api.listMergeRequests(project.id, { state: 'opened', limit: 1 }),
          api.listMergeRequests(project.id, { state: 'merged', limit: 1 }),
          api.listMergeRequests(project.id, { state: 'closed', limit: 1 }),
          api.listMergeRequests(project.id, { limit: 1 }),
        ]);
        setCounts({ opened: openRes.total, merged: mergedRes.total, closed: closedRes.total, all: allRes.total });
      } catch {
        setCounts({ opened: 0, merged: 0, closed: 0, all: 0 });
      }
    };
    void loadCounts();
  }, [project]);

  useEffect(() => {
    const load = async () => {
      if (!project) return;
      setLoading(true);
      setLoadError(null);
      try {
        const response = await api.listMergeRequests(project.id, { state: stateFilter === 'all' ? undefined : stateFilter, limit: 100 });
        setMergeRequests(response.merge_requests);
      } catch (err) {
        setMergeRequests([]);
        setLoadError(err instanceof Error ? err.message : 'Failed to load merge requests');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [project, stateFilter]);

  if (projectLoading) return <Loader label="Loading project…" />;
  if (projectError || !project) return <EmptyState title="Project not found" description={projectError ?? 'This project could not be resolved.'} action={<button className="gl-button btn btn-default" type="button" onClick={() => void refresh()}>Try again</button>} />;
  if (loading) return <Loader label="Loading merge requests…" />;
  if (loadError) return <EmptyState title="Merge requests unavailable" description={loadError} action={<button className="gl-button btn btn-default" type="button" onClick={() => void refresh()}>Retry</button>} />;

  const tabs: Array<[typeof stateFilter, string, number]> = [
    ['opened', 'Open', counts.opened],
    ['merged', 'Merged', counts.merged],
    ['closed', 'Closed', counts.closed],
    ['all', 'All', counts.all],
  ];

  return (
    <div>
      <PageTitle title="Merge requests" description={`${project.name} merge requests`} />
      <SectionCard className="issuable-filter-bar page-section">
        <div className="top-area">
          <ul className="nav gl-tabs-nav">
            {tabs.map(([value, label, count]) => (
              <li key={value} className="nav-item">
                <button type="button" className={classNames('nav-link gl-tab-nav-item', stateFilter === value && 'gl-tab-nav-item-active')} onClick={() => setStateFilter(value)}>
                  {label} <CountPill value={count} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </SectionCard>
      <SectionCard className="list-card">
        {mergeRequests.length ? (
          <ul className="content-list issuable-list">
            {mergeRequests.map((mergeRequest) => (
              <li key={mergeRequest.id} className="gl2-issuable-row">
                <MergeRequestStateIcon state={mergeRequest.state} />
                <div className="issuable-main-info">
                  <div className="merge-request-title title">
                    <Link to={`${getProjectPath(project)}/-/merge_requests/${mergeRequest.iid}`} className="merge-request-title-text">{mergeRequest.title}</Link>
                  </div>
                  <div className="gl2-meta-row">
                    <span>!{mergeRequest.iid}</span>
                    <span>opened {relativeTime(mergeRequest.created_at)} by @{mrAuthor(mergeRequest)}</span>
                    <span className="gl2-branch-chip">{mergeRequest.source_branch}</span>
                    <span>→</span>
                    <span className="gl2-branch-chip">{mergeRequest.target_branch}</span>
                    <span className="gl-badge badge-info">{mergeRequest.merge_status.split('_').join(' ')}</span>
                  </div>
                  {mergeRequest.description ? <div className="issuable-description">{mergeRequest.description}</div> : null}
                </div>
                <div className="issuable-meta">
                  <MergeRequestStatus state={mergeRequest.state} />
                  <div className="gl2-row-assignee">
                    {mergeRequest.assignee ? <Avatar name={mergeRequest.assignee.name} url={mergeRequest.assignee.avatar_url} size={24} /> : null}
                    <span>{mergeRequest.assignee?.name ?? mergeRequest.assignee?.username ?? 'Unassigned'}</span>
                  </div>
                  <div className="gl2-comments"><Icon name="comment" className="tiny-icon" />{mergeRequest.notes_count ?? mergeRequest.note_count ?? 0}</div>
                  <div>updated {relativeTime(mergeRequest.updated_at ?? mergeRequest.created_at)}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : <EmptyState title="No merge requests match this filter" description="Switch filters or create work in the repository to start a merge request." action={<Link to={getProjectPath(project)} className="gl-button btn btn-default">Back to project</Link>} />}
      </SectionCard>
    </div>
  );
}

function MergeRequestStateIcon({ state }: { state: string }) {
  const className = state === 'merged' ? 'gl2-state-merged' : state === 'closed' ? 'gl2-state-mr-closed' : 'gl2-state-open';
  return <span className={classNames('gl2-state-icon', className)} title={`${state} merge request`}>{state === 'merged' ? '✓' : state === 'closed' ? '×' : '!'}</span>;
}

function MergeRequestStatus({ state }: { state: string }) {
  const className = state === 'merged' ? 'gl2-status-merged' : state === 'closed' ? 'gl2-status-mr-closed' : 'gl2-status-open';
  return <span className={classNames('gl2-status-pill', className)}>{state === 'opened' ? 'Open' : state}</span>;
}
