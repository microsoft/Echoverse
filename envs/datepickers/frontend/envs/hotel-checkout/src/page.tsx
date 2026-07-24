import React, { useState, useCallback, useMemo } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DISABLED_DATES = new Set([
  "2029-12-01",
  "2029-12-02",
  "2029-12-08",
  "2029-12-09",
  "2029-12-15",
  "2029-12-16",
  "2029-12-22",
  "2029-12-23",
  "2029-12-29",
  "2029-12-30",
]);

const MIN_DATE = new Date(2028, 0, 1);
const MAX_DATE = new Date(2030, 11, 31);

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

export default function Page_hotel_checkout(props: GeneratedPageProps) {
  const [viewMonth, setViewMonth] = useState(11);
  const [viewYear, setViewYear] = useState(2029);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [guests, setGuests] = useState(2);
  const [roomType, setRoomType] = useState("Standard");
  const [amenities, setAmenities] = useState<Record<string, boolean>>({
    wifi: true,
    breakfast: false,
    parking: false,
    spa: false,
  });

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
    else { setViewMonth(m => m - 1); }
  }, [canGoPrev, viewMonth]);

  const goNext = useCallback(() => {
    if (!canGoNext) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else { setViewMonth(m => m + 1); }
  }, [canGoNext, viewMonth]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ day: number; iso: string; disabled: boolean } | null> = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toISO(viewYear, viewMonth, d);
      const dt = new Date(viewYear, viewMonth, d);
      const outOfRange = dt < MIN_DATE || dt > MAX_DATE;
      cells.push({ day: d, iso, disabled: outOfRange || DISABLED_DATES.has(iso) });
    }
    return cells;
  }, [viewMonth, viewYear]);

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    props.onSubmit({
      type: "date",
      value: selectedDate,
      raw: { selectedDate, viewMonth, viewYear, guests, roomType, amenities },
    });
  }, [selectedDate, viewMonth, viewYear, guests, roomType, amenities, props]);

  const toggleAmenity = useCallback((key: string) => {
    setAmenities(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const selectedDisplay = useMemo(() => {
    if (!selectedDate) return "Select a date";
    const [y, m, d] = selectedDate.split("-").map(Number);
    return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
  }, [selectedDate]);

  const checkoutDisplay = useMemo(() => {
    if (!selectedDate) return "—";
    const [y, m, d] = selectedDate.split("-").map(Number);
    const co = new Date(y, m - 1, d + 6);
    return `${MONTH_NAMES[co.getMonth()]} ${co.getDate()}, ${co.getFullYear()}`;
  }, [selectedDate]);

  const properties = [
    { name: "Alpine Chalet", location: "Zermatt, Switzerland", stars: 4.9, price: 289, color: "#5a4e7a" },
    { name: "Mountain Lodge", location: "Chamonix, France", stars: 4.7, price: 215, color: "#4e6a5a" },
    { name: "Summit Retreat", location: "Innsbruck, Austria", stars: 4.8, price: 245, color: "#6a5a4e" },
    { name: "Glacier View Inn", location: "Grindelwald, Switzerland", stars: 4.6, price: 199, color: "#4e5a6a" },
    { name: "Pineridge Cabin", location: "Cortina, Italy", stars: 4.5, price: 175, color: "#6a4e5a" },
    { name: "Snow Peak Hotel", location: "St. Moritz, Switzerland", stars: 4.8, price: 310, color: "#5a6a4e" },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ background: BG, color: PRIMARY }}>
      {/* Header */}
      <header className="w-full" style={{ background: SURFACE }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center text-sm font-bold"
              style={{ background: BRAND, color: PRIMARY, borderRadius: "9999px" }}
            >
              AC
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ color: PRIMARY }}>
              Echo<span style={{ color: BRAND }}>Lodge</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 flex-1 max-w-lg mx-8">
            <div
              className="flex-1 flex items-center gap-3 px-5 py-2.5 text-sm"
              style={{ background: SURFACE_LIGHT, color: MUTED, borderRadius: "9999px" }}
            >
              <span>Zermatt</span>
              <span style={{ color: SURFACE_LIGHT }}>|</span>
              <span>Dec 2029</span>
              <span style={{ color: SURFACE_LIGHT }}>|</span>
              <span>2 guests</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              className="text-xs font-medium px-3 py-1.5"
              style={{ border: `1px solid ${MUTED}`, color: ACCENT, borderRadius: "9999px" }}
            >
              List property
            </button>
            <div
              className="w-8 h-8 flex items-center justify-center text-xs font-bold"
              style={{ background: BRAND, color: PRIMARY, borderRadius: "9999px" }}
            >
              U
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative w-full overflow-hidden" style={{ background: `linear-gradient(135deg, ${SURFACE} 0%, ${BG} 100%)` }}>
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 relative z-10">
          <p className="text-sm font-medium uppercase tracking-wider mb-2" style={{ color: MUTED }}>
            Hotel Checkout
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: PRIMARY }}>
            Alpine Chalet · 6-Night Stay
          </h1>
          <p className="text-base mb-4" style={{ color: ACCENT }}>
            Zermatt, Switzerland — Stunning views of the Matterhorn
          </p>
          <div
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium"
            style={{ background: BRAND, color: PRIMARY, borderRadius: "9999px" }}
          >
            <span>📅</span>
            <span>Book a 6-night stay at Alpine Chalet starting December 10, 2029.</span>
          </div>
        </div>
        {/* Hero image placeholder */}
        <div
          className="absolute top-0 right-0 w-2/5 h-full hidden lg:flex items-center justify-center text-xs"
          style={{ background: `linear-gradient(135deg, ${SURFACE_LIGHT}88, ${SURFACE}dd)`, color: MUTED }}
        >
          <div className="text-center">
            <div className="text-3xl mb-2">🏔️</div>
            <span>Property photo (400×300)</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Filters & Options */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Booking Details Card */}
            <div className="p-6 space-y-5" style={{ background: SURFACE, borderRadius: "9999px" ? "16px" : "16px" }}>
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: MUTED }}>
                Booking Details
              </h3>

              {/* Guest Count Stepper */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: ACCENT }}>Guests</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setGuests(g => Math.max(1, g - 1))}
                    className="w-9 h-9 flex items-center justify-center text-lg font-bold transition-colors"
                    style={{ background: SURFACE_LIGHT, color: PRIMARY, borderRadius: "9999px" }}
                  >
                    −
                  </button>
                  <span className="text-lg font-semibold w-8 text-center" style={{ color: PRIMARY }}>{guests}</span>
                  <button
                    onClick={() => setGuests(g => Math.min(8, g + 1))}
                    className="w-9 h-9 flex items-center justify-center text-lg font-bold transition-colors"
                    style={{ background: SURFACE_LIGHT, color: PRIMARY, borderRadius: "9999px" }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Room Type */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: ACCENT }}>Room Type</label>
                <div className="flex flex-wrap gap-2">
                  {["Standard", "Deluxe", "Suite"].map(rt => (
                    <button
                      key={rt}
                      onClick={() => setRoomType(rt)}
                      className="px-4 py-2 text-sm font-medium transition-colors"
                      style={{
                        background: roomType === rt ? BRAND : SURFACE_LIGHT,
                        color: roomType === rt ? PRIMARY : MUTED,
                        borderRadius: "9999px",
                      }}
                    >
                      {rt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: ACCENT }}>Amenities</label>
                <div className="space-y-2">
                  {[
                    { key: "wifi", label: "Free Wi-Fi", icon: "📶" },
                    { key: "breakfast", label: "Breakfast included", icon: "🥐" },
                    { key: "parking", label: "Free parking", icon: "🅿️" },
                    { key: "spa", label: "Spa access", icon: "♨️" },
                  ].map(a => (
                    <label
                      key={a.key}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors"
                      style={{ background: amenities[a.key] ? SURFACE_LIGHT : "transparent", borderRadius: "9999px" }}
                    >
                      <input
                        type="checkbox"
                        checked={amenities[a.key]}
                        onChange={() => toggleAmenity(a.key)}
                        className="sr-only"
                      />
                      <div
                        className="w-5 h-5 flex items-center justify-center text-xs"
                        style={{
                          background: amenities[a.key] ? BRAND : SURFACE_LIGHT,
                          color: PRIMARY,
                          borderRadius: "4px",
                          border: amenities[a.key] ? "none" : `1px solid ${MUTED}`,
                        }}
                      >
                        {amenities[a.key] ? "✓" : ""}
                      </div>
                      <span className="text-sm" style={{ color: ACCENT }}>{a.icon} {a.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Stay Summary */}
            <div className="p-6 space-y-4" style={{ background: SURFACE, borderRadius: "16px" }}>
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: MUTED }}>
                Stay Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between" style={{ color: ACCENT }}>
                  <span>Check-in</span>
                  <span className="font-medium" style={{ color: PRIMARY }}>{selectedDisplay}</span>
                </div>
                <div className="flex justify-between" style={{ color: ACCENT }}>
                  <span>Check-out</span>
                  <span className="font-medium" style={{ color: PRIMARY }}>{checkoutDisplay}</span>
                </div>
                <div className="flex justify-between" style={{ color: ACCENT }}>
                  <span>Duration</span>
                  <span className="font-medium" style={{ color: PRIMARY }}>6 nights</span>
                </div>
                <div className="flex justify-between" style={{ color: ACCENT }}>
                  <span>Guests</span>
                  <span className="font-medium" style={{ color: PRIMARY }}>{guests}</span>
                </div>
                <div className="flex justify-between" style={{ color: ACCENT }}>
                  <span>Room</span>
                  <span className="font-medium" style={{ color: PRIMARY }}>{roomType}</span>
                </div>
                <div className="border-t pt-3 mt-3 flex justify-between" style={{ borderColor: SURFACE_LIGHT }}>
                  <span className="font-semibold" style={{ color: ACCENT }}>Total</span>
                  <span className="font-bold text-lg" style={{ color: BRAND }}>
                    ${selectedDate ? (289 * 6) : "—"}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Column: Calendar + Properties */}
          <div className="lg:col-span-8 space-y-8">
            {/* Calendar */}
            <div className="p-6" style={{ background: SURFACE, borderRadius: "16px" }}>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-5" style={{ color: MUTED }}>
                Select Check-in Date
              </h3>

              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-5">
                <button
                  onClick={goPrev}
                  disabled={!canGoPrev}
                  className="w-10 h-10 flex items-center justify-center text-lg font-bold transition-colors"
                  style={{
                    background: canGoPrev ? SURFACE_LIGHT : "transparent",
                    color: canGoPrev ? PRIMARY : SURFACE_LIGHT,
                    borderRadius: "9999px",
                    cursor: canGoPrev ? "pointer" : "not-allowed",
                  }}
                >
                  ‹
                </button>
                <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </span>
                <button
                  onClick={goNext}
                  disabled={!canGoNext}
                  className="w-10 h-10 flex items-center justify-center text-lg font-bold transition-colors"
                  style={{
                    background: canGoNext ? SURFACE_LIGHT : "transparent",
                    color: canGoNext ? PRIMARY : SURFACE_LIGHT,
                    borderRadius: "9999px",
                    cursor: canGoNext ? "pointer" : "not-allowed",
                  }}
                >
                  ›
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAY_LABELS.map(d => (
                  <div key={d} className="text-center text-xs font-medium py-2" style={{ color: MUTED }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((cell, i) => {
                  if (!cell) return <div key={`e-${i}`} />;
                  const isSelected = selectedDate === cell.iso;
                  const isDisabled = cell.disabled;
                  return (
                    <button
                      key={cell.iso}
                      disabled={isDisabled}
                      onClick={() => !isDisabled && setSelectedDate(cell.iso)}
                      className="relative flex items-center justify-center py-3 text-sm font-medium transition-all"
                      style={{
                        background: isSelected ? BRAND : "transparent",
                        color: isDisabled ? SURFACE_LIGHT : isSelected ? PRIMARY : ACCENT,
                        borderRadius: "9999px",
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        opacity: isDisabled ? 0.35 : 1,
                      }}
                      onMouseEnter={e => {
                        if (!isDisabled && !isSelected) {
                          (e.currentTarget as HTMLElement).style.background = SURFACE_LIGHT;
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isDisabled && !isSelected) {
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                        }
                      }}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6 mt-5 text-xs" style={{ color: MUTED }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{ background: BRAND, borderRadius: "9999px" }} />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{ background: SURFACE_LIGHT, borderRadius: "9999px", opacity: 0.35 }} />
                  <span>Unavailable</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!selectedDate}
              className="w-full py-4 text-base font-semibold tracking-wide transition-all"
              style={{
                background: selectedDate ? BRAND : SURFACE_LIGHT,
                color: selectedDate ? PRIMARY : MUTED,
                borderRadius: "9999px",
                cursor: selectedDate ? "pointer" : "not-allowed",
                opacity: selectedDate ? 1 : 0.6,
              }}
            >
              {selectedDate ? `Confirm Check-in · ${selectedDisplay}` : "Select a check-in date to continue"}
            </button>

            {/* Property Cards Grid */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-5" style={{ color: MUTED }}>
                Similar Properties Nearby
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {properties.map(p => (
                  <div
                    key={p.name}
                    className="overflow-hidden transition-transform hover:scale-[1.02]"
                    style={{ background: CARD_BG, borderRadius: "16px" }}
                  >
                    {/* Image placeholder */}
                    <div
                      className="w-full h-40 flex items-center justify-center text-xs"
                      style={{ background: p.color, color: MUTED }}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">🏔️</div>
                        <span>Property photo (400×300)</span>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold" style={{ color: PRIMARY }}>{p.name}</h4>
                        <div className="flex items-center gap-1 text-xs" style={{ color: BRAND }}>
                          <span>★</span>
                          <span>{p.stars}</span>
                        </div>
                      </div>
                      <p className="text-xs" style={{ color: MUTED }}>{p.location}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-sm font-bold" style={{ color: PRIMARY }}>${p.price}</span>
                        <span className="text-xs" style={{ color: MUTED }}>per night</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full mt-16" style={{ background: SURFACE }}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
            <div>
              <h4 className="font-semibold mb-3" style={{ color: PRIMARY }}>Hosting</h4>
              <ul className="space-y-2" style={{ color: MUTED }}>
                <li>List your property</li>
                <li>Host resources</li>
                <li>Community forum</li>
                <li>Responsible hosting</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3" style={{ color: PRIMARY }}>Trust & Safety</h4>
              <ul className="space-y-2" style={{ color: MUTED }}>
                <li>Guest reviews</li>
                <li>Safety center</li>
                <li>Insurance info</li>
                <li>COVID-19 resources</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3" style={{ color: PRIMARY }}>Community</h4>
              <ul className="space-y-2" style={{ color: MUTED }}>
                <li>Invite friends</li>
                <li>Gift cards</li>
                <li>Travel guides</li>
                <li>Blog</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3" style={{ color: PRIMARY }}>Support</h4>
              <ul className="space-y-2" style={{ color: MUTED }}>
                <li>Help center</li>
                <li>Cancellation policy</li>
                <li>Terms of service</li>
                <li>Privacy policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: SURFACE_LIGHT }}>
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 flex items-center justify-center text-xs font-bold"
                style={{ background: BRAND, color: PRIMARY, borderRadius: "9999px" }}
              >
                AC
              </div>
              <span className="text-sm font-semibold" style={{ color: PRIMARY }}>
                Echo<span style={{ color: BRAND }}>Lodge</span>
              </span>
            </div>
            <p className="text-xs" style={{ color: MUTED }}>© 2029 EchoLodge, Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
