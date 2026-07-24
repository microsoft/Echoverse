import React, { useState, useCallback, useMemo } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}
function firstDayOfMonth(month: number, year: number) {
  return new Date(year, month - 1, 1).getDay();
}
function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const MAX_DATE = { year: 2025, month: 9, day: 30 };
const YEAR_MIN = 1950;
const YEAR_MAX = 2015;
const YEARS = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MIN + i);

function AttendeeDOBPicker(props: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [viewMonth, setViewMonth] = useState(9);
  const [viewYear, setViewYear] = useState(2025);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const totalDays = useMemo(() => daysInMonth(viewMonth, viewYear), [viewMonth, viewYear]);
  const startDay = useMemo(() => firstDayOfMonth(viewMonth, viewYear), [viewMonth, viewYear]);

  const isDayDisabled = useCallback((day: number) => {
    const y = viewYear;
    const m = viewMonth;
    if (y > MAX_DATE.year) return true;
    if (y === MAX_DATE.year && m > MAX_DATE.month) return true;
    if (y === MAX_DATE.year && m === MAX_DATE.month && day > MAX_DATE.day) return true;
    return false;
  }, [viewMonth, viewYear]);

  const canGoNext = useMemo(() => {
    if (viewYear < MAX_DATE.year) return true;
    if (viewYear === MAX_DATE.year && viewMonth < MAX_DATE.month) return true;
    return false;
  }, [viewMonth, viewYear]);

  const handlePrev = useCallback(() => {
    setViewMonth(m => {
      if (m === 1) { setViewYear(y => y - 1); return 12; }
      return m - 1;
    });
  }, []);

  const handleNext = useCallback(() => {
    if (!canGoNext) return;
    setViewMonth(m => {
      if (m === 12) { setViewYear(y => y + 1); return 1; }
      return m + 1;
    });
  }, [canGoNext]);

  const handleYearChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = parseInt(e.target.value, 10);
    setViewYear(y);
    if (y === MAX_DATE.year && viewMonth > MAX_DATE.month) {
      setViewMonth(MAX_DATE.month);
    }
  }, [viewMonth]);

  const handleMonthChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = parseInt(e.target.value, 10);
    if (viewYear === MAX_DATE.year && m > MAX_DATE.month) return;
    setViewMonth(m);
  }, [viewYear]);

  const handleDayClick = useCallback((day: number) => {
    if (isDayDisabled(day)) return;
    setSelectedDate(toISO(viewYear, viewMonth, day));
  }, [viewYear, viewMonth, isDayDisabled]);

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    const [sy, sm, sd] = selectedDate.split("-").map(Number);
    props.onSubmit({
      type: "dob",
      value: selectedDate,
      raw: {
        widget_id: "attendee_dob",
        year: sy,
        month: sm,
        day: sd,
        month_name: MONTH_NAMES[sm - 1],
        iso: selectedDate,
      },
    });
  }, [selectedDate, props]);

  const availableMonths = useMemo(() => {
    if (viewYear === MAX_DATE.year) return MONTH_NAMES.slice(0, MAX_DATE.month);
    return MONTH_NAMES;
  }, [viewYear]);

  const cells: (number | null)[] = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) arr.push(null);
    for (let d = 1; d <= totalDays; d++) arr.push(d);
    return arr;
  }, [startDay, totalDays]);

  return (
    <div data-widget-id="attendee_dob" className="w-full">
      <label className="block text-sm font-semibold mb-1" style={{ color: "#bbbabe" }}>
        Date of Birth
      </label>
      <p className="text-xs mb-3" style={{ color: "#60606a" }}>
        Select your date of birth. Only dates up to September 30, 2025 are available.
      </p>

      <div className="rounded-lg p-4" style={{ backgroundColor: "#1f202b", border: "1px solid #272732" }}>
        <div className="flex items-center gap-2 mb-3">
          <select
            value={viewYear}
            onChange={handleYearChange}
            className="rounded-md px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2"
            style={{ backgroundColor: "#272732", color: "#bbbabe", border: "1px solid #60606a", borderRadius: "8px" }}
            aria-label="Select year"
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={viewMonth}
            onChange={handleMonthChange}
            className="rounded-md px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2"
            style={{ backgroundColor: "#272732", color: "#bbbabe", border: "1px solid #60606a", borderRadius: "8px" }}
            aria-label="Select month"
          >
            {availableMonths.map((name, i) => <option key={i} value={i + 1}>{name}</option>)}
          </select>
        </div>

        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={handlePrev}
            className="w-7 h-7 flex items-center justify-center rounded-md text-sm font-bold transition-colors"
            style={{ color: "#bbbabe", backgroundColor: "#272732" }}
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="text-sm font-semibold" style={{ color: "#bbbabe" }}>
            {MONTH_NAMES[viewMonth - 1]} {viewYear}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext}
            className="w-7 h-7 flex items-center justify-center rounded-md text-sm font-bold transition-colors"
            style={{
              color: canGoNext ? "#bbbabe" : "#60606a",
              backgroundColor: canGoNext ? "#272732" : "transparent",
              cursor: canGoNext ? "pointer" : "not-allowed",
            }}
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center text-xs font-medium py-1" style={{ color: "#60606a" }}>
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} />;
            const iso = toISO(viewYear, viewMonth, day);
            const disabled = isDayDisabled(day);
            const selected = selectedDate === iso;
            return (
              <button
                key={idx}
                type="button"
                disabled={disabled}
                onClick={() => handleDayClick(day)}
                className="h-8 text-sm rounded-md transition-colors"
                style={{
                  color: disabled ? "#3a3a44" : selected ? "#0c0b21" : "#bbbabe",
                  backgroundColor: selected ? "#6366F1" : "transparent",
                  cursor: disabled ? "not-allowed" : "pointer",
                  textDecoration: disabled ? "line-through" : "none",
                  fontWeight: selected ? 600 : 400,
                  borderRadius: "8px",
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <p className="text-xs mt-3 font-medium" style={{ color: "#6366F1" }}>
            Selected: {selectedDate}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedDate}
        className="w-full mt-3 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
        style={{ backgroundColor: "#6366F1", color: "#fff", borderRadius: "8px" }}
      >
        Confirm Date of Birth
      </button>
    </div>
  );
}

