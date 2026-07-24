import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../App';
import { getListings, saveSearch, getPropertyTypes, getCities, getAmenities } from '../api';
import type { Listing, SearchFilters, FilterOption } from '../types';
import ListingCard from './ListingCard';
import MapView from './MapView';
import FilterModal from './FilterModal';

const SORT_OPTIONS: { label: string; value: string | undefined }[] = [
  { label: 'Recommended', value: undefined },
  { label: 'Price: low to high', value: 'price_asc' },
  { label: 'Price: high to low', value: 'price_desc' },
  { label: 'Top rated', value: 'rating' },
  { label: 'Newest', value: 'newest' },
];

const ROOM_TYPES = ['Entire home/apt', 'Private room', 'Hotel room', 'Shared room'];

// Property types and cities are fetched dynamically from the API inside the component.

type OpenDropdown = 'price' | 'room_type' | 'property_type' | 'city' | 'amenities' | 'booking_options' | 'rooms_beds' | 'sort' | null;

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function listener(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    }
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

function Counter({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
        >–</button>
        <span className="w-6 text-center text-sm">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-900"
        >+</button>
      </div>
    </div>
  );
}

export default function SearchResults() {
  const { searchFilters, setSearchFilters } = useAppContext();
  const [searchParams] = useSearchParams();

  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [neighbourhoodCounts, setNeighbourhoodCounts] = useState<Array<{neighbourhood_name: string; count: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Auto-open the Filters modal when arriving with ?openFilters=1 (from the home Filters button)
  useEffect(() => {
    if (searchParams.get('openFilters') === '1') setFilterModalOpen(true);
  }, [searchParams]);

  // Data-driven filter option lists
  const [propertyTypes, setPropertyTypes] = useState<FilterOption[]>([]);
  const [cities, setCities] = useState<FilterOption[]>([]);
  const [amenityOptions, setAmenityOptions] = useState<Array<{ id: number; name: string; category: string }>>([]);
  useEffect(() => {
    getPropertyTypes().then(setPropertyTypes).catch(() => {});
    getCities().then(setCities).catch(() => {});
    getAmenities().then(setAmenityOptions).catch(() => {});
  }, []);

  // Local draft state for price filter
  const [draftMinPrice, setDraftMinPrice] = useState<string>(searchFilters.min_price?.toString() ?? '');
  const [draftMaxPrice, setDraftMaxPrice] = useState<string>(searchFilters.max_price?.toString() ?? '');

  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setOpenDropdown(null), []);
  useClickOutside(dropdownRef, closeDropdown);

  const effectiveFilters: SearchFilters = {
    location: searchParams.get('location') || searchFilters.location || undefined,
    city: searchFilters.city,
    check_in: searchParams.get('check_in') || searchFilters.check_in || undefined,
    check_out: searchParams.get('check_out') || searchFilters.check_out || undefined,
    guests: searchParams.get('guests') ? Number(searchParams.get('guests')) : searchFilters.guests || undefined,
    min_price: searchFilters.min_price,
    max_price: searchFilters.max_price,
    property_type: searchFilters.property_type,
    room_type: searchFilters.room_type,
    min_bedrooms: searchFilters.min_bedrooms,
    min_beds: searchFilters.min_beds,
    min_bathrooms: searchFilters.min_bathrooms,
    instant_book: searchFilters.instant_book,
    is_guest_favourite: searchFilters.is_guest_favourite,
    sort_by: searchFilters.sort_by,
    amenities: searchFilters.amenities && searchFilters.amenities.length > 0 ? searchFilters.amenities : undefined,
  };

  const filterKey = JSON.stringify(effectiveFilters);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getListings(effectiveFilters)
      .then((result) => {
        if (!cancelled) {
          setListings(result.listings);
          setTotalCount(result.total);
          setNeighbourhoodCounts(result.neighbourhood_counts || []);
          // Save search to history
          const query = effectiveFilters.location || '';
          if (query) {
            saveSearch({ query, filters: JSON.stringify(effectiveFilters), result_count: result.total }).catch(() => {});
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setListings([]);
          setTotalCount(0);
          setNeighbourhoodCounts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const updateFilter = (patch: Partial<SearchFilters>) => {
    setSearchFilters({ ...searchFilters, ...patch });
  };

  const clearFilter = (keys: (keyof SearchFilters)[]) => {
    const next = { ...searchFilters };
    keys.forEach((k) => { (next as Record<string, unknown>)[k] = undefined; });
    setSearchFilters(next);
  };

  // Count active filters
  const activeFilterCount = [
    effectiveFilters.min_price !== undefined || effectiveFilters.max_price !== undefined,
    effectiveFilters.room_type !== undefined,
    effectiveFilters.property_type !== undefined,
    effectiveFilters.city !== undefined,
    (effectiveFilters.amenities?.length ?? 0) > 0,
    effectiveFilters.instant_book !== undefined,
    effectiveFilters.is_guest_favourite !== undefined,
    (effectiveFilters.min_bedrooms ?? 0) > 0 || (effectiveFilters.min_beds ?? 0) > 0 || (effectiveFilters.min_bathrooms ?? 0) > 0,
  ].filter(Boolean).length;

  const isPriceActive = effectiveFilters.min_price !== undefined || effectiveFilters.max_price !== undefined;
  const isRoomTypeActive = effectiveFilters.room_type !== undefined;
  const isPropertyTypeActive = effectiveFilters.property_type !== undefined;
  const isCityActive = effectiveFilters.city !== undefined;
  const isAmenitiesActive = (effectiveFilters.amenities?.length ?? 0) > 0;
  const isBookingOptionsActive = effectiveFilters.instant_book !== undefined;
  const isTopTierActive = effectiveFilters.is_guest_favourite !== undefined;
  const isRoomsBedsActive = (effectiveFilters.min_bedrooms ?? 0) > 0 || (effectiveFilters.min_beds ?? 0) > 0 || (effectiveFilters.min_bathrooms ?? 0) > 0;

  const pillClass = (active: boolean) =>
    `flex-shrink-0 px-4 py-2 rounded-full text-sm border transition-colors flex items-center gap-1 ${
      active
        ? 'bg-gray-900 text-white border-gray-900'
        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900'
    }`;

  const toggleDropdown = (name: OpenDropdown) => {
    setOpenDropdown(openDropdown === name ? null : name);
    if (name === 'price' && openDropdown !== 'price') {
      setDraftMinPrice(searchFilters.min_price?.toString() ?? '');
      setDraftMaxPrice(searchFilters.max_price?.toString() ?? '');
    }
  };

  const locationLabel = effectiveFilters.location;
  const sortLabel = SORT_OPTIONS.find((o) => o.value === effectiveFilters.sort_by)?.label ?? 'Recommended';

  return (
    <div className="pt-[160px] min-h-screen flex flex-col">
      {/* Filter bar — single Filters button (opens modal) */}
      <div className="border-b border-gray-200 bg-white sticky top-[140px] z-10">
        <div className="px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => setFilterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 text-sm font-medium text-gray-800 hover:border-gray-900 transition"
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M2 4h12M4 8h8M6 12h4" />
            </svg>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-gray-900 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Results header with count and sort */}
      <div className="px-6 pt-4 pb-2 flex items-center justify-between">
        {!loading && (
          <div>
            <p className="text-sm text-gray-600">
              {totalCount.toLocaleString()} {totalCount === 1 ? 'place' : 'places'}
              {locationLabel ? ` in ${locationLabel}` : ''}
            </p>
            {neighbourhoodCounts.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {neighbourhoodCounts.map((nc) => (
                  <span
                    key={nc.neighbourhood_name}
                    className="inline-flex items-center text-xs bg-gray-100 text-gray-700 rounded-full px-2.5 py-0.5 font-medium"
                  >
                    {nc.count} {nc.count === 1 ? 'listing' : 'listings'} in {nc.neighbourhood_name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('sort')}
            className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 font-medium"
          >
            <span>{sortLabel}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openDropdown === 'sort' && (
            <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-20 w-52">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    updateFilter({ sort_by: opt.value });
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                    effectiveFilters.sort_by === opt.value ? 'font-semibold text-gray-900' : 'text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Split view: listings + map */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT: listing cards */}
        <div className="w-full lg:w-[58%] overflow-y-auto px-6 pb-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-xl mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No results found</h2>
              <p className="text-gray-500">
                Try adjusting your search or filters to find what you&apos;re looking for.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: map */}
        <div className="hidden lg:block lg:w-[42%] sticky top-[200px] h-[calc(100vh-200px)]">
          <MapView listings={listings} />
        </div>
      </div>

      <FilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={searchFilters}
        onApply={(f) => setSearchFilters(f)}
        baseParams={{
          location: effectiveFilters.location,
          check_in: effectiveFilters.check_in,
          check_out: effectiveFilters.check_out,
          guests: effectiveFilters.guests,
        }}
      />
    </div>
  );
}
