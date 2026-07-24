import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiStar, FiMinus, FiPlus, FiCheck } from 'react-icons/fi';
import { differenceInDays, parseISO, format } from 'date-fns';
import type { Listing, Booking } from '../types';
import { useAppContext } from '../App';
import { createBooking } from '../api';
import DateInput from './DateInput';
import { ENV_TODAY_STR } from '../lib/benchmark';

interface ReservationWidgetProps {
  listing: Listing;
  onDateSelect?: (dateStr: string) => void;
}

export default function ReservationWidget({ listing, onDateSelect }: ReservationWidgetProps) {
  const { user, selectedCurrency, addToast } = useAppContext();
  const navigate = useNavigate();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const rate = selectedCurrency?.exchange_rate ?? 1;
  const symbol = selectedCurrency?.symbol ?? '$';

  const convertedPriceNum = listing.price_per_night * rate;
  const convertedPrice = convertedPriceNum.toFixed(2);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = differenceInDays(parseISO(checkOut), parseISO(checkIn));
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  const basePrice = convertedPriceNum * nights;
  const cleaningFee = nights > 0 ? listing.cleaning_fee * rate : 0;
  const serviceFee = nights > 0 ? basePrice * listing.service_fee_percent / 100 : 0;
  const total = basePrice + cleaningFee + serviceFee;

  const handleReserve = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!checkIn || !checkOut) {
      addToast('error', 'Please select check-in and check-out dates.');
      return;
    }
    if (nights <= 0) {
      addToast('error', 'Check-out must be after check-in.');
      return;
    }

    setLoading(true);
    try {
      const booking = await createBooking({
        listing_id: listing.id,
        check_in: checkIn,
        check_out: checkOut,
        num_guests: guestCount,
        num_adults: guestCount,
        currency: selectedCurrency?.code || 'USD',
      });
      setConfirmedBooking(booking);
      addToast('success', 'Reservation confirmed!');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Booking failed.');
    } finally {
      setLoading(false);
    }
  };

  if (confirmedBooking) {
    return (
      <div className="border border-gray-200 rounded-xl shadow-lg p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">Booking confirmed!</h3>
          <p className="text-sm text-gray-500 mb-4">Your reservation is all set</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Confirmation Code</p>
            <p className="text-lg font-bold text-gray-900">{confirmedBooking.confirmation_code}</p>
          </div>
          <div className="text-left space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Check-in</span>
              <span className="font-medium">{format(parseISO(confirmedBooking.check_in), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-out</span>
              <span className="font-medium">{format(parseISO(confirmedBooking.check_out), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Guests</span>
              <span className="font-medium">{confirmedBooking.num_guests}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold">
              <span>Total</span>
              <span>{symbol}{(confirmedBooking.total_price * rate).toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/trips')}
            className="w-full py-3 rounded-lg text-white font-semibold text-base bg-gradient-to-r from-[#E61E4D] to-[#D70466] hover:opacity-90 transition"
          >
            Go to Trips
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl shadow-lg p-6">
      {/* Price & rating */}
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <span className="text-2xl font-semibold">{symbol}{convertedPrice}</span>
          <span className="text-gray-500 ml-1">night</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <FiStar className="w-4 h-4" />
          <span className="font-medium">
            {listing.avg_rating != null ? listing.avg_rating.toFixed(2) : 'New'}
          </span>
          {listing.review_count > 0 && (
            <span className="text-gray-500 ml-1">
              · {listing.review_count} review{listing.review_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Date inputs */}
      <div className="border border-gray-300 rounded-xl overflow-hidden mb-4">
        <div className="grid grid-cols-2">
          <div className="p-3 border-r border-gray-300">
            <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-700">
              Check-in
            </label>
            <DateInput
              value={checkIn}
              min={ENV_TODAY_STR}
              onChange={(v) => setCheckIn(v)}
              className="w-full text-sm outline-none mt-1"
            />
          </div>
          <div className="p-3">
            <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-700">
              Checkout
            </label>
            <DateInput
              value={checkOut}
              min={checkIn || ENV_TODAY_STR}
              onChange={(v) => setCheckOut(v)}
              className="w-full text-sm outline-none mt-1"
            />
          </div>
        </div>

        {/* Guest selector */}
        <div className="p-3 border-t border-gray-300">
          <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-700 mb-1">
            Guests
          </label>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
              disabled={guestCount <= 1}
              data-testid="decrease-guests-button"
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-800 transition"
              aria-label="Decrease guests"
            >
              <FiMinus className="w-4 h-4" />
            </button>
            {/* Direct-entry guest count: pick the exact number of guests in one step. */}
            <select
              data-testid="guest-count-select"
              id="guest-count-select"
              aria-label="Number of guests"
              value={guestCount}
              onChange={(e) => setGuestCount(Math.min(listing.max_guests, Math.max(1, Number(e.target.value))))}
              className="text-sm font-medium border border-gray-300 rounded-md px-2 py-1"
            >
              {Array.from({ length: Math.max(1, listing.max_guests) }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n} guest{n !== 1 ? 's' : ''}</option>
              ))}
            </select>
            <button
              onClick={() => setGuestCount((g) => Math.min(listing.max_guests, g + 1))}
              disabled={guestCount >= listing.max_guests}
              data-testid="increase-guests-button"
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-800 transition"
              aria-label="Increase guests"
            >
              <FiPlus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Reserve button */}
      <button
        onClick={handleReserve}
        disabled={loading}
        data-testid="reserve-button"
        className="w-full py-3 rounded-lg text-white font-semibold text-base bg-gradient-to-r from-[#E61E4D] to-[#D70466] hover:opacity-90 transition disabled:opacity-60"
      >
        {loading ? 'Reserving…' : listing.instant_book ? 'Reserve' : 'Request to book'}
      </button>

      {nights > 0 && (
        <p className="text-center text-sm text-gray-500 mt-2">
          {listing.instant_book ? "You won't be charged yet" : 'The host will review your request'}
        </p>
      )}

      {/* Cancellation policy */}
      {listing.cancellation_policy && (
        <p className="text-xs text-gray-500 mt-3 text-center">
          {listing.cancellation_policy === 'flexible'
            ? 'Free cancellation within 48 hours of booking'
            : listing.cancellation_policy === 'moderate'
              ? 'Free cancellation up to 5 days before check-in'
              : 'Non-refundable. 50% refund up to 1 week before check-in'}
          {' · '}
          <span className="capitalize font-medium">{listing.cancellation_policy}</span> policy
        </p>
      )}

      {/* Price breakdown */}
      {nights > 0 && (
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="underline text-gray-700">
              {symbol}{convertedPrice} × {nights} night{nights !== 1 ? 's' : ''}
            </span>
            <span>{symbol}{basePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="underline text-gray-700">Cleaning fee</span>
            <span>{symbol}{cleaningFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="underline text-gray-700">Service fee</span>
            <span>{symbol}{serviceFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-gray-200 font-semibold">
            <span>Total</span>
            <span>{symbol}{total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
