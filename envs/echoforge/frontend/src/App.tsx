import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { api } from './api';
import { AuthPage } from './components/AuthPage';
import { CreateIssue } from './components/CreateIssue';
import { CreateProject } from './components/CreateProject';
import { Dashboard } from './components/Dashboard';
import { GroupList } from './components/GroupList';
import { IssueDetail } from './components/IssueDetail';
import { IssueList } from './components/IssueList';
import { LabelList } from './components/LabelList';
import { MemberList } from './components/MemberList';
import { MergeRequestDetail } from './components/MergeRequestDetail';
import { MergeRequestList } from './components/MergeRequestList';
import { MilestoneList } from './components/MilestoneList';
import { Navbar } from './components/Navbar';
import { ProfilePage } from './components/ProfilePage';
import { ProfileSettings } from './components/ProfileSettings';
import { ProjectDetail } from './components/ProjectDetail';
import { ProjectList } from './components/ProjectList';
import { Sidebar } from './components/Sidebar';
import { ToastContainer, type ToastData } from './components/Toast';
import { TodoList } from './components/TodoList';
import { useResolvedProject } from './hooks/useResolvedProject';
import { EmptyState, Loader } from './echoforge-ui';
import type { Project, User } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((message: string, type: ToastData['type'] = 'info') => {
    setToasts((current) => [...current, { id: `${Date.now()}-${Math.random()}`, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const user = await api.getCurrentUser();
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleLogout = useCallback(async () => {
    await api.logout().catch(() => undefined);
    setCurrentUser(null);
    addToast('Signed out', 'info');
  }, [addToast]);

  if (loading) {
    return <div className="app-loading"><Loader label="Loading EchoForge frontend…" /></div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" currentUser={currentUser} setCurrentUser={setCurrentUser} addToast={addToast} />} />
        <Route path="/register" element={<AuthPage mode="register" currentUser={currentUser} setCurrentUser={setCurrentUser} addToast={addToast} />} />
        <Route
          path="/"
          element={<AppLayout currentUser={currentUser} onLogout={handleLogout} />}
        >
          <Route index element={<Dashboard currentUser={currentUser} />} />
          <Route path="projects" element={<ProjectList currentUser={currentUser} />} />
          <Route path="projects/new" element={<CreateProject currentUser={currentUser} addToast={addToast} />} />
          <Route path="dashboard/todos" element={<TodoList addToast={addToast} />} />
          <Route path="groups" element={<GroupList />} />
          <Route path="profile" element={<ProfilePage currentUser={currentUser} />} />
          <Route path="users/:username" element={<ProfilePage currentUser={currentUser} />} />
          <Route path="-/profile" element={<ProfileSettings currentUser={currentUser} onUserUpdated={setCurrentUser} addToast={addToast} />} />
          <Route path=":namespace/:project" element={<ProjectDetail addToast={addToast} />} />
          <Route path=":namespace/:project/-/issues" element={<IssueList />} />
          <Route path=":namespace/:project/-/issues/new" element={<CreateIssue addToast={addToast} />} />
          <Route path=":namespace/:project/-/issues/:iid" element={<IssueDetail addToast={addToast} />} />
          <Route path=":namespace/:project/-/merge_requests" element={<MergeRequestList />} />
          <Route path=":namespace/:project/-/merge_requests/:iid" element={<MergeRequestDetail addToast={addToast} />} />
          <Route path=":namespace/:project/-/milestones" element={<MilestoneList addToast={addToast} />} />
          <Route path=":namespace/:project/-/project_members" element={<MemberList addToast={addToast} />} />
          <Route path=":namespace/:project/-/labels" element={<LabelList addToast={addToast} />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </BrowserRouter>
  );
}

function AppLayout({ currentUser, onLogout }: { currentUser: User | null; onLogout: () => Promise<void> }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const projectPath = useMemo(() => getProjectPathFromLocation(location.pathname), [location.pathname]);
  const projectResolution = useResolvedProject(projectPath?.namespace, projectPath?.project);
  const project = projectResolution.project;

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const breadcrumbs = useMemo(() => buildBreadcrumbs(location.pathname, project), [location.pathname, project]);

  return (
    <div className="app-shell ui-indigo">
      <Navbar
        user={currentUser}
        project={project}
        onLogout={onLogout}
        onMenuToggle={() => setSidebarOpen((value) => !value)}
      />
      <div className="layout-page hide-when-top-nav-responsive-open">
        <div className="content-wrapper content-wrapper-margin page-with-contextual-sidebar">
          <Sidebar currentUser={currentUser} project={project} projectLoading={projectResolution.loading} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="mobile-overlay" hidden={!sidebarOpen} onClick={() => setSidebarOpen(false)} />
          <nav className="breadcrumbs" aria-label="Breadcrumbs">
            <div className="breadcrumbs-container">
              {project ? (
                <button className="toggle-mobile-nav" type="button" onClick={() => setSidebarOpen((value) => !value)}>
                  Open sidebar
                </button>
              ) : null}
              <div className="breadcrumbs-links">
                <ul className="list-unstyled breadcrumbs-list js-breadcrumbs-list">
                  {breadcrumbs.map((crumb, index) => (
                    <li key={`${crumb.label}-${index}`}>
                      {crumb.href ? <a href={crumb.href}>{crumb.label}</a> : <span className="breadcrumb-item-text js-breadcrumb-item-text">{crumb.label}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </nav>
          <div className="container-fluid container-limited limit-container-width">
            <main className="content" id="content-body">
              <div className="flash-container flash-container-page sticky" />
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildBreadcrumbs(pathname: string, project: Project | null): Array<{ label: string; href?: string }> {
  if (project) {
    const projectBase = `/${project.full_path}`;
    const afterProject = pathname.replace(projectBase, '') || '';
    const parts = afterProject.split('/').filter(Boolean);
    const crumbs: Array<{ label: string; href?: string }> = [
      { label: project.namespace?.name ?? project.namespace_path },
      { label: project.name, href: projectBase },
    ];
    if (parts[0] === '-') {
      const routeMap: Record<string, string> = {
        issues: 'Issues',
        merge_requests: 'Merge Requests',
        milestones: 'Milestones',
        project_members: 'Members',
        labels: 'Labels',
      };
      if (parts[1]) crumbs.push({ label: routeMap[parts[1]] ?? parts[1].split('_').join(' ') });
      if (parts[2] && parts[2] !== 'new') crumbs.push({ label: parts[2].startsWith('!') || parts[1] === 'merge_requests' ? `!${parts[2]}` : `#${parts[2]}` });
      if (parts[2] === 'new') crumbs.push({ label: 'New' });
    }
    return crumbs;
  }

  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return [{ label: 'Dashboard', href: '/' }];
  if (parts[0] === 'projects') {
    return [{ label: 'Dashboard', href: '/' }, { label: parts[1] === 'new' ? 'New project' : 'Projects' }];
  }
  if (parts[0] === 'groups') return [{ label: 'Dashboard', href: '/' }, { label: 'Groups' }];
  if (parts[0] === 'dashboard' && parts[1] === 'todos') return [{ label: 'Dashboard', href: '/' }, { label: 'Todos' }];
  if (parts[0] === 'profile' || (parts[0] === '-' && parts[1] === 'profile')) return [{ label: 'Profile' }];
  return [{ label: 'Dashboard', href: '/' }, { label: parts[0] }];
}

function getProjectPathFromLocation(pathname: string): { namespace: string; project: string } | null {
  const reservedRoots = new Set(['projects', 'groups', 'dashboard', 'profile', 'login', 'register', '-']);
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  if (reservedRoots.has(parts[0])) return null;
  return { namespace: parts[0], project: parts[1] };
}

function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="This route is not part of the EchoForge synthetic frontend. Jump back to the dashboard or browse projects instead."
      action={<Link className="gl-button btn btn-default" to="/">Go to dashboard</Link>}
    />
  );
}
