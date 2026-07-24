import React, { useState, useCallback, useMemo } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function startDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function pad2(n: number) {
  return String(n).padStart(2, "0");
}

const PRIMARY = "#1D4ED8";
const BG = "#EFF6FF";
const AVAILABLE = "#10B981";
const PAGE_BG = "#706f7c";
const CARD_BG = "#ffffff";
const CARD_SECONDARY = "#fcffff";
const ACCENT = "#fcfcfc";
const BORDER = "#eeeff0";

/* ──────────────────────────────────────────────
   Widget 1 — Interview Date & Time (datetime)
   ────────────────────────────────────────────── */

const W1_DISABLED = new Set([
  "2026-01-01","2026-07-04","2026-12-25","2026-11-28",
]);
const W1_DISABLED_WEEKDAYS = new Set([0, 6]); // Sun=0, Sat=6

function InterviewDateTimePicker({ onSubmit }: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(1); // Feb = index 1
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<"AM" | "PM">("AM");

  const totalDays = daysInMonth(year, month);
  const startDay = startDayOfMonth(year, month);

  const isDisabled = useCallback(
    (day: number) => {
      const ds = toDateStr(year, month, day);
      if (W1_DISABLED.has(ds)) return true;
      const dow = new Date(year, month, day).getDay();
      return W1_DISABLED_WEEKDAYS.has(dow);
    },
    [year, month],
  );

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const handleSubmit = () => {
    if (!selectedDate) return;
    const h24 = ampm === "PM" ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
    const iso = `${selectedDate}T${pad2(h24)}:${pad2(minute)}:00`;
    onSubmit({
      type: "datetime",
      value: iso,
      raw: { widget_id: "interview_datetime", date: selectedDate, hour: h24, minute, ampm },
    });
  };

  return (
    <div data-widget-id="interview_datetime" className="rounded-xl p-6 shadow-sm" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: PRIMARY }}>Interview Date &amp; Time</h3>
      <p className="text-sm mb-4" style={{ color: "#64748b" }}>
        Select a business day and time for the interview. Weekends and holidays are unavailable.
      </p>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 rounded font-bold text-lg" style={{ color: PRIMARY }} aria-label="Previous month">&larr;</button>
        <span className="font-semibold" style={{ color: PRIMARY }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 rounded font-bold text-lg" style={{ color: PRIMARY }} aria-label="Next month">&rarr;</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1" style={{ color: "#94a3b8" }}>
        {DAYS_LABEL.map(d => <div key={d}>{d}</div>)}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const ds = toDateStr(year, month, day);
          const disabled = isDisabled(day);
          const selected = selectedDate === ds;
          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => !disabled && setSelectedDate(ds)}
              className={`h-9 rounded-lg text-sm font-medium transition-colors ${
                disabled
                  ? "text-gray-300 cursor-not-allowed"
                  : selected
                  ? "text-white"
                  : "hover:bg-blue-50"
              }`}
              style={selected ? { background: PRIMARY, color: "#fff" } : undefined}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Time selectors */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <label className="text-sm font-medium" style={{ color: "#334155" }}>Time:</label>
        <select
          value={hour}
          onChange={e => setHour(Number(e.target.value))}
          className="rounded-lg border px-2 py-1.5 text-sm"
          style={{ borderColor: BORDER }}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span className="font-medium">:</span>
        <select
          value={minute}
          onChange={e => setMinute(Number(e.target.value))}
          className="rounded-lg border px-2 py-1.5 text-sm"
          style={{ borderColor: BORDER }}
        >
          {[0, 15, 30, 45].map(m => (
            <option key={m} value={m}>{pad2(m)}</option>
          ))}
        </select>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: BORDER }}>
          {(["AM", "PM"] as const).map(v => (
            <button
              key={v}
              onClick={() => setAmpm(v)}
              className="px-3 py-1.5 text-sm font-medium transition-colors"
              style={ampm === v ? { background: PRIMARY, color: "#fff" } : { color: "#64748b" }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {selectedDate && (
        <p className="text-sm mb-3" style={{ color: AVAILABLE }}>
          Selected: {selectedDate} at {hour}:{pad2(minute)} {ampm}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedDate}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
        style={{ background: PRIMARY, opacity: selectedDate ? 1 : 0.4 }}
      >
        Confirm Interview Time
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Widget 2 — Candidate DOB (dob)
   ────────────────────────────────────────────── */

function CandidateDOBPicker({ onSubmit }: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(10); // Nov = index 10
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const MAX_DATE = "2026-11-30";

  const totalDays = daysInMonth(year, month);
  const startDay = startDayOfMonth(year, month);

  const isDisabled = useCallback(
    (day: number) => {
      const ds = toDateStr(year, month, day);
      return ds > MAX_DATE;
    },
    [year, month],
  );

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const handleYearChange = (y: number) => { setYear(y); setSelectedDate(null); };
  const handleMonthChange = (m: number) => { setMonth(m); setSelectedDate(null); };

  const handleSubmit = () => {
    if (!selectedDate) return;
    onSubmit({
      type: "dob",
      value: selectedDate,
      raw: { widget_id: "candidate_dob", date: selectedDate },
    });
  };

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = 1950; y <= 2015; y++) arr.push(y);
    return arr;
  }, []);

  return (
    <div data-widget-id="candidate_dob" className="rounded-xl p-6 shadow-sm" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: PRIMARY }}>Candidate Date of Birth</h3>
      <p className="text-sm mb-4" style={{ color: "#64748b" }}>
        Select the candidate&apos;s date of birth. Only past dates are available.
      </p>

      {/* Year + Month dropdowns */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          value={year}
          onChange={e => handleYearChange(Number(e.target.value))}
          className="rounded-lg border px-2 py-1.5 text-sm font-medium"
          style={{ borderColor: BORDER, color: PRIMARY }}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={month}
          onChange={e => handleMonthChange(Number(e.target.value))}
          className="rounded-lg border px-2 py-1.5 text-sm font-medium"
          style={{ borderColor: BORDER, color: PRIMARY }}
        >
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
      </div>

      {/* Month nav arrows */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 rounded font-bold text-lg" style={{ color: PRIMARY }} aria-label="Previous month">&larr;</button>
        <span className="font-semibold" style={{ color: PRIMARY }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 rounded font-bold text-lg" style={{ color: PRIMARY }} aria-label="Next month">&rarr;</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1" style={{ color: "#94a3b8" }}>
        {DAYS_LABEL.map(d => <div key={d}>{d}</div>)}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const ds = toDateStr(year, month, day);
          const disabled = isDisabled(day);
          const selected = selectedDate === ds;
          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => !disabled && setSelectedDate(ds)}
              className={`h-9 rounded-lg text-sm font-medium transition-colors ${
                disabled
                  ? "text-gray-300 cursor-not-allowed"
                  : selected
                  ? "text-white"
                  : "hover:bg-blue-50"
              }`}
              style={selected ? { background: PRIMARY, color: "#fff" } : undefined}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <p className="text-sm mb-3" style={{ color: AVAILABLE }}>
          Selected DOB: {selectedDate}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedDate}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
        style={{ background: PRIMARY, opacity: selectedDate ? 1 : 0.4 }}
      >
        Confirm Date of Birth
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Widget 3 — Compound (standard date calendar)
   ────────────────────────────────────────────── */

const W3_DISABLED = new Set([
  "2025-01-01","2025-07-04","2025-12-25","2025-11-28",
]);
const W3_DISABLED_WEEKDAYS = new Set([0, 6]);

function CompoundDatePicker({ onSubmit }: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5); // June = index 5
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const totalDays = daysInMonth(year, month);
  const startDay = startDayOfMonth(year, month);

  const isDisabled = useCallback(
    (day: number) => {
      const ds = toDateStr(year, month, day);
      if (W3_DISABLED.has(ds)) return true;
      const dow = new Date(year, month, day).getDay();
      return W3_DISABLED_WEEKDAYS.has(dow);
    },
    [year, month],
  );

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const handleSubmit = () => {
    if (!selectedDate) return;
    onSubmit({
      type: "date",
      value: selectedDate,
      raw: { widget_id: "compound", date: selectedDate },
    });
  };

  return (
    <div data-widget-id="compound" className="rounded-xl p-6 shadow-sm" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: PRIMARY }}>Interview Date &amp; Candidate DOB</h3>
      <p className="text-sm mb-4" style={{ color: "#64748b" }}>
        Select a date. Weekends and holidays are unavailable.
      </p>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 rounded font-bold text-lg" style={{ color: PRIMARY }} aria-label="Previous month">&larr;</button>
        <span className="font-semibold" style={{ color: PRIMARY }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 rounded font-bold text-lg" style={{ color: PRIMARY }} aria-label="Next month">&rarr;</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1" style={{ color: "#94a3b8" }}>
        {DAYS_LABEL.map(d => <div key={d}>{d}</div>)}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const ds = toDateStr(year, month, day);
          const disabled = isDisabled(day);
          const selected = selectedDate === ds;
          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => !disabled && setSelectedDate(ds)}
              className={`h-9 rounded-lg text-sm font-medium transition-colors ${
                disabled
                  ? "text-gray-300 cursor-not-allowed"
                  : selected
                  ? "text-white"
                  : "hover:bg-blue-50"
              }`}
              style={selected ? { background: PRIMARY, color: "#fff" } : undefined}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <p className="text-sm mb-3" style={{ color: AVAILABLE }}>
          Selected: {selectedDate}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedDate}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
        style={{ background: PRIMARY, opacity: selectedDate ? 1 : 0.4 }}
      >
        Confirm Date
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main Page
   ────────────────────────────────────────────── */

export default function Page_interview_scheduler(props: GeneratedPageProps) {
  const [activeNav, setActiveNav] = useState("Calendar");
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("month");
  const [duration, setDuration] = useState(30);
  const [meetingType, setMeetingType] = useState("video");

  const navItems = ["Calendar", "Rooms", "Team", "Reports"];
  const viewModes = ["day", "week", "month"] as const;

  return (
    <div className="min-h-screen font-sans" style={{ background: PAGE_BG }}>
      {/* ── Header ── */}
      <header className="shadow-sm" style={{ background: CARD_BG, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <span className="text-xl font-bold" style={{ color: PRIMARY }}>EchoPlan</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <button
                  key={item}
                  onClick={() => setActiveNav(item)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={activeNav === item ? { background: BG, color: PRIMARY } : { color: "#64748b" }}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <select className="rounded-lg border px-2 py-1 text-xs" style={{ borderColor: BORDER, color: "#64748b" }}>
              <option>UTC-5 (EST)</option>
              <option>UTC-8 (PST)</option>
              <option>UTC+0 (GMT)</option>
              <option>UTC+5:30 (IST)</option>
            </select>
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: BORDER }}>
              {viewModes.map(v => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className="px-2.5 py-1 text-xs font-medium capitalize transition-colors"
                  style={viewMode === v ? { background: PRIMARY, color: "#fff" } : { color: "#64748b" }}
                >
                  {v}
                </button>
              ))}
            </div>
            <button className="relative text-lg" aria-label="Notifications">
              🔔
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ background: PRIMARY }}>
        <img
          src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=400&fit=crop"
          alt="Meeting room"
          className="w-full h-48 object-cover opacity-30"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-3xl font-bold mb-2">Pick a Time</h1>
            <p className="text-base opacity-90">Schedule your next interview with ease</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Context / Filters ── */}
        <div className="rounded-xl p-5 mb-8 shadow-sm" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#64748b" }}>Duration</label>
              <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: BORDER }}>
                {[15, 30, 60].map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className="px-3 py-1.5 text-sm font-medium transition-colors"
                    style={duration === d ? { background: PRIMARY, color: "#fff" } : { color: "#64748b" }}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#64748b" }}>Timezone</label>
              <select className="rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: BORDER }}>
                <option>America/New_York</option>
                <option>America/Los_Angeles</option>
                <option>Europe/London</option>
                <option>Asia/Kolkata</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#64748b" }}>Meeting Type</label>
              <div className="flex items-center gap-4">
                {[
                  { val: "video", label: "📹 Video" },
                  { val: "phone", label: "📞 Phone" },
                  { val: "inperson", label: "🏢 In-Person" },
                ].map(({ val, label }) => (
                  <label key={val} className="flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: meetingType === val ? PRIMARY : "#64748b" }}>
                    <input
                      type="radio"
                      name="meetingType"
                      value={val}
                      checked={meetingType === val}
                      onChange={() => setMeetingType(val)}
                      className="accent-blue-700"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Datepicker Widgets ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <InterviewDateTimePicker onSubmit={props.onSubmit} />
          <CandidateDOBPicker onSubmit={props.onSubmit} />
          <CompoundDatePicker onSubmit={props.onSubmit} />
        </div>

        {/* ── Supporting Content ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Upcoming meetings */}
          <div className="rounded-xl p-5 shadow-sm" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: PRIMARY }}>Upcoming Meetings</h3>
            {[
              { name: "Design Review", time: "10:00 AM", date: "Feb 3", avatars: "👩‍💻👨‍🎨" },
              { name: "Engineering Sync", time: "2:30 PM", date: "Feb 4", avatars: "👨‍💻👩‍🔬" },
              { name: "Product Demo", time: "11:00 AM", date: "Feb 5", avatars: "👩‍💼👨‍💼🧑‍💻" },
            ].map((m, i) => (
              <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: i < 2 ? `1px solid ${BORDER}` : "none" }}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: AVAILABLE }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#334155" }}>{m.name}</p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>{m.date} · {m.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm">{m.avatars}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Meeting link preview + card images */}
          <div className="rounded-xl p-5 shadow-sm" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: PRIMARY }}>Meeting Preview</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop"
                alt="Team meeting"
                className="w-full h-28 object-cover rounded-lg"
              />
              <img
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop"
                alt="Calendar desk"
                className="w-full h-28 object-cover rounded-lg"
              />
            </div>
            <div className="rounded-lg p-3" style={{ background: BG }}>
              <p className="text-xs font-medium mb-1" style={{ color: PRIMARY }}>Meeting Link</p>
              <p className="text-sm font-mono" style={{ color: "#64748b" }}>https://planit.meet/abc-xyz-123</p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: BG, color: PRIMARY }}>
                {meetingType === "video" ? "📹 Video Call" : meetingType === "phone" ? "📞 Phone Call" : "🏢 In-Person"}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: BG, color: PRIMARY }}>
                {duration} min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ background: CARD_SECONDARY, borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: "#334155" }}>Calendar Sync</h4>
              <ul className="space-y-1.5 text-xs" style={{ color: "#64748b" }}>
                <li>EchoCal</li>
                <li>EchoMail</li>
                <li>EchoDate</li>
                <li>CalDAV</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: "#334155" }}>Notifications</h4>
              <ul className="space-y-1.5 text-xs" style={{ color: "#64748b" }}>
                <li>Email Reminders</li>
                <li>SMS Alerts</li>
                <li>EchoChat Updates</li>
                <li>Push Notifications</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: "#334155" }}>Integrations</h4>
              <ul className="space-y-1.5 text-xs" style={{ color: "#64748b" }}>
                <li>EchoConf</li>
                <li>EchoTeam</li>
                <li>EchoMeet</li>
                <li>EchoConnect</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: "#334155" }}>Help Center</h4>
              <ul className="space-y-1.5 text-xs" style={{ color: "#64748b" }}>
                <li>Getting Started</li>
                <li>FAQ</li>
                <li>API Docs</li>
                <li>Contact Support</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 pt-4 text-center text-xs" style={{ borderTop: `1px solid ${BORDER}`, color: "#94a3b8" }}>
            © 2026 EchoPlan — Interview Scheduler. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
