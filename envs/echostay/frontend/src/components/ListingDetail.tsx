import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiHeart, FiMessageSquare, FiChevronLeft, FiChevronRight, FiPlus } from 'react-icons/fi';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { differenceInYears, parseISO, format } from 'date-fns';
import type { Listing, CalendarDay, Wishlist } from '../types';
import { useAppContext } from '../App';
import { getListing, sendMessage, getListingCalendar, getWishlists, createWishlist, addToWishlist } from '../api';
import PhotoGallery from './PhotoGallery';
import AmenityList from './AmenityList';
import ReservationWidget from './ReservationWidget';
import ReviewSection from './ReviewSection';

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { selectedCurrency, wishedListingIds, toggleWish, markWished, user, addToast } = useAppContext();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactModal, setContactModal] = useState(false);
  const [contactMsg, setContactMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [wishlistModal, setWishlistModal] = useState(false);
  const [wishlists, setWishlistsLocal] = useState<Wishlist[]>([]);
  const [newWishlistName, setNewWishlistName] = useState('');
  const [savingWishlist, setSavingWishlist] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getListing(parseInt(id))
      .then(setListing)
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    getListingCalendar(parseInt(id), calendarMonth)
      .then((data) => setCalendarDays(data.days))
      .catch(() => setCalendarDays([]));
  }, [id, calendarMonth]);

  function navigateCalendarMonth(direction: number) {
    const [y, m] = calendarMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + direction, 1);
    setCalendarMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-semibold">Listing not found</h1>
      </div>
    );
  }

  const isWished = wishedListingIds.has(listing.id);
  const host = listing.host;
  const hostYears = host?.member_since
    ? differenceInYears(new Date(), parseISO(host.member_since))
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 pt-[160px] pb-6">
      {/* Title */}
      <div className="mb-2">
        <div className="flex items-start justify-between">
          <h1 className="text-[26px] font-semibold leading-tight">{listing.title}</h1>
          <button
            onClick={() => {
              if (!user) { navigate('/login'); return; }
              getWishlists().then(setWishlistsLocal).catch(() => {});
              setWishlistModal(true);
            }}
            className="flex items-center gap-1 text-sm font-medium underline hover:opacity-70 transition flex-shrink-0 ml-4 mt-1"
          >
            {isWished ? (
              <FaHeart className="w-4 h-4 text-red-500" />
            ) : (
              <FaRegHeart className="w-4 h-4" />
            )}
            {isWished ? 'Saved to Wishlist' : 'Save to Wishlist'}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {listing.room_type} in {listing.city}, {listing.state}, {listing.country}
        </p>
      </div>

      {/* Photo gallery */}
      <div className="mt-4 overflow-hidden">
        <PhotoGallery images={listing.images} />
      </div>

      {/* Full-width sections between gallery and two-column area */}
      {/* Guest favourite badge */}
      <div className="mt-6 py-6 border-b">
        <div className="flex items-center gap-4 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-2xl p-5">
          <span className="text-3xl">🏅</span>
          <div>
            <p className="text-sm font-semibold text-gray-900">Guest favourite</p>
            <p className="text-xs text-gray-500 mt-0.5">One of the most loved homes on EchoStay</p>
          </div>
          <div className="flex items-center gap-4 flex-1 justify-end">
            <div className="flex flex-col items-center px-4">
              <span className="text-xl font-bold">{listing.avg_rating != null ? listing.avg_rating.toFixed(2) : '—'}</span>
            </div>
            <div className="border-l border-rose-200 pl-4">
              <p className="text-xs text-gray-500">
                {listing.review_count} review{listing.review_count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Specs row */}
      <div className="py-6 border-b">
        <p className="text-gray-700">
          {listing.max_guests} guest{listing.max_guests !== 1 ? 's' : ''}
          {' · '}
          {listing.bedrooms} bedroom{listing.bedrooms !== 1 ? 's' : ''}
          {' · '}
          {listing.beds} bed{listing.beds !== 1 ? 's' : ''}
          {' · '}
          {listing.bathrooms} bath{listing.bathrooms !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Price display */}
      <div className="py-4 border-b">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">
            ${listing.price_per_night.toFixed(2)}
          </span>
          <span className="text-base text-gray-500">/ night</span>
        </div>
        {listing.cleaning_fee > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            + ${listing.cleaning_fee.toFixed(2)} cleaning fee
          </p>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-2">
        {/* Left column (2/3 width) */}
        <div className="lg:col-span-2">
          {/* Host info row */}
          <div className="flex items-start gap-4 py-6 border-b">
            {host && (
              <>
                {host.avatar_url ? (
                  <img
                    src={host.avatar_url}
                    alt={host.name}
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.startsWith('/api/images/proxy')) {
                        target.src = `/api/images/proxy?url=${encodeURIComponent(host.avatar_url!)}`;
                      } else {
                        target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect fill="%23e5e7eb" width="64" height="64" rx="32"/><text fill="%239ca3af" font-family="sans-serif" font-size="24" text-anchor="middle" x="32" y="38">?</text></svg>';
                      }
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-800 text-white flex items-center justify-center text-2xl font-semibold flex-shrink-0">
                    {host.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-lg">Hosted by {host.name}</p>
                    {host.is_superhost && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                        🏅 Superhost
                      </span>
                    )}
                    {(host as any).identity_verified && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        ✓ Identity verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {hostYears <= 0 ? 'New host' : `Joined in ${host.member_since ? new Date(host.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}`}
                    {' · '}
                    {(host as any).total_reviews_received || 0} review{((host as any).total_reviews_received || 0) !== 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>Response rate: {(host as any).response_rate ?? 100}%</span>
                    <span>Response time: {(host as any).response_time ?? 'within an hour'}</span>
                  </div>
                  {host.bio && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-3">{host.bio}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (!user) { navigate('/login'); return; }
                    setContactModal(true);
                  }}
                  className="flex-shrink-0 flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition"
                >
                  <FiMessageSquare className="w-4 h-4" />
                  Contact Host
                </button>
              </>
            )}
          </div>

          {/* Description */}
          <div className="py-6 border-b">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Cancellation Policy & House Rules */}
          <div className="py-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">📋</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Cancellation policy</p>
                  <p className="text-sm text-gray-600 capitalize">{listing.cancellation_policy}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🕐</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Check-in / Check-out</p>
                  <p className="text-sm text-gray-600">{listing.check_in_time} / {listing.check_out_time}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🌙</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Stay length</p>
                  <p className="text-sm text-gray-600">{listing.min_nights} night min · {listing.max_nights} nights max</p>
                </div>
              </div>
              {listing.instant_book && (
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚡</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Instant Book</p>
                    <p className="text-sm text-gray-600">Book without waiting for host approval</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Amenities */}
          <div className="py-6 border-b">
            <AmenityList amenities={listing.amenities || []} />
          </div>
        </div>

        {/* Right column (1/3 width) - Sticky ReservationWidget */}
        <div className="lg:col-span-1">
          <div className="sticky top-[172px]">
            <ReservationWidget listing={listing} />
          </div>
        </div>
      </div>

      {/* Review section */}
      <div className="border-t mt-2">
        <ReviewSection
          listingId={listing.id}
          avgRating={listing.avg_rating}
          reviewCount={listing.review_count}
        />
      </div>

      {/* Availability Calendar */}
      <div className="border-t mt-2 pt-8 pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Availability Calendar</h2>
        <div className="max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigateCalendarMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-medium text-gray-900">
              {(() => {
                const [y, m] = calendarMonth.split('-').map(Number);
                return format(new Date(y, m - 1, 1), 'MMMM yyyy');
              })()}
            </h3>
            <button onClick={() => navigateCalendarMonth(1)} className="p-2 hover:bg-gray-100 rounded-full transition">
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
              const [y, m] = calendarMonth.split('-').map(Number);
              const firstDay = new Date(y, m - 1, 1).getDay();
              const cells: React.ReactNode[] = [];

              for (let i = 0; i < firstDay; i++) {
                cells.push(<div key={`empty-${i}`} />);
              }

              for (const day of calendarDays) {
                const dayNum = parseInt(day.date.split('-')[2]);
                const statusColors: Record<string, string> = {
                  available: 'bg-green-50 text-green-800 hover:bg-green-100 cursor-pointer',
                  booked: 'bg-red-50 text-red-600',
                  blocked: 'bg-gray-200 text-gray-500',
                  past: 'bg-gray-50 text-gray-300',
                };
                cells.push(
                  <div
                    key={day.date}
                    className={`h-10 flex items-center justify-center rounded-lg text-sm font-medium ${statusColors[day.status] || 'bg-gray-50 text-gray-400'}`}
                    title={day.status === 'blocked' ? `Blocked: ${day.reason}` : day.status}
                  >
                    {dayNum}
                  </div>
                );
              }
              return cells;
            })()}
          </div>

          {/* Legend */}
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
        </div>
      </div>

      {/* Wishlist Picker Modal */}
      {wishlistModal && listing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Save to wishlist</h3>
            {wishlists.length > 0 && (
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {wishlists.map((wl) => (
                  <button
                    key={wl.id}
                    onClick={async () => {
                      setSavingWishlist(true);
                      try {
                        await addToWishlist(wl.id, listing.id);
                        addToast('success', `Saved to "${wl.name}"`);
                        markWished(listing.id);
                        setWishlistModal(false);
                      } catch {
                        addToast('error', 'Failed to save to wishlist');
                      } finally {
                        setSavingWishlist(false);
                      }
                    }}
                    disabled={savingWishlist}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-sm font-medium text-gray-900"
                  >
                    {wl.name}
                    <span className="text-gray-400 ml-2 text-xs">{wl.item_count} {wl.item_count === 1 ? 'stay' : 'stays'}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                placeholder="New wishlist name"
                value={newWishlistName}
                onChange={(e) => setNewWishlistName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newWishlistName.trim()) {
                    (async () => {
                      setSavingWishlist(true);
                      try {
                        const wl = await createWishlist(newWishlistName.trim());
                        await addToWishlist(wl.id, listing.id);
                        addToast('success', `Created "${wl.name}" and saved listing`);
                        markWished(listing.id);
                        setWishlistModal(false);
                        setNewWishlistName('');
                      } catch {
                        addToast('error', 'Failed to create wishlist');
                      } finally {
                        setSavingWishlist(false);
                      }
                    })();
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                onClick={async () => {
                  if (!newWishlistName.trim()) return;
                  setSavingWishlist(true);
                  try {
                    const wl = await createWishlist(newWishlistName.trim());
                    await addToWishlist(wl.id, listing.id);
                    addToast('success', `Created "${wl.name}" and saved listing`);
                    markWished(listing.id);
                    setWishlistModal(false);
                    setNewWishlistName('');
                  } catch {
                    addToast('error', 'Failed to create wishlist');
                  } finally {
                    setSavingWishlist(false);
                  }
                }}
                disabled={savingWishlist || !newWishlistName.trim()}
                className="flex items-center gap-1 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
              >
                <FiPlus className="w-4 h-4" />
                Create
              </button>
            </div>
            <button
              onClick={() => { setWishlistModal(false); setNewWishlistName(''); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Contact Host Modal */}
      {contactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Message to {host?.name}</h3>
            <textarea
              value={contactMsg}
              onChange={(e) => setContactMsg(e.target.value)}
              placeholder="Hi! I have a question about your listing..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none h-32 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => { setContactModal(false); setContactMsg(''); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!contactMsg.trim()) return;
                  setSending(true);
                  try {
                    await sendMessage({ listing_id: listing.id, host_id: listing.host_id, content: contactMsg.trim() });
                    addToast('success', 'Message sent!');
                    setContactModal(false);
                    setContactMsg('');
                  } catch {
                    addToast('error', 'Failed to send message');
                  } finally {
                    setSending(false);
                  }
                }}
                disabled={sending || !contactMsg.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-500 rounded-lg hover:bg-rose-600 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
