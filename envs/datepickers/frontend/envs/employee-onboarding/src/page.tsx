import React, { useState, useCallback, useMemo } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ─── Single Date Picker ───────────────────────────────────────────────────────
function SingleDatePicker(props: {
  widgetId: string;
  label: string;
  description: string;
  initialYear: number;
  initialMonth: number;
  minDate?: string;
  maxDate?: string;
  constraint: "future_only" | "past_only" | "none";
  answerType: string;
  onSubmit: GeneratedPageProps["onSubmit"];
}) {
  const [viewYear, setViewYear] = useState(props.initialYear);
  const [viewMonth, setViewMonth] = useState(props.initialMonth);
  const [selected, setSelected] = useState<string | null>(null);

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const firstDay = useMemo(() => getFirstDayOfWeek(viewYear, viewMonth), [viewYear, viewMonth]);

  const today = useMemo(() => {
    const d = new Date(2025, 0, 1);
    return toISO(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const isDisabled = useCallback(
    (day: number) => {
      const iso = toISO(viewYear, viewMonth, day);
      const d = parseDate(iso);
      const t = parseDate(today);
      if (props.constraint === "future_only" && d < t) return true;
      if (props.constraint === "past_only" && d > t) return true;
      if (props.minDate && d < parseDate(props.minDate)) return true;
      if (props.maxDate && d > parseDate(props.maxDate)) return true;
      return false;
    },
    [viewYear, viewMonth, today, props.constraint, props.minDate, props.maxDate]
  );

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const handleSubmit = () => {
    if (!selected) return;
    props.onSubmit({
      type: props.answerType,
      value: selected,
      raw: { widget_id: props.widgetId, selected_date: selected, view_year: viewYear, view_month: viewMonth },
    });
  };

  return (
    <div data-widget-id={props.widgetId} className="rounded-none p-6" style={{ backgroundColor: "#fafbfd" }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "#374151" }}>{props.label}</h3>
      <p className="text-sm mb-4" style={{ color: "#6B7280" }}>{props.description}</p>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 text-sm font-medium rounded-none" style={{ backgroundColor: "#eef1f6", color: "#374151" }}>
          ← Prev
        </button>
        <span className="font-medium text-sm" style={{ color: "#374151" }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="px-3 py-1 text-sm font-medium rounded-none" style={{ backgroundColor: "#eef1f6", color: "#374151" }}>
          Next →
        </button>
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="font-semibold py-1" style={{ color: "#6B7280" }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const iso = toISO(viewYear, viewMonth, day);
          const disabled = isDisabled(day);
          const isSelected = selected === iso;
          const isToday = iso === today;
          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => !disabled && setSelected(iso)}
              className={`py-1.5 rounded-none text-sm transition-colors ${
                disabled
                  ? "text-gray-300 cursor-not-allowed"
                  : isSelected
                  ? "text-white font-semibold"
                  : isToday
                  ? "font-semibold"
                  : "hover:bg-gray-100"
              }`}
              style={{
                backgroundColor: isSelected ? "#2563EB" : undefined,
                color: disabled ? "#D1D5DB" : isSelected ? "#FFFFFF" : isToday ? "#2563EB" : "#374151",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected && (
        <p className="mt-3 text-sm" style={{ color: "#374151" }}>
          Selected: <span className="font-semibold">{selected}</span>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="mt-4 w-full py-2 text-sm font-medium rounded-none text-white transition-colors"
        style={{ backgroundColor: selected ? "#2563EB" : "#9CA3AF" }}
      >
        Submit {props.label}
      </button>
    </div>
  );
}

// ─── DOB Picker ───────────────────────────────────────────────────────────────
function DOBPicker(props: {
  widgetId: string;
  label: string;
  description: string;
  initialYear: number;
  initialMonth: number;
  maxDate?: string;
  minDate?: string;
  yearRange: [number, number];
  answerType: string;
  onSubmit: GeneratedPageProps["onSubmit"];
}) {
  const [viewYear, setViewYear] = useState(props.initialYear);
  const [viewMonth, setViewMonth] = useState(props.initialMonth);
  const [selected, setSelected] = useState<string | null>(null);

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const firstDay = useMemo(() => getFirstDayOfWeek(viewYear, viewMonth), [viewYear, viewMonth]);

  const today = useMemo(() => {
    const d = new Date(2025, 0, 1);
    return toISO(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = props.yearRange[1]; y >= props.yearRange[0]; y--) arr.push(y);
    return arr;
  }, [props.yearRange]);

  const isDisabled = useCallback(
    (day: number) => {
      const iso = toISO(viewYear, viewMonth, day);
      const d = parseDate(iso);
      const t = parseDate(today);
      if (d > t) return true; // past_only
      if (props.maxDate && d > parseDate(props.maxDate)) return true;
      if (props.minDate && d < parseDate(props.minDate)) return true;
      return false;
    },
    [viewYear, viewMonth, today, props.maxDate, props.minDate]
  );

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => setViewYear(Number(e.target.value));
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => setViewMonth(Number(e.target.value));

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const handleSubmit = () => {
    if (!selected) return;
    props.onSubmit({
      type: props.answerType,
      value: selected,
      raw: { widget_id: props.widgetId, selected_date: selected, view_year: viewYear, view_month: viewMonth },
    });
  };

  return (
    <div data-widget-id={props.widgetId} className="rounded-none p-6" style={{ backgroundColor: "#fafbfd" }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "#374151" }}>{props.label}</h3>
      <p className="text-sm mb-4" style={{ color: "#6B7280" }}>{props.description}</p>

      {/* Year & month dropdowns */}
      <div className="flex gap-3 mb-3">
        <select
          value={viewYear}
          onChange={handleYearChange}
          className="flex-1 py-1.5 px-2 text-sm rounded-none border"
          style={{ borderColor: "#d8e1e9", backgroundColor: "#f6f7fb", color: "#374151" }}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={viewMonth}
          onChange={handleMonthChange}
          className="flex-1 py-1.5 px-2 text-sm rounded-none border"
          style={{ borderColor: "#d8e1e9", backgroundColor: "#f6f7fb", color: "#374151" }}
        >
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={i}>{m}</option>
          ))}
        </select>
      </div>

      {/* Month nav arrows */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 text-sm font-medium rounded-none" style={{ backgroundColor: "#eef1f6", color: "#374151" }}>
          ← Prev
        </button>
        <span className="font-medium text-sm" style={{ color: "#374151" }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="px-3 py-1 text-sm font-medium rounded-none" style={{ backgroundColor: "#eef1f6", color: "#374151" }}>
          Next →
        </button>
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="font-semibold py-1" style={{ color: "#6B7280" }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const iso = toISO(viewYear, viewMonth, day);
          const disabled = isDisabled(day);
          const isSelected = selected === iso;
          const isToday = iso === today;
          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => !disabled && setSelected(iso)}
              className={`py-1.5 rounded-none text-sm transition-colors ${
                disabled
                  ? "cursor-not-allowed"
                  : isSelected
                  ? "text-white font-semibold"
                  : isToday
                  ? "font-semibold"
                  : "hover:bg-gray-100"
              }`}
              style={{
                backgroundColor: isSelected ? "#2563EB" : undefined,
                color: disabled ? "#D1D5DB" : isSelected ? "#FFFFFF" : isToday ? "#2563EB" : "#374151",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected && (
        <p className="mt-3 text-sm" style={{ color: "#374151" }}>
          Selected: <span className="font-semibold">{selected}</span>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="mt-4 w-full py-2 text-sm font-medium rounded-none text-white transition-colors"
        style={{ backgroundColor: selected ? "#2563EB" : "#9CA3AF" }}
      >
        Submit {props.label}
      </button>
    </div>
  );
}

// ─── Compound Widget (single_date + dob) ─────────────────────────────────────
function CompoundPicker(props: {
  widgetId: string;
  label: string;
  description: string;
  initialYear: number;
  initialMonth: number;
  minDate?: string;
  maxDate?: string;
  answerType: string;
  onSubmit: GeneratedPageProps["onSubmit"];
}) {
  // Sub-picker A: Start Date (future_only)
  const [aYear, setAYear] = useState(props.initialYear);
  const [aMonth, setAMonth] = useState(props.initialMonth);
  const [aSelected, setASelected] = useState<string | null>(null);

  // Sub-picker B: DOB (past_only)
  const [bYear, setBYear] = useState(props.initialYear);
  const [bMonth, setBMonth] = useState(props.initialMonth);
  const [bSelected, setBSelected] = useState<string | null>(null);

  const today = useMemo(() => {
    const d = new Date(2025, 0, 1);
    return toISO(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const dobYears = useMemo(() => {
    const arr: number[] = [];
    for (let y = 2015; y >= 1950; y--) arr.push(y);
    return arr;
  }, []);

  // --- helpers for sub-picker A ---
  const aDays = useMemo(() => getDaysInMonth(aYear, aMonth), [aYear, aMonth]);
  const aFirst = useMemo(() => getFirstDayOfWeek(aYear, aMonth), [aYear, aMonth]);
  const aIsDisabled = useCallback(
    (day: number) => {
      const iso = toISO(aYear, aMonth, day);
      const d = parseDate(iso);
      const t = parseDate(today);
      if (d < t) return true;
      if (props.minDate && d < parseDate(props.minDate)) return true;
      return false;
    },
    [aYear, aMonth, today, props.minDate]
  );
  const aPrev = () => { if (aMonth === 0) { setAMonth(11); setAYear(aYear - 1); } else setAMonth(aMonth - 1); };
  const aNext = () => { if (aMonth === 11) { setAMonth(0); setAYear(aYear + 1); } else setAMonth(aMonth + 1); };

  // --- helpers for sub-picker B ---
  const bDays = useMemo(() => getDaysInMonth(bYear, bMonth), [bYear, bMonth]);
  const bFirst = useMemo(() => getFirstDayOfWeek(bYear, bMonth), [bYear, bMonth]);
  const bIsDisabled = useCallback(
    (day: number) => {
      const iso = toISO(bYear, bMonth, day);
      const d = parseDate(iso);
      const t = parseDate(today);
      if (d > t) return true;
      return false;
    },
    [bYear, bMonth, today]
  );
  const bPrev = () => { if (bMonth === 0) { setBMonth(11); setBYear(bYear - 1); } else setBMonth(bMonth - 1); };
  const bNext = () => { if (bMonth === 11) { setBMonth(0); setBYear(bYear + 1); } else setBMonth(bMonth + 1); };

  const handleSubmit = () => {
    if (!aSelected || !bSelected) return;
    const combined = `${aSelected}|${bSelected}`;
    props.onSubmit({
      type: props.answerType,
      value: combined,
      raw: {
        widget_id: props.widgetId,
        start_date: aSelected,
        dob: bSelected,
        view_a: { year: aYear, month: aMonth },
        view_b: { year: bYear, month: bMonth },
      },
    });
  };

  const renderGrid = (
    year: number,
    month: number,
    days: number,
    first: number,
    isDisabledFn: (d: number) => boolean,
    selectedVal: string | null,
    setSelectedFn: (v: string) => void,
  ) => (
    <>
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="font-semibold py-1" style={{ color: "#6B7280" }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {Array.from({ length: first }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1;
          const iso = toISO(year, month, day);
          const disabled = isDisabledFn(day);
          const isSel = selectedVal === iso;
          const isT = iso === today;
          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => !disabled && setSelectedFn(iso)}
              className={`py-1.5 rounded-none text-sm transition-colors ${
                disabled ? "cursor-not-allowed" : isSel ? "text-white font-semibold" : isT ? "font-semibold" : "hover:bg-gray-100"
              }`}
              style={{
                backgroundColor: isSel ? "#2563EB" : undefined,
                color: disabled ? "#D1D5DB" : isSel ? "#FFFFFF" : isT ? "#2563EB" : "#374151",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <div data-widget-id={props.widgetId} className="rounded-none p-6" style={{ backgroundColor: "#fafbfd" }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "#374151" }}>{props.label}</h3>
      <p className="text-sm mb-5" style={{ color: "#6B7280" }}>{props.description}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sub-picker A: Start Date */}
        <div className="p-4 rounded-none border" style={{ borderColor: "#d8e1e9", backgroundColor: "#f6f7fb" }}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: "#374151" }}>Start Date (future only)</h4>
          <div className="flex items-center justify-between mb-3">
            <button onClick={aPrev} className="px-2 py-1 text-xs font-medium rounded-none" style={{ backgroundColor: "#eef1f6", color: "#374151" }}>← Prev</button>
            <span className="font-medium text-xs" style={{ color: "#374151" }}>{MONTH_NAMES[aMonth]} {aYear}</span>
            <button onClick={aNext} className="px-2 py-1 text-xs font-medium rounded-none" style={{ backgroundColor: "#eef1f6", color: "#374151" }}>Next →</button>
          </div>
          {renderGrid(aYear, aMonth, aDays, aFirst, aIsDisabled, aSelected, setASelected)}
          {aSelected && <p className="mt-2 text-xs" style={{ color: "#374151" }}>Selected: <span className="font-semibold">{aSelected}</span></p>}
        </div>

        {/* Sub-picker B: DOB */}
        <div className="p-4 rounded-none border" style={{ borderColor: "#d8e1e9", backgroundColor: "#f6f7fb" }}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: "#374151" }}>Employee DOB (past only)</h4>
          <div className="flex gap-2 mb-3">
            <select value={bYear} onChange={(e) => setBYear(Number(e.target.value))} className="flex-1 py-1 px-2 text-xs rounded-none border" style={{ borderColor: "#d8e1e9", backgroundColor: "#fafbfd", color: "#374151" }}>
              {dobYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={bMonth} onChange={(e) => setBMonth(Number(e.target.value))} className="flex-1 py-1 px-2 text-xs rounded-none border" style={{ borderColor: "#d8e1e9", backgroundColor: "#fafbfd", color: "#374151" }}>
              {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between mb-3">
            <button onClick={bPrev} className="px-2 py-1 text-xs font-medium rounded-none" style={{ backgroundColor: "#eef1f6", color: "#374151" }}>← Prev</button>
            <span className="font-medium text-xs" style={{ color: "#374151" }}>{MONTH_NAMES[bMonth]} {bYear}</span>
            <button onClick={bNext} className="px-2 py-1 text-xs font-medium rounded-none" style={{ backgroundColor: "#eef1f6", color: "#374151" }}>Next →</button>
          </div>
          {renderGrid(bYear, bMonth, bDays, bFirst, bIsDisabled, bSelected, setBSelected)}
          {bSelected && <p className="mt-2 text-xs" style={{ color: "#374151" }}>Selected: <span className="font-semibold">{bSelected}</span></p>}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!aSelected || !bSelected}
        className="mt-5 w-full py-2 text-sm font-medium rounded-none text-white transition-colors"
        style={{ backgroundColor: aSelected && bSelected ? "#2563EB" : "#9CA3AF" }}
      >
        Submit Both Selections
      </button>
    </div>
  );
}

// ─── Progress Indicator ───────────────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  const steps = ["Personal Info", "Date Details", "Documents", "Review"];
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center">
            <div
              className="w-8 h-8 flex items-center justify-center text-xs font-semibold rounded-full mb-1"
              style={{
                backgroundColor: i <= step ? "#2563EB" : "#d8e1e9",
                color: i <= step ? "#FFFFFF" : "#6B7280",
              }}
            >
              {i + 1}
            </div>
            <span className="text-xs" style={{ color: i <= step ? "#374151" : "#9CA3AF" }}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="w-12 h-0.5 mt-[-14px]" style={{ backgroundColor: i < step ? "#2563EB" : "#d8e1e9" }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Page_employee_onboarding(props: GeneratedPageProps) {
  const [filterWidget, setFilterWidget] = useState<string>("all");

  const widgets = [
    { id: "start_date", label: "Start Date" },
    { id: "employee_dob", label: "Employee DOB" },
    { id: "compound", label: "Compound" },
  ];

  const showWidget = (id: string) => filterWidget === "all" || filterWidget === id;

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#d8e1e9" }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: "#fafbfd", borderColor: "#d8e1e9" }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <span className="font-semibold text-base" style={{ color: "#374151" }}>EchoID</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: "#6B7280" }}>
            <a href="#" className="hover:underline">Settings</a>
            <a href="#" className="hover:underline">Security</a>
            <a href="#" className="hover:underline">Plan</a>
            <a href="#" className="hover:underline">Help</a>
          </nav>
          <div className="flex items-center gap-4 text-sm" style={{ color: "#6B7280" }}>
            <span>Employee Onboarding</span>
            <button className="hover:underline">Logout</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=400&fit=crop"
          alt="Office workspace"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(55,65,81,0.55)" }}>
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-1">Complete Your Profile</h1>
            <p className="text-sm opacity-90">Step 2 of 4 — Date Details</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <ProgressBar step={1} />

        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-xs font-medium mr-1" style={{ color: "#6B7280" }}>Filter:</span>
          <button
            onClick={() => setFilterWidget("all")}
            className="px-3 py-1 text-xs font-medium rounded-none border transition-colors"
            style={{
              backgroundColor: filterWidget === "all" ? "#2563EB" : "#f6f7fb",
              color: filterWidget === "all" ? "#FFFFFF" : "#374151",
              borderColor: "#d8e1e9",
            }}
          >
            All Widgets
          </button>
          {widgets.map((w) => (
            <button
              key={w.id}
              onClick={() => setFilterWidget(w.id)}
              className="px-3 py-1 text-xs font-medium rounded-none border transition-colors"
              style={{
                backgroundColor: filterWidget === w.id ? "#2563EB" : "#f6f7fb",
                color: filterWidget === w.id ? "#FFFFFF" : "#374151",
                borderColor: "#d8e1e9",
              }}
            >
              {w.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left: context info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-5 rounded-none border" style={{ backgroundColor: "#fafbfd", borderColor: "#d8e1e9" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#374151" }}>Onboarding Checklist</h3>
              <ul className="space-y-2 text-xs" style={{ color: "#6B7280" }}>
                <li className="flex items-center gap-2"><span style={{ color: "#10B981" }}>✓</span> Personal information</li>
                <li className="flex items-center gap-2"><span style={{ color: "#2563EB" }}>●</span> Date details (current step)</li>
                <li className="flex items-center gap-2"><span style={{ color: "#9CA3AF" }}>○</span> Document upload</li>
                <li className="flex items-center gap-2"><span style={{ color: "#9CA3AF" }}>○</span> Review & submit</li>
              </ul>
            </div>

            <div className="rounded-none overflow-hidden border" style={{ borderColor: "#d8e1e9" }}>
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop"
                alt="Team meeting"
                className="w-full h-36 object-cover"
              />
              <div className="p-4" style={{ backgroundColor: "#fafbfd" }}>
                <h4 className="text-sm font-semibold mb-1" style={{ color: "#374151" }}>Welcome to the Team!</h4>
                <p className="text-xs" style={{ color: "#6B7280" }}>
                  Please complete all required date fields to proceed with your onboarding process.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-none border" style={{ backgroundColor: "#fafbfd", borderColor: "#d8e1e9" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#374151" }}>Document Status</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span style={{ color: "#6B7280" }}>ID Card</span><span className="px-2 py-0.5 rounded-none" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>Pending</span></div>
                <div className="flex justify-between"><span style={{ color: "#6B7280" }}>Resume</span><span className="px-2 py-0.5 rounded-none" style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}>Uploaded</span></div>
                <div className="flex justify-between"><span style={{ color: "#6B7280" }}>Tax Forms</span><span className="px-2 py-0.5 rounded-none" style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}>Missing</span></div>
              </div>
            </div>

            <div className="p-4 rounded-none border" style={{ backgroundColor: "#f6f7fb", borderColor: "#d8e1e9" }}>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                💡 <strong>Tip:</strong> Your start date must be a future date. Date of birth must be in the past.
              </p>
            </div>
          </div>

          {/* Right: date picker widgets */}
          <div className="lg:col-span-2 space-y-6">
            {/* Form context */}
            <div className="p-5 rounded-none border" style={{ backgroundColor: "#fafbfd", borderColor: "#d8e1e9" }}>
              <h2 className="text-base font-semibold mb-2" style={{ color: "#374151" }}>Date Information</h2>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                Please select the required dates below. Each field has specific constraints — follow the labels and instructions carefully.
              </p>
            </div>

            {/* Widget 1: Start Date */}
            {showWidget("start_date") && (
              <div className="border" style={{ borderColor: "#d8e1e9" }}>
                <SingleDatePicker
                  widgetId="start_date"
                  label="Start Date"
                  description="Select your employment start date. Only future dates are available."
                  initialYear={2026}
                  initialMonth={0}
                  minDate="2026-01-01"
                  constraint="future_only"
                  answerType="date"
                  onSubmit={props.onSubmit}
                />
              </div>
            )}

            {/* Widget 2: Employee DOB */}
            {showWidget("employee_dob") && (
              <div className="border" style={{ borderColor: "#d8e1e9" }}>
                <DOBPicker
                  widgetId="employee_dob"
                  label="Employee DOB"
                  description="Select your date of birth using the year and month dropdowns, then pick the day."
                  initialYear={2026}
                  initialMonth={8}
                  maxDate="2026-09-30"
                  yearRange={[1950, 2015]}
                  answerType="dob"
                  onSubmit={props.onSubmit}
                />
              </div>
            )}

            {/* Widget 3: Compound */}
            {showWidget("compound") && (
              <div className="border" style={{ borderColor: "#d8e1e9" }}>
                <CompoundPicker
                  widgetId="compound"
                  label="Start Date + Employee DOB"
                  description="This section requires both a start date (future) and date of birth (past). Fill both calendars to submit."
                  initialYear={2025}
                  initialMonth={5}
                  minDate="2025-06-01"
                  answerType="date"
                  onSubmit={props.onSubmit}
                />
              </div>
            )}
          </div>
        </div>

        {/* Extra context row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-none overflow-hidden border" style={{ borderColor: "#d8e1e9" }}>
            <img
              src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop"
              alt="ID card and documents"
              className="w-full h-36 object-cover"
            />
            <div className="p-4" style={{ backgroundColor: "#fafbfd" }}>
              <h4 className="text-sm font-semibold mb-1" style={{ color: "#374151" }}>Required Documents</h4>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                After completing date fields, you'll be asked to upload identification documents and tax forms.
              </p>
            </div>
          </div>
          <div className="p-5 rounded-none border flex flex-col justify-center" style={{ backgroundColor: "#fafbfd", borderColor: "#d8e1e9" }}>
            <h4 className="text-sm font-semibold mb-2" style={{ color: "#374151" }}>Need Help?</h4>
            <p className="text-xs mb-3" style={{ color: "#6B7280" }}>
              Contact HR support if you have questions about any onboarding step. We're here to help.
            </p>
            <div className="text-xs" style={{ color: "#6B7280" }}>
              📧 hr@myprofile.com &nbsp;|&nbsp; 📞 1-800-555-0199
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6" style={{ backgroundColor: "#f6f7fb", borderColor: "#d8e1e9" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs" style={{ color: "#9CA3AF" }}>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Data Handling Notice</a>
              <a href="#" className="hover:underline">Contact Support</a>
              <a href="#" className="hover:underline">Accessibility Statement</a>
            </div>
            <span>© 2026 EchoID — Employee Onboarding Portal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
