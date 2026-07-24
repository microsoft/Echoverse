import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../App';
import { getSettings, updateSettings, getCurrencies, updateMe } from '../api';
import type { UserSettings, Currency } from '../types';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
];

export default function SettingsPage() {
  const { user, setUser, addToast } = useAppContext();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);

  // Local form state
  const [preferredCurrency, setPreferredCurrency] = useState('USD');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [theme, setTheme] = useState('light');
  const [notificationEmail, setNotificationEmail] = useState(true);
  const [notificationPush, setNotificationPush] = useState(true);

  const autoSave = async (field: string, value: any) => {
    try {
      const updated = await updateSettings({ [field]: value });
      setSettings(updated);
      const displayValue = typeof value === 'boolean' ? (value ? 'ON' : 'OFF') : value;
      addToast('success', `${field.replace(/_/g, ' ')} updated to ${displayValue}`);
    } catch { addToast('error', `Failed to save ${field}`); }
  };

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([getSettings(), getCurrencies()])
      .then(([s, c]) => {
        setSettings(s);
        setCurrencies(c);
        setPreferredCurrency(s.preferred_currency);
        setPreferredLanguage(s.preferred_language);
        setTheme(s.theme);
        setNotificationEmail(s.notification_email);
        setNotificationPush(s.notification_push);
      })
      .catch(() => addToast('error', 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, [user, addToast]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateSettings({
        preferred_currency: preferredCurrency,
        preferred_language: preferredLanguage,
        theme,
        notification_email: notificationEmail,
        notification_push: notificationPush,
      });
      setSettings(updated);
      setShowSavedConfirmation(true);
      addToast('success', 'Settings saved!');
    } catch {
      addToast('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function startEditProfile() {
    setProfileName(user?.name || '');
    setProfilePhone(user?.phone || '');
    setProfileBio(user?.bio || '');
    setEditingProfile(true);
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const updated = await updateMe({ name: profileName, phone: profilePhone, bio: profileBio });
      setUser({ ...user!, ...updated });
      setEditingProfile(false);
      addToast('success', 'Profile updated!');
    } catch {
      addToast('error', 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  }

  if (!user) {
    return (
      <div className="pt-[160px] min-h-screen flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Log in to view settings</h2>
        <p className="text-gray-500 mb-6">You need to be logged in to manage your settings.</p>
        <Link
          to="/login"
          className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-lg transition"
        >
          Log in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-[160px] min-h-screen px-6">
        <div className="max-w-2xl mx-auto">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-[160px] min-h-screen px-6 pb-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        {showSavedConfirmation && settings && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2">
                <span className="text-green-600">✓</span> Settings saved successfully
              </h3>
              <button
                onClick={() => setShowSavedConfirmation(false)}
                className="text-green-600 hover:text-green-800 text-sm"
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-green-700 font-medium">Currency:</span>{' '}
                <span className="text-green-900">{settings.preferred_currency}</span>
              </div>
              <div>
                <span className="text-green-700 font-medium">Language:</span>{' '}
                <span className="text-green-900">{settings.preferred_language}</span>
              </div>
              <div>
                <span className="text-green-700 font-medium">Theme:</span>{' '}
                <span className="text-green-900">{settings.theme}</span>
              </div>
              <div>
                <span className="text-green-700 font-medium">Email notifications:</span>{' '}
                <span className="text-green-900">{settings.notification_email ? 'ON' : 'OFF'}</span>
              </div>
              <div>
                <span className="text-green-700 font-medium">Push notifications:</span>{' '}
                <span className="text-green-900">{settings.notification_push ? 'ON' : 'OFF'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Profile Section */}
        <div className="mb-10 border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
            {!editingProfile && (
              <button
                onClick={startEditProfile}
                className="text-sm font-medium text-rose-500 hover:text-rose-600 underline transition"
              >
                Edit Profile
              </button>
            )}
          </div>

          {editingProfile ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingProfile(false)}
                  className="flex-1 border border-gray-300 text-gray-700 font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold px-4 py-2.5 rounded-lg transition text-sm"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium text-gray-900">Name:</span> {user?.name}</p>
              <p><span className="font-medium text-gray-900">Email:</span> {user?.email}</p>
              <p><span className="font-medium text-gray-900">Phone:</span> {user?.phone || '—'}</p>
              <p><span className="font-medium text-gray-900">Bio:</span> {user?.bio || '—'}</p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Currency */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Preferred currency
            </label>
            <select
              value={preferredCurrency}
              onChange={(e) => { setPreferredCurrency(e.target.value); autoSave('preferred_currency', e.target.value); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.symbol} {c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Preferred language
            </label>
            <select
              value={preferredLanguage}
              onChange={(e) => { setPreferredLanguage(e.target.value); autoSave('preferred_language', e.target.value); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Theme</label>
            <div className="flex gap-3">
              {['light', 'dark'].map((t) => (
                <button
                  key={t}
                  onClick={() => { setTheme(t); autoSave('theme', t); }}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium border transition ${
                    theme === t
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Notifications</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">Email notifications</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${notificationEmail ? 'text-green-600' : 'text-gray-400'}`}>
                    {notificationEmail ? 'ON' : 'OFF'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notificationEmail}
                    onClick={() => { const newVal = !notificationEmail; setNotificationEmail(newVal); autoSave('notification_email', newVal); }}
                    className={`relative w-11 h-6 rounded-full transition ${
                      notificationEmail ? 'bg-rose-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        notificationEmail ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">Push notifications</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${notificationPush ? 'text-green-600' : 'text-gray-400'}`}>
                    {notificationPush ? 'ON' : 'OFF'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notificationPush}
                    onClick={() => { const newVal = !notificationPush; setNotificationPush(newVal); autoSave('notification_push', newVal); }}
                    className={`relative w-11 h-6 rounded-full transition ${
                      notificationPush ? 'bg-rose-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        notificationPush ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
              </label>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold py-3 rounded-lg text-sm transition"
          >
            {saving ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