/* ─── Similar Events Data ─── */
const SIMILAR_EVENTS = [
  { title: "AI & Innovation Expo", date: "Oct 15, 2025", img: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=300&fit=crop", venue: "Tech Center Hall A" },
  { title: "Creative Arts Night", date: "Nov 2, 2025", img: "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400&h=300&fit=crop", venue: "Gallery District" },
  { title: "Indie Film Showcase", date: "Nov 18, 2025", img: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=300&fit=crop", venue: "Downtown Cinema" },
];

/* ─── Filter Tags ─── */
const FILTER_TAGS = ["All Events", "Technology", "Startups", "Networking", "Workshops", "Keynotes"];

export default function Page_startup_summit(props: GeneratedPageProps) {
  const [activeFilter, setActiveFilter] = useState("All Events");
  const [ticketQty, setTicketQty] = useState(1);
  const [promoCode, setPromoCode] = useState("");
  const [seatSection, setSeatSection] = useState("General");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0c0b21", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: "#1f202b", borderBottom: "1px solid #272732" }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎫</span>
              <span className="text-lg font-bold" style={{ color: "#bbbabe" }}>EchoEvents</span>
            </div>
            <nav className="hidden md:flex items-center gap-5 text-sm" style={{ color: "#60606a" }}>
              {["Browse", "Tickets", "Calendar", "Saved"].map(item => (
                <a key={item} href="#" className="hover:opacity-80 transition-opacity" style={{ color: "#60606a" }}>{item}</a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center rounded-lg px-3 py-1.5" style={{ backgroundColor: "#272732", border: "1px solid #60606a", borderRadius: "8px" }}>
              <span className="text-xs mr-2" style={{ color: "#60606a" }}>🔍</span>
              <input
                type="text"
                placeholder="Search events..."
                className="bg-transparent text-sm outline-none w-32"
                style={{ color: "#bbbabe" }}
              />
            </div>
            <select
              className="text-xs rounded-lg px-2 py-1.5"
              style={{ backgroundColor: "#272732", color: "#60606a", border: "1px solid #60606a", borderRadius: "8px" }}
            >
              <option>San Francisco</option>
              <option>New York</option>
              <option>Austin</option>
            </select>
            <button className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: "#6366F1", color: "#fff", borderRadius: "8px" }}>
              + Create Event
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "#272732", color: "#bbbabe" }}>
              JD
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative">
        <img
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=400&fit=crop"
          alt="Startup Summit crowd"
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 flex items-end" style={{ background: "linear-gradient(transparent 30%, #0c0b21)" }}>
          <div className="max-w-6xl mx-auto w-full px-4 pb-6">
            <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: "#6366F1", color: "#fff", borderRadius: "8px" }}>
              Featured Event
            </span>
            <h1 className="text-3xl font-bold mt-2" style={{ color: "#bbbabe" }}>Startup Summit 2025</h1>
            <p className="text-sm mt-1" style={{ color: "#60606a" }}>
              October 10–12, 2025 · Moscone Center, San Francisco
            </p>
            <button className="mt-3 px-5 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: "#F97316", color: "#fff", borderRadius: "8px" }}>
              Get Tickets
            </button>
          </div>
        </div>
      </section>

      {/* Filter Tags */}
      <div className="max-w-6xl mx-auto px-4 mt-5">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {FILTER_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveFilter(tag)}
              className="text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors"
              style={{
                backgroundColor: activeFilter === tag ? "#6366F1" : "#272732",
                color: activeFilter === tag ? "#fff" : "#60606a",
                borderRadius: "8px",
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 mt-5 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Panel: Registration Form + DOB Picker */}
          <div className="lg:col-span-2 space-y-5">
            {/* Context */}
            <div className="rounded-lg p-5" style={{ backgroundColor: "#1f202b", border: "1px solid #272732", borderRadius: "8px" }}>
              <h2 className="text-lg font-bold mb-1" style={{ color: "#bbbabe" }}>Attendee Registration</h2>
              <p className="text-sm" style={{ color: "#60606a" }}>
                Complete your registration for Startup Summit 2025. We require your date of birth for age verification and badge printing.
              </p>
            </div>

            {/* Ticket Config Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg p-4" style={{ backgroundColor: "#1f202b", border: "1px solid #272732", borderRadius: "8px" }}>
                <label className="text-xs font-medium mb-2 block" style={{ color: "#60606a" }}>Ticket Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTicketQty(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-md flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: "#272732", color: "#bbbabe", borderRadius: "8px" }}
                  >−</button>
                  <span className="text-lg font-bold" style={{ color: "#bbbabe" }}>{ticketQty}</span>
                  <button
                    type="button"
                    onClick={() => setTicketQty(q => Math.min(10, q + 1))}
                    className="w-8 h-8 rounded-md flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: "#272732", color: "#bbbabe", borderRadius: "8px" }}
                  >+</button>
                </div>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: "#1f202b", border: "1px solid #272732", borderRadius: "8px" }}>
                <label className="text-xs font-medium mb-2 block" style={{ color: "#60606a" }}>Seat Section</label>
                <select
                  value={seatSection}
                  onChange={e => setSeatSection(e.target.value)}
                  className="w-full rounded-md px-2 py-1.5 text-sm"
                  style={{ backgroundColor: "#272732", color: "#bbbabe", border: "1px solid #60606a", borderRadius: "8px" }}
                >
                  <option>General</option>
                  <option>VIP</option>
                  <option>Premium</option>
                  <option>Balcony</option>
                </select>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: "#1f202b", border: "1px solid #272732", borderRadius: "8px" }}>
                <label className="text-xs font-medium mb-2 block" style={{ color: "#60606a" }}>Promo Code</label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  placeholder="Enter code"
                  className="w-full rounded-md px-2 py-1.5 text-sm outline-none"
                  style={{ backgroundColor: "#272732", color: "#bbbabe", border: "1px solid #60606a", borderRadius: "8px" }}
                />
              </div>
            </div>

            {/* DOB Widget */}
            <div className="rounded-lg p-5" style={{ backgroundColor: "#1f202b", border: "1px solid #272732", borderRadius: "8px" }}>
              <AttendeeDOBPicker onSubmit={props.onSubmit} />
            </div>

            {/* Schedule Table */}
            <div className="rounded-lg p-5" style={{ backgroundColor: "#1f202b", border: "1px solid #272732", borderRadius: "8px" }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: "#bbbabe" }}>Event Schedule</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #272732" }}>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: "#60606a" }}>Time</th>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: "#60606a" }}>Session</th>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: "#60606a" }}>Speaker</th>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: "#60606a" }}>Room</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { time: "9:00 AM", session: "Opening Keynote", speaker: "Sarah Chen", room: "Main Hall" },
                    { time: "10:30 AM", session: "Fundraising 101", speaker: "Mike Torres", room: "Room A" },
                    { time: "12:00 PM", session: "Networking Lunch", speaker: "—", room: "Atrium" },
                    { time: "1:30 PM", session: "Product-Market Fit", speaker: "Lisa Patel", room: "Room B" },
                    { time: "3:00 PM", session: "Pitch Competition", speaker: "Panel", room: "Main Hall" },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #272732" }}>
                      <td className="py-2 px-2" style={{ color: "#bbbabe" }}>{row.time}</td>
                      <td className="py-2 px-2" style={{ color: "#bbbabe" }}>{row.session}</td>
                      <td className="py-2 px-2" style={{ color: "#60606a" }}>{row.speaker}</td>
                      <td className="py-2 px-2" style={{ color: "#60606a" }}>{row.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-5">
            {/* Venue Info */}
            <div className="rounded-lg p-4" style={{ backgroundColor: "#1f202b", border: "1px solid #272732", borderRadius: "8px" }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: "#bbbabe" }}>Venue Info</h3>
              <div className="rounded-lg overflow-hidden mb-3" style={{ backgroundColor: "#272732", borderRadius: "8px" }}>
                <div className="h-28 flex items-center justify-center text-3xl" style={{ backgroundColor: "#272732" }}>📍</div>
              </div>
              <p className="text-xs font-medium" style={{ color: "#bbbabe" }}>Moscone Center</p>
              <p className="text-xs mt-1" style={{ color: "#60606a" }}>747 Howard St, San Francisco, CA 94103</p>
              <p className="text-xs mt-1" style={{ color: "#60606a" }}>Capacity: 10,000 · Free WiFi · Accessible</p>
            </div>

            {/* Organizer */}
            <div className="rounded-lg p-4" style={{ backgroundColor: "#1f202b", border: "1px solid #272732", borderRadius: "8px" }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: "#bbbabe" }}>Organizer</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "#6366F1", color: "#fff" }}>SV</div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#bbbabe" }}>SV Founders Network</p>
                  <p className="text-xs" style={{ color: "#60606a" }}>127 events hosted</p>
                </div>
              </div>
            </div>

            {/* Similar Events */}
            <div className="rounded-lg p-4" style={{ backgroundColor: "#1f202b", border: "1px solid #272732", borderRadius: "8px" }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: "#bbbabe" }}>Similar Events</h3>
              <div className="space-y-3">
                {SIMILAR_EVENTS.map((ev, i) => (
                  <div key={i} className="rounded-lg overflow-hidden" style={{ backgroundColor: "#272732", borderRadius: "8px" }}>
                    <img src={ev.img} alt={ev.title} className="w-full h-28 object-cover" />
                    <div className="p-3">
                      <p className="text-xs font-semibold" style={{ color: "#bbbabe" }}>{ev.title}</p>
                      <p className="text-xs mt-1" style={{ color: "#60606a" }}>{ev.date} · {ev.venue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: "#1f202b", borderTop: "1px solid #272732" }}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs" style={{ color: "#60606a" }}>
            <div>
              <p className="font-semibold mb-2" style={{ color: "#bbbabe" }}>Policies</p>
              <p className="mb-1">Refund Policy</p>
              <p className="mb-1">Privacy Policy</p>
              <p className="mb-1">Terms of Service</p>
            </div>
            <div>
              <p className="font-semibold mb-2" style={{ color: "#bbbabe" }}>Community</p>
              <p className="mb-1">Guidelines</p>
              <p className="mb-1">Help Center</p>
              <p className="mb-1">Blog</p>
            </div>
            <div>
              <p className="font-semibold mb-2" style={{ color: "#bbbabe" }}>Connect</p>
              <p className="mb-1">EchoX</p>
              <p className="mb-1">EchoLink</p>
              <p className="mb-1">EchoGram</p>
            </div>
            <div>
              <p className="font-semibold mb-2" style={{ color: "#bbbabe" }}>EchoEvents</p>
              <p className="mb-1">About Us</p>
              <p className="mb-1">Careers</p>
              <p className="mb-1">Press</p>
            </div>
          </div>
          <div className="mt-5 pt-4 text-xs text-center" style={{ color: "#60606a", borderTop: "1px solid #272732" }}>
            © 2025 EchoEvents Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
