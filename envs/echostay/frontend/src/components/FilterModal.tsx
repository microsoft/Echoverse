import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { FiX, FiMinus, FiPlus } from 'react-icons/fi';
import {
  FiWifi, FiTv, FiCoffee, FiHome, FiZap, FiHeart,
} from 'react-icons/fi';
import {
  FaSnowflake, FaParking, FaSwimmingPool, FaUmbrellaBeach,
  FaWater, FaTree, FaFan, FaFireExtinguisher,
} from 'react-icons/fa';
import { MdOutlineBalcony, MdOutlineLocalLaundryService, MdIron, MdOutlineKitchen } from 'react-icons/md';
import { useAppContext } from '../App';
import { getListings, getPropertyTypes, getAmenities } from '../api';
import type { SearchFilters, FilterOption } from '../types';

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  /** Extra params (e.g. location from the search bar) included in the live count. */
  baseParams?: Record<string, string | number | undefined>;
}

interface AmenityOption {
  id: number;
  name: string;
  category: string;
}

const ROOM_TYPE_TABS: { label: string; value: string | undefined }[] = [
  { label: 'Any type', value: undefined },
  { label: 'Room', value: 'Private room,Shared room' },
  { label: 'Entire home', value: 'Entire home/apt' },
];

function amenityIcon(name: string): React.ReactNode {
  const n = name.toLowerCase();
  if (n.includes('wifi')) return <FiWifi className="w-5 h-5" />;
  if (n.includes('air conditioning')) return <FaSnowflake className="w-5 h-5" />;
  if (n.includes('parking') || n.includes('garage')) return <FaParking className="w-5 h-5" />;
  if (n.includes('tv')) return <FiTv className="w-5 h-5" />;
  if (n.includes('iron')) return <MdIron className="w-5 h-5" />;
  if (n.includes('workspace')) return <MdOutlineBalcony className="w-5 h-5" />;
  if (n.includes('pool')) return <FaSwimmingPool className="w-5 h-5" />;
  if (n.includes('beach')) return <FaUmbrellaBeach className="w-5 h-5" />;
  if (n.includes('waterfront')) return <FaWater className="w-5 h-5" />;
  if (n.includes('garden') || n.includes('patio') || n.includes('bbq')) return <FaTree className="w-5 h-5" />;
  if (n.includes('washer') || n.includes('dryer') || n.includes('linen')) return <MdOutlineLocalLaundryService className="w-5 h-5" />;
  if (n.includes('fan')) return <FaFan className="w-5 h-5" />;
  if (n.includes('coffee') || n.includes('breakfast')) return <FiCoffee className="w-5 h-5" />;
  if (n.includes('kitchen') || n.includes('oven') || n.includes('microwave') || n.includes('refrigerator') || n.includes('dishes')) return <MdOutlineKitchen className="w-5 h-5" />;
  if (n.includes('extinguisher') || n.includes('alarm') || n.includes('first aid')) return <FaFireExtinguisher className="w-5 h-5" />;
  return <FiHome className="w-5 h-5" />;
}

function propertyIcon(): React.ReactNode {
  return <FiHome className="w-6 h-6" />;
}

