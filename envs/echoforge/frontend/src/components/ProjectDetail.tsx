import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { CountPill, EmptyState, Icon, Loader, SectionCard, TabNav, VisibilityBadge } from '../echoforge-ui';
import { useResolvedProject } from '../hooks/useResolvedProject';
import type { ProjectFile, TreeEntry } from '../types';
import { formatCount, formatDateTime, getProjectPath, relativeTime } from '../utils';

export function ProjectDetail({ addToast }: { addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const { namespace, project: projectPath } = useParams();
  const { project, loading, error, refresh } = useResolvedProject(namespace, projectPath);
  const [tree, setTree] = useState<TreeEntry[]>([]);
  const [readme, setReadme] = useState<ProjectFile | null>(null);
  const [openIssueTotal, setOpenIssueTotal] = useState(0);
  const [openMergeRequestTotal, setOpenMergeRequestTotal] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      if (!project) return;
      try {
        const [treeRes, readmeRes, issuesRes, mergeRequestsRes] = await Promise.all([
          api.getRepositoryTree(project.id, { branch: project.default_branch }),
          api.getProjectReadme(project.id, project.default_branch),
          api.listIssues(project.id, { state: 'opened', limit: 1 }),
          api.listMergeRequests(project.id, { state: 'opened', limit: 1 }),
        ]);
        setTree(treeRes.tree);
        setReadme(readmeRes);
        setOpenIssueTotal(issuesRes.total);
        setOpenMergeRequestTotal(mergeRequestsRes.total);
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Failed to load project details', 'error');
      }
    };
    void loadDetails();
  }, [addToast, project]);

  const stats = useMemo(() => ([
    ['Stars', formatCount(project?.star_count ?? 0)],
    ['Forks', formatCount(project?.forks_count ?? 0)],
    ['Open issues', formatCount(openIssueTotal)],
    ['Open merge requests', formatCount(openMergeRequestTotal)],
    ['Default branch', project?.default_branch ?? 'main'],
    ['Last activity', relativeTime(project?.last_activity_at ?? project?.updated_at)],
    ['Created', formatDateTime(project?.created_at)],
  ]), [openIssueTotal, openMergeRequestTotal, project]);

  const toggleStar = async () => {
    if (!project) return;
    const wasStarred = project.starred || project.is_starred;
    setBusy(true);
    try {
      if (wasStarred) {
        await api.unstarProject(project.id);
      } else {
        await api.starProject(project.id);
      }
      await refresh();
      addToast(wasStarred ? 'Project unstarred' : 'Project starred', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update star', 'error');
    } finally {
      setBusy(false);
    }
  };

  const forkProject = async () => {
    if (!project) return;
    setBusy(true);
    try {
      const forked = await api.forkProject(project.id);
      addToast(`Forked into ${forked.full_path}`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to fork project', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader label="Loading project…" />;
  if (error || !project) return <EmptyState title="Project not found" description={error ?? 'This project path does not resolve to a known project.'} action={<button className="gl-button btn btn-default" type="button" onClick={() => void refresh()}>Try again</button>} />;

  const base = getProjectPath(project);
  const namespaceName = project.namespace?.name ?? project.namespace_path;

  return (
    <div>
      <SectionCard className="gl2-project-hero">
        <div className="gl2-project-hero-main">
          <div className="gl2-project-avatar" aria-hidden="true">{project.name[0]?.toUpperCase()}</div>
          <div>
            <div className="gl2-project-path">{namespaceName} / {project.path}</div>
            <h1 className="gl2-project-title">
              {project.name}
              <VisibilityBadge level={project.visibility_level} />
            </h1>
            <div className="gl2-project-stats">
              <span className="gl2-stat-chip"><Icon name="star" className="tiny-icon" /> {formatCount(project.star_count)} stars</span>
              <span className="gl2-stat-chip"><Icon name="fork" className="tiny-icon" /> {formatCount(project.forks_count)} forks</span>
              <span className="gl2-stat-chip"><Icon name="branch" className="tiny-icon" /> {project.default_branch}</span>
            </div>
            {project.topics.length ? (
              <div className="gl2-topic-list">
                {project.topics.map((topic) => <span key={topic} className="gl2-topic-chip">{topic}</span>)}
              </div>
            ) : null}
            <p className="gl2-description">{project.description ?? 'No project description provided.'}</p>
            <div className="gl2-quick-stats">
              <Link to={`${base}/-/issues`} className="gl2-quick-stat">
                <strong>{formatCount(openIssueTotal)}</strong>
                <span>Open issues</span>
              </Link>
              <Link to={`${base}/-/merge_requests`} className="gl2-quick-stat">
                <strong>{formatCount(openMergeRequestTotal)}</strong>
                <span>Open merge requests</span>
              </Link>
              <div className="gl2-quick-stat">
                <strong>{formatCount(tree.length)}</strong>
                <span>Repository files</span>
              </div>
            </div>
          </div>
          <div className="gl2-project-actions">
            <button type="button" className="gl-button btn btn-default" onClick={() => void toggleStar()} disabled={busy}>★ Star <CountPill value={project.star_count} /></button>
            <button type="button" className="gl-button btn btn-default" onClick={() => void forkProject()} disabled={busy}>Fork <CountPill value={project.forks_count} /></button>
            <Link to={`${base}/-/issues/new`} className="gl-button btn btn-confirm">New issue</Link>
          </div>
        </div>
      </SectionCard>

      <div className="top-area">
        <TabNav
          tabs={[
            { to: base, label: 'Overview', end: true },
            { to: `${base}/-/issues`, label: 'Issues', count: openIssueTotal },
            { to: `${base}/-/merge_requests`, label: 'Merge requests', count: openMergeRequestTotal },
            { to: `${base}/-/milestones`, label: 'Milestones' },
            { to: `${base}/-/labels`, label: 'Labels' },
            { to: `${base}/-/project_members`, label: 'Members' },
          ]}
        />
      </div>

      <div className="detail-layout">
        <div>
          <SectionCard className="repository-tree-card page-section">
            <div className="card-header"><h3>Repository</h3><span className="gl2-branch-chip"><Icon name="branch" className="tiny-icon" />{project.default_branch}</span></div>
            <ul className="repo-tree">
              {tree.length ? tree.map((entry) => (
                <li key={entry.path}><span>{entry.type === 'tree' ? '📁' : '📄'} {entry.name}<small>{entry.type}</small></span></li>
              )) : <li><span>Repository is empty.</span></li>}
            </ul>
          </SectionCard>

          <SectionCard className="readme-holder gl2-readme">
            <div className="file-title-flex-parent"><div className="file-header-content"><strong>{readme?.file_path ?? 'README.md'}</strong></div></div>
            <div className="file-content"><ReadmeContent content={readme?.content} /></div>
          </SectionCard>
        </div>

        <SectionCard className="project-sidebar-card gl2-metadata-sidebar">
          <div className="card-header"><h3>Project information</h3></div>
          <div className="card-body">
            <dl>
              {stats.map(([label, value]) => (
                <Fragment key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </Fragment>
              ))}
            </dl>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function ReadmeContent({ content }: { content?: string | null }) {
  if (!content) {
    return <div className="gl2-readme-empty">No README found for this project.</div>;
  }
  return (
    <div className="gl2-markdown-body">
      {content.split('\n').map((line, index) => {
        const key = `${index}-${line}`;
        if (!line.trim()) return <br key={key} />;
        if (line.startsWith('### ')) return <h3 key={key}>{line.slice(4)}</h3>;
        if (line.startsWith('## ')) return <h2 key={key}>{line.slice(3)}</h2>;
        if (line.startsWith('# ')) return <h1 key={key}>{line.slice(2)}</h1>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <p key={key} className="gl2-md-list">• {line.slice(2)}</p>;
        return <p key={key}>{line}</p>;
      })}
    </div>
  );
}
