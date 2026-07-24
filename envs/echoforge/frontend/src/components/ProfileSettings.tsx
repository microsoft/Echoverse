import { useEffect, useState, type FormEvent } from 'react';
import { EmptyState, PageTitle, SectionCard } from '../echoforge-ui';
import { api } from '../api';
import type { User } from '../types';

export function ProfileSettings({ currentUser, onUserUpdated, addToast }: { currentUser: User | null; onUserUpdated: (user: User) => void; addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [form, setForm] = useState({ name: '', bio: '', location: '', website_url: '', organization: '', avatar_url: '', emoji: '', message: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setForm({
      name: currentUser.name,
      bio: currentUser.bio ?? '',
      location: currentUser.location ?? '',
      website_url: currentUser.website_url ?? '',
      organization: currentUser.organization ?? '',
      avatar_url: currentUser.avatar_url ?? '',
      emoji: currentUser.status_emoji ?? '',
      message: currentUser.status_message ?? '',
    });
  }, [currentUser]);

  if (!currentUser) return <EmptyState title="No current user" description="Sign in to update your profile." />;

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const [user, statusUser] = await Promise.all([
        api.updateUser({
          name: form.name,
          bio: form.bio,
          location: form.location,
          website_url: form.website_url,
          organization: form.organization,
          avatar_url: form.avatar_url,
        }),
        api.updateUserStatus({ emoji: form.emoji, message: form.message }),
      ]);
      onUserUpdated({ ...user, status_emoji: statusUser.status_emoji, status_message: statusUser.status_message });
      addToast('Profile updated', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageTitle title="Edit profile" description="Update public profile details and status." />
      <SectionCard className="form-card">
        <div className="card-body">
          <form onSubmit={save} className="form-grid">
            <div className="two-column-grid">
              <div className="field-group"><label className="field-label">Name</label><input className="gl-form-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></div>
              <div className="field-group"><label className="field-label">Location</label><input className="gl-form-input" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} /></div>
            </div>
            <div className="two-column-grid">
              <div className="field-group"><label className="field-label">Website</label><input className="gl-form-input" value={form.website_url} onChange={(event) => setForm((current) => ({ ...current, website_url: event.target.value }))} /></div>
              <div className="field-group"><label className="field-label">Organization</label><input className="gl-form-input" value={form.organization} onChange={(event) => setForm((current) => ({ ...current, organization: event.target.value }))} /></div>
            </div>
            <div className="two-column-grid">
              <div className="field-group"><label className="field-label">Avatar URL</label><input className="gl-form-input" value={form.avatar_url} onChange={(event) => setForm((current) => ({ ...current, avatar_url: event.target.value }))} /></div>
              <div className="field-group"><label className="field-label">Status emoji</label><input className="gl-form-input" value={form.emoji} onChange={(event) => setForm((current) => ({ ...current, emoji: event.target.value }))} /></div>
            </div>
            <div className="field-group"><label className="field-label">Status message</label><input className="gl-form-input" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} /></div>
            <div className="field-group"><label className="field-label">Bio</label><textarea className="gl-form-textarea" value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} /></div>
            <div className="inline-actions"><button disabled={saving} className="gl-button btn btn-success">{saving ? 'Saving…' : 'Save changes'}</button></div>
          </form>
        </div>
      </SectionCard>
    </div>
  );
}
