import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { FiPrinter, FiArrowLeft } from 'react-icons/fi';
import type { BookingReceipt as BookingReceiptType } from '../types';
import { getBookingReceipt } from '../api';

export default function BookingReceipt() {
  const { id } = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<BookingReceiptType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getBookingReceipt(parseInt(id))
      .then(setReceipt)
      .catch((err) => setError(err.message || 'Failed to load receipt'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="pt-[160px] min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="pt-[160px] min-h-screen flex flex-col items-center justify-center px-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Receipt not found</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <Link to="/trips" className="text-rose-500 hover:text-rose-600 font-medium">
          ← Back to Trips
        </Link>
      </div>
    );
  }

  const nightsCost = receipt.price_per_night * receipt.nights;

  return (
    <div className="pt-[160px] min-h-screen px-6 pb-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 print:hidden">
          <Link to="/trips" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
            <FiArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Trips</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <FiPrinter className="w-4 h-4" />
            Print
          </button>
        </div>

        {/* Receipt card */}
        <div className="border border-gray-200 rounded-xl p-8">
          {/* EchoStay branding */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Booking Receipt</h1>
              <p className="text-sm text-gray-500 mt-1">
                {receipt.booked_at ? format(parseISO(receipt.booked_at), 'MMMM d, yyyy') : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Confirmation Code</p>
              <p className="text-xl font-bold text-gray-900 font-mono">{receipt.confirmation_code}</p>
            </div>
          </div>

          {/* Listing info */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{receipt.listing_title}</h2>
            <p className="text-sm text-gray-500 mt-1">Hosted by {receipt.host_name}</p>
          </div>

          {/* Dates & guests */}
          <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-200">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Check-in</p>
              <p className="text-sm font-medium text-gray-900">
                {format(parseISO(receipt.check_in), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Check-out</p>
              <p className="text-sm font-medium text-gray-900">
                {format(parseISO(receipt.check_out), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Guests</p>
              <p className="text-sm font-medium text-gray-900">{receipt.guests} guest{receipt.guests !== 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{receipt.status}</p>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Price Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  ${receipt.price_per_night.toFixed(2)} × {receipt.nights} night{receipt.nights !== 1 ? 's' : ''}
                </span>
                <span className="text-gray-900">${nightsCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cleaning fee</span>
                <span className="text-gray-900">${receipt.cleaning_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service fee</span>
                <span className="text-gray-900">${receipt.service_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200 font-semibold text-base">
                <span className="text-gray-900">Total ({receipt.currency})</span>
                <span className="text-gray-900">${receipt.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Booking ID */}
          <div className="text-xs text-gray-400 pt-4 border-t border-gray-100">
            Booking ID: {receipt.booking_id}
          </div>
        </div>
      </div>
    </div>
  );
}
