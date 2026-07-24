import React, { useState, useCallback, useMemo } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DISABLED_DATES = new Set([
  "2022-05-01",
  "2022-05-07",
  "2022-05-08",
  "2022-05-14",
  "2022-05-15",
  "2022-05-21",
  "2022-05-22",
  "2022-05-28",
  "2022-05-29",
]);

const MIN_DATE = new Date(2021, 0, 1);
const MAX_DATE = new Date(2023, 11, 31);

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function pad(n: number) { return n < 10 ? "0" + n : "" + n; }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

const BG = "#28252f";
const SURFACE = "#332f3d";
const SURFACE_LIGHT = "#3e3a49";
const PRIMARY = "#ffffff";
const SECONDARY = "#fefefd";
const ACCENT = "#f5f5f6";
const MUTED = "#cfcfcc";
const BRAND = "#FF385C";
const CARD_BG = "#2f2c37";

const PROPERTIES = [
  { name: "Mountain Lodge", rating: 4.92, reviews: 187, price: 189, beds: 3, tag: "Superhost", color: "#5a4e6e" },
  { name: "Lakeside Cabin", rating: 4.85, reviews: 124, price: 145, beds: 2, tag: "Guest Favorite", color: "#4e5a6e" },
  { name: "Alpine Retreat", rating: 4.78, reviews: 96, price: 215, beds: 4, tag: "Superhost", color: "#6e5a4e" },
  { name: "Forest Hideaway", rating: 4.91, reviews: 203, price: 168, beds: 2, tag: "Rare Find", color: "#4e6e5a" },
  { name: "Summit View Suite", rating: 4.67, reviews: 58, price: 275, beds: 5, tag: "", color: "#6e4e5a" },
  { name: "Valley Cottage", rating: 4.88, reviews: 142, price: 132, beds: 2, tag: "Superhost", color: "#5a6e4e" },
];

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill={BRAND} xmlns="http://www.w3.org/2000/svg">
      <path d="M6 0.5L7.76 4.08L11.7 4.64L8.85 7.42L9.52 11.34L6 9.5L2.48 11.34L3.15 7.42L0.3 4.64L4.24 4.08L6 0.5Z" />
    </svg>
  );
}

function ChevronLeft({ color = PRIMARY }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13 4 7 10 13 16" />
    </svg>
  );
}

function ChevronRight({ color = PRIMARY }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="7 4 13 10 7 16" />
    </svg>
  );
}

