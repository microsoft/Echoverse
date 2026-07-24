import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { api } from '../api';
import { Avatar, CountPill, EchoForgeLogo, Icon } from '../echoforge-ui';
import type { Project, SearchResults, User } from '../types';
import { getProjectPath } from '../utils';

export function Navbar({
  user,
  project,
  onLogout,
  onMenuToggle,
}: {
  user: User | null;
  project: Project | null;
  onLogout: () => Promise<void>;
  onMenuToggle: () => void;
}) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [todoCount, setTodoCount] = useState(0);
  const [issueCount, setIssueCount] = useState(0);
  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (!search.trim()) {
        setResults(null);
        return;
      }
      try {
        const next = await api.search(search.trim());
        if (!controller.signal.aborted) {
          setResults(next);
          setSearchOpen(true);
        }
      } catch {
        if (!controller.signal.aborted) setResults(null);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    if (!user) {
      setTodoCount(0);
      setIssueCount(0);
      return;
    }
    const loadCounts = async () => {
      try {
        const [todosRes, issuesRes] = await Promise.all([
          api.listTodos({ state: 'pending', limit: 100 }),
          api.dashboardIssues(),
        ]);
        setTodoCount(todosRes.total);
        setIssueCount(issuesRes.issues.filter((issue) => issue.state === 'opened').length);
      } catch {
        setTodoCount(0);
        setIssueCount(0);
      }
    };
    void loadCounts();
  }, [user]);

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
      const target = event.target as HTMLElement;
      if (!target.closest('.header-new-menu')) setNewMenuOpen(false);
      if (!target.closest('.header-user-menu')) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', closeMenus);
    return () => document.removeEventListener('mousedown', closeMenus);
  }, []);

  const projectLinks = useMemo(() => {
    if (!project) return [];
    const base = getProjectPath(project);
    return [
      { label: 'New issue', href: `${base}/-/issues/new` },
      { label: 'Open merge requests', href: `${base}/-/merge_requests` },
      { label: 'Invite members', href: `${base}/-/project_members` },
      { label: 'Create label', href: `${base}/-/labels` },
    ];
  }, [project]);

  const context = project ? (
    <Link to={getProjectPath(project)} title={project.full_path}>
      <span>{project.namespace?.path ?? project.namespace_path}</span>
      <span>/</span>
      <strong>{project.name}</strong>
    </Link>
  ) : (
    <Link to="/">
      <strong>Your work</strong>
    </Link>
  );

  return (
    <header className="navbar navbar-echoforge navbar-expand-sm js-navbar" data-qa-selector="navbar">
      <div className="container-fluid">
        <div className="header-content js-header-content">
          <div className="title-container hide-when-top-nav-responsive-open">
            <button className="header-icon-button" type="button" onClick={onMenuToggle} aria-label="Toggle sidebar">
              <Icon name="menu" />
            </button>
            <Link to="/" className="header-logo-link" title="Dashboard">
              <EchoForgeLogo />
            </Link>
            <div className="gl2-topbar-context" aria-label="Current context">
              {context}
            </div>
            <ul className="navbar-sub-nav list-unstyled nav navbar-nav">
              <li><NavLink to="/" end className="header-nav-link">Your work</NavLink></li>
              <li><NavLink to="/projects" className="header-nav-link">Projects</NavLink></li>
              <li><NavLink to="/groups" className="header-nav-link">Groups</NavLink></li>
            </ul>
          </div>

          <div className="global-search-container header-search-shell" ref={searchRef}>
            <div className="header-search">
              <Icon name="search" />
              <input
                value={search}
                onFocus={() => setSearchOpen(true)}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search or jump to…"
                aria-label="Global search"
              />
              <span className="keyboard-shortcut-helper">/</span>
            </div>
            {searchOpen && search.trim() ? (
              <div className="search-results-dropdown" role="dialog" aria-label="Search results">
                {results?.projects?.length ? <div className="dropdown-section-title">Projects</div> : null}
                {results?.projects?.slice(0, 4).map((item) => (
                  <Link key={item.id} className="search-result-link" to={getProjectPath(item)} onClick={() => setSearchOpen(false)}>
                    {item.full_path}
                    <small>{item.description ?? 'Project'}</small>
                  </Link>
                ))}
                {results?.users?.length ? <div className="dropdown-section-title">Users</div> : null}
                {results?.users?.slice(0, 4).map((item) => (
                  <Link key={item.id} className="search-result-link" to={`/users/${item.username}`} onClick={() => setSearchOpen(false)}>
                    @{item.username}
                    <small>{item.name ?? 'User'}</small>
                  </Link>
                ))}
                {results?.issues?.length ? <div className="dropdown-section-title">Issues</div> : null}
                {results?.issues?.slice(0, 3).map((item) => (
                  <Link key={item.id} className="search-result-link" to={`${item.project ? getProjectPath(item.project) : ''}/-/issues/${item.iid}`} onClick={() => setSearchOpen(false)}>
                    #{item.iid} {item.title}
                    <small>{item.project?.name ?? 'Issue'}</small>
                  </Link>
                ))}
                {results?.merge_requests?.length ? <div className="dropdown-section-title">Merge requests</div> : null}
                {results?.merge_requests?.slice(0, 3).map((item) => (
                  <Link key={item.id} className="search-result-link" to={`${item.project ? getProjectPath(item.project) : ''}/-/merge_requests/${item.iid}`} onClick={() => setSearchOpen(false)}>
                    !{item.iid} {item.title}
                    <small>{item.project?.name ?? 'Merge request'}</small>
                  </Link>
                ))}
                {!results?.projects?.length && !results?.users?.length && !results?.issues?.length && !results?.merge_requests?.length ? <div className="search-empty">No results for “{search}”.</div> : null}
              </div>
            ) : null}
          </div>

          <div className="header-actions">
            {user ? (
              <>
                <NavLink to="/dashboard/todos" className="header-nav-link" title="To do list">
                  <Icon name="todo" />
                  <CountPill value={todoCount} tone="info" />
                </NavLink>
                <NavLink to="/projects" className="header-nav-link" title="Assigned open issues">
                  <Icon name="issues" />
                  <CountPill value={issueCount} tone="success" />
                </NavLink>
                <div className="header-new-menu">
                  <button className="header-new-button" type="button" onClick={() => setNewMenuOpen((value) => !value)} aria-expanded={newMenuOpen} aria-label="Create new">
                    <Icon name="plus" />
                    <Icon name="chevron-down" className="tiny-icon" />
                  </button>
                  {newMenuOpen ? (
                    <div className="header-dropdown-menu">
                      {projectLinks.length ? <div className="dropdown-section-title">This project</div> : null}
                      {projectLinks.map((item) => (
                        <Link key={item.href} to={item.href} className="header-dropdown-link" onClick={() => setNewMenuOpen(false)}>{item.label}</Link>
                      ))}
                      <div className="dropdown-section-title">EchoForge</div>
                      <Link to="/projects/new" className="header-dropdown-link" onClick={() => setNewMenuOpen(false)}>New project/repository</Link>
                      <Link to="/groups" className="header-dropdown-link" onClick={() => setNewMenuOpen(false)}>Browse groups</Link>
                    </div>
                  ) : null}
                </div>
                <div className="header-user-menu">
                  <button className="header-user-button" type="button" onClick={() => setUserMenuOpen((value) => !value)} aria-expanded={userMenuOpen}>
                    <Avatar name={user.name} url={user.avatar_url} size={24} />
                    <Icon name="chevron-down" className="tiny-icon" />
                  </button>
                  {userMenuOpen ? (
                    <div className="header-dropdown-menu">
                      <Link to="/profile" className="header-dropdown-link" onClick={() => setUserMenuOpen(false)}>
                        {user.name}
                        <small>@{user.username}</small>
                      </Link>
                      <Link to="/-/profile" className="header-dropdown-link" onClick={() => setUserMenuOpen(false)}>Edit profile</Link>
                      <button className="header-dropdown-link" type="button" onClick={() => { setUserMenuOpen(false); void onLogout(); }}>Sign out</button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <Link to="/register" className="header-nav-link">Register</Link>
                <Link to="/login" className="header-nav-link">Sign in</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
