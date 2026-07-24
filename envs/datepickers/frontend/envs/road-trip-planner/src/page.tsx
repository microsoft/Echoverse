import React, { useState, useCallback, useMemo } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const MIN_DATE = new Date(2023, 0, 1);
const MAX_DATE = new Date(2025, 11, 31);

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function pad(n: number) {
  return n < 10 ? "0" + n : "" + n;
}
function toISO(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

const C = {
  primary: "#bbbabe",
  secondary: "#60606a",
  bg: "#0c0b21",
  accent: "#272732",
  surface: "#1f202b",
  brandBlue: "#003580",
  brandYellow: "#febb02",
  white: "#ffffff",
};

export default function Page_road_trip_planner(props: GeneratedPageProps) {
  const [viewMonth, setViewMonth] = useState(0);
  const [viewYear, setViewYear] = useState(2024);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [tripType] = useState<"round-trip">("round-trip");
  const [travelers] = useState(1);
  const [cabinClass] = useState("Economy");
  const [filterSort, setFilterSort] = useState("price");

  const canGoPrev = useMemo(() => {
    const prev = viewMonth === 0 ? new Date(viewYear - 1, 11, 1) : new Date(viewYear, viewMonth - 1, 1);
    return prev >= new Date(MIN_DATE.getFullYear(), MIN_DATE.getMonth(), 1);
  }, [viewMonth, viewYear]);

  const canGoNext = useMemo(() => {
    const next = viewMonth === 11 ? new Date(viewYear + 1, 0, 1) : new Date(viewYear, viewMonth + 1, 1);
    return next <= new Date(MAX_DATE.getFullYear(), MAX_DATE.getMonth(), 1);
  }, [viewMonth, viewYear]);

  const goPrev = useCallback(() => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else { setViewMonth((m) => m - 1); }
  }, [canGoPrev, viewMonth]);

  const goNext = useCallback(() => {
    if (!canGoNext) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else { setViewMonth((m) => m + 1); }
  }, [canGoNext, viewMonth]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ day: number; iso: string; disabled: boolean } | null> = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toISO(viewYear, viewMonth, d);
      const date = new Date(viewYear, viewMonth, d);
      const outOfRange = date < MIN_DATE || date > MAX_DATE;
      cells.push({ day: d, iso, disabled: outOfRange });
    }
    return cells;
  }, [viewMonth, viewYear]);

  const handleDayClick = useCallback((iso: string, disabled: boolean) => {
    if (disabled) return;
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(iso);
      setRangeEnd(null);
    } else {
      if (iso < rangeStart) {
        setRangeStart(iso);
        setRangeEnd(null);
      } else if (iso === rangeStart) {
        return;
      } else {
        setRangeEnd(iso);
      }
    }
  }, [rangeStart, rangeEnd]);

  const isInRange = useCallback((iso: string) => {
    if (rangeStart && rangeEnd) {
      return iso > rangeStart && iso < rangeEnd;
    }
    if (rangeStart && !rangeEnd && hoverDate && hoverDate > rangeStart) {
      return iso > rangeStart && iso < hoverDate;
    }
    return false;
  }, [rangeStart, rangeEnd, hoverDate]);

  const handleSubmit = useCallback(() => {
    if (!rangeStart || !rangeEnd) return;
    const value = `${rangeStart} to ${rangeEnd}`;
    props.onSubmit({
      type: "date_range",
      value,
      raw: { start: rangeStart, end: rangeEnd, viewMonth, viewYear, tripType, travelers, cabinClass },
    });
  }, [rangeStart, rangeEnd, viewMonth, viewYear, props, tripType, travelers, cabinClass]);

  const formatDisplay = (iso: string | null) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-").map(Number);
    return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
  };

  const popularDestinations = [
    { city: "Cancún", country: "Mexico", color: "#1a3a5c" },
    { city: "Barcelona", country: "Spain", color: "#2a1a4c" },
    { city: "Tokyo", country: "Japan", color: "#3a1a2c" },
    { city: "Reykjavik", country: "Iceland", color: "#0a2a3c" },
  ];

  const flightResults = [
    { airline: "SkyWest Air", depart: "6:00 AM", arrive: "12:30 PM", stops: "1 stop", duration: "6h 30m", price: "$287" },
    { airline: "Northern Wings", depart: "9:15 AM", arrive: "3:00 PM", stops: "Nonstop", duration: "5h 45m", price: "$342" },
    { airline: "Atlantic Express", depart: "2:30 PM", arrive: "9:45 PM", stops: "1 stop", duration: "7h 15m", price: "$259" },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bg, color: C.primary }}>
      {/* Header */}
      <header className="w-full" style={{ background: C.accent }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: C.brandYellow, color: C.bg }}>
              RT
            </div>
            <span className="text-lg font-semibold" style={{ color: C.white }}>Road Trip Planner</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: C.secondary }}>
            <span className="cursor-pointer hover:opacity-80">Flights</span>
            <span className="cursor-pointer hover:opacity-80">Hotels</span>
            <span className="cursor-pointer hover:opacity-80">Car Rental</span>
            <span className="cursor-pointer hover:opacity-80">Packages</span>
          </div>
          <div className="flex items-center gap-4 text-sm" style={{ color: C.secondary }}>
            <span>USD</span>
            <span>EN</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ background: C.surface, color: C.primary }}>
              JD
            </div>
          </div>
        </div>
      </header>

      {/* Hero area */}
      <div className="w-full py-6" style={{ background: `linear-gradient(135deg, ${C.accent} 0%, ${C.bg} 100%)` }}>
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl font-semibold mb-1" style={{ color: C.white }}>
            Miami → Toronto
          </h1>
          <p className="text-sm mb-4" style={{ color: C.secondary }}>
            Find the best flights for your trip
          </p>
          {/* Search form bar */}
          <div className="rounded-lg p-4 flex flex-wrap items-center gap-3" style={{ background: C.surface }}>
            <div className="flex items-center gap-2 text-sm">
              <label className="flex items-center gap-1 cursor-pointer" style={{ color: C.primary }}>
                <input type="radio" name="trip" checked={tripType === "round-trip"} readOnly className="accent-yellow-400" />
                Round-trip
              </label>
            </div>
            <div className="h-5 w-px" style={{ background: C.secondary }} />
            <div className="flex items-center gap-2 text-sm rounded-md px-3 py-1.5" style={{ background: C.accent, color: C.primary }}>
              <span>✈</span>
              <span>Miami (MIA)</span>
            </div>
            <span style={{ color: C.secondary }}>→</span>
            <div className="flex items-center gap-2 text-sm rounded-md px-3 py-1.5" style={{ background: C.accent, color: C.primary }}>
              <span>✈</span>
              <span>Toronto (YYZ)</span>
            </div>
            <div className="h-5 w-px" style={{ background: C.secondary }} />
            <div className="text-sm rounded-md px-3 py-1.5" style={{ background: C.accent, color: C.primary }}>
              {travelers} Traveler · {cabinClass}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Instruction */}
        <div className="rounded-lg p-4 mb-6" style={{ background: C.surface, borderLeft: `3px solid ${C.brandYellow}` }}>
          <p className="text-sm font-medium" style={{ color: C.white }}>
            Book a flight from Miami to Toronto. Select your departure date: January 24, 2024 to January 31, 2024.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Filters */}
          <div className="lg:col-span-1 space-y-4">
            {/* Date picker card */}
            <div className="rounded-lg p-4" style={{ background: C.surface }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: C.white }}>Select Travel Dates</h3>

              {/* Selected range display */}
              <div className="flex items-center gap-2 mb-4 text-xs">
                <div className="flex-1 rounded-md px-3 py-2" style={{ background: C.accent, color: rangeStart ? C.white : C.secondary }}>
                  <div style={{ color: C.secondary }}>Departure</div>
                  <div>{formatDisplay(rangeStart)}</div>
                </div>
                <span style={{ color: C.secondary }}>→</span>
                <div className="flex-1 rounded-md px-3 py-2" style={{ background: C.accent, color: rangeEnd ? C.white : C.secondary }}>
                  <div style={{ color: C.secondary }}>Return</div>
                  <div>{formatDisplay(rangeEnd)}</div>
                </div>
              </div>

              {/* Calendar */}
              <div className="rounded-lg p-3" style={{ background: C.accent }}>
                {/* Month nav */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={goPrev}
                    disabled={!canGoPrev}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-sm transition-opacity"
                    style={{
                      background: C.surface,
                      color: canGoPrev ? C.white : C.secondary,
                      opacity: canGoPrev ? 1 : 0.3,
                      cursor: canGoPrev ? "pointer" : "default",
                    }}
                  >
                    ‹
                  </button>
                  <span className="text-sm font-medium" style={{ color: C.white }}>
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </span>
                  <button
                    onClick={goNext}
                    disabled={!canGoNext}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-sm transition-opacity"
                    style={{
                      background: C.surface,
                      color: canGoNext ? C.white : C.secondary,
                      opacity: canGoNext ? 1 : 0.3,
                      cursor: canGoNext ? "pointer" : "default",
                    }}
                  >
                    ›
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {DAY_LABELS.map((d) => (
                    <div key={d} className="text-center text-xs py-1" style={{ color: C.secondary }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((cell, i) => {
                    if (!cell) return <div key={`e-${i}`} className="h-8" />;
                    const { day, iso, disabled } = cell;
                    const isStart = iso === rangeStart;
                    const isEnd = iso === rangeEnd;
                    const inRange = isInRange(iso);
                    const isHoverEnd = !rangeEnd && rangeStart && iso === hoverDate && iso > rangeStart;

                    let bg = "transparent";
                    let fg = C.white;
                    let fontWeight = "normal";

                    if (disabled) {
                      fg = C.secondary;
                    } else if (isStart || isEnd) {
                      bg = C.brandYellow;
                      fg = C.bg;
                      fontWeight = "600";
                    } else if (inRange) {
                      bg = `${C.brandYellow}33`;
                      fg = C.brandYellow;
                    } else if (isHoverEnd) {
                      bg = `${C.brandYellow}55`;
                      fg = C.bg;
                    }

                    return (
                      <div
                        key={iso}
                        onClick={() => handleDayClick(iso, disabled)}
                        onMouseEnter={() => !disabled && setHoverDate(iso)}
                        onMouseLeave={() => setHoverDate(null)}
                        className="h-8 flex items-center justify-center text-xs rounded-md transition-colors"
                        style={{
                          background: bg,
                          color: fg,
                          fontWeight,
                          cursor: disabled ? "default" : "pointer",
                          opacity: disabled ? 0.35 : 1,
                        }}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!rangeStart || !rangeEnd}
                className="w-full mt-4 rounded-lg py-2.5 text-sm font-semibold transition-opacity"
                style={{
                  background: rangeStart && rangeEnd ? C.brandYellow : C.secondary,
                  color: rangeStart && rangeEnd ? C.bg : C.primary,
                  cursor: rangeStart && rangeEnd ? "pointer" : "default",
                  opacity: rangeStart && rangeEnd ? 1 : 0.5,
                }}
              >
                Search Flights
              </button>
            </div>

            {/* Filters card */}
            <div className="rounded-lg p-4" style={{ background: C.surface }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: C.white }}>Filters</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="mb-1" style={{ color: C.secondary }}>Stops</div>
                  <div className="space-y-1">
                    {["Nonstop", "1 stop", "2+ stops"].map((s) => (
                      <label key={s} className="flex items-center gap-2 cursor-pointer" style={{ color: C.primary }}>
                        <input type="checkbox" defaultChecked className="rounded" />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="h-px" style={{ background: C.accent }} />
                <div>
                  <div className="mb-1" style={{ color: C.secondary }}>Airlines</div>
                  <div className="space-y-1">
                    {["SkyWest Air", "Northern Wings", "Atlantic Express"].map((a) => (
                      <label key={a} className="flex items-center gap-2 cursor-pointer" style={{ color: C.primary }}>
                        <input type="checkbox" defaultChecked className="rounded" />
                        {a}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="h-px" style={{ background: C.accent }} />
                <div>
                  <div className="mb-1" style={{ color: C.secondary }}>Price Range</div>
                  <div className="flex items-center gap-2" style={{ color: C.primary }}>
                    <span>$200</span>
                    <div className="flex-1 h-1 rounded-full" style={{ background: C.accent }}>
                      <div className="h-full rounded-full w-3/4" style={{ background: C.brandYellow }} />
                    </div>
                    <span>$500</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Results table */}
          <div className="lg:col-span-2 space-y-4">
            {/* Sort bar */}
            <div className="rounded-lg p-3 flex items-center justify-between" style={{ background: C.surface }}>
              <span className="text-xs" style={{ color: C.secondary }}>
                Showing results for Miami → Toronto
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span style={{ color: C.secondary }}>Sort by:</span>
                {["price", "duration", "departure"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterSort(s)}
                    className="px-2 py-1 rounded-md capitalize"
                    style={{
                      background: filterSort === s ? C.brandYellow : C.accent,
                      color: filterSort === s ? C.bg : C.primary,
                      fontSize: "11px",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Results table */}
            <div className="rounded-lg overflow-hidden" style={{ background: C.surface }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: C.accent }}>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: C.secondary }}>Airline</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: C.secondary }}>Depart</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: C.secondary }}>Arrive</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: C.secondary }}>Duration</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: C.secondary }}>Stops</th>
                    <th className="text-right px-4 py-3 font-medium" style={{ color: C.secondary }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {flightResults.map((f, i) => (
                    <tr
                      key={i}
                      className="transition-colors"
                      style={{ borderBottom: i < flightResults.length - 1 ? `1px solid ${C.accent}` : "none" }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                            style={{ background: C.accent, color: C.brandYellow }}
                          >
                            {f.airline[0]}
                          </div>
                          <span style={{ color: C.white }}>{f.airline}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: C.white }}>{f.depart}</td>
                      <td className="px-4 py-3" style={{ color: C.white }}>{f.arrive}</td>
                      <td className="px-4 py-3" style={{ color: C.secondary }}>{f.duration}</td>
                      <td className="px-4 py-3" style={{ color: f.stops === "Nonstop" ? "#22c55e" : C.secondary }}>{f.stops}</td>
                      <td className="px-4 py-3 text-right font-semibold" style={{ color: C.brandYellow }}>{f.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Popular destinations */}
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: C.white }}>Popular Destinations</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {popularDestinations.map((d) => (
                  <div key={d.city} className="rounded-lg overflow-hidden" style={{ background: C.surface }}>
                    <div
                      className="h-24 flex items-end p-2"
                      style={{ background: d.color }}
                      role="img"
                      aria-label={`Destination photo of ${d.city}`}
                    >
                      <div>
                        <div className="text-xs font-semibold" style={{ color: C.white }}>{d.city}</div>
                        <div className="text-xs" style={{ color: C.primary, opacity: 0.7 }}>{d.country}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Traveler reviews */}
            <div className="rounded-lg p-4" style={{ background: C.surface }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: C.white }}>Traveler Reviews</h3>
              <div className="space-y-3">
                {[
                  { name: "Sarah M.", rating: 5, text: "Smooth booking experience. Found great prices for Toronto flights!" },
                  { name: "David K.", rating: 4, text: "Easy to compare options. The filter tools are really helpful." },
                ].map((r, i) => (
                  <div key={i} className="rounded-md p-3" style={{ background: C.accent }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: C.white }}>{r.name}</span>
                      <span className="text-xs" style={{ color: C.brandYellow }}>
                        {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: C.secondary }}>{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 py-6" style={{ background: C.accent }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs mb-6">
            <div>
              <h4 className="font-semibold mb-2" style={{ color: C.white }}>Company</h4>
              <div className="space-y-1" style={{ color: C.secondary }}>
                <div>About Us</div><div>Careers</div><div>Press</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: C.white }}>Support</h4>
              <div className="space-y-1" style={{ color: C.secondary }}>
                <div>Help Center</div><div>Contact Us</div><div>FAQs</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: C.white }}>Legal</h4>
              <div className="space-y-1" style={{ color: C.secondary }}>
                <div>Privacy Policy</div><div>Terms of Service</div><div>Cookie Policy</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: C.white }}>Get the App</h4>
              <div className="space-y-2">
                <div className="rounded-md px-3 py-1.5 text-center" style={{ background: C.surface, color: C.primary }}>
                  EchoStore
                </div>
                <div className="rounded-md px-3 py-1.5 text-center" style={{ background: C.surface, color: C.primary }}>
                  EchoPlay
                </div>
              </div>
            </div>
          </div>
          <div className="h-px mb-4" style={{ background: C.surface }} />
          <p className="text-xs text-center" style={{ color: C.secondary }}>
            © 2024 Road Trip Planner. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
