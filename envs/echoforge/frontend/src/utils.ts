import type { Group, Issue, Member, MergeRequest, Project } from './types';

export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function relativeTime(value?: string | null): string {
  if (!value) return 'unknown';
  const now = Date.now();
  const then = new Date(value).getTime();
  const diffMinutes = Math.round((then - now) / 60000);
  const suffix = diffMinutes < 0 ? 'ago' : 'from now';
  const abs = Math.abs(diffMinutes);
  if (abs < 1) return 'just now';
  if (abs < 60) return `${abs}m ${suffix}`;
  const hours = Math.round(abs / 60);
  if (hours < 24) return `${hours}h ${suffix}`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ${suffix}`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ${suffix}`;
  const years = Math.round(months / 12);
  return `${years}y ${suffix}`;
}

export function getProjectPath(project: Pick<Project, 'full_path'>): string {
  return `/${project.full_path}`;
}

export function visibilityLabel(level: number): string {
  return level >= 30 ? 'Public' : level >= 20 ? 'Internal' : 'Private';
}

export function stateTone(state: string): 'success' | 'info' | 'danger' | 'muted' | 'warning' {
  switch (state) {
    case 'opened':
    case 'open':
    case 'active':
    case 'pending':
      return 'success';
    case 'merged':
    case 'done':
      return 'info';
    case 'closed':
      return 'danger';
    default:
      return 'muted';
  }
}

export function memberDisplayName(member: Member): string {
  return member.user?.name ?? member.name ?? member.user?.username ?? member.username;
}

export function memberUsername(member: Member): string {
  return member.user?.username ?? member.username;
}

export function issueAuthor(issue: Issue): string {
  return issue.author?.username ?? issue.author_username ?? 'unknown';
}

export function issueAssignee(issue: Issue): string {
  return issue.assignee?.username ?? issue.assignee_username ?? 'Unassigned';
}

export function mrAuthor(mergeRequest: MergeRequest): string {
  return mergeRequest.author?.username ?? mergeRequest.author_username ?? 'unknown';
}

export function initials(value: string): string {
  const words = value.split(/\s+/).filter(Boolean).slice(0, 2);
  return words.map((word) => word[0]?.toUpperCase() ?? '').join('') || '?';
}

export function formatCount(value: number): string {
  return Intl.NumberFormat().format(value);
}

export function parseHexColor(value: string): { r: number; g: number; b: number } {
  const normalized = value.replace('#', '');
  const hex = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized.padEnd(6, '0').slice(0, 6);
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
}

export function labelTextColor(value: string): string {
  const { r, g, b } = parseHexColor(value);
  const luminance = (0.299 * r) + (0.587 * g) + (0.114 * b);
  return luminance > 186 ? '#1f1e31' : '#ffffff';
}

export function labelBackground(value: string): string {
  const { r, g, b } = parseHexColor(value);
  return `rgba(${r}, ${g}, ${b}, 0.16)`;
}

export function namespaceName(item: Pick<Project, 'namespace_path'> | Pick<Group, 'path'>): string {
  return 'namespace_path' in item ? item.namespace_path : item.path;
}
