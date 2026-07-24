import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { FiMapPin, FiCalendar, FiUsers } from 'react-icons/fi';
import { getSharedBooking } from '../api';

interface SharedBookingData {
  id: number;
  listing_id: number;
  guest_first_name: string;
  check_in: string;
  check_out: string;
  num_guests: number;
  status: string;
  listing: {
    id: number;
    title: string;
    city: string;
    state: string;
    country: string;
    property_type: string;
    images: { id: number; url: string; caption?: string; sort_order: number }[];
    avg_rating: number;
    review_count: number;
  } | null;
  created_at: string;
}

export default function SharedTripPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedBookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getSharedBooking(token)
      .then((d) => setData(d as unknown as SharedBookingData))
      .catch(() => setError('This shared trip link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="pt-[160px] min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="pt-[160px] min-h-screen flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Trip not found</h2>
        <p className="text-gray-500 mb-6">{error || 'Unable to load this shared trip.'}</p>
        <Link to="/" className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-lg transition">
          Explore homes
        </Link>
      </div>
    );
  }

  const listing = data.listing;
  const mainImage = listing?.images?.[0]?.url;
  const checkInDate = format(parseISO(data.check_in), 'MMM d, yyyy');
  const checkOutDate = format(parseISO(data.check_out), 'MMM d, yyyy');

  return (
    <div className="pt-[160px] min-h-screen px-6 pb-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-sm text-gray-500 mb-2">Shared trip by {data.guest_first_name}</div>
        <Link to={`/listings/${listing?.id}`} className="hover:underline">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{listing?.title || 'Trip Details'}</h1>
        </Link>

        {mainImage && (
          <Link to={`/listings/${listing?.id}`} className="block rounded-2xl overflow-hidden mb-6">
            <img src={mainImage} alt={listing?.title} className="w-full h-72 object-cover hover:opacity-90 transition" />
          </Link>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          {listing && (
            <div className="flex items-center gap-2 text-gray-600">
              <FiMapPin className="w-5 h-5" />
              <span>{listing.city}{listing.state ? `, ${listing.state}` : ''}, {listing.country}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-gray-600">
            <FiCalendar className="w-5 h-5" />
            <span>{checkInDate} — {checkOutDate}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <FiUsers className="w-5 h-5" />
            <span>{data.num_guests} guest{data.num_guests !== 1 ? 's' : ''}</span>
          </div>

          {listing && listing.avg_rating > 0 && (
            <div className="flex items-center gap-1 text-gray-600">
              <span className="text-yellow-500">★</span>
              <span>{listing.avg_rating.toFixed(1)} ({listing.review_count} reviews)</span>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              data.status === 'confirmed' ? 'bg-green-100 text-green-800' :
              data.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
            </span>
          </div>
        </div>

        {listing && (
          <div className="mt-8 text-center">
            <Link
              to={`/listings/${listing.id}`}
              className="inline-block bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              Book a similar place
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
