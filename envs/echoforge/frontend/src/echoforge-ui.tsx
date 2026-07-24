import type { PropsWithChildren, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { classNames, formatCount, getProjectPath, initials, labelBackground, labelTextColor, stateTone, visibilityLabel } from './utils';
import type { Label, Project } from './types';

export type IconName =
  | 'menu'
  | 'search'
  | 'plus'
  | 'chevron-down'
  | 'project'
  | 'repository'
  | 'issues'
  | 'merge'
  | 'pipeline'
  | 'package'
  | 'monitor'
  | 'analytics'
  | 'wiki'
  | 'snippet'
  | 'settings'
  | 'group'
  | 'activity'
  | 'milestone'
  | 'todo'
  | 'star'
  | 'fork'
  | 'clock'
  | 'comment'
  | 'member'
  | 'label'
  | 'branch'
  | 'lock'
  | 'earth'
  | 'home'
  | 'profile'
  | 'edit'
  | 'x';

const ICON_PATHS: Record<IconName, ReactNode> = {
  menu: <path d="M3 5h18M3 12h18M3 19h18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
  search: <><circle cx="10.5" cy="10.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m15 15 5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></>,
  plus: <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
  'chevron-down': <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
  project: <path d="M4 6.5h16v11H4zM4 9h16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
  repository: <path d="M7 4h10l2 3v13H5V7l2-3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
  issues: <><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M12 8v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="12" cy="16.7" r="1" fill="currentColor" /></>,
  merge: <path d="M8 5a3 3 0 1 0 0 6c.85 0 1.62-.34 2.18-.9L14 13.92V16a3 3 0 1 0 2 0v-2.91l-4.41-4.4A3 3 0 0 0 8 5Zm8 11a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM8 7a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" fill="currentColor" />,
  pipeline: <><path d="M7 6h10M7 12h10M7 18h10M5 6h0M5 12h0M5 18h0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="5" cy="6" r="1.2" fill="currentColor" /><circle cx="5" cy="12" r="1.2" fill="currentColor" /><circle cx="5" cy="18" r="1.2" fill="currentColor" /></>,
  package: <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 0v18M4 7l8 4 8-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />,
  monitor: <path d="M4 6h16v10H4zM9 20h6M12 16v4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
  analytics: <><path d="M6 18V9M12 18V5M18 18v-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M4 18h16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></>,
  wiki: <path d="M6 5h12v14H6zM9 5v14M9 8h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
  snippet: <path d="M8 8h8M8 12h8M8 16h5M6 4h12v16H6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />,
  settings: <path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm8 3.8-2.08-.68a6.35 6.35 0 0 0-.55-1.32l1.03-1.92-1.78-1.78-1.92 1.03c-.42-.23-.86-.41-1.32-.55L12 4l-2.38.76c-.46.14-.9.32-1.32.55L6.38 4.28 4.6 6.06l1.03 1.92c-.23.42-.41.86-.55 1.32L3 12l.76 2.38c.14.46.32.9.55 1.32L3.28 17.62l1.78 1.78 1.92-1.03c.42.23.86.41 1.32.55L12 20l2.38-.76c.46-.14.9-.32 1.32-.55l1.92 1.03 1.78-1.78-1.03-1.92c.23-.42.41-.86.55-1.32L20 12Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />,
  group: <><circle cx="8" cy="10" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="16" cy="10" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M4.5 18c.6-2.4 2.4-4 4.8-4s4.2 1.6 4.8 4M11.5 18c.5-1.9 2-3.2 4-3.2s3.5 1.3 4 3.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>,
  activity: <path d="M4 13h4l2-5 4 9 2-4h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
  milestone: <path d="M6 5v14M18 5v14M6 9h12M6 15h12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
  todo: <><path d="M6 7h12M6 12h8M6 17h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="m16 16 2 2 4-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>,
  star: <path d="m12 3 2.7 5.48 6.05.88-4.38 4.27 1.03 6.02L12 16.8l-5.4 2.85 1.03-6.02L3.25 9.36l6.05-.88L12 3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />,
  fork: <><path d="M8 5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm8 9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM8 10v4a4 4 0 0 0 4 4h1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="16" cy="6" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M8 10V6h5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></>,
  clock: <><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>,
  comment: <path d="M5 6h14v9H9l-4 3V6Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
  member: <><circle cx="12" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M5.5 19c.8-3.2 3.3-5 6.5-5s5.7 1.8 6.5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></>,
  label: <><path d="M5 9V5h4l8 8-4 4-8-8Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="7.5" cy="7.5" r="1" fill="currentColor" /></>,
  branch: <><path d="M8 5v12M8 9h6a3 3 0 1 0 0-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="8" cy="5" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="8" cy="17" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="14" cy="9" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" /></>,
  lock: <path d="M7 11V8a5 5 0 1 1 10 0v3M6 11h12v9H6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
  earth: <><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M4.8 9h14.4M4.8 15h14.4M12 4a13 13 0 0 1 0 16M12 4a13 13 0 0 0 0 16" fill="none" stroke="currentColor" strokeWidth="1.4" /></>,
  home: <path d="m4 11 8-6 8 6v9h-5v-5H9v5H4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
  profile: <><circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M5 19c1-3 3.5-4.8 7-4.8s6 1.8 7 4.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></>,
  edit: <path d="m5 19 3.8-1 8.5-8.5-2.8-2.8L6 15.2 5 19Zm8.8-11.2 2.8 2.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />,
  x: <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={classNames('gl-icon', className)}>
      {ICON_PATHS[name]}
    </svg>
  );
}

