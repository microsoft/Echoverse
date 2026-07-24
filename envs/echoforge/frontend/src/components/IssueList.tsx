import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { Avatar, CountPill, EmptyState, Icon, LabelPill, Loader, PageTitle, SectionCard } from '../echoforge-ui';
import { useResolvedProject } from '../hooks/useResolvedProject';
import type { Issue, Label, Member, Milestone } from '../types';
import { classNames, getProjectPath, issueAssignee, issueAuthor, relativeTime } from '../utils';

export function IssueList() {
  const { namespace, project: projectPath } = useParams();
  const { project, loading: projectLoading, error: projectError, refresh } = useResolvedProject(namespace, projectPath);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [counts, setCounts] = useState({ opened: 0, closed: 0, all: 0 });
  const [stateFilter, setStateFilter] = useState<'opened' | 'closed' | 'all'>('opened');
  const [search, setSearch] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [labelTitle, setLabelTitle] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadMeta = async () => {
      if (!project) return;
      try {
        const [labelRes, milestoneRes, memberRes, openRes, closedRes, allRes] = await Promise.all([
          api.listLabels(project.id),
          api.listMilestones(project.id),
          api.listProjectMembers(project.id),
          api.listIssues(project.id, { state: 'opened', limit: 1 }),
          api.listIssues(project.id, { state: 'closed', limit: 1 }),
          api.listIssues(project.id, { limit: 1 }),
        ]);
        setLabels(labelRes.labels);
        setMilestones(milestoneRes.milestones);
        setMembers(memberRes.members);
        setCounts({ opened: openRes.total, closed: closedRes.total, all: allRes.total });
      } catch {
        setLabels([]);
        setMilestones([]);
        setMembers([]);
        setCounts({ opened: 0, closed: 0, all: 0 });
      }
    };
    void loadMeta();
  }, [project]);

  useEffect(() => {
    const load = async () => {
      if (!project) return;
      setLoading(true);
      setLoadError(null);
      try {
        const response = await api.listIssues(project.id, {
          state: stateFilter === 'all' ? undefined : stateFilter,
          search: search || undefined,
          assignee_id: assigneeId ? Number(assigneeId) : undefined,
          milestone_id: milestoneId ? Number(milestoneId) : undefined,
          labels: labelTitle || undefined,
          limit: 100,
        });
        setIssues(response.issues);
      } catch (err) {
        setIssues([]);
        setLoadError(err instanceof Error ? err.message : 'Failed to load issues');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [assigneeId, labelTitle, milestoneId, project, search, stateFilter]);

  if (projectLoading) return <Loader label="Loading project…" />;
  if (projectError || !project) return <EmptyState title="Project not found" description={projectError ?? 'This project could not be resolved.'} action={<button className="gl-button btn btn-default" type="button" onClick={() => void refresh()}>Try again</button>} />;
  if (loading) return <Loader label="Loading issues…" />;
  if (loadError) return <EmptyState title="Issues unavailable" description={loadError} action={<button className="gl-button btn btn-default" type="button" onClick={() => void refresh()}>Retry</button>} />;

  const tabs: Array<[typeof stateFilter, string, number]> = [
    ['opened', 'Open', counts.opened],
    ['closed', 'Closed', counts.closed],
    ['all', 'All', counts.all],
  ];

  return (
    <div>
      <PageTitle title="Issues" controls={<Link to={`${getProjectPath(project)}/-/issues/new`} className="gl-button btn btn-confirm">New issue</Link>} description={`${project.name} issue tracker`} />

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
        <div className="filters-row">
          <input className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search issues" />
          <select className="gl-form-select" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
            <option value="">Any assignee</option>
            {members.map((member) => <option key={member.id} value={member.user_id}>{member.name || member.username}</option>)}
          </select>
          <select className="gl-form-select" value={labelTitle} onChange={(event) => setLabelTitle(event.target.value)}>
            <option value="">Any label</option>
            {labels.map((label) => <option key={label.id} value={label.title}>{label.title}</option>)}
          </select>
          <select className="gl-form-select" value={milestoneId} onChange={(event) => setMilestoneId(event.target.value)}>
            <option value="">Any milestone</option>
            {milestones.map((milestone) => <option key={milestone.id} value={milestone.id}>{milestone.title}</option>)}
          </select>
        </div>
      </SectionCard>

      <SectionCard className="list-card">
        {issues.length ? (
          <ul className="content-list issuable-list issues-list">
            {issues.map((issue) => (
              <li key={issue.id} className="issue gl2-issuable-row">
                <IssueStateIcon state={issue.state} />
                <div className="issuable-main-info">
                  <div className="issue-title title">
                    <Link to={`${getProjectPath(project)}/-/issues/${issue.iid}`} className="issue-title-text">{issue.title}</Link>
                  </div>
                  <div className="gl2-meta-row">
                    <span className="issuable-reference">#{issue.iid}</span>
                    <span>opened {relativeTime(issue.created_at)} by @{issueAuthor(issue)}</span>
                    {issue.milestone ? <span>Milestone: {issue.milestone.title}</span> : null}
                    {issue.confidential ? <span className="gl-badge badge-warning">Confidential</span> : null}
                  </div>
                  {issue.labels.length ? <div className="gl2-label-row">{issue.labels.map((label) => <LabelPill key={label.id} label={label} />)}</div> : null}
                  {issue.description ? <div className="issuable-description">{issue.description}</div> : null}
                </div>
                <div className="issuable-meta">
                  <div className="gl2-row-assignee">
                    {issue.assignee ? <Avatar name={issue.assignee.name} url={issue.assignee.avatar_url} size={24} /> : null}
                    <span>{issueAssignee(issue)}</span>
                  </div>
                  <div className="gl2-comments"><Icon name="comment" className="tiny-icon" />{issue.notes_count ?? issue.note_count ?? 0}</div>
                  <div>updated {relativeTime(issue.updated_at)}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No issues match this filter" description="Adjust your filters or create a new issue." action={<Link to={`${getProjectPath(project)}/-/issues/new`} className="gl-button btn btn-confirm">Create issue</Link>} />
        )}
      </SectionCard>
    </div>
  );
}

function IssueStateIcon({ state }: { state: string }) {
  const closed = state === 'closed';
  return <span className={classNames('gl2-state-icon', closed ? 'gl2-state-closed' : 'gl2-state-open')} title={closed ? 'Closed issue' : 'Open issue'}>{closed ? '✓' : '!'}</span>;
}
