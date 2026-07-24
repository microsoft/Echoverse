import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiCalendar, FiStar, FiDollarSign, FiSettings, FiCheck, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { format } from 'date-fns';
import { useAppContext } from '../App';
import { getHostListings, getHostStats, getHostBookings, updateListingSettings, approveBooking, declineBooking, getListingCalendar, blockDates, unblockDates, createHostListing } from '../api';
import type { Listing, Booking, HostStats, HostListingSettings, CalendarDay } from '../types';

export default function HostDashboard() {
  const { user, addToast } = useAppContext();
  const [stats, setStats] = useState<HostStats | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [settingsForm, setSettingsForm] = useState<Partial<HostListingSettings>>({});
  const [saving, setSaving] = useState(false);
  const [availabilityListingId, setAvailabilityListingId] = useState<number | null>(null);
  const [availabilityMonth, setAvailabilityMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [availabilityDays, setAvailabilityDays] = useState<CalendarDay[]>([]);
  const [blockReason, setBlockReason] = useState('unavailable');
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [creatingListing, setCreatingListing] = useState(false);
  const [newListing, setNewListing] = useState({
    title: '', description: '', property_type: 'Apartment', city: '', state: '', country: '',
    price_per_night: 100, bedrooms: 1, beds: 1, bathrooms: 1, max_guests: 2,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [s, l, b] = await Promise.all([getHostStats(), getHostListings(), getHostBookings()]);
      setStats(s);
      setListings(l);
      setBookings(b.bookings);
    } catch {
      addToast('error', 'Failed to load host data');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (user) void fetchData();
    else setLoading(false);
  }, [user, fetchData]);

  useEffect(() => {
    if (availabilityListingId) {
      getListingCalendar(availabilityListingId, availabilityMonth)
        .then((data) => setAvailabilityDays(data.days))
        .catch(() => setAvailabilityDays([]));
    }
  }, [availabilityListingId, availabilityMonth]);

  function navigateAvailMonth(direction: number) {
    const [y, m] = availabilityMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + direction, 1);
    setAvailabilityMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  async function handleBlockDate(dateStr: string) {
    if (!availabilityListingId) return;
    try {
      await blockDates(availabilityListingId, [dateStr], blockReason);
      const cal = await getListingCalendar(availabilityListingId, availabilityMonth);
      setAvailabilityDays(cal.days);
      addToast('success', 'Date blocked');
    } catch {
      addToast('error', 'Failed to block date');
    }
  }

  async function handleUnblockDate(dateStr: string) {
    if (!availabilityListingId) return;
    try {
      await unblockDates(availabilityListingId, [dateStr]);
      const cal = await getListingCalendar(availabilityListingId, availabilityMonth);
      setAvailabilityDays(cal.days);
      addToast('success', 'Date unblocked');
    } catch {
      addToast('error', 'Failed to unblock date');
    }
  }

  function openSettings(listing: Listing) {
    setSelectedListing(listing);
    setSettingsForm({
      instant_book: listing.instant_book,
      cancellation_policy: listing.cancellation_policy,
      advance_notice_days: listing.advance_notice_days,
      preparation_time_days: listing.preparation_time_days,
      min_nights: listing.min_nights,
      max_nights: listing.max_nights,
      price_per_night: listing.price_per_night,
      cleaning_fee: listing.cleaning_fee,
      is_active: listing.is_active,
      require_profile_photo: listing.require_profile_photo,
      require_identity_verified: listing.require_identity_verified,
    });
  }

  async function handleSaveSettings() {
    if (!selectedListing) return;
    setSaving(true);
    try {
      const updated = await updateListingSettings(selectedListing.id, settingsForm);
      setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setSelectedListing(null);
      addToast('success', 'Settings updated');
    } catch {
      addToast('error', 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleInstantBook(listing: Listing) {
    try {
      const updated = await updateListingSettings(listing.id, { instant_book: !listing.instant_book });
      setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch {
      addToast('error', 'Failed to toggle instant book');
    }
  }

  async function handleToggleActive(listing: Listing) {
    try {
      const updated = await updateListingSettings(listing.id, { is_active: !listing.is_active });
      setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch {
      addToast('error', 'Failed to toggle active status');
    }
  }

  async function handleCreateListing() {
    if (!newListing.title.trim()) { addToast('error', 'Title is required'); return; }
    setCreatingListing(true);
    try {
      const created = await createHostListing(newListing);
      setListings((prev) => [...prev, created]);
      setShowCreateListing(false);
      setNewListing({ title: '', description: '', property_type: 'Apartment', city: '', state: '', country: '', price_per_night: 100, bedrooms: 1, beds: 1, bathrooms: 1, max_guests: 2 });
      addToast('success', 'Listing created!');
    } catch {
      addToast('error', 'Failed to create listing');
    } finally {
      setCreatingListing(false);
    }
  }

  async function handleApprove(bookingId: number) {
    try {
      const updated = await approveBooking(bookingId);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
      addToast('success', 'Booking approved');
    } catch {
      addToast('error', 'Failed to approve booking');
    }
  }

  async function handleDecline(bookingId: number) {
    try {
      const updated = await declineBooking(bookingId);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
      addToast('success', 'Booking declined');
    } catch {
      addToast('error', 'Failed to decline booking');
    }
  }

  if (!user) {
    return (
      <div className="pt-[160px] min-h-screen flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Log in to manage your listings</h2>
        <Link to="/login" className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-lg transition">
          Log in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-[160px] min-h-screen px-6">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  const pendingBookings = bookings.filter((b) => b.status === 'requested');

  return (
    <div className="pt-[160px] min-h-screen px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Hosting Dashboard</h1>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <FiHome className="w-5 h-5 text-rose-500" />
                <span className="text-sm text-gray-500">Total Listings</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_listings}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <FiCalendar className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-500">Active Bookings</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.active_bookings}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <FiStar className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-gray-500">Average Rating</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.avg_rating > 0 ? stats.avg_rating.toFixed(1) : '—'}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <FiDollarSign className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-500">Total Earnings</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">${stats.total_earnings.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Pending Booking Requests */}
        {pendingBookings.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Requests</h2>
            <div className="space-y-3">
              {pendingBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div>
                    <p className="font-medium text-gray-900">{b.listing?.title || `Listing #${b.listing_id}`}</p>
                    <p className="text-sm text-gray-600">{b.check_in} → {b.check_out} · {b.num_guests} guest{b.num_guests !== 1 ? 's' : ''}</p>
                    <p className="text-sm text-gray-500">${b.total_price.toFixed(2)} total</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(b.id)} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                      <FiCheck className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => handleDecline(b.id)} className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                      <FiX className="w-4 h-4" /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Listings Table */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Listings</h2>
        {listings.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-500 mb-4">You don't have any listings yet.</p>
            <button
              onClick={() => setShowCreateListing(true)}
              className="bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold rounded-lg px-6 py-3 transition"
            >
              Add your first listing
            </button>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Listing</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Price per Night</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Instant Book</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Rating</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {listing.images?.[0]?.url ? (
                          <img src={listing.images[0].url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
                        )}
                        <div>
                          <Link to={`/listings/${listing.id}`} className="font-medium text-gray-900 hover:underline text-sm">{listing.title}</Link>
                          <p className="text-xs text-gray-500">{listing.city}, {listing.country}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500">Edit Price</label>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-gray-500">$</span>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            defaultValue={listing.price_per_night}
                            aria-label={`Price per night for ${listing.title}`}
                            className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            onBlur={async (e) => {
                              const newPrice = parseFloat(e.target.value);
                              if (!isNaN(newPrice) && newPrice !== listing.price_per_night) {
                                try {
                                  const updated = await updateListingSettings(listing.id, { price_per_night: newPrice });
                                  setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
                                  addToast('success', `Price updated to $${newPrice.toFixed(2)}`);
                                } catch {
                                  addToast('error', 'Failed to update price');
                                  e.target.value = String(listing.price_per_night);
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            }}
                          />
                          <span className="text-sm text-gray-500">/night</span>
                        </div>
                        <span className="text-xs text-gray-400">Current: ${listing.price_per_night.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleInstantBook(listing)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${listing.instant_book ? 'bg-rose-500' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${listing.instant_book ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(listing)}
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${listing.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {listing.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {listing.review_count > 0 ? `${listing.avg_rating.toFixed(1)} (${listing.review_count})` : '—'}
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => openSettings(listing)}
                        className="text-gray-500 hover:text-gray-700 transition"
                        title="Settings"
                      >
                        <FiSettings className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setAvailabilityListingId(listing.id)}
                        className="text-gray-500 hover:text-gray-700 transition"
                        title="Manage availability"
                      >
                        <FiCalendar className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Settings Panel Modal */}
        {selectedListing && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedListing(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Settings: {selectedListing.title}</h3>
              <div className="space-y-5">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Instant Book</span>
                  <button
                    onClick={() => setSettingsForm((f) => ({ ...f, instant_book: !f.instant_book }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settingsForm.instant_book ? 'bg-rose-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settingsForm.instant_book ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Policy</label>
                  <select
                    value={settingsForm.cancellation_policy || 'flexible'}
                    onChange={(e) => setSettingsForm((f) => ({ ...f, cancellation_policy: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="flexible">Flexible</option>
                    <option value="moderate">Moderate</option>
                    <option value="strict">Strict</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Advance Notice (days)</label>
                    <input
                      type="number" min={0} max={7}
                      value={settingsForm.advance_notice_days ?? 0}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, advance_notice_days: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Time (days)</label>
                    <input
                      type="number" min={0} max={3}
                      value={settingsForm.preparation_time_days ?? 0}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, preparation_time_days: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Nights</label>
                    <input
                      type="number" min={1} max={30}
                      value={settingsForm.min_nights ?? 1}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, min_nights: parseInt(e.target.value) || 1 }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Nights</label>
                    <input
                      type="number" min={1} max={365}
                      value={settingsForm.max_nights ?? 365}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, max_nights: parseInt(e.target.value) || 365 }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price per Night ($)</label>
                    <input
                      type="number" min={0} step="0.01"
                      value={settingsForm.price_per_night ?? 0}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, price_per_night: parseFloat(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cleaning Fee ($)</label>
                    <input
                      type="number" min={0} step="0.01"
                      value={settingsForm.cleaning_fee ?? 0}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, cleaning_fee: parseFloat(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Active</span>
                  <button
                    onClick={() => setSettingsForm((f) => ({ ...f, is_active: !f.is_active }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settingsForm.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settingsForm.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Require Profile Photo</span>
                  <button
                    onClick={() => setSettingsForm((f) => ({ ...f, require_profile_photo: !f.require_profile_photo }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settingsForm.require_profile_photo ? 'bg-rose-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settingsForm.require_profile_photo ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Require Identity Verification</span>
                  <button
                    onClick={() => setSettingsForm((f) => ({ ...f, require_identity_verified: !f.require_identity_verified }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settingsForm.require_identity_verified ? 'bg-rose-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settingsForm.require_identity_verified ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </label>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setSelectedListing(null)}
                  className="flex-1 border border-gray-300 text-gray-700 font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold px-4 py-2.5 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Availability Management Modal */}
        {availabilityListingId !== null && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setAvailabilityListingId(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Manage Availability</h3>
                <button onClick={() => setAvailabilityListingId(null)} className="text-gray-400 hover:text-gray-600">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mr-2">Block reason:</label>
                <select
                  value={['unavailable', 'maintenance', 'personal'].includes(blockReason) ? blockReason : 'custom'}
                  onChange={(e) => setBlockReason(e.target.value === 'custom' ? '' : e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                >
                  <option value="unavailable">Unavailable</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="personal">Personal</option>
                  <option value="custom">Custom…</option>
                </select>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Custom reason"
                  aria-label="Block reason (custom)"
                  className="ml-2 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>

              <div className="flex items-center justify-between mb-4">
                <button onClick={() => navigateAvailMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                <h4 className="text-lg font-medium text-gray-900">
                  {(() => {
                    const [y, m] = availabilityMonth.split('-').map(Number);
                    return format(new Date(y, m - 1, 1), 'MMMM yyyy');
                  })()}
                </h4>
                <button onClick={() => navigateAvailMonth(1)} className="p-2 hover:bg-gray-100 rounded-full transition">
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-medium text-gray-500">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const [y, m] = availabilityMonth.split('-').map(Number);
                  const firstDay = new Date(y, m - 1, 1).getDay();
                  const cells: React.ReactNode[] = [];
                  for (let i = 0; i < firstDay; i++) {
                    cells.push(<div key={`empty-${i}`} />);
                  }
                  for (const day of availabilityDays) {
                    const dayNum = parseInt(day.date.split('-')[2]);
                    const statusColors: Record<string, string> = {
                      available: 'bg-green-50 text-green-800 hover:bg-green-200 cursor-pointer',
                      booked: 'bg-red-50 text-red-600',
                      blocked: 'bg-gray-200 text-gray-500 hover:bg-gray-300 cursor-pointer',
                      past: 'bg-gray-50 text-gray-300',
                    };
                    cells.push(
                      <div
                        key={day.date}
                        onClick={() => {
                          if (day.status === 'available') handleBlockDate(day.date);
                          else if (day.status === 'blocked') handleUnblockDate(day.date);
                        }}
                        className={`h-10 flex items-center justify-center rounded-lg text-sm font-medium transition ${statusColors[day.status] || ''}`}
                        title={day.status === 'blocked' ? `Blocked: ${day.reason} (click to unblock)` : day.status === 'available' ? 'Click to block' : day.status}
                      >
                        {dayNum}
                      </div>
                    );
                  }
                  return cells;
                })()}
              </div>

              <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-50 border border-green-200" /> Available
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-50 border border-red-200" /> Booked
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-gray-200 border border-gray-300" /> Blocked
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Click available dates to block, click blocked dates to unblock.</p>
            </div>
          </div>
        )}

        {/* Create Listing Modal */}
        {showCreateListing && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateListing(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Create a new listing</h3>
                <button onClick={() => setShowCreateListing(false)} className="text-gray-400 hover:text-gray-600">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input type="text" value={newListing.title} onChange={(e) => setNewListing({ ...newListing, title: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none" placeholder="Cozy apartment in downtown" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={newListing.description} onChange={(e) => setNewListing({ ...newListing, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none" rows={3} placeholder="Describe your space..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property type</label>
                    <select value={newListing.property_type} onChange={(e) => setNewListing({ ...newListing, property_type: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none">
                      {['Apartment', 'Home', 'Villa', 'Cabin', 'Condo', 'Loft', 'Studio'].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price per night ($)</label>
                    <input type="number" min={1} value={newListing.price_per_night} onChange={(e) => setNewListing({ ...newListing, price_per_night: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input type="text" value={newListing.city} onChange={(e) => setNewListing({ ...newListing, city: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input type="text" value={newListing.state} onChange={(e) => setNewListing({ ...newListing, state: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input type="text" value={newListing.country} onChange={(e) => setNewListing({ ...newListing, country: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                    <input type="number" min={0} value={newListing.bedrooms} onChange={(e) => setNewListing({ ...newListing, bedrooms: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Beds</label>
                    <input type="number" min={1} value={newListing.beds} onChange={(e) => setNewListing({ ...newListing, beds: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Baths</label>
                    <input type="number" min={0.5} step={0.5} value={newListing.bathrooms} onChange={(e) => setNewListing({ ...newListing, bathrooms: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max guests</label>
                    <input type="number" min={1} value={newListing.max_guests} onChange={(e) => setNewListing({ ...newListing, max_guests: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowCreateListing(false)} className="flex-1 border border-gray-300 text-gray-700 font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm">Cancel</button>
                  <button onClick={handleCreateListing} disabled={creatingListing || !newListing.title.trim()} className="flex-1 bg-[#FF385C] hover:bg-[#E31C5F] disabled:bg-rose-300 text-white font-semibold px-4 py-2.5 rounded-lg transition text-sm">
                    {creatingListing ? 'Creating...' : 'Create listing'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
