import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { api } from '../api';
import type { IconName } from '../echoforge-ui';
import { Avatar, CountPill, Icon } from '../echoforge-ui';
import type { Project, User } from '../types';
import { classNames, getProjectPath } from '../utils';

interface SidebarProps {
  currentUser: User | null;
  project: Project | null;
  projectLoading: boolean;
  open: boolean;
  onClose: () => void;
}

interface SidebarSubItem {
  label: string;
  to: string;
}

interface SidebarItem {
  icon: IconName;
  label: string;
  to?: string;
  count?: number;
  subItems?: SidebarSubItem[];
  activePrefixes?: string[];
  matchMode?: 'prefix' | 'exact' | 'none';
  disabled?: boolean;
  note?: string;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

export function Sidebar({ currentUser, project, projectLoading, open, onClose }: SidebarProps) {
  const location = useLocation();
  const base = project ? getProjectPath(project) : '';
  const isDashboardMode = !project;
  const { issueCount, mergeRequestCount, todoCount } = useResolvedSidebarCounts(currentUser?.id, project?.id);

  const dashboardGroups: SidebarGroup[] = [
    {
      title: 'Your work',
      items: [
        { icon: 'activity', label: 'Activity', to: '/', matchMode: 'exact' },
        { icon: 'project', label: 'Projects', to: '/projects', activePrefixes: ['/projects'] },
        { icon: 'group', label: 'Groups', to: '/groups', activePrefixes: ['/groups'] },
        { icon: 'todo', label: 'Todos', to: '/dashboard/todos', count: todoCount, activePrefixes: ['/dashboard/todos'] },
      ],
    },
    {
      title: 'Plan',
      items: [
        { icon: 'milestone', label: 'Milestones', disabled: true, matchMode: 'none', note: 'Project-scoped' },
        { icon: 'snippet', label: 'Snippets', disabled: true, matchMode: 'none', note: 'No snippet data' },
      ],
    },
  ];

  const projectGroups: SidebarGroup[] = [
    {
      title: 'Manage',
      items: [
        { icon: 'activity', label: 'Activity', to: base, matchMode: 'exact' },
        { icon: 'member', label: 'Members', to: `${base}/-/project_members`, activePrefixes: [`${base}/-/project_members`] },
        { icon: 'label', label: 'Labels', to: `${base}/-/labels`, activePrefixes: [`${base}/-/labels`] },
      ],
    },
    {
      title: 'Plan',
      items: [
        { icon: 'issues', label: 'Issues', to: `${base}/-/issues`, count: issueCount, activePrefixes: [`${base}/-/issues`] },
        { icon: 'milestone', label: 'Milestones', to: `${base}/-/milestones`, activePrefixes: [`${base}/-/milestones`] },
      ],
    },
    {
      title: 'Code',
      items: [
        { icon: 'merge', label: 'Merge requests', to: `${base}/-/merge_requests`, count: mergeRequestCount, activePrefixes: [`${base}/-/merge_requests`] },
        {
          icon: 'repository',
          label: 'Repository',
          to: base,
          matchMode: 'exact',
          subItems: [{ label: 'Files', to: base }],
        },
      ],
    },
    {
      title: 'Operate',
      items: [
        { icon: 'pipeline', label: 'Build', disabled: true, matchMode: 'none', note: 'No CI data' },
        { icon: 'package', label: 'Deploy', disabled: true, matchMode: 'none', note: 'No deploy data' },
        { icon: 'monitor', label: 'Monitor', disabled: true, matchMode: 'none', note: 'No metrics' },
        { icon: 'analytics', label: 'Analyze', disabled: true, matchMode: 'none', note: 'No analytics' },
      ],
    },
  ];

  return (
    <aside className={classNames('nav-sidebar gl2-super-sidebar', open && 'open-mobile')}>
      <div className="context-header">
        {isDashboardMode ? (
          <NavLink to="/" onClick={onClose} className="gl2-context-switcher">
            <Avatar name={currentUser?.name ?? 'EchoForge'} url={currentUser?.avatar_url} square size={32} />
            <span>
              <span className="gl2-context-title">Your work</span>
              <span className="gl2-context-subtitle">{currentUser ? `@${currentUser.username}` : 'Dashboard'}</span>
            </span>
            <Icon name="chevron-down" className="tiny-icon" />
          </NavLink>
        ) : (
          <NavLink to={base} onClick={onClose} className="gl2-context-switcher">
            <Avatar name={project?.name ?? 'Project'} size={32} square />
            <span>
              <span className="gl2-context-title">{projectLoading ? 'Loading project…' : project?.name ?? 'Project'}</span>
              <span className="gl2-context-subtitle">{project?.namespace?.path ?? project?.namespace_path ?? 'Project'}</span>
            </span>
            <Icon name="chevron-down" className="tiny-icon" />
          </NavLink>
        )}
      </div>

      <div className="nav-sidebar-inner-scroll">
        {(isDashboardMode ? dashboardGroups : projectGroups).map((group) => (
          <div key={group.title} className="gl2-sidebar-section">
            <div className="gl2-sidebar-section-title">{group.title}</div>
            <ul className="sidebar-top-level-items list-unstyled">
              {group.items.map((item) => {
                const matchMode = item.matchMode ?? 'prefix';
                const to = item.to ?? location.pathname;
                const prefixes = item.activePrefixes ?? [to];
                const isActive = item.disabled || matchMode === 'none'
                  ? false
                  : matchMode === 'exact'
                    ? location.pathname === to
                    : prefixes.some((prefix) => prefix && (location.pathname === prefix || location.pathname.startsWith(`${prefix}/`)));
                return (
                  <li key={`${group.title}-${item.label}`} className={classNames(isActive && 'active')}>
                    {item.disabled ? (
                      <button type="button" className="gl2-sidebar-disabled" disabled title={item.note}>
                        <span className="nav-icon-container"><Icon name={item.icon} /></span>
                        <span className="nav-item-name">{item.label}</span>
                        {item.note ? <span className="sidebar-group-badge">{item.note}</span> : null}
                      </button>
                    ) : (
                      <NavLink to={to} onClick={onClose}>
                        <span className="nav-icon-container"><Icon name={item.icon} /></span>
                        <span className="nav-item-name">{item.label}</span>
                        {typeof item.count === 'number' ? <span className="sidebar-group-badge"><CountPill value={item.count} /></span> : null}
                      </NavLink>
                    )}
                    {item.subItems?.length ? (
                      <ul className="sidebar-sub-level-items list-unstyled">
                        {item.subItems.map((subItem) => (
                          <li key={subItem.to} className={classNames(location.pathname === subItem.to && 'active')}>
                            <NavLink to={subItem.to} onClick={onClose}>{subItem.label}</NavLink>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}

function useResolvedSidebarCounts(userId?: number, projectId?: number) {
  const [todoCount, setTodoCount] = useState(0);
  const [issueCount, setIssueCount] = useState(0);
  const [mergeRequestCount, setMergeRequestCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const promises: Promise<unknown>[] = [];
        if (userId) promises.push(api.listTodos({ state: 'pending', limit: 100 }));
        if (projectId) {
          promises.push(api.listIssues(projectId, { state: 'opened', limit: 1 }));
          promises.push(api.listMergeRequests(projectId, { state: 'opened', limit: 1 }));
        }
        const results = await Promise.all(promises);
        if (userId) {
          const todosRes = results.shift() as Awaited<ReturnType<typeof api.listTodos>>;
          setTodoCount(todosRes.total);
        } else {
          setTodoCount(0);
        }
        if (projectId) {
          const issuesRes = results.shift() as Awaited<ReturnType<typeof api.listIssues>>;
          const mergeRequestsRes = results.shift() as Awaited<ReturnType<typeof api.listMergeRequests>>;
          setIssueCount(issuesRes.total);
          setMergeRequestCount(mergeRequestsRes.total);
        } else {
          setIssueCount(0);
          setMergeRequestCount(0);
        }
      } catch {
        setTodoCount(0);
        setIssueCount(0);
        setMergeRequestCount(0);
      }
    };
    void load();
  }, [projectId, userId]);

  return { todoCount, issueCount, mergeRequestCount };
}
