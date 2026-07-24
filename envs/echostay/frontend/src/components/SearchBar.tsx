import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMinus, FiPlus, FiMapPin, FiClock, FiX } from 'react-icons/fi';
import { useAppContext } from '../App';
import { getSearchSuggestions, getSearchHistory, clearSearchHistory, deleteSearchHistory } from '../api';
import type { SearchSuggestion, SearchHistoryItem } from '../types';
import DateInput from './DateInput';
import { ENV_TODAY_STR } from '../lib/benchmark';

type ExpandedSection = null | 'where' | 'when' | 'who';

interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
}

function GuestCounter({
  label,
  description,
  count,
  onIncrement,
  onDecrement,
  min = 0,
}: {
  label: string;
  description: string;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onDecrement}
          disabled={count <= min}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-800 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-500 transition"
        >
          <FiMinus className="w-3 h-3" />
        </button>
        <span className="w-5 text-center text-sm font-medium">{count}</span>
        <button
          onClick={onIncrement}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-800 hover:text-gray-800 transition"
        >
          <FiPlus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function SearchBar() {
  const { searchFilters, setSearchFilters } = useAppContext();
  const navigate = useNavigate();
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  const [guestCounts, setGuestCounts] = useState<GuestCounts>({
    adults: searchFilters.guests || 0,
    children: 0,
    infants: 0,
  });
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [locationInput, setLocationInput] = useState(searchFilters.location || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpandedSection(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedSection(null);
        setMobileExpanded(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (expandedSection === 'where' && !locationInput) {
      getSearchHistory()
        .then(setRecentSearches)
        .catch(() => setRecentSearches([]));
    }
  }, [expandedSection, locationInput]);

  const handleClearHistory = async () => {
    try {
      await clearSearchHistory();
      setRecentSearches([]);
    } catch {
      // ignore
    }
  };

  const handleHistoryClick = (item: SearchHistoryItem) => {
    setLocationInput(item.query);
    let filters: Record<string, string> = {};
    try { filters = JSON.parse(item.filters || '{}'); } catch { /* ignore */ }
    // Restore only the location (and guests) from a recent search.
    // Deliberately do NOT restore check_in/check_out — selecting a location
    // should never auto-populate the "When" dates.
    const updated: Record<string, string | number | undefined> = { location: item.query };
    if (filters.guests) updated.guests = Number(filters.guests);
    setSearchFilters({ ...searchFilters, ...updated });
    setRecentSearches([]);
    setExpandedSection(null);
    const params = new URLSearchParams();
    params.set('location', item.query);
    if (filters.guests) params.set('guests', String(filters.guests));
    navigate(`/search?${params.toString()}`);
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const fetchSuggestions = useCallback((query: string) => {
    if (suggestionsTimer.current) clearTimeout(suggestionsTimer.current);
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    suggestionsTimer.current = setTimeout(async () => {
      try {
        const results = await getSearchSuggestions(query);
        setSuggestions(results.filter((s: SearchSuggestion) => !/^\d+$/.test(s.value)));
      } catch {
        setSuggestions([]);
      }
    }, 200);
  }, []);

  const totalGuests = guestCounts.adults + guestCounts.children;
  const guestSummary = totalGuests > 0
    ? `${totalGuests} guest${totalGuests !== 1 ? 's' : ''}${guestCounts.infants > 0 ? `, ${guestCounts.infants} infant${guestCounts.infants !== 1 ? 's' : ''}` : ''}`
    : '';

  const updateGuests = (updated: GuestCounts) => {
    setGuestCounts(updated);
    const total = updated.adults + updated.children;
    setSearchFilters({ ...searchFilters, guests: total > 0 ? total : undefined });
  };

  const handleLocationChange = (value: string) => {
    setLocationInput(value);
    setSearchFilters({ ...searchFilters, location: value });
    fetchSuggestions(value);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setLocationInput(suggestion.value);
    setSearchFilters({ ...searchFilters, location: suggestion.value });
    setSuggestions([]);
    // Close the dropdown after picking a location. Do NOT auto-open the "When"
    // picker — selecting a location should not activate/populate the dates.
    setExpandedSection(null);
  };

  const handleSubmit = () => {
    setMobileExpanded(false);
    setExpandedSection(null);
    setSuggestions([]);
    const params = new URLSearchParams();
    if (locationInput) params.set('location', locationInput);
    if (searchFilters.check_in) params.set('check_in', searchFilters.check_in);
    if (searchFilters.check_out) params.set('check_out', searchFilters.check_out);
    if (searchFilters.guests) params.set('guests', String(searchFilters.guests));
    const qs = params.toString();
    navigate(`/search${qs ? `?${qs}` : ''}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const dateSummary = searchFilters.check_in && searchFilters.check_out
    ? `${formatDate(searchFilters.check_in)} – ${formatDate(searchFilters.check_out)}`
    : searchFilters.check_in
      ? formatDate(searchFilters.check_in)
      : '';

  const today = ENV_TODAY_STR;

  const suggestionIcon = (type: string) => {
    if (type === 'city' || type === 'region') return <FiMapPin className="w-4 h-4 text-gray-500" />;
    return <FiSearch className="w-4 h-4 text-gray-500" />;
  };

  const suggestionLabel = (s: SearchSuggestion) => {
    if (s.type === 'region') return `${s.value} (region)`;
    if (s.type === 'property') return `${s.value} (property type)`;
    if (s.type === 'neighbourhood') return `${s.value} (neighbourhood)`;
    return s.value;
  };

  // Desktop full bar
  if (!mobileExpanded) {
    return (
      <>
        <div className="hidden md:block relative" ref={containerRef}>
          <div className="flex items-center border border-gray-300 rounded-full shadow-sm hover:shadow-md transition w-full max-w-2xl bg-white">
            {/* Where */}
            <div
              className={`flex-1 px-6 py-3 border-r border-gray-200 min-w-0 rounded-l-full cursor-pointer transition ${expandedSection === 'where' ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
              onClick={() => setExpandedSection('where')}
            >
              <label className="block text-xs font-bold text-gray-800">Where</label>
              <input
                type="text"
                placeholder="Search destinations"
                value={locationInput}
                onChange={(e) => handleLocationChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setExpandedSection('where')}
                className="w-full text-sm text-gray-600 placeholder-gray-400 outline-none bg-transparent truncate"
              />
            </div>

            {/* When */}
            <button
              type="button"
              onClick={() => setExpandedSection(expandedSection === 'when' ? null : 'when')}
              className={`px-5 py-3 border-r border-gray-200 text-left rounded-none transition min-w-[140px] ${expandedSection === 'when' ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
            >
              <span className="block text-xs font-bold text-gray-800">When</span>
              <span className={`block text-sm truncate ${dateSummary ? 'text-gray-800' : 'text-gray-400'}`}>
                {dateSummary || 'Add dates'}
              </span>
            </button>

            {/* Who */}
            <button
              type="button"
              onClick={() => setExpandedSection(expandedSection === 'who' ? null : 'who')}
              className={`px-5 py-3 text-left rounded-none transition min-w-[130px] ${expandedSection === 'who' ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
            >
              <span className="block text-xs font-bold text-gray-800">Who</span>
              <span className={`block text-sm truncate ${guestSummary ? 'text-gray-800' : 'text-gray-400'}`}>
                {guestSummary || 'Add guests'}
              </span>
            </button>

            {/* Search button */}
            <button
              onClick={handleSubmit}
              className="m-1.5 px-4 py-3 rounded-full text-white text-sm font-semibold flex-shrink-0 flex items-center gap-2 hover:brightness-95 transition"
              style={{ backgroundColor: '#FF385C' }}
              aria-label="Search"
            >
              <FiSearch className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>

          {/* Where dropdown — autocomplete suggestions */}
          {expandedSection === 'where' && suggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-2xl shadow-lg border border-gray-200 py-2 z-50">
              {suggestions.map((s, i) => (
                <button
                  key={`${s.type}-${s.value}-${i}`}
                  onClick={() => handleSuggestionClick(s)}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {suggestionIcon(s.type)}
                  </div>
                  <span className="text-sm font-medium text-gray-800">{suggestionLabel(s)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Recent searches dropdown */}
          {expandedSection === 'where' && suggestions.length === 0 && !locationInput && recentSearches.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-2xl shadow-lg border border-gray-200 py-2 z-50">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-bold text-gray-700">Recent searches</span>
                <button onClick={handleClearHistory} className="text-xs text-gray-500 hover:text-gray-800 underline">
                  Clear all
                </button>
              </div>
              {recentSearches.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition group"
                >
                  <button
                    onClick={() => handleHistoryClick(item)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FiClock className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.query || 'All locations'}</p>
                      <p className="text-xs text-gray-500">
                        {item.result_count} result{item.result_count !== 1 ? 's' : ''} · {formatTimeAgo(item.created_at)}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await deleteSearchHistory(item.id);
                        setRecentSearches((prev) => prev.filter((s) => s.id !== item.id));
                      } catch { /* ignore */ }
                    }}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition"
                    aria-label="Remove search"
                  >
                    <FiX className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* When dropdown */}
          {expandedSection === 'when' && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-gray-200 p-5 z-50">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">Check in</label>
                  <DateInput
                    min={today}
                    value={searchFilters.check_in || ''}
                    onChange={(newCheckIn) => {
                      const updates: Record<string, string | undefined> = { check_in: newCheckIn };
                      if (newCheckIn && searchFilters.check_out && newCheckIn >= searchFilters.check_out) {
                        updates.check_out = undefined;
                      }
                      setSearchFilters({ ...searchFilters, ...updates });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800 bg-white transition"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">Check out</label>
                  <DateInput
                    min={searchFilters.check_in || today}
                    value={searchFilters.check_out || ''}
                    onChange={(newCheckOut) => {
                      setSearchFilters({ ...searchFilters, check_out: newCheckOut });
                      if (newCheckOut) setExpandedSection('who');
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800 bg-white transition"
                  />
                </div>
              </div>
              {searchFilters.check_in && searchFilters.check_out && (
                <p className="mt-3 text-xs text-gray-500">
                  {Math.ceil((new Date(searchFilters.check_out).getTime() - new Date(searchFilters.check_in).getTime()) / 86400000)} night(s) selected
                </p>
              )}
            </div>
          )}

          {/* Who dropdown */}
          {expandedSection === 'who' && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-200 p-5 z-50">
              <GuestCounter
                label="Adults"
                description="Ages 13+"
                count={guestCounts.adults}
                onIncrement={() => updateGuests({ ...guestCounts, adults: guestCounts.adults + 1 })}
                onDecrement={() => updateGuests({ ...guestCounts, adults: guestCounts.adults - 1 })}
              />
              <hr className="border-gray-100" />
              <GuestCounter
                label="Children"
                description="Ages 2–12"
                count={guestCounts.children}
                onIncrement={() => updateGuests({ ...guestCounts, children: guestCounts.children + 1 })}
                onDecrement={() => updateGuests({ ...guestCounts, children: guestCounts.children - 1 })}
              />
              <hr className="border-gray-100" />
              <GuestCounter
                label="Infants"
                description="Under 2"
                count={guestCounts.infants}
                onIncrement={() => updateGuests({ ...guestCounts, infants: guestCounts.infants + 1 })}
                onDecrement={() => updateGuests({ ...guestCounts, infants: guestCounts.infants - 1 })}
              />
            </div>
          )}
        </div>

        {/* Compact mobile bar */}
        <button
          onClick={() => setMobileExpanded(true)}
          className="md:hidden flex items-center gap-3 w-full border border-gray-300 rounded-full shadow-sm px-4 py-2 bg-white"
        >
          <FiSearch className="w-5 h-5 text-gray-700 flex-shrink-0" />
          <div className="text-left min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {locationInput || 'Anywhere'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {dateSummary || 'Any week'} · {guestSummary || 'Add guests'}
            </p>
          </div>
        </button>
      </>
    );
  }

  // Expanded mobile search
  return (
    <div className="md:hidden bg-white rounded-2xl shadow-lg border border-gray-200 p-4 space-y-4">
      <div>
        <label className="block text-xs font-bold text-gray-800 mb-1">Where</label>
        <input
          type="text"
          placeholder="Search destinations"
          value={locationInput}
          onChange={(e) => handleLocationChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-500"
        />
        {suggestions.length > 0 && (
          <div className="mt-1 border border-gray-200 rounded-lg bg-white shadow-sm max-h-40 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={`${s.type}-${s.value}-${i}`}
                onClick={() => handleSuggestionClick(s)}
                className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
              >
                {suggestionIcon(s.type)}
                <span>{suggestionLabel(s)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-800 mb-1">Check in</label>
          <DateInput
            min={today}
            value={searchFilters.check_in || ''}
            onChange={(v) =>
              setSearchFilters({ ...searchFilters, check_in: v })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-800 mb-1">Check out</label>
          <DateInput
            min={searchFilters.check_in || today}
            value={searchFilters.check_out || ''}
            onChange={(v) =>
              setSearchFilters({ ...searchFilters, check_out: v })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-500"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-gray-800">Guests</label>
        <div className="border border-gray-300 rounded-lg p-3 space-y-2">
          <GuestCounter
            label="Adults"
            description="Ages 13+"
            count={guestCounts.adults}
            onIncrement={() => updateGuests({ ...guestCounts, adults: guestCounts.adults + 1 })}
            onDecrement={() => updateGuests({ ...guestCounts, adults: guestCounts.adults - 1 })}
          />
          <hr className="border-gray-100" />
          <GuestCounter
            label="Children"
            description="Ages 2–12"
            count={guestCounts.children}
            onIncrement={() => updateGuests({ ...guestCounts, children: guestCounts.children + 1 })}
            onDecrement={() => updateGuests({ ...guestCounts, children: guestCounts.children - 1 })}
          />
          <hr className="border-gray-100" />
          <GuestCounter
            label="Infants"
            description="Under 2"
            count={guestCounts.infants}
            onIncrement={() => updateGuests({ ...guestCounts, infants: guestCounts.infants + 1 })}
            onDecrement={() => updateGuests({ ...guestCounts, infants: guestCounts.infants - 1 })}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setMobileExpanded(false)}
          className="flex-1 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 py-2 text-sm font-semibold text-white rounded-lg flex items-center justify-center gap-2"
          style={{ backgroundColor: '#FF385C' }}
        >
          <FiSearch className="w-4 h-4" />
          Search
        </button>
      </div>
    </div>
  );
}