export default function Page_vacation_rental(props: GeneratedPageProps) {
  const [viewMonth, setViewMonth] = useState(4);
  const [viewYear, setViewYear] = useState(2022);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [guests, setGuests] = useState(2);
  const [roomType, setRoomType] = useState("Entire place");
  const [amenities, setAmenities] = useState<Record<string, boolean>>({
    wifi: true,
    kitchen: false,
    parking: false,
    hotTub: false,
  });
  const [activeFilter, setActiveFilter] = useState("All");

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
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }, [canGoPrev, viewMonth]);

  const goNext = useCallback(() => {
    if (!canGoNext) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }, [canGoNext, viewMonth]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ day: number; iso: string; disabled: boolean; outOfRange: boolean } | null> = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toISO(viewYear, viewMonth, d);
      const dt = new Date(viewYear, viewMonth, d);
      const outOfRange = dt < MIN_DATE || dt > MAX_DATE;
      const disabled = DISABLED_DATES.has(iso) || outOfRange;
      cells.push({ day: d, iso, disabled, outOfRange });
    }
    return cells;
  }, [viewMonth, viewYear]);

  const handleDayClick = useCallback((iso: string, disabled: boolean) => {
    if (disabled) return;
    setSelectedDate(prev => prev === iso ? null : iso);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    props.onSubmit({
      type: "date",
      value: selectedDate,
      raw: {
        selectedDate,
        guests,
        roomType,
        amenities,
        viewMonth,
        viewYear,
      },
    });
  }, [selectedDate, guests, roomType, amenities, viewMonth, viewYear, props]);

  const filters = ["All", "Cabins", "Lodges", "Lakefront", "Mountain", "Trending"];

  return (
    <div className="min-h-screen" style={{ background: BG, color: PRIMARY, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-8 py-4"
        style={{ background: SURFACE, borderBottom: `1px solid ${SURFACE_LIGHT}` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center font-bold text-sm"
            style={{ width: 36, height: 36, borderRadius: 9999, background: BRAND, color: PRIMARY }}
          >
            VR
          </div>
          <span className="text-lg font-semibold" style={{ color: PRIMARY }}>EchoStay</span>
        </div>

        <div
          className="hidden md:flex items-center gap-2 px-5 py-2 text-sm"
          style={{ background: SURFACE_LIGHT, borderRadius: 9999, border: `1px solid ${SURFACE_LIGHT}` }}
        >
          <span style={{ color: ACCENT }}>Anywhere</span>
          <span style={{ color: MUTED }}>·</span>
          <span style={{ color: ACCENT }}>Any week</span>
          <span style={{ color: MUTED }}>·</span>
          <span style={{ color: MUTED }}>Add guests</span>
          <div
            className="flex items-center justify-center ml-2"
            style={{ width: 28, height: 28, borderRadius: 9999, background: BRAND }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round">
              <circle cx="6" cy="6" r="4.5" />
              <line x1="9.2" y1="9.2" x2="12.5" y2="12.5" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm hidden lg:block" style={{ color: MUTED }}>Become a Host</span>
          <div
            className="flex items-center gap-2 px-3 py-1.5"
            style={{ border: `1px solid ${SURFACE_LIGHT}`, borderRadius: 9999 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={MUTED} strokeWidth="1.5">
              <line x1="2" y1="4" x2="14" y2="4" /><line x1="2" y1="8" x2="14" y2="8" /><line x1="2" y1="12" x2="14" y2="12" />
            </svg>
            <div
              className="flex items-center justify-center text-xs font-bold"
              style={{ width: 28, height: 28, borderRadius: 9999, background: MUTED, color: BG }}
            >
              JD
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative w-full" style={{ height: 220, background: `linear-gradient(135deg, ${SURFACE} 0%, #1e1b25 100%)` }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: PRIMARY }}>
            Find your perfect mountain getaway
          </h1>
          <p className="text-base" style={{ color: MUTED }}>
            Unique stays, incredible views, unforgettable experiences
          </p>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-8"
          style={{ background: `linear-gradient(to bottom, transparent, ${BG})` }}
        />
      </section>

      {/* Filters bar */}
      <div className="px-8 py-5 flex items-center gap-3 overflow-x-auto">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="px-5 py-2 text-sm font-medium whitespace-nowrap transition-colors"
            style={{
              borderRadius: 9999,
              background: activeFilter === f ? PRIMARY : SURFACE_LIGHT,
              color: activeFilter === f ? BG : MUTED,
              border: `1px solid ${activeFilter === f ? PRIMARY : SURFACE_LIGHT}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Instruction banner */}
      <div className="px-8 mb-6">
        <div
          className="px-6 py-4 flex items-center gap-4"
          style={{ background: SURFACE, borderRadius: 16, border: `1px solid ${SURFACE_LIGHT}` }}
        >
          <div
            className="flex-shrink-0 flex items-center justify-center"
            style={{ width: 40, height: 40, borderRadius: 9999, background: `${BRAND}22` }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill={BRAND}>
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 3a1 1 0 011 1v4a1 1 0 01-2 0V6a1 1 0 011-1zm0 8a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: ACCENT }}>Your Task</p>
            <p className="text-base font-medium" style={{ color: PRIMARY }}>
              Book a 3-night stay at Mountain Lodge starting May 19, 2022.
            </p>
          </div>
        </div>
      </div>

      {/* Main content — two columns */}
      <main className="px-8 pb-16 flex flex-col lg:flex-row gap-8">
        {/* Left column — booking form + calendar */}
        <div className="lg:w-5/12 xl:w-4/12 flex-shrink-0 space-y-6">
          {/* Property card */}
          <div style={{ background: SURFACE, borderRadius: 16, border: `1px solid ${SURFACE_LIGHT}`, overflow: "hidden" }}>
            <div className="flex items-center gap-1 px-4 pt-4 pb-2" style={{ color: ACCENT }}>
              <div
                className="flex items-center justify-center text-xs font-bold"
                style={{ width: 48, height: 48, borderRadius: 12, background: PROPERTIES[0].color, color: PRIMARY }}
              >
                ML
              </div>
              <div className="ml-3">
                <p className="font-semibold text-base" style={{ color: PRIMARY }}>Mountain Lodge</p>
                <div className="flex items-center gap-1 text-sm">
                  <StarIcon />
                  <span style={{ color: ACCENT }}>4.92</span>
                  <span style={{ color: MUTED }}> · 187 reviews</span>
                </div>
              </div>
              <div className="ml-auto text-right">
                <span className="text-lg font-bold" style={{ color: PRIMARY }}>$189</span>
                <span className="text-sm" style={{ color: MUTED }}>/night</span>
              </div>
            </div>
            <div className="px-4 pb-3">
              <span
                className="inline-block text-xs font-medium px-3 py-1"
                style={{ background: `${BRAND}22`, color: BRAND, borderRadius: 9999 }}
              >
                Superhost
              </span>
            </div>
          </div>

          {/* Form controls */}
          <div className="space-y-5" style={{ background: SURFACE, borderRadius: 16, padding: 24, border: `1px solid ${SURFACE_LIGHT}` }}>
            <h3 className="text-base font-semibold" style={{ color: ACCENT }}>Booking Details</h3>

            {/* Room type */}
            <div>
              <label className="block text-sm mb-2" style={{ color: MUTED }}>Room Type</label>
              <div className="flex gap-2 flex-wrap">
                {["Entire place", "Private room", "Shared room"].map(t => (
                  <button
                    key={t}
                    onClick={() => setRoomType(t)}
                    className="px-4 py-2 text-sm font-medium transition-colors"
                    style={{
                      borderRadius: 9999,
                      background: roomType === t ? PRIMARY : SURFACE_LIGHT,
                      color: roomType === t ? BG : MUTED,
                      border: `1px solid ${roomType === t ? PRIMARY : SURFACE_LIGHT}`,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Guests stepper */}
            <div>
              <label className="block text-sm mb-2" style={{ color: MUTED }}>Guests</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setGuests(g => Math.max(1, g - 1))}
                  className="flex items-center justify-center text-lg font-bold"
                  style={{
                    width: 36, height: 36, borderRadius: 9999,
                    border: `1px solid ${MUTED}`, color: MUTED, background: "transparent",
                  }}
                >
                  −
                </button>
                <span className="text-lg font-semibold w-8 text-center" style={{ color: PRIMARY }}>{guests}</span>
                <button
                  onClick={() => setGuests(g => Math.min(10, g + 1))}
                  className="flex items-center justify-center text-lg font-bold"
                  style={{
                    width: 36, height: 36, borderRadius: 9999,
                    border: `1px solid ${MUTED}`, color: MUTED, background: "transparent",
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm mb-2" style={{ color: MUTED }}>Amenities</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "wifi", label: "Wi-Fi" },
                  { key: "kitchen", label: "Kitchen" },
                  { key: "parking", label: "Free Parking" },
                  { key: "hotTub", label: "Hot Tub" },
                ].map(a => (
                  <label
                    key={a.key}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm"
                    style={{ borderRadius: 12, background: SURFACE_LIGHT, color: amenities[a.key] ? ACCENT : MUTED }}
                  >
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 18, height: 18, borderRadius: 4,
                        border: `2px solid ${amenities[a.key] ? BRAND : MUTED}`,
                        background: amenities[a.key] ? BRAND : "transparent",
                      }}
                    >
                      {amenities[a.key] && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2.5 6 5 8.5 9.5 3.5" />
                        </svg>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={amenities[a.key]}
                      onChange={() => setAmenities(prev => ({ ...prev, [a.key]: !prev[a.key] }))}
                    />
                    {a.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div style={{ background: SURFACE, borderRadius: 16, padding: 24, border: `1px solid ${SURFACE_LIGHT}` }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: ACCENT }}>Select Check-in Date</h3>

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goPrev}
                disabled={!canGoPrev}
                className="flex items-center justify-center transition-opacity"
                style={{
                  width: 36, height: 36, borderRadius: 9999,
                  background: SURFACE_LIGHT, opacity: canGoPrev ? 1 : 0.3,
                  border: "none", cursor: canGoPrev ? "pointer" : "default",
                }}
                aria-label="Previous month"
              >
                <ChevronLeft />
              </button>
              <span className="text-base font-semibold" style={{ color: PRIMARY }}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                onClick={goNext}
                disabled={!canGoNext}
                className="flex items-center justify-center transition-opacity"
                style={{
                  width: 36, height: 36, borderRadius: 9999,
                  background: SURFACE_LIGHT, opacity: canGoNext ? 1 : 0.3,
                  border: "none", cursor: canGoNext ? "pointer" : "default",
                }}
                aria-label="Next month"
              >
                <ChevronRight />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAY_LABELS.map(d => (
                <div key={d} className="text-center text-xs font-medium py-1" style={{ color: MUTED }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell, i) => {
                if (!cell) return <div key={`e-${i}`} />;
                const isSelected = selectedDate === cell.iso;
                let bg = "transparent";
                let fg = PRIMARY;
                let cursor = "pointer";
                if (cell.disabled) {
                  fg = `${MUTED}55`;
                  cursor = "default";
                } else if (isSelected) {
                  bg = BRAND;
                  fg = PRIMARY;
                }
                return (
                  <button
                    key={cell.iso}
                    onClick={() => handleDayClick(cell.iso, cell.disabled)}
                    disabled={cell.disabled}
                    className="flex items-center justify-center text-sm font-medium transition-colors"
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      borderRadius: 9999,
                      background: bg,
                      color: fg,
                      cursor,
                      border: "none",
                      lineHeight: 1,
                    }}
                    aria-label={`${MONTH_NAMES[viewMonth]} ${cell.day}, ${viewYear}`}
                    aria-disabled={cell.disabled}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* Selected date display */}
            <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${SURFACE_LIGHT}` }}>
              {selectedDate ? (
                <p className="text-sm" style={{ color: ACCENT }}>
                  Check-in: <span className="font-semibold" style={{ color: PRIMARY }}>{selectedDate}</span>
                </p>
              ) : (
                <p className="text-sm" style={{ color: MUTED }}>No date selected</p>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!selectedDate}
              className="w-full mt-4 py-3 text-base font-semibold transition-opacity"
              style={{
                borderRadius: 9999,
                background: selectedDate ? BRAND : SURFACE_LIGHT,
                color: selectedDate ? PRIMARY : MUTED,
                border: "none",
                cursor: selectedDate ? "pointer" : "default",
                opacity: selectedDate ? 1 : 0.6,
              }}
            >
              {selectedDate ? "Reserve Now" : "Select a date to continue"}
            </button>
          </div>
        </div>

        {/* Right column — property cards grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold" style={{ color: PRIMARY }}>Nearby Stays</h2>
            <span className="text-sm" style={{ color: MUTED }}>{PROPERTIES.length} properties</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {PROPERTIES.map((p, idx) => (
              <div
                key={idx}
                className="overflow-hidden transition-transform hover:scale-[1.02]"
                style={{ background: CARD_BG, borderRadius: 16, border: `1px solid ${SURFACE_LIGHT}` }}
              >
                {/* Image placeholder */}
                <div
                  className="relative w-full flex items-end justify-start p-3"
                  style={{ height: 180, background: `linear-gradient(135deg, ${p.color} 0%, ${BG} 100%)` }}
                  role="img"
                  aria-label={`${p.name} property photo`}
                >
                  {p.tag && (
                    <span
                      className="text-xs font-semibold px-3 py-1"
                      style={{ borderRadius: 9999, background: `${BG}cc`, color: PRIMARY, backdropFilter: "blur(8px)" }}
                    >
                      {p.tag}
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm" style={{ color: PRIMARY }}>{p.name}</h3>
                    <div className="flex items-center gap-1 text-xs">
                      <StarIcon />
                      <span style={{ color: ACCENT }}>{p.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: MUTED }}>{p.beds} beds · {p.reviews} reviews</p>
                  <div className="flex items-baseline gap-1 pt-1">
                    <span className="text-base font-bold" style={{ color: PRIMARY }}>${p.price}</span>
                    <span className="text-xs" style={{ color: MUTED }}>/night</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: SURFACE, borderTop: `1px solid ${SURFACE_LIGHT}` }}>
        <div className="px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <h4 className="font-semibold mb-3" style={{ color: ACCENT }}>Hosting</h4>
            <ul className="space-y-2">
              {["List your property", "Host resources", "Community forum", "Responsible hosting"].map(t => (
                <li key={t} style={{ color: MUTED }} className="cursor-pointer hover:underline">{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3" style={{ color: ACCENT }}>Trust & Safety</h4>
            <ul className="space-y-2">
              {["Guest verification", "Property standards", "Insurance", "Cancellation policy"].map(t => (
                <li key={t} style={{ color: MUTED }} className="cursor-pointer hover:underline">{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3" style={{ color: ACCENT }}>Community</h4>
            <ul className="space-y-2">
              {["Blog", "Help center", "Invite friends", "Gift cards"].map(t => (
                <li key={t} style={{ color: MUTED }} className="cursor-pointer hover:underline">{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3" style={{ color: ACCENT }}>EchoStay</h4>
            <ul className="space-y-2">
              {["About us", "Careers", "Press", "Contact"].map(t => (
                <li key={t} style={{ color: MUTED }} className="cursor-pointer hover:underline">{t}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="px-8 py-4 flex flex-col md:flex-row items-center justify-between text-xs" style={{ borderTop: `1px solid ${SURFACE_LIGHT}` }}>
          <span style={{ color: MUTED }}>© 2022 EchoStay, Inc. All rights reserved.</span>
          <div className="flex gap-4 mt-2 md:mt-0">
            {["Privacy", "Terms", "Sitemap"].map(t => (
              <span key={t} style={{ color: MUTED }} className="cursor-pointer hover:underline">{t}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
