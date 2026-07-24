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

function pad(n: number) { return n < 10 ? "0" + n : "" + n; }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const MIN_DATE = new Date(2025, 5, 1);

const C = {
  bg: "#111112",
  surface: "#1e1e1f",
  surfaceAlt: "#2e2d2c",
  primary: "#f4f8f4",
  secondary: "#e2e8e1",
  accent: "#6c7165",
  border: "#3a3a3b",
  text: "#f4f8f4",
  textMuted: "#9ca3af",
  blue: "#2563EB",
};

export default function Page_gym_membership(props: GeneratedPageProps) {
  const [viewMonth, setViewMonth] = useState(5);
  const [viewYear, setViewYear] = useState(2025);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [activeStep] = useState(2);
  const [activeFilter, setActiveFilter] = useState("All Plans");

  const today = useMemo(() => {
    const d = new Date(2025, 0, 1);
    return toISO(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const canGoPrev = useMemo(() => {
    const prev = viewMonth === 0
      ? new Date(viewYear - 1, 11, 1)
      : new Date(viewYear, viewMonth - 1, 1);
    return prev >= new Date(MIN_DATE.getFullYear(), MIN_DATE.getMonth(), 1);
  }, [viewMonth, viewYear]);

  const goPrev = useCallback(() => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }, [canGoPrev, viewMonth]);

  const goNext = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }, [viewMonth]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ day: number; iso: string; disabled: boolean } | null> = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toISO(viewYear, viewMonth, d);
      const date = new Date(viewYear, viewMonth, d);
      const beforeMin = date < MIN_DATE;
      const isPast = iso < today;
      cells.push({ day: d, iso, disabled: beforeMin || isPast });
    }
    return cells;
  }, [viewMonth, viewYear, today]);

  const handleDayClick = useCallback((iso: string) => {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(iso);
      setRangeEnd(null);
    } else {
      if (iso < rangeStart) {
        setRangeStart(iso);
        setRangeEnd(null);
      } else if (iso === rangeStart) {
        setRangeStart(null);
      } else {
        setRangeEnd(iso);
      }
    }
  }, [rangeStart, rangeEnd]);

  const isInRange = useCallback((iso: string) => {
    if (rangeStart && rangeEnd) return iso >= rangeStart && iso <= rangeEnd;
    if (rangeStart && hoverDate && !rangeEnd) {
      const eEnd = hoverDate >= rangeStart ? hoverDate : rangeStart;
      const eStart = hoverDate >= rangeStart ? rangeStart : hoverDate;
      return iso >= eStart && iso <= eEnd;
    }
    return false;
  }, [rangeStart, rangeEnd, hoverDate]);

  const isRangeStart = useCallback((iso: string) => iso === rangeStart, [rangeStart]);
  const isRangeEnd = useCallback((iso: string) => {
    if (rangeEnd) return iso === rangeEnd;
    if (rangeStart && hoverDate && hoverDate >= rangeStart) return iso === hoverDate;
    return false;
  }, [rangeEnd, rangeStart, hoverDate]);

  const rangeDays = useMemo(() => {
    if (!rangeStart || !rangeEnd) return null;
    const s = parseISO(rangeStart);
    const e = parseISO(rangeEnd);
    return Math.round((e.getTime() - s.getTime()) / 86400000);
  }, [rangeStart, rangeEnd]);

  const handleSubmit = useCallback(() => {
    if (!rangeStart || !rangeEnd) return;
    props.onSubmit({
      type: "date_range",
      value: `${rangeStart} to ${rangeEnd}`,
      raw: {
        widget_id: "membership_dates",
        start: rangeStart,
        end: rangeEnd,
        days: rangeDays,
      },
    });
  }, [rangeStart, rangeEnd, rangeDays, props]);

  const steps = ["Personal Info", "Contact Details", "Membership Period", "Review & Submit"];
  const plans = [
    { name: "Basic", price: "$29/mo", features: ["Gym access", "Locker room", "Free parking"] },
    { name: "Standard", price: "$49/mo", features: ["Basic +", "Group classes", "Sauna access"] },
    { name: "Premium", price: "$79/mo", features: ["Standard +", "Personal trainer", "Pool access", "Towel service"] },
  ];
  const filters = ["All Plans", "Monthly", "Quarterly", "Annual"];

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: C.bg, color: C.text }}>
      {/* Header */}
      <header
        className="border-b"
        style={{ backgroundColor: C.surface, borderColor: C.border }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg"
              style={{ backgroundColor: C.accent, color: C.primary }}
            >
              GF
            </div>
            <span className="font-semibold text-lg" style={{ color: C.primary }}>
              EchoGym
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-1 text-sm" style={{ color: C.textMuted }}>
            <span className="hover:underline cursor-pointer">Home</span>
            <span className="mx-1">/</span>
            <span className="hover:underline cursor-pointer">Profile</span>
            <span className="mx-1">/</span>
            <span style={{ color: C.primary }}>Membership Setup</span>
          </nav>
          <div className="flex items-center gap-4 text-sm">
            <button
              className="px-3 py-1.5 rounded-md hover:opacity-80 transition-opacity"
              style={{ backgroundColor: C.surfaceAlt, color: C.textMuted }}
            >
              Help
            </button>
            <button
              className="px-3 py-1.5 rounded-md hover:opacity-80 transition-opacity"
              style={{ backgroundColor: C.surfaceAlt, color: C.textMuted }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="border-b"
        style={{ backgroundColor: C.surfaceAlt, borderColor: C.border }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-[120px] h-[120px] rounded-lg flex items-center justify-center text-xs"
              style={{ backgroundColor: C.accent, color: C.primary }}
            >
              Profile Avatar
            </div>
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: C.primary }}>
                Complete Your Membership Profile
              </h1>
              <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
                Set up your gym membership by selecting your preferred membership period below.
              </p>
            </div>
          </div>
          {/* Progress Steps */}
          <div className="flex items-center gap-0 mt-4">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{
                      backgroundColor: i <= activeStep ? C.blue : C.border,
                      color: i <= activeStep ? "#fff" : C.textMuted,
                    }}
                  >
                    {i < activeStep ? "✓" : i + 1}
                  </div>
                  <span
                    className="text-xs whitespace-nowrap"
                    style={{ color: i <= activeStep ? C.primary : C.textMuted }}
                  >
                    {step}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="flex-1 h-px mx-3"
                    style={{ backgroundColor: i < activeStep ? C.blue : C.border }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Panel - Calendar */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <div
              className="rounded-lg p-4 border"
              style={{ backgroundColor: C.surface, borderColor: C.border }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium" style={{ color: C.primary }}>
                  Filter Plans:
                </span>
                {filters.map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className="px-3 py-1 rounded-md text-xs transition-colors"
                    style={{
                      backgroundColor: activeFilter === f ? C.blue : C.surfaceAlt,
                      color: activeFilter === f ? "#fff" : C.textMuted,
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {/* Plans Table */}
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderColor: C.border }} className="border-b">
                    <th className="text-left py-2 px-3" style={{ color: C.textMuted }}>Plan</th>
                    <th className="text-left py-2 px-3" style={{ color: C.textMuted }}>Price</th>
                    <th className="text-left py-2 px-3" style={{ color: C.textMuted }}>Features</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map(p => (
                    <tr
                      key={p.name}
                      className="border-b"
                      style={{ borderColor: C.border }}
                    >
                      <td className="py-2 px-3 font-medium" style={{ color: C.primary }}>
                        {p.name}
                      </td>
                      <td className="py-2 px-3" style={{ color: C.secondary }}>
                        {p.price}
                      </td>
                      <td className="py-2 px-3" style={{ color: C.textMuted }}>
                        {p.features.join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Date Picker Widget */}
            <div
              data-widget-id="membership_dates"
              className="rounded-lg border p-4"
              style={{ backgroundColor: C.surface, borderColor: C.border }}
            >
              <div className="mb-3">
                <h2 className="text-lg font-semibold" style={{ color: C.primary }}>
                  Membership Period
                </h2>
                <p className="text-xs mt-1" style={{ color: C.textMuted }}>
                  Select your membership start and end dates. Click a start date, then click an end date to define the range.
                </p>
              </div>

              {/* Selected Range Display */}
              <div
                className="flex items-center gap-3 mb-4 p-3 rounded-md"
                style={{ backgroundColor: C.surfaceAlt }}
              >
                <div className="flex-1">
                  <div className="text-xs mb-1" style={{ color: C.textMuted }}>Start Date</div>
                  <div className="text-sm font-medium" style={{ color: rangeStart ? C.primary : C.accent }}>
                    {rangeStart || "Select start date"}
                  </div>
                </div>
                <div className="text-lg" style={{ color: C.accent }}>→</div>
                <div className="flex-1">
                  <div className="text-xs mb-1" style={{ color: C.textMuted }}>End Date</div>
                  <div className="text-sm font-medium" style={{ color: rangeEnd ? C.primary : C.accent }}>
                    {rangeEnd || "Select end date"}
                  </div>
                </div>
                {rangeDays !== null && (
                  <div className="text-right">
                    <div className="text-xs" style={{ color: C.textMuted }}>Duration</div>
                    <div className="text-sm font-semibold" style={{ color: C.blue }}>
                      {rangeDays} days
                    </div>
                  </div>
                )}
              </div>

              {/* Calendar */}
              <div
                className="rounded-lg border p-4"
                style={{ backgroundColor: C.bg, borderColor: C.border }}
              >
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={goPrev}
                    disabled={!canGoPrev}
                    className="w-8 h-8 flex items-center justify-center rounded-md transition-opacity"
                    style={{
                      backgroundColor: C.surfaceAlt,
                      color: canGoPrev ? C.primary : C.accent,
                      opacity: canGoPrev ? 1 : 0.3,
                      cursor: canGoPrev ? "pointer" : "not-allowed",
                    }}
                  >
                    ‹
                  </button>
                  <span className="text-sm font-semibold" style={{ color: C.primary }}>
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </span>
                  <button
                    onClick={goNext}
                    className="w-8 h-8 flex items-center justify-center rounded-md transition-opacity"
                    style={{ backgroundColor: C.surfaceAlt, color: C.primary }}
                  >
                    ›
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-0 mb-1">
                  {DAY_LABELS.map(d => (
                    <div
                      key={d}
                      className="text-center text-xs py-1 font-medium"
                      style={{ color: C.textMuted }}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-0">
                  {calendarDays.map((cell, idx) => {
                    if (!cell) {
                      return <div key={`e-${idx}`} className="h-9" />;
                    }
                    const { day, iso, disabled } = cell;
                    const inRange = isInRange(iso);
                    const start = isRangeStart(iso);
                    const end = isRangeEnd(iso);
                    const isToday = iso === today;

                    let bgColor = "transparent";
                    let textColor = C.primary;

                    if (disabled) {
                      textColor = C.accent;
                    } else if (start || end) {
                      bgColor = C.blue;
                      textColor = "#fff";
                    } else if (inRange) {
                      bgColor = "rgba(37,99,235,0.2)";
                      textColor = C.secondary;
                    }

                    return (
                      <div
                        key={iso}
                        onClick={() => !disabled && handleDayClick(iso)}
                        onMouseEnter={() => !disabled && setHoverDate(iso)}
                        onMouseLeave={() => setHoverDate(null)}
                        className="h-9 flex items-center justify-center text-sm transition-colors relative"
                        style={{
                          backgroundColor: bgColor,
                          color: textColor,
                          cursor: disabled ? "not-allowed" : "pointer",
                          borderRadius:
                            start && end
                              ? "8px"
                              : start
                              ? "8px 0 0 8px"
                              : end
                              ? "0 8px 8px 0"
                              : inRange
                              ? "0"
                              : "8px",
                          opacity: disabled ? 0.35 : 1,
                        }}
                      >
                        {day}
                        {isToday && !start && !end && (
                          <span
                            className="absolute bottom-1 w-1 h-1 rounded-full"
                            style={{ backgroundColor: C.blue }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!rangeStart || !rangeEnd}
                className="mt-4 w-full py-2.5 rounded-md text-sm font-semibold transition-opacity"
                style={{
                  backgroundColor: rangeStart && rangeEnd ? C.blue : C.border,
                  color: rangeStart && rangeEnd ? "#fff" : C.textMuted,
                  cursor: rangeStart && rangeEnd ? "pointer" : "not-allowed",
                  opacity: rangeStart && rangeEnd ? 1 : 0.6,
                }}
              >
                Confirm Membership Period
              </button>
            </div>
          </div>

          {/* Right Panel - Sidebar */}
          <div className="space-y-4">
            {/* Requirements Checklist */}
            <div
              className="rounded-lg border p-4"
              style={{ backgroundColor: C.surface, borderColor: C.border }}
            >
              <h3 className="text-sm font-semibold mb-3" style={{ color: C.primary }}>
                Requirements Checklist
              </h3>
              {[
                { label: "Government-issued ID", done: true },
                { label: "Proof of address", done: true },
                { label: "Health declaration form", done: false },
                { label: "Emergency contact info", done: true },
                { label: "Membership dates selected", done: !!(rangeStart && rangeEnd) },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 py-1.5">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-xs"
                    style={{
                      backgroundColor: item.done ? C.blue : C.surfaceAlt,
                      color: item.done ? "#fff" : C.textMuted,
                    }}
                  >
                    {item.done ? "✓" : ""}
                  </div>
                  <span className="text-xs" style={{ color: item.done ? C.primary : C.textMuted }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Document Upload */}
            <div
              className="rounded-lg border p-4"
              style={{ backgroundColor: C.surface, borderColor: C.border }}
            >
              <h3 className="text-sm font-semibold mb-3" style={{ color: C.primary }}>
                Document Upload
              </h3>
              {[
                { name: "Photo ID", status: "Uploaded" },
                { name: "Medical Clearance", status: "Pending" },
                { name: "Waiver Form", status: "Not Started" },
              ].map(doc => (
                <div
                  key={doc.name}
                  className="flex items-center gap-2 py-2 border-b last:border-b-0"
                  style={{ borderColor: C.border }}
                >
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-xs"
                    style={{ backgroundColor: C.surfaceAlt, color: C.textMuted }}
                  >
                    📄
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium" style={{ color: C.primary }}>{doc.name}</div>
                    <div
                      className="text-xs"
                      style={{
                        color:
                          doc.status === "Uploaded"
                            ? "#22c55e"
                            : doc.status === "Pending"
                            ? "#eab308"
                            : C.textMuted,
                      }}
                    >
                      {doc.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Help Tooltip */}
            <div
              className="rounded-lg border p-4"
              style={{ backgroundColor: C.surface, borderColor: C.border }}
            >
              <h3 className="text-sm font-semibold mb-2" style={{ color: C.primary }}>
                Need Help?
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: C.textMuted }}>
                Select your membership start date first, then click the end date.
                Minimum membership duration is 30 days. Past dates are not available.
                For assistance, contact support@echogym.com.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t mt-8"
        style={{ backgroundColor: C.surface, borderColor: C.border }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3 text-xs" style={{ color: C.textMuted }}>
          <div className="flex items-center gap-4">
            <span className="hover:underline cursor-pointer">Privacy Policy</span>
            <span className="hover:underline cursor-pointer">Data Handling Notice</span>
            <span className="hover:underline cursor-pointer">Accessibility</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:underline cursor-pointer">Contact Support</span>
            <span>© 2025 EchoGym. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
