import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO, isBefore } from 'date-fns';
import { FiGlobe, FiShare2, FiCopy, FiTrash2, FiX, FiFileText, FiMessageSquare, FiChevronDown, FiChevronUp, FiStar, FiEdit2 } from 'react-icons/fi';
import { useAppContext } from '../App';
import { getBookings, cancelBooking, shareBooking, getBookingShares, removeShare, payBooking, createReview, getMyReviews, updateBooking, deleteReview, updateReview } from '../api';
import type { Booking, ReservationShareItem, Review } from '../types';
import { envToday } from '../lib/benchmark';

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
  requested: 'bg-orange-100 text-orange-800',
  declined: 'bg-red-100 text-red-800',
  paid: 'bg-emerald-100 text-emerald-800',
};

export default function TripsPage() {
  const { user, addToast } = useAppContext();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [shareModalBookingId, setShareModalBookingId] = useState<number | null>(null);
  const [shares, setShares] = useState<ReservationShareItem[]>([]);
  const [shareEmail, setShareEmail] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [sharingInProgress, setSharingInProgress] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [expandedBookingId, setExpandedBookingId] = useState<number | null>(null);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<number>>(new Set());
  const [reviewMap, setReviewMap] = useState<Map<number, Review>>(new Map());
  const [reviewModalBookingId, setReviewModalBookingId] = useState<number | null>(null);
  const [reviewOverall, setReviewOverall] = useState(5);
  const [reviewCleanliness, setReviewCleanliness] = useState(5);
  const [reviewAccuracy, setReviewAccuracy] = useState(5);
  const [reviewCheckin, setReviewCheckin] = useState(5);
  const [reviewCommunication, setReviewCommunication] = useState(5);
  const [reviewLocation, setReviewLocation] = useState(5);
  const [reviewValue, setReviewValue] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [modifyingBookingId, setModifyingBookingId] = useState<number | null>(null);
  const [modifyCheckIn, setModifyCheckIn] = useState('');
  const [modifyCheckOut, setModifyCheckOut] = useState('');
  const [modifyGuests, setModifyGuests] = useState(1);
  const [savingModify, setSavingModify] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const [data, myReviews] = await Promise.all([getBookings(), getMyReviews()]);
      setBookings(data.bookings);
      setReviewedBookingIds(new Set(myReviews.map((r: Review) => r.booking_id)));
      const rMap = new Map<number, Review>();
      myReviews.forEach((r: Review) => rMap.set(r.booking_id, r));
      setReviewMap(rMap);
    } catch {
      addToast('error', 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (user) {
      void fetchBookings();
    } else {
      setLoading(false);
    }
  }, [user, fetchBookings]);

  function openReviewModal(bookingId: number) {
    setReviewModalBookingId(bookingId);
    setReviewOverall(5);
    setReviewCleanliness(5);
    setReviewAccuracy(5);
    setReviewCheckin(5);
    setReviewCommunication(5);
    setReviewLocation(5);
    setReviewValue(5);
    setReviewComment('');
  }

  function openModifyForm(booking: Booking) {
    setModifyingBookingId(booking.id);
    setModifyCheckIn(booking.check_in);
    setModifyCheckOut(booking.check_out);
    setModifyGuests(booking.num_guests);
  }

  async function handleSaveModify() {
    if (!modifyingBookingId) return;
    setSavingModify(true);
    try {
      const updated = await updateBooking(modifyingBookingId, {
        check_in: modifyCheckIn,
        check_out: modifyCheckOut,
        guests: modifyGuests,
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === modifyingBookingId ? { ...b, ...updated, listing: b.listing } : b))
      );
      setModifyingBookingId(null);
      addToast('success', 'Booking updated successfully');
    } catch {
      addToast('error', 'Failed to update booking');
    } finally {
      setSavingModify(false);
    }
  }

  async function handleSubmitReview() {
    if (!reviewModalBookingId) return;
    const booking = bookings.find((b) => b.id === reviewModalBookingId);
    if (!booking) return;
    setSubmittingReview(true);
    const existingReview = reviewMap.get(reviewModalBookingId);
    try {
      if (existingReview) {
        const updated = await updateReview(existingReview.id, {
          overall_rating: reviewOverall,
          cleanliness_rating: reviewCleanliness,
          accuracy_rating: reviewAccuracy,
          checkin_rating: reviewCheckin,
          communication_rating: reviewCommunication,
          location_rating: reviewLocation,
          value_rating: reviewValue,
          comment: reviewComment,
        });
        setReviewMap((prev) => new Map(prev).set(reviewModalBookingId, updated));
        addToast('success', 'Review updated!');
      } else {
        const created = await createReview({
          listing_id: booking.listing_id,
          booking_id: booking.id,
          overall_rating: reviewOverall,
          cleanliness_rating: reviewCleanliness,
          accuracy_rating: reviewAccuracy,
          checkin_rating: reviewCheckin,
          communication_rating: reviewCommunication,
          location_rating: reviewLocation,
          value_rating: reviewValue,
          comment: reviewComment,
        });
        setReviewedBookingIds((prev) => new Set([...prev, reviewModalBookingId]));
        setReviewMap((prev) => new Map(prev).set(reviewModalBookingId, created));
        addToast('success', 'Review submitted! Thank you for your feedback.');
      }
      setReviewModalBookingId(null);
    } catch {
      addToast('error', 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handleCancel(bookingId: number) {
    setCancellingId(bookingId);
    try {
      const updated = await cancelBooking(bookingId);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
      addToast('success', 'Booking cancelled successfully');
    } catch {
      addToast('error', 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  }

  async function handlePay(bookingId: number) {
    setPayingId(bookingId);
    try {
      const updated = await payBooking(bookingId);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, ...updated, listing: b.listing } : b)));
      addToast('success', 'Payment successful!');
    } catch {
      addToast('error', 'Payment failed');
    } finally {
      setPayingId(null);
    }
  }

  async function openShareModal(bookingId: number) {
    setShareModalBookingId(bookingId);
    setShareEmail('');
    setShareLink('');
    try {
      const existingShares = await getBookingShares(bookingId);
      setShares(existingShares);
    } catch {
      setShares([]);
    }
  }

  async function handleShare() {
    if (!shareModalBookingId) return;
    setSharingInProgress(true);
    try {
      const result = await shareBooking(shareModalBookingId, shareEmail);
      setShareLink(`${window.location.origin}${result.share_url}`);
      setShares((prev) => [...prev, result]);
      setShareEmail('');
      addToast('success', 'Share link created');
    } catch {
      addToast('error', 'Failed to share booking');
    } finally {
      setSharingInProgress(false);
    }
  }

  async function handleRemoveShare(bookingId: number, shareId: number) {
    try {
      await removeShare(bookingId, shareId);
      setShares((prev) => prev.filter((s) => s.id !== shareId));
      addToast('success', 'Share removed');
    } catch {
      addToast('error', 'Failed to remove share');
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => addToast('success', 'Link copied!')).catch(() => {});
  }

  if (!user) {
    return (
      <div className="pt-[160px] min-h-screen flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Log in to view your trips</h2>
        <p className="text-gray-500 mb-6">You need to be logged in to see your bookings.</p>
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
        <div className="max-w-5xl mx-auto">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const now = envToday();
  const upcoming = bookings.filter(
    (b) => (b.status === 'confirmed' || b.status === 'requested' || b.status === 'paid' || b.status === 'pending') && !isBefore(parseISO(b.check_in), now)
  );
  const completed = bookings.filter(
    (b) => b.status === 'completed' || (isBefore(parseISO(b.check_out), now) && b.status !== 'cancelled' && b.status !== 'declined')
  );
  const cancelled = bookings.filter(
    (b) => b.status === 'cancelled' || b.status === 'declined'
  );

  const displayedBookings = activeTab === 'upcoming' ? upcoming : activeTab === 'completed' ? completed : cancelled;

  function formatDateRange(checkIn: string, checkOut: string): string {
    const inDate = parseISO(checkIn);
    const outDate = parseISO(checkOut);
    const inMonth = format(inDate, 'MMM');
    const outMonth = format(outDate, 'MMM');
    const year = format(outDate, 'yyyy');
    if (inMonth === outMonth) {
      return `${inMonth} ${format(inDate, 'd')}-${format(outDate, 'd')}, ${year}`;
    }
    return `${format(inDate, 'MMM d')} - ${format(outDate, 'MMM d')}, ${year}`;
  }

  function renderBookingCard(booking: Booking) {
    const canCancel = booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'requested' || booking.status === 'paid';
    const canPay = booking.status === 'confirmed';
    const canModify = booking.status === 'confirmed' || booking.status === 'pending';
    const image = booking.listing?.images?.[0]?.url;
    const hostName = booking.listing?.host?.name;
    const isExpanded = expandedBookingId === booking.id;

    return (
      <div
        key={booking.id}
        className="flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Image - left side */}
          <Link
            to={`/listings/${booking.listing_id}`}
            className="sm:w-[40%] h-48 sm:h-auto flex-shrink-0"
          >
            {image ? (
              <img
                src={image}
                alt={booking.listing?.title ?? 'Listing'}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm rounded-xl">
                No image
              </div>
            )}
          </Link>

          {/* Details - right side */}
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div>
              <Link
                to={`/listings/${booking.listing_id}`}
                className="text-lg font-semibold text-gray-900 hover:underline line-clamp-1"
              >
                {booking.listing?.title ?? 'Listing'}
              </Link>

              {hostName && (
                <p className="text-sm text-gray-500 mt-1">Hosted by {hostName}</p>
              )}

              <p className="text-sm text-gray-600 mt-2">
                {formatDateRange(booking.check_in, booking.check_out)}
              </p>

              {booking.listing && (
                <p className="text-sm text-gray-500 mt-1">
                  {booking.listing.city}, {booking.listing.country}
                </p>
              )}

              <p className="text-sm text-gray-600 mt-1">
                {booking.num_guests} guest{booking.num_guests !== 1 ? 's' : ''} · ${booking.total_price.toFixed(2)} total
              </p>

              {booking.confirmation_code && (
                <p className="text-xs font-mono text-gray-500 mt-1">
                  Confirmation: <span className="font-semibold text-gray-700">{booking.confirmation_code}</span>
                </p>
              )}

              <div className="mt-3 flex items-center gap-2">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyles[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {canPay && (
                <button
                  onClick={() => handlePay(booking.id)}
                  disabled={payingId === booking.id}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700 underline disabled:opacity-50"
                >
                  {payingId === booking.id ? 'Processing...' : 'Mark as paid'}
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => handleCancel(booking.id)}
                  disabled={cancellingId === booking.id}
                  className="text-sm font-medium text-red-600 hover:text-red-700 underline disabled:opacity-50"
                >
                  {cancellingId === booking.id ? 'Cancelling...' : 'Cancel booking'}
                </button>
              )}
              {canModify && (
                <button
                  onClick={() => openModifyForm(booking)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
                >
                  Modify Booking
                </button>
              )}
              <Link
                to={`/bookings/${booking.id}/receipt`}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
              >
                <FiFileText className="w-4 h-4" /> View receipt
              </Link>
              <button
                onClick={() => openShareModal(booking.id)}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
              >
                <FiShare2 className="w-4 h-4" /> Share trip
              </button>
              {booking.listing?.host_id && (
                <Link
                  to="/messages"
                  className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
                >
                  <FiMessageSquare className="w-4 h-4" /> Contact host
                </Link>
              )}
              {booking.status === 'completed' && !reviewedBookingIds.has(booking.id) && (
                <button
                  onClick={() => openReviewModal(booking.id)}
                  className="flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-700 transition"
                >
                  <FiStar className="w-4 h-4" /> Write a Review
                </button>
              )}
              {booking.status === 'completed' && reviewedBookingIds.has(booking.id) && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                    <FiStar className="w-4 h-4" /> Reviewed
                  </span>
                  <button
                    onClick={() => {
                      const rev = reviewMap.get(booking.id);
                      if (rev) {
                        setReviewModalBookingId(booking.id);
                        setReviewOverall(rev.overall_rating);
                        setReviewCleanliness(rev.cleanliness_rating);
                        setReviewAccuracy(rev.accuracy_rating);
                        setReviewCheckin(rev.checkin_rating);
                        setReviewCommunication(rev.communication_rating);
                        setReviewLocation(rev.location_rating);
                        setReviewValue(rev.value_rating);
                        setReviewComment(rev.comment);
                      }
                    }}
                    className="text-gray-400 hover:text-gray-600 transition"
                    title="Edit review"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      const rev = reviewMap.get(booking.id);
                      if (rev && confirm('Delete this review?')) {
                        try {
                          await deleteReview(rev.id);
                          setReviewedBookingIds((prev) => { const n = new Set(prev); n.delete(booking.id); return n; });
                          setReviewMap((prev) => { const n = new Map(prev); n.delete(booking.id); return n; });
                          addToast('success', 'Review deleted');
                        } catch { addToast('error', 'Failed to delete review'); }
                      }
                    }}
                    className="text-gray-400 hover:text-red-500 transition"
                    title="Delete review"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button
                onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
              >
                {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                {isExpanded ? 'Less details' : 'More details'}
              </button>
            </div>
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Booking Details</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Check-in: {format(parseISO(booking.check_in), 'EEEE, MMMM d, yyyy')} · {booking.listing?.check_in_time || '3:00 PM'}</p>
                  <p>Check-out: {format(parseISO(booking.check_out), 'EEEE, MMMM d, yyyy')} · {booking.listing?.check_out_time || '11:00 AM'}</p>
                  {booking.confirmation_code && <p>Confirmation: {booking.confirmation_code}</p>}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Price Breakdown</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>${booking.price_per_night}/night × {Math.round((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24))} nights</p>
                  <p>Cleaning fee: ${booking.cleaning_fee.toFixed(2)}</p>
                  <p>Service fee: ${booking.service_fee.toFixed(2)}</p>
                  <p className="font-semibold text-gray-900">Total: ${booking.total_price.toFixed(2)}</p>
                </div>
              </div>
              {booking.listing?.host && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Host</h4>
                  <div className="flex items-center gap-2">
                    {booking.listing.host.avatar_url ? (
                      <img src={booking.listing.host.avatar_url} alt={booking.listing.host.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-semibold">
                        {booking.listing.host.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{booking.listing.host.name}</p>
                      {booking.listing.host.is_superhost && <span className="text-xs text-rose-600">🏅 Superhost</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modify Booking Form */}
        {modifyingBookingId === booking.id && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-3">Modify Booking</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Check-in</label>
                <input
                  type="date"
                  value={modifyCheckIn}
                  onChange={(e) => setModifyCheckIn(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Check-out</label>
                <input
                  type="date"
                  value={modifyCheckOut}
                  onChange={(e) => setModifyCheckOut(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Guests</label>
                <input
                  type="number"
                  min={1}
                  value={modifyGuests}
                  onChange={(e) => setModifyGuests(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-800"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setModifyingBookingId(null)}
                className="px-4 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModify}
                disabled={savingModify}
                className="px-4 py-1.5 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition hover:brightness-95"
                style={{ backgroundColor: '#FF385C' }}
              >
                {savingModify ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pt-[160px] min-h-screen px-6 pb-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Trips</h1>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'upcoming'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upcoming
            {activeTab === 'upcoming' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'completed'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Completed
            {activeTab === 'completed' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'cancelled'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Cancelled
            {activeTab === 'cancelled' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
            )}
          </button>
        </div>

        {/* Trip cards */}
        {displayedBookings.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {activeTab === 'upcoming' ? 'No upcoming trips' : activeTab === 'completed' ? 'No completed trips' : 'No cancelled trips'}
            </h2>
            <p className="text-gray-500 mb-6">
              {activeTab === 'upcoming'
                ? 'When you book a trip, it will show up here.'
                : activeTab === 'completed'
                  ? 'Your completed trips will appear here.'
                  : 'Your cancelled trips will appear here.'}
            </p>
            {activeTab === 'upcoming' && (
              <Link
                to="/"
                className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-lg transition"
              >
                Start exploring
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6">{displayedBookings.map(renderBookingCard)}</div>
        )}

        {/* Where to next section */}
        <div className="mt-16 border-t border-gray-200 pt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Where to next?</h2>
          <p className="text-gray-500 mb-6">Explore new destinations and plan your next adventure</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 border border-gray-900 text-gray-900 font-semibold px-5 py-3 rounded-lg hover:bg-gray-900 hover:text-white transition"
          >
            <FiGlobe className="w-5 h-5" />
            I&apos;m flexible
          </button>
        </div>

        {/* Share Modal */}
        {shareModalBookingId !== null && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShareModalBookingId(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Share this trip</h3>
                <button onClick={() => setShareModalBookingId(null)} className="text-gray-400 hover:text-gray-600">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {shareLink && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Shareable link</p>
                  <div className="flex items-center gap-2">
                    <input type="text" readOnly value={shareLink} className="flex-1 text-sm text-gray-700 bg-transparent outline-none truncate" />
                    <button onClick={() => copyToClipboard(shareLink)} className="text-rose-500 hover:text-rose-600">
                      <FiCopy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mb-4">
                <input
                  type="email"
                  placeholder="Email address (optional)"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  onClick={handleShare}
                  disabled={sharingInProgress}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
                >
                  {sharingInProgress ? '...' : 'Share'}
                </button>
              </div>

              {shares.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Shared with</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {shares.map((s) => (
                      <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-sm text-gray-700">{s.shared_with_email || 'Link share'}</p>
                          <p className="text-xs text-gray-400">{s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}</p>
                        </div>
                        <button onClick={() => handleRemoveShare(shareModalBookingId!, s.id)} className="text-gray-400 hover:text-red-500">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Review Modal */}
        {reviewModalBookingId !== null && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setReviewModalBookingId(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Write a Review</h3>
                <button onClick={() => setReviewModalBookingId(null)} className="text-gray-400 hover:text-gray-600">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Overall Rating */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Overall Rating *</label>
                  <StarSelector value={reviewOverall} onChange={setReviewOverall} />
                </div>

                {/* Sub-ratings */}
                <div className="grid grid-cols-2 gap-4">
                  {([
                    ['Cleanliness', reviewCleanliness, setReviewCleanliness] as const,
                    ['Accuracy', reviewAccuracy, setReviewAccuracy] as const,
                    ['Check-in', reviewCheckin, setReviewCheckin] as const,
                    ['Communication', reviewCommunication, setReviewCommunication] as const,
                    ['Location', reviewLocation, setReviewLocation] as const,
                    ['Value', reviewValue, setReviewValue] as const,
                  ]).map(([label, value, setter]) => (
                    <div key={label}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <StarSelector value={value} onChange={setter} size="sm" />
                    </div>
                  ))}
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Your Review</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview || !reviewComment.trim()}
                  className="w-full bg-[#FF385C] hover:bg-[#E31C5F] disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg text-sm transition"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StarSelector({ value, onChange, size = 'md' }: { value: number; onChange: (v: number) => void; size?: 'sm' | 'md' }) {
  const starSize = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <FiStar
            className={`${starSize} transition ${star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
}