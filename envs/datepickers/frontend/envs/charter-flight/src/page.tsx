import React, { useState, useCallback, useMemo } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DISABLED_DATES = new Set([
  "2016-04-02","2016-04-03","2016-04-09","2016-04-10",
  "2016-04-16","2016-04-17","2016-04-23","2016-04-24","2016-04-30",
]);

const MIN_DATE = new Date(2015, 0, 1);
const MAX_DATE = new Date(2017, 11, 31);

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function pad(n: number) { return n < 10 ? "0" + n : "" + n; }
function toISO(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

const PRIMARY = "#2d2b36";
const SECONDARY = "#121315";
const BG = "#101113";
const ACCENT = "#111315";
const BRAND_BLUE = "#003580";
const YELLOW = "#febb02";
const SURFACE = "#1c1b24";
const SURFACE_LIGHT = "#252430";
const TEXT_PRIMARY = "#f0f0f2";
const TEXT_SECONDARY = "#8a8994";
const CARD_BG = "#18171f";

export default function Page_charter_flight(props: GeneratedPageProps) {
  const [viewMonth, setViewMonth] = useState(3); // April = 3 (0-indexed)
  const [viewYear, setViewYear] = useState(2016);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState(3);
  const [selectedMinute, setSelectedMinute] = useState(15);
  const [selectedAmPm, setSelectedAmPm] = useState<"AM" | "PM">("PM");

  const [from] = useState("New York (JFK)");
  const [to] = useState("Lisbon (LIS)");
  const [travelers] = useState(1);
  const [cabinClass, setCabinClass] = useState("Business");
  const [tripType, setTripType] = useState<"one-way" | "round-trip">("one-way");
  const [filterNonstop, setFilterNonstop] = useState(false);
  const [filterTime, setFilterTime] = useState("any");

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
      const date = new Date(viewYear, viewMonth, d);
      const outOfRange = date < MIN_DATE || date > MAX_DATE;
      const disabled = DISABLED_DATES.has(iso) || outOfRange;
      cells.push({ day: d, iso, disabled, outOfRange });
    }
    return cells;
  }, [viewMonth, viewYear]);

  const get24Hour = useCallback(() => {
    let h = selectedHour;
    if (selectedAmPm === "AM" && h === 12) h = 0;
    else if (selectedAmPm === "PM" && h !== 12) h += 12;
    return h;
  }, [selectedHour, selectedAmPm]);

  const selectedISO = useMemo(() => {
    if (!selectedDate) return "";
    const h24 = get24Hour();
    return `${selectedDate}T${pad(h24)}:${pad(selectedMinute)}:00`;
  }, [selectedDate, get24Hour, selectedMinute]);

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    props.onSubmit({
      type: "datetime",
      value: selectedISO,
      raw: {
        date: selectedDate,
        hour: selectedHour,
        minute: selectedMinute,
        ampm: selectedAmPm,
        hour24: get24Hour(),
        from,
        to,
        travelers,
        cabinClass,
        tripType,
      },
    });
  }, [selectedISO, selectedDate, selectedHour, selectedMinute, selectedAmPm, get24Hour, from, to, travelers, cabinClass, tripType, props]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const popularRoutes = [
    { from: "New York", to: "London", price: "$412" },
    { from: "New York", to: "Paris", price: "$389" },
    { from: "New York", to: "Lisbon", price: "$358" },
    { from: "New York", to: "Barcelona", price: "$425" },
    { from: "New York", to: "Rome", price: "$445" },
    { from: "New York", to: "Dublin", price: "$320" },
  ];

  const flightResults = [
    { airline: "Atlantic Charter", depart: "08:30", arrive: "20:15", duration: "7h 45m", stops: "Nonstop", price: "$1,280" },
    { airline: "TransEuro Air", depart: "11:00", arrive: "23:30", duration: "8h 30m", stops: "1 stop", price: "$940" },
    { airline: "LisAir Express", depart: "15:15", arrive: "03:45+1", duration: "8h 30m", stops: "Nonstop", price: "$1,150" },
    { airline: "SkyBridge", depart: "19:00", arrive: "07:20+1", duration: "8h 20m", stops: "Nonstop", price: "$1,320" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG, color: TEXT_PRIMARY, fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <header className="w-full" style={{ background: PRIMARY }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold" style={{ background: YELLOW, color: "#1a1a2e" }}>CF</div>
            <span className="text-lg font-semibold tracking-tight" style={{ color: TEXT_PRIMARY }}>Charter Flight</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: TEXT_SECONDARY }}>
            <span className="cursor-pointer hover:text-white transition-colors">Flights</span>
            <span className="cursor-pointer hover:text-white transition-colors">Deals</span>
            <span className="cursor-pointer hover:text-white transition-colors">Charter</span>
            <span className="cursor-pointer hover:text-white transition-colors">Support</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-1 rounded" style={{ background: SURFACE, color: TEXT_SECONDARY }}>USD</span>
            <span className="text-xs px-2 py-1 rounded" style={{ background: SURFACE, color: TEXT_SECONDARY }}>EN</span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: SURFACE_LIGHT, color: TEXT_SECONDARY }}>JD</div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative w-full" style={{ background: SECONDARY }}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: TEXT_PRIMARY }}>Charter your next flight</h1>
          <p className="text-sm mb-4" style={{ color: TEXT_SECONDARY }}>Premium private aviation — New York to Lisbon</p>

          {/* Instruction Banner */}
          <div className="rounded px-4 py-3 mb-4" style={{ background: "rgba(254,187,2,0.08)", border: `1px solid ${YELLOW}33` }}>
            <p className="text-sm font-medium" style={{ color: YELLOW }}>
              Book a flight from New York to Lisbon. Select your departure date: April 18, 2016 at 15:15.
            </p>
          </div>

          {/* Search Bar Mock */}
          <div className="flex flex-wrap items-center gap-2 rounded p-3" style={{ background: SURFACE }}>
            <div className="flex-1 min-w-[140px] px-3 py-2 rounded text-sm" style={{ background: ACCENT, color: TEXT_PRIMARY }}>
              <span className="block text-[10px] uppercase tracking-wider mb-0.5" style={{ color: TEXT_SECONDARY }}>From</span>
              {from}
            </div>
            <div className="flex-1 min-w-[140px] px-3 py-2 rounded text-sm" style={{ background: ACCENT, color: TEXT_PRIMARY }}>
              <span className="block text-[10px] uppercase tracking-wider mb-0.5" style={{ color: TEXT_SECONDARY }}>To</span>
              {to}
            </div>
            <div className="flex-1 min-w-[120px] px-3 py-2 rounded text-sm" style={{ background: ACCENT, color: TEXT_PRIMARY }}>
              <span className="block text-[10px] uppercase tracking-wider mb-0.5" style={{ color: TEXT_SECONDARY }}>Departure</span>
              {selectedDate || "Select date"}
            </div>
            <div className="px-3 py-2 rounded text-sm" style={{ background: ACCENT, color: TEXT_PRIMARY }}>
              <span className="block text-[10px] uppercase tracking-wider mb-0.5" style={{ color: TEXT_SECONDARY }}>Travelers</span>
              {travelers} Adult
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left: Filters */}
          <aside className="w-full lg:w-56 shrink-0">
            <div className="rounded p-4 mb-3" style={{ background: CARD_BG, border: `1px solid ${SURFACE_LIGHT}` }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: TEXT_SECONDARY }}>Trip Type</h3>
              <div className="flex gap-1">
                {(["one-way", "round-trip"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTripType(t)}
                    className="flex-1 text-xs py-1.5 rounded transition-colors capitalize"
                    style={{
                      background: tripType === t ? YELLOW : SURFACE,
                      color: tripType === t ? "#1a1a2e" : TEXT_SECONDARY,
                      fontWeight: tripType === t ? 600 : 400,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded p-4 mb-3" style={{ background: CARD_BG, border: `1px solid ${SURFACE_LIGHT}` }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: TEXT_SECONDARY }}>Cabin Class</h3>
              <select
                value={cabinClass}
                onChange={e => setCabinClass(e.target.value)}
                className="w-full text-sm py-1.5 px-2 rounded border-0 outline-none"
                style={{ background: SURFACE, color: TEXT_PRIMARY }}
              >
                <option>Economy</option>
                <option>Premium Economy</option>
                <option>Business</option>
                <option>First</option>
              </select>
            </div>

            <div className="rounded p-4 mb-3" style={{ background: CARD_BG, border: `1px solid ${SURFACE_LIGHT}` }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: TEXT_SECONDARY }}>Filters</h3>
              <label className="flex items-center gap-2 text-sm cursor-pointer mb-2" style={{ color: TEXT_PRIMARY }}>
                <input
                  type="checkbox"
                  checked={filterNonstop}
                  onChange={() => setFilterNonstop(!filterNonstop)}
                  className="rounded"
                />
                Nonstop only
              </label>
              <div className="mt-3">
                <span className="text-xs mb-1.5 block" style={{ color: TEXT_SECONDARY }}>Departure Time</span>
                <select
                  value={filterTime}
                  onChange={e => setFilterTime(e.target.value)}
                  className="w-full text-sm py-1.5 px-2 rounded border-0 outline-none"
                  style={{ background: SURFACE, color: TEXT_PRIMARY }}
                >
                  <option value="any">Any time</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Center: Calendar + Time + Results Table */}
          <div className="flex-1 min-w-0">
            {/* Calendar Card */}
            <div className="rounded p-4 mb-4" style={{ background: CARD_BG, border: `1px solid ${SURFACE_LIGHT}` }}>
              <h2 className="text-base font-semibold mb-3" style={{ color: TEXT_PRIMARY }}>Select Departure Date & Time</h2>

              {/* Calendar */}
              <div className="max-w-sm mx-auto">
                {/* Month Nav */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={goPrev}
                    disabled={!canGoPrev}
                    className="w-8 h-8 flex items-center justify-center rounded text-sm transition-colors"
                    style={{
                      background: canGoPrev ? SURFACE : "transparent",
                      color: canGoPrev ? TEXT_PRIMARY : TEXT_SECONDARY,
                      cursor: canGoPrev ? "pointer" : "not-allowed",
                      opacity: canGoPrev ? 1 : 0.3,
                    }}
                  >
                    ‹
                  </button>
                  <span className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </span>
                  <button
                    onClick={goNext}
                    disabled={!canGoNext}
                    className="w-8 h-8 flex items-center justify-center rounded text-sm transition-colors"
                    style={{
                      background: canGoNext ? SURFACE : "transparent",
                      color: canGoNext ? TEXT_PRIMARY : TEXT_SECONDARY,
                      cursor: canGoNext ? "pointer" : "not-allowed",
                      opacity: canGoNext ? 1 : 0.3,
                    }}
                  >
                    ›
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {DAY_LABELS.map(d => (
                    <div key={d} className="text-center text-[11px] py-1 font-medium" style={{ color: TEXT_SECONDARY }}>{d}</div>
                  ))}
                </div>

                {/* Day Cells */}
                <div className="grid grid-cols-7 gap-0.5">
                  {calendarDays.map((cell, i) => {
                    if (!cell) return <div key={`e-${i}`} className="h-9" />;
                    const isSelected = selectedDate === cell.iso;
                    const isDisabled = cell.disabled;
                    const isToday = cell.iso === toISO(2016, 3, 18); // highlight target hint — but NOT auto-selected
                    return (
                      <button
                        key={cell.iso}
                        disabled={isDisabled}
                        onClick={() => !isDisabled && setSelectedDate(cell.iso)}
                        className="h-9 flex items-center justify-center rounded text-sm transition-all"
                        style={{
                          background: isSelected ? YELLOW : "transparent",
                          color: isSelected ? "#1a1a2e" : isDisabled ? "#444" : TEXT_PRIMARY,
                          fontWeight: isSelected ? 700 : 400,
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          opacity: isDisabled ? 0.35 : 1,
                          outline: isToday && !isSelected ? `1px solid ${TEXT_SECONDARY}` : "none",
                        }}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Picker */}
              <div className="max-w-sm mx-auto mt-4 pt-4" style={{ borderTop: `1px solid ${SURFACE_LIGHT}` }}>
                <span className="text-xs font-medium block mb-2" style={{ color: TEXT_SECONDARY }}>Departure Time</span>
                <div className="flex items-center gap-2">
                  {/* Hour */}
                  <select
                    value={selectedHour}
                    onChange={e => setSelectedHour(Number(e.target.value))}
                    className="flex-1 text-sm py-2 px-2 rounded border-0 outline-none text-center"
                    style={{ background: SURFACE, color: TEXT_PRIMARY }}
                  >
                    {hours.map(h => (
                      <option key={h} value={h}>{pad(h)}</option>
                    ))}
                  </select>
                  <span className="text-lg font-bold" style={{ color: TEXT_SECONDARY }}>:</span>
                  {/* Minute */}
                  <select
                    value={selectedMinute}
                    onChange={e => setSelectedMinute(Number(e.target.value))}
                    className="flex-1 text-sm py-2 px-2 rounded border-0 outline-none text-center"
                    style={{ background: SURFACE, color: TEXT_PRIMARY }}
                  >
                    {minutes.map(m => (
                      <option key={m} value={m}>{pad(m)}</option>
                    ))}
                  </select>
                  {/* AM/PM */}
                  <div className="flex rounded overflow-hidden" style={{ border: `1px solid ${SURFACE_LIGHT}` }}>
                    {(["AM", "PM"] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setSelectedAmPm(p)}
                        className="px-3 py-2 text-xs font-semibold transition-colors"
                        style={{
                          background: selectedAmPm === p ? YELLOW : SURFACE,
                          color: selectedAmPm === p ? "#1a1a2e" : TEXT_SECONDARY,
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selected Summary & Submit */}
              <div className="max-w-sm mx-auto mt-4 pt-3" style={{ borderTop: `1px solid ${SURFACE_LIGHT}` }}>
                {selectedDate ? (
                  <p className="text-sm mb-3" style={{ color: TEXT_PRIMARY }}>
                    <span style={{ color: TEXT_SECONDARY }}>Selected: </span>
                    {MONTH_NAMES[parseInt(selectedDate.split("-")[1], 10) - 1]} {parseInt(selectedDate.split("-")[2], 10)}, {selectedDate.split("-")[0]}
                    {" at "}
                    {pad(selectedHour)}:{pad(selectedMinute)} {selectedAmPm}
                  </p>
                ) : (
                  <p className="text-sm mb-3" style={{ color: TEXT_SECONDARY }}>No date selected</p>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!selectedDate}
                  className="w-full py-2.5 rounded text-sm font-semibold transition-all"
                  style={{
                    background: selectedDate ? YELLOW : SURFACE,
                    color: selectedDate ? "#1a1a2e" : TEXT_SECONDARY,
                    cursor: selectedDate ? "pointer" : "not-allowed",
                    opacity: selectedDate ? 1 : 0.5,
                  }}
                >
                  Confirm Departure
                </button>
              </div>
            </div>

            {/* Flight Results Table */}
            <div className="rounded overflow-hidden mb-4" style={{ background: CARD_BG, border: `1px solid ${SURFACE_LIGHT}` }}>
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${SURFACE_LIGHT}` }}>
                <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Available Charter Flights — JFK → LIS</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: SURFACE }}>
                      <th className="text-left px-4 py-2 font-medium text-xs" style={{ color: TEXT_SECONDARY }}>Airline</th>
                      <th className="text-left px-4 py-2 font-medium text-xs" style={{ color: TEXT_SECONDARY }}>Depart</th>
                      <th className="text-left px-4 py-2 font-medium text-xs" style={{ color: TEXT_SECONDARY }}>Arrive</th>
                      <th className="text-left px-4 py-2 font-medium text-xs" style={{ color: TEXT_SECONDARY }}>Duration</th>
                      <th className="text-left px-4 py-2 font-medium text-xs" style={{ color: TEXT_SECONDARY }}>Stops</th>
                      <th className="text-right px-4 py-2 font-medium text-xs" style={{ color: TEXT_SECONDARY }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flightResults.map((f, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${SURFACE_LIGHT}` }}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold" style={{ background: SURFACE_LIGHT, color: YELLOW }}>
                              {f.airline.split(" ").map(w => w[0]).join("")}
                            </div>
                            <span style={{ color: TEXT_PRIMARY }}>{f.airline}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-medium" style={{ color: TEXT_PRIMARY }}>{f.depart}</td>
                        <td className="px-4 py-2.5" style={{ color: TEXT_PRIMARY }}>{f.arrive}</td>
                        <td className="px-4 py-2.5" style={{ color: TEXT_SECONDARY }}>{f.duration}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{
                              background: f.stops === "Nonstop" ? "rgba(76,175,80,0.15)" : "rgba(255,152,0,0.15)",
                              color: f.stops === "Nonstop" ? "#66bb6a" : "#ffa726",
                            }}
                          >
                            {f.stops}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold" style={{ color: YELLOW }}>{f.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Popular Routes */}
            <div className="rounded p-4" style={{ background: CARD_BG, border: `1px solid ${SURFACE_LIGHT}` }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: TEXT_PRIMARY }}>Popular Routes from New York</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {popularRoutes.map((r, i) => (
                  <div key={i} className="rounded p-3" style={{ background: SURFACE }}>
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-xs" style={{ color: TEXT_SECONDARY }}>{r.from}</span>
                      <span className="text-[10px]" style={{ color: TEXT_SECONDARY }}>→</span>
                      <span className="text-xs font-medium" style={{ color: TEXT_PRIMARY }}>{r.to}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      {/* Destination image placeholder */}
                      <div
                        className="w-12 h-8 rounded flex items-center justify-center text-[8px]"
                        style={{ background: SURFACE_LIGHT, color: TEXT_SECONDARY }}
                        title={`${r.to} destination photo`}
                      >
                        640×360
                      </div>
                      <span className="text-sm font-semibold" style={{ color: YELLOW }}>from {r.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full mt-8" style={{ background: PRIMARY, borderTop: `1px solid ${SURFACE_LIGHT}` }}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: TEXT_SECONDARY }}>Company</h4>
              <div className="flex flex-col gap-1 text-xs" style={{ color: TEXT_SECONDARY }}>
                <span>About Us</span><span>Careers</span><span>Press</span><span>Blog</span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: TEXT_SECONDARY }}>Support</h4>
              <div className="flex flex-col gap-1 text-xs" style={{ color: TEXT_SECONDARY }}>
                <span>Help Center</span><span>Contact</span><span>Safety</span><span>Accessibility</span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: TEXT_SECONDARY }}>Legal</h4>
              <div className="flex flex-col gap-1 text-xs" style={{ color: TEXT_SECONDARY }}>
                <span>Terms of Use</span><span>Privacy</span><span>Cookies</span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: TEXT_SECONDARY }}>Get the App</h4>
              <div className="flex flex-col gap-1.5">
                <div className="rounded px-2 py-1.5 text-[10px] text-center" style={{ background: SURFACE, color: TEXT_SECONDARY }}>EchoStore</div>
                <div className="rounded px-2 py-1.5 text-[10px] text-center" style={{ background: SURFACE, color: TEXT_SECONDARY }}>EchoPlay</div>
              </div>
            </div>
          </div>
          <div className="text-center text-[11px] pt-4" style={{ color: TEXT_SECONDARY, borderTop: `1px solid ${SURFACE_LIGHT}` }}>
            © 2016 Charter Flight Inc. All rights reserved. Task ID: {props.taskId}
          </div>
        </div>
      </footer>
    </div>
  );
}