/** Stepper row (Bedrooms / Beds / Bathrooms). */
function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <span className="text-base text-gray-800">{label}</span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
          aria-label={`Decrease ${label}`}
        >
          <FiMinus className="w-4 h-4" />
        </button>
        <span className="w-12 text-center text-sm">{value === 0 ? 'Any' : `${value}+`}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={value >= 8}
          className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
          aria-label={`Increase ${label}`}
        >
          <FiPlus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function FilterModal({ open, onClose, filters, onApply, baseParams }: FilterModalProps) {
  const { selectedCurrency } = useAppContext();
  const [draft, setDraft] = useState<SearchFilters>(filters);
  const [propertyTypes, setPropertyTypes] = useState<FilterOption[]>([]);
  const [amenityOptions, setAmenityOptions] = useState<AmenityOption[]>([]);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);

  const rate = selectedCurrency?.exchange_rate ?? 1;
  const symbol = selectedCurrency?.symbol ?? '$';

  // Sync draft when (re)opening
  useEffect(() => {
    if (open) {
      setDraft(filters);
      setShowAllAmenities(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    getPropertyTypes().then(setPropertyTypes).catch(() => {});
    getAmenities().then(setAmenityOptions).catch(() => {});
  }, []);

  // Lock background scroll while open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // Live count of matching listings for the current draft
  const draftKey = JSON.stringify({ ...baseParams, ...draft });
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setCounting(true);
    const t = setTimeout(() => {
      getListings({ ...baseParams, ...draft, page: 1, limit: 1 } as Parameters<typeof getListings>[0])
        .then((r) => { if (!cancelled) setCount(r.total); })
        .catch(() => { if (!cancelled) setCount(null); })
        .finally(() => { if (!cancelled) setCounting(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, open]);

  const patch = useCallback((p: Partial<SearchFilters>) => setDraft((d) => ({ ...d, ...p })), []);

  // --- Price (entered in the selected currency, stored as USD) ---
  const minPriceDisplay = draft.min_price !== undefined ? Math.round(draft.min_price * rate) : '';
  const maxPriceDisplay = draft.max_price !== undefined ? Math.round(draft.max_price * rate) : '';
  const setMinPrice = (v: string) => patch({ min_price: v ? Number(v) / rate : undefined });
  const setMaxPrice = (v: string) => patch({ max_price: v ? Number(v) / rate : undefined });

  // --- Amenities (array of string IDs) ---
  const selectedAmenities = draft.amenities ?? [];
  const toggleAmenity = (id: number) => {
    const s = String(id);
    const next = selectedAmenities.includes(s)
      ? selectedAmenities.filter((x) => x !== s)
      : [...selectedAmenities, s];
    patch({ amenities: next.length ? next : undefined });
  };
  const visibleAmenities = showAllAmenities ? amenityOptions : amenityOptions.slice(0, 8);

  // --- Property type (multi-select, comma-joined string) ---
  const selectedPropertyTypes = useMemo(
    () => (draft.property_type ? draft.property_type.split(',').map((s) => s.trim()).filter(Boolean) : []),
    [draft.property_type],
  );
  const togglePropertyType = (value: string) => {
    const next = selectedPropertyTypes.includes(value)
      ? selectedPropertyTypes.filter((x) => x !== value)
      : [...selectedPropertyTypes, value];
    patch({ property_type: next.length ? next.join(',') : undefined });
  };

  const clearAll = () => setDraft({
    location: draft.location,
    check_in: draft.check_in,
    check_out: draft.check_out,
    guests: draft.guests,
  });

  if (!open) return null;

  // Decorative price histogram bars
  const bars = [3, 5, 4, 6, 8, 7, 10, 14, 18, 22, 28, 24, 30, 26, 20, 16, 12, 10, 8, 6, 5, 4, 3, 2];

  const chip = (active: boolean) =>
    `inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm transition ${
      active ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900' : 'border-gray-300 hover:border-gray-900'
    }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal card */}
      <div className="relative mt-12 mb-12 w-full max-w-[640px] max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-center relative px-6 py-4 border-b border-gray-200">
          <button onClick={onClose} className="absolute left-4 p-2 rounded-full hover:bg-gray-100 transition" aria-label="Close filters">
            <FiX className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-gray-900">Filters</h2>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6">
          {/* Type of place */}
          <section className="py-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Type of place</h3>
            <div className="flex border border-gray-300 rounded-xl overflow-hidden">
              {ROOM_TYPE_TABS.map((tab) => {
                const active = (draft.room_type ?? undefined) === tab.value;
                return (
                  <button
                    key={tab.label}
                    onClick={() => patch({ room_type: tab.value })}
                    className={`flex-1 py-3 text-sm font-medium transition ${
                      active ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                    } ${tab.label !== 'Entire home' ? 'border-r border-gray-300' : ''}`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Price range */}
          <section className="py-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Price range</h3>
            <p className="text-sm text-gray-500 mb-4">Nightly price, includes all fees</p>
            <div className="flex items-end gap-[3px] h-20 mb-4 px-1">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 bg-rose-400 rounded-sm" style={{ height: `${h * 3}%` }} />
              ))}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <span className="block text-xs text-gray-500 mb-1">Minimum</span>
                <div className="flex items-center border border-gray-300 rounded-full px-4 py-2">
                  <span className="text-gray-500 mr-1">{symbol}</span>
                  <input
                    type="number" min={0} placeholder="0" value={minPriceDisplay}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full outline-none text-sm bg-transparent"
                  />
                </div>
              </label>
              <span className="text-gray-400 mt-5">–</span>
              <label className="flex-1">
                <span className="block text-xs text-gray-500 mb-1">Maximum</span>
                <div className="flex items-center border border-gray-300 rounded-full px-4 py-2">
                  <span className="text-gray-500 mr-1">{symbol}</span>
                  <input
                    type="number" min={0} placeholder="Any" value={maxPriceDisplay}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full outline-none text-sm bg-transparent"
                  />
                </div>
              </label>
            </div>
          </section>

          {/* Rooms and beds */}
          <section className="py-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Rooms and beds</h3>
            <Stepper label="Bedrooms" value={draft.min_bedrooms ?? 0} onChange={(v) => patch({ min_bedrooms: v || undefined })} />
            <Stepper label="Beds" value={draft.min_beds ?? 0} onChange={(v) => patch({ min_beds: v || undefined })} />
            <Stepper label="Bathrooms" value={draft.min_bathrooms ?? 0} onChange={(v) => patch({ min_bathrooms: v || undefined })} />
          </section>

          {/* Amenities */}
          <section className="py-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h3>
            <div className="flex flex-wrap gap-3">
              {visibleAmenities.map((a) => (
                <button key={a.id} onClick={() => toggleAmenity(a.id)} className={chip(selectedAmenities.includes(String(a.id)))}>
                  {amenityIcon(a.name)}
                  <span>{a.name}</span>
                </button>
              ))}
            </div>
            {amenityOptions.length > 8 && (
              <button
                onClick={() => setShowAllAmenities((s) => !s)}
                className="mt-4 text-sm font-semibold text-gray-900 underline"
              >
                {showAllAmenities ? 'Show less' : 'Show more'}
              </button>
            )}
          </section>

          {/* Booking options */}
          <section className="py-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Booking options</h3>
            <button
              onClick={() => patch({ instant_book: draft.instant_book ? undefined : true })}
              className={chip(draft.instant_book === true)}
            >
              <FiZap className="w-5 h-5" />
              <span>Instant Book</span>
            </button>
          </section>

          {/* Standout stays */}
          <section className="py-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Standout stays</h3>
            <button
              onClick={() => patch({ is_guest_favourite: draft.is_guest_favourite ? undefined : true })}
              className={`text-left w-full sm:w-72 p-4 rounded-xl border transition ${
                draft.is_guest_favourite ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-300 hover:border-gray-900'
              }`}
            >
              <FiHeart className="w-6 h-6 mb-2 text-rose-500" />
              <div className="font-semibold text-gray-900">Guest favourite</div>
              <div className="text-sm text-gray-500">The most loved homes on EchoStay</div>
            </button>
          </section>

          {/* Property type */}
          <section className="py-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Property type</h3>
            <div className="flex flex-wrap gap-3">
              {propertyTypes.map((pt) => (
                <button key={pt.value} onClick={() => togglePropertyType(pt.value)} className={chip(selectedPropertyTypes.includes(pt.value))}>
                  {propertyIcon()}
                  <span>{pt.value}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <button onClick={clearAll} className="text-sm font-semibold text-gray-900 underline">
            Clear all
          </button>
          <button
            onClick={() => { onApply(draft); onClose(); }}
            className="px-6 py-3 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition"
          >
            {counting || count === null ? 'Show places' : `Show ${count.toLocaleString()} ${count === 1 ? 'place' : 'places'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