export function EchoForgeLogo() {
  return (
    <div className="echoforge-logo-wrap" aria-label="EchoForge">
      <svg viewBox="0 0 32 32" className="echoforge-tanuki" aria-hidden="true">
        <rect x="3" y="3" width="26" height="26" rx="8" fill="#FC6D26" />
        <path d="M11 20.5 16 9.5l5 11" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 16.5h6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span className="echoforge-wordmark">EchoForge</span>
    </div>
  );
}

export function Avatar({ name, url, size = 32, square = false }: { name: string; url?: string | null; size?: number; square?: boolean }) {
  const style = { width: size, height: size };
  if (url) {
    return <img src={url} alt={name} className={classNames('gl-avatar', square && 'gl-avatar-square')} style={style} />;
  }
  return (
    <span className={classNames('gl-avatar', 'gl-avatar-fallback', square && 'gl-avatar-square')} style={style}>
      {initials(name)}
    </span>
  );
}

export function SectionCard({ className, children }: PropsWithChildren<{ className?: string }>) {
  return <section className={classNames('gl-card', className)}>{children}</section>;
}

export function PageTitle({ title, controls, description }: { title: string; controls?: ReactNode; description?: ReactNode }) {
  return (
    <div className="page-title-holder">
      <div>
        <h1 className="page-title">{title}</h1>
        {description ? <div className="page-subtitle">{description}</div> : null}
      </div>
      {controls ? <div className="page-title-controls">{controls}</div> : null}
    </div>
  );
}

export function Loader({ label }: { label: string }) {
  return (
    <SectionCard className="state-card">
      <div className="loading-spinner" />
      <p>{label}</p>
    </SectionCard>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <SectionCard className="state-card error-card">
      <h3>Something went wrong</h3>
      <p>{message}</p>
      {onRetry ? <button type="button" className="gl-button btn btn-default" onClick={onRetry}>Try again</button> : null}
    </SectionCard>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <SectionCard className="state-card empty-state-card">
      <div className="empty-state-illustration">✦</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div>{action}</div> : null}
    </SectionCard>
  );
}

export function StateBadge({ state }: { state: string }) {
  return <span className={classNames('gl-badge state-badge', `state-${stateTone(state)}`)}>{state.split('_').join(' ')}</span>;
}

export function VisibilityBadge({ level }: { level: number }) {
  const publicLike = level >= 30;
  return (
    <span className="visibility-badge">
      <Icon name={publicLike ? 'earth' : 'lock'} className="tiny-icon" />
      {visibilityLabel(level)}
    </span>
  );
}

export function CountPill({ value, tone = 'muted' }: { value: number; tone?: 'muted' | 'success' | 'warning' | 'info' }) {
  return <span className={classNames('gl-badge', `badge-${tone}`)}>{formatCount(value)}</span>;
}

export function LabelPill({ label }: { label: Label }) {
  return (
    <span
      className="gl-label"
      style={{ backgroundColor: labelBackground(label.color), color: labelTextColor(label.color), borderColor: label.color }}
    >
      {label.title}
    </span>
  );
}

export function TabNav({ tabs }: { tabs: Array<{ to: string; label: string; count?: number; end?: boolean }> }) {
  return (
    <ul className="nav gl-tabs-nav project-tabs-nav">
      {tabs.map((tab) => (
        <li key={`${tab.to}-${tab.label}`} className="nav-item">
          <NavLink to={tab.to} end={tab.end} className={({ isActive }) => classNames('nav-link gl-tab-nav-item', isActive && 'gl-tab-nav-item-active')}>
            {tab.label}
            {tab.count !== undefined ? <CountPill value={tab.count} /> : null}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export function ProjectLinkButton({ project, suffix, label }: { project: Project; suffix?: string; label: string }) {
  return <NavLink to={`${getProjectPath(project)}${suffix ?? ''}`} className="gl-button btn btn-default">{label}</NavLink>;
}
