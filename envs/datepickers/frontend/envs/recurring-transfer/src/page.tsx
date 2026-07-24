import React, { useState, useCallback, useMemo } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const MONTH_SHORT = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function isBefore(y1: number, m1: number, d1: number, y2: number, m2: number, d2: number) {
  if (y1 < y2) return true;
  if (y1 === y2 && m1 < m2) return true;
  if (y1 === y2 && m1 === m2 && d1 < d2) return true;
  return false;
}

/* ─── Single Date Picker ─── */
function SingleDatePicker({
  widgetId,
  label,
  description,
  initialMonth,
  initialYear,
  minDate,
  onSubmit,
}: {
  widgetId: string;
  label: string;
  description: string;
  initialMonth: number;
  initialYear: number;
  minDate: { y: number; m: number; d: number } | null;
  onSubmit: GeneratedPageProps["onSubmit"];
}) {
  const [viewMonth, setViewMonth] = useState(initialMonth);
  const [viewYear, setViewYear] = useState(initialYear);
  const [selected, setSelected] = useState<{ y: number; m: number; d: number } | null>(null);

  const days = useMemo(() => daysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const startDay = useMemo(() => firstDayOfMonth(viewYear, viewMonth), [viewYear, viewMonth]);

  const isDisabled = useCallback(
    (d: number) => {
      if (minDate && isBefore(viewYear, viewMonth, d, minDate.y, minDate.m, minDate.d)) return true;
      return false;
    },
    [viewYear, viewMonth, minDate]
  );

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const canGoPrev = !minDate || viewYear > minDate.y || (viewYear === minDate.y && viewMonth > minDate.m);

  const handleSubmit = () => {
    if (!selected) return;
    const iso = toISO(selected.y, selected.m, selected.d);
    onSubmit({
      type: "date",
      value: iso,
      raw: { widget_id: widgetId, year: selected.y, month: selected.m + 1, day: selected.d, iso },
    });
  };

  return (
    <div data-widget-id={widgetId} className="w-full" style={{ background: "#fdfdfc" }}>
      <div className="mb-3">
        <h3 className="text-base font-semibold" style={{ color: "#1A3A6B" }}>{label}</h3>
        <p className="text-sm" style={{ color: "#6b7280" }}>{description}</p>
      </div>
      <div className="border" style={{ borderColor: "#d8d7cd", borderRadius: 0 }}>
        {/* Month nav */}
        <div className="flex items-center justify-between px-4 py-3" style={{ background: "#f8f8f8" }}>
          <button
            onClick={prevMonth}
            disabled={!canGoPrev}
            className="w-8 h-8 flex items-center justify-center text-sm font-bold disabled:opacity-30"
            style={{ color: "#1A3A6B" }}
            aria-label="Previous month"
          >
            ◀
          </button>
          <span className="text-sm font-semibold" style={{ color: "#1A3A6B" }}>
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center text-sm font-bold"
            style={{ color: "#1A3A6B" }}
            aria-label="Next month"
          >
            ▶
          </button>
        </div>
        {/* Day headers */}
        <div className="grid grid-cols-7 text-center text-xs font-medium py-1 px-2" style={{ color: "#6b7280", background: "#f8f8f8" }}>
          {DAYS.map((d) => (<div key={d} className="py-1">{d}</div>))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7 text-center px-2 pb-3 gap-y-1">
          {Array.from({ length: startDay }).map((_, i) => (<div key={`e${i}`} />))}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const disabled = isDisabled(day);
            const isSelected = selected && selected.y === viewYear && selected.m === viewMonth && selected.d === day;
            return (
              <button
                key={day}
                disabled={disabled}
                onClick={() => !disabled && setSelected({ y: viewYear, m: viewMonth, d: day })}
                className="py-1.5 text-sm transition-colors"
                style={{
                  color: disabled ? "#c4c4c0" : isSelected ? "#fff" : "#1A3A6B",
                  background: isSelected ? "#0A7CFF" : "transparent",
                  cursor: disabled ? "default" : "pointer",
                  fontWeight: isSelected ? 600 : 400,
                  borderRadius: 0,
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
      {selected && (
        <p className="text-xs mt-2" style={{ color: "#1A3A6B" }}>
          Selected: {MONTHS[selected.m]} {selected.d}, {selected.y}
        </p>
      )}
      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="mt-3 w-full py-2 text-sm font-semibold transition-colors disabled:opacity-40"
        style={{ background: "#1A3A6B", color: "#fff", borderRadius: 0 }}
      >
        Confirm {label}
      </button>
    </div>
  );
}

/* ─── Month/Year Picker ─── */
function MonthYearPicker({
  widgetId,
  label,
  description,
  initialYear,
  minDate,
  onSubmit,
}: {
  widgetId: string;
  label: string;
  description: string;
  initialYear: number;
  minDate: { y: number; m: number } | null;
  onSubmit: GeneratedPageProps["onSubmit"];
}) {
  const [viewYear, setViewYear] = useState(initialYear);
  const [selected, setSelected] = useState<{ y: number; m: number } | null>(null);

  const isDisabled = useCallback(
    (m: number) => {
      if (minDate && (viewYear < minDate.y || (viewYear === minDate.y && m < minDate.m))) return true;
      return false;
    },
    [viewYear, minDate]
  );

  const canGoPrev = !minDate || viewYear > minDate.y;

  const handleSubmit = () => {
    if (!selected) return;
    const val = `${selected.y}-${String(selected.m + 1).padStart(2, "0")}`;
    onSubmit({
      type: "month_year",
      value: val,
      raw: { widget_id: widgetId, year: selected.y, month: selected.m + 1, formatted: val },
    });
  };

  return (
    <div data-widget-id={widgetId} className="w-full" style={{ background: "#fdfdfc" }}>
      <div className="mb-3">
        <h3 className="text-base font-semibold" style={{ color: "#1A3A6B" }}>{label}</h3>
        <p className="text-sm" style={{ color: "#6b7280" }}>{description}</p>
      </div>
      <div className="border" style={{ borderColor: "#d8d7cd", borderRadius: 0 }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ background: "#f8f8f8" }}>
          <button
            onClick={() => setViewYear(viewYear - 1)}
            disabled={!canGoPrev}
            className="w-8 h-8 flex items-center justify-center text-sm font-bold disabled:opacity-30"
            style={{ color: "#1A3A6B" }}
            aria-label="Previous year"
          >
            ◀
          </button>
          <span className="text-sm font-semibold" style={{ color: "#1A3A6B" }}>{viewYear}</span>
          <button
            onClick={() => setViewYear(viewYear + 1)}
            className="w-8 h-8 flex items-center justify-center text-sm font-bold"
            style={{ color: "#1A3A6B" }}
            aria-label="Next year"
          >
            ▶
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2 p-3">
          {MONTH_SHORT.map((m, i) => {
            const disabled = isDisabled(i);
            const isSelected = selected && selected.y === viewYear && selected.m === i;
            return (
              <button
                key={m}
                disabled={disabled}
                onClick={() => !disabled && setSelected({ y: viewYear, m: i })}
                className="py-2.5 text-sm transition-colors"
                style={{
                  color: disabled ? "#c4c4c0" : isSelected ? "#fff" : "#1A3A6B",
                  background: isSelected ? "#0A7CFF" : "transparent",
                  cursor: disabled ? "default" : "pointer",
                  fontWeight: isSelected ? 600 : 400,
                  borderRadius: 0,
                  border: disabled ? "none" : "1px solid #d8d7cd",
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>
      {selected && (
        <p className="text-xs mt-2" style={{ color: "#1A3A6B" }}>
          Selected: {MONTHS[selected.m]} {selected.y}
        </p>
      )}
      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="mt-3 w-full py-2 text-sm font-semibold transition-colors disabled:opacity-40"
        style={{ background: "#1A3A6B", color: "#fff", borderRadius: 0 }}
      >
        Confirm {label}
      </button>
    </div>
  );
}

/* ─── Compound Picker (Single Date + Month/Year) ─── */
function CompoundPicker({
  widgetId,
  label,
  description,
  initialMonth,
  initialYear,
  minDate,
  onSubmit,
}: {
  widgetId: string;
  label: string;
  description: string;
  initialMonth: number;
  initialYear: number;
  minDate: { y: number; m: number; d: number } | null;
  onSubmit: GeneratedPageProps["onSubmit"];
}) {
  const [activeTab, setActiveTab] = useState<"date" | "month">("date");

  // Date picker state
  const [viewMonth, setViewMonth] = useState(initialMonth);
  const [viewYear, setViewYear] = useState(initialYear);
  const [selectedDate, setSelectedDate] = useState<{ y: number; m: number; d: number } | null>(null);

  // Month picker state
  const [myViewYear, setMyViewYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState<{ y: number; m: number } | null>(null);

  const days = useMemo(() => daysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const startDay = useMemo(() => firstDayOfMonth(viewYear, viewMonth), [viewYear, viewMonth]);

  const isDayDisabled = useCallback(
    (d: number) => {
      if (minDate && isBefore(viewYear, viewMonth, d, minDate.y, minDate.m, minDate.d)) return true;
      return false;
    },
    [viewYear, viewMonth, minDate]
  );

  const isMonthDisabled = useCallback(
    (m: number) => {
      if (minDate && (myViewYear < minDate.y || (myViewYear === minDate.y && m < minDate.m))) return true;
      return false;
    },
    [myViewYear, minDate]
  );

  const canGoPrevMonth = !minDate || viewYear > minDate.y || (viewYear === minDate.y && viewMonth > minDate.m);
  const canGoPrevYear = !minDate || myViewYear > minDate.y;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const handleSubmit = () => {
    if (activeTab === "date" && selectedDate) {
      const iso = toISO(selectedDate.y, selectedDate.m, selectedDate.d);
      onSubmit({
        type: "date",
        value: iso,
        raw: {
          widget_id: widgetId,
          sub_widget: "start_date",
          year: selectedDate.y,
          month: selectedDate.m + 1,
          day: selectedDate.d,
          iso,
        },
      });
    } else if (activeTab === "month" && selectedMonth) {
      const val = `${selectedMonth.y}-${String(selectedMonth.m + 1).padStart(2, "0")}`;
      onSubmit({
        type: "month_year",
        value: val,
        raw: {
          widget_id: widgetId,
          sub_widget: "schedule_month",
          year: selectedMonth.y,
          month: selectedMonth.m + 1,
          formatted: val,
        },
      });
    }
  };

  const canSubmit = (activeTab === "date" && !!selectedDate) || (activeTab === "month" && !!selectedMonth);

  return (
    <div data-widget-id={widgetId} className="w-full" style={{ background: "#fdfdfc" }}>
      <div className="mb-3">
        <h3 className="text-base font-semibold" style={{ color: "#1A3A6B" }}>{label}</h3>
        <p className="text-sm" style={{ color: "#6b7280" }}>{description}</p>
      </div>
      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "#d8d7cd" }}>
        <button
          onClick={() => setActiveTab("date")}
          className="flex-1 py-2 text-sm font-medium transition-colors"
          style={{
            color: activeTab === "date" ? "#1A3A6B" : "#6b7280",
            borderBottom: activeTab === "date" ? "2px solid #0A7CFF" : "2px solid transparent",
          }}
        >
          Start Date
        </button>
        <button
          onClick={() => setActiveTab("month")}
          className="flex-1 py-2 text-sm font-medium transition-colors"
          style={{
            color: activeTab === "month" ? "#1A3A6B" : "#6b7280",
            borderBottom: activeTab === "month" ? "2px solid #0A7CFF" : "2px solid transparent",
          }}
        >
          Schedule Month
        </button>
      </div>

      <div className="border border-t-0" style={{ borderColor: "#d8d7cd", borderRadius: 0 }}>
        {activeTab === "date" ? (
          <>
            <div className="flex items-center justify-between px-4 py-3" style={{ background: "#f8f8f8" }}>
              <button
                onClick={prevMonth}
                disabled={!canGoPrevMonth}
                className="w-8 h-8 flex items-center justify-center text-sm font-bold disabled:opacity-30"
                style={{ color: "#1A3A6B" }}
                aria-label="Previous month"
              >
                ◀
              </button>
              <span className="text-sm font-semibold" style={{ color: "#1A3A6B" }}>
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                onClick={nextMonth}
                className="w-8 h-8 flex items-center justify-center text-sm font-bold"
                style={{ color: "#1A3A6B" }}
                aria-label="Next month"
              >
                ▶
              </button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs font-medium py-1 px-2" style={{ color: "#6b7280", background: "#f8f8f8" }}>
              {DAYS.map((d) => (<div key={d} className="py-1">{d}</div>))}
            </div>
            <div className="grid grid-cols-7 text-center px-2 pb-3 gap-y-1">
              {Array.from({ length: startDay }).map((_, i) => (<div key={`e${i}`} />))}
              {Array.from({ length: days }).map((_, i) => {
                const day = i + 1;
                const disabled = isDayDisabled(day);
                const isSelected = selectedDate && selectedDate.y === viewYear && selectedDate.m === viewMonth && selectedDate.d === day;
                return (
                  <button
                    key={day}
                    disabled={disabled}
                    onClick={() => !disabled && setSelectedDate({ y: viewYear, m: viewMonth, d: day })}
                    className="py-1.5 text-sm transition-colors"
                    style={{
                      color: disabled ? "#c4c4c0" : isSelected ? "#fff" : "#1A3A6B",
                      background: isSelected ? "#0A7CFF" : "transparent",
                      cursor: disabled ? "default" : "pointer",
                      fontWeight: isSelected ? 600 : 400,
                      borderRadius: 0,
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-3" style={{ background: "#f8f8f8" }}>
              <button
                onClick={() => setMyViewYear(myViewYear - 1)}
                disabled={!canGoPrevYear}
                className="w-8 h-8 flex items-center justify-center text-sm font-bold disabled:opacity-30"
                style={{ color: "#1A3A6B" }}
                aria-label="Previous year"
              >
                ◀
              </button>
              <span className="text-sm font-semibold" style={{ color: "#1A3A6B" }}>{myViewYear}</span>
              <button
                onClick={() => setMyViewYear(myViewYear + 1)}
                className="w-8 h-8 flex items-center justify-center text-sm font-bold"
                style={{ color: "#1A3A6B" }}
                aria-label="Next year"
              >
                ▶
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 p-3">
              {MONTH_SHORT.map((m, idx) => {
                const disabled = isMonthDisabled(idx);
                const isSelected = selectedMonth && selectedMonth.y === myViewYear && selectedMonth.m === idx;
                return (
                  <button
                    key={m}
                    disabled={disabled}
                    onClick={() => !disabled && setSelectedMonth({ y: myViewYear, m: idx })}
                    className="py-2.5 text-sm transition-colors"
                    style={{
                      color: disabled ? "#c4c4c0" : isSelected ? "#fff" : "#1A3A6B",
                      background: isSelected ? "#0A7CFF" : "transparent",
                      cursor: disabled ? "default" : "pointer",
                      fontWeight: isSelected ? 600 : 400,
                      borderRadius: 0,
                      border: disabled ? "none" : "1px solid #d8d7cd",
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {activeTab === "date" && selectedDate && (
        <p className="text-xs mt-2" style={{ color: "#1A3A6B" }}>
          Selected: {MONTHS[selectedDate.m]} {selectedDate.d}, {selectedDate.y}
        </p>
      )}
      {activeTab === "month" && selectedMonth && (
        <p className="text-xs mt-2" style={{ color: "#1A3A6B" }}>
          Selected: {MONTHS[selectedMonth.m]} {selectedMonth.y}
        </p>
      )}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="mt-3 w-full py-2 text-sm font-semibold transition-colors disabled:opacity-40"
        style={{ background: "#1A3A6B", color: "#fff", borderRadius: 0 }}
      >
        Confirm {activeTab === "date" ? "Start Date" : "Schedule Month"}
      </button>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Page_recurring_transfer(props: GeneratedPageProps) {
  const transactions = [
    { id: "TXN-4821", to: "Savings ••4421", amount: "$500.00", date: "Sep 1, 2025", status: "Scheduled" },
    { id: "TXN-4790", to: "Joint ••7733", amount: "$1,200.00", date: "Aug 15, 2025", status: "Completed" },
    { id: "TXN-4755", to: "Savings ••4421", amount: "$500.00", date: "Aug 1, 2025", status: "Completed" },
    { id: "TXN-4701", to: "External ••9102", amount: "$250.00", date: "Jul 15, 2025", status: "Completed" },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ background: "#d8d7cd" }}>
      {/* Header */}
      <header className="w-full" style={{ background: "#1A3A6B" }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold text-white flex items-center gap-2">
              🏦 <span>EchoBank</span>
            </span>
            <nav className="hidden md:flex items-center gap-5 text-sm text-white" style={{ opacity: 0.85 }}>
              <a href="#" className="hover:opacity-100">Accounts</a>
              <a href="#" className="hover:opacity-100">Transfer</a>
              <a href="#" className="hover:opacity-100">Cards</a>
              <a href="#" className="hover:opacity-100">Support</a>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm text-white" style={{ opacity: 0.85 }}>
            <span className="hidden sm:inline">🔒 Secure Session</span>
            <span>John D.</span>
            <button className="underline text-xs">Logout</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative w-full" style={{ maxHeight: 220, overflow: "hidden" }}>
        <img
          src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop"
          alt="Bank building"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 flex items-center" style={{ background: "rgba(26,58,107,0.65)" }}>
          <div className="max-w-6xl mx-auto px-4 w-full">
            <h1 className="text-2xl font-semibold text-white">Recurring Transfer</h1>
            <p className="text-sm text-white mt-1" style={{ opacity: 0.9 }}>
              Schedule automated transfers between your accounts
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Account summary bar */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px] p-4 border" style={{ background: "#fdfdfc", borderColor: "#d8d7cd", borderRadius: 0 }}>
            <p className="text-xs" style={{ color: "#6b7280" }}>Checking ••3847</p>
            <p className="text-xl font-semibold" style={{ color: "#1A3A6B" }}>$12,450.32</p>
            <p className="text-xs mt-1" style={{ color: "#6b7280" }}>Available balance</p>
          </div>
          <div className="flex-1 min-w-[200px] p-4 border" style={{ background: "#fdfdfc", borderColor: "#d8d7cd", borderRadius: 0 }}>
            <p className="text-xs" style={{ color: "#6b7280" }}>Savings ••4421</p>
            <p className="text-xl font-semibold" style={{ color: "#1A3A6B" }}>$34,891.00</p>
            <p className="text-xs mt-1" style={{ color: "#6b7280" }}>Available balance</p>
          </div>
          <div className="flex-1 min-w-[200px] p-4 border" style={{ background: "#fdfdfc", borderColor: "#d8d7cd", borderRadius: 0 }}>
            <p className="text-xs" style={{ color: "#6b7280" }}>Active Recurring</p>
            <p className="text-xl font-semibold" style={{ color: "#1A3A6B" }}>3</p>
            <p className="text-xs mt-1" style={{ color: "#6b7280" }}>Scheduled transfers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Transfer form + datepickers */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transfer setup */}
            <div className="p-5 border" style={{ background: "#fdfdfc", borderColor: "#d8d7cd", borderRadius: 0 }}>
              <h2 className="text-base font-semibold mb-4" style={{ color: "#1A3A6B" }}>
                Set Up Recurring Transfer
              </h2>
              <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
                Configure your automated transfer schedule. Select accounts, enter an amount, then choose
                start date and recurring month below.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#1A3A6B" }}>From Account</label>
                  <select
                    className="w-full border px-3 py-2 text-sm"
                    style={{ borderColor: "#d8d7cd", background: "#f8f8f8", borderRadius: 0, color: "#1A3A6B" }}
                    defaultValue="checking"
                  >
                    <option value="checking">Checking ••3847</option>
                    <option value="savings">Savings ••4421</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#1A3A6B" }}>To Account</label>
                  <select
                    className="w-full border px-3 py-2 text-sm"
                    style={{ borderColor: "#d8d7cd", background: "#f8f8f8", borderRadius: 0, color: "#1A3A6B" }}
                    defaultValue="savings"
                  >
                    <option value="savings">Savings ••4421</option>
                    <option value="joint">Joint ••7733</option>
                    <option value="external">External ••9102</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#1A3A6B" }}>Amount (USD)</label>
                  <input
                    type="text"
                    placeholder="$0.00"
                    className="w-full border px-3 py-2 text-sm"
                    style={{ borderColor: "#d8d7cd", background: "#f8f8f8", borderRadius: 0, color: "#1A3A6B" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#1A3A6B" }}>Memo / Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. Monthly savings"
                    className="w-full border px-3 py-2 text-sm"
                    style={{ borderColor: "#d8d7cd", background: "#f8f8f8", borderRadius: 0, color: "#1A3A6B" }}
                  />
                </div>
              </div>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-3 text-xs" style={{ color: "#6b7280" }}>
              <span className="font-medium" style={{ color: "#1A3A6B" }}>Frequency:</span>
              {["Monthly", "Bi-weekly", "Weekly"].map((f) => (
                <button
                  key={f}
                  className="px-3 py-1 border text-xs"
                  style={{
                    borderColor: "#d8d7cd",
                    background: f === "Monthly" ? "#f6efd3" : "#fdfdfc",
                    color: "#1A3A6B",
                    borderRadius: 0,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Widget 1: Start Date */}
            <div className="p-5 border" style={{ background: "#fdfdfc", borderColor: "#d8d7cd", borderRadius: 0 }}>
              <SingleDatePicker
                widgetId="start_date"
                label="Start Date"
                description="Select the first date for your recurring transfer. Only future dates are available."
                initialMonth={8}
                initialYear={2025}
                minDate={{ y: 2025, m: 8, d: 1 }}
                onSubmit={props.onSubmit}
              />
            </div>

            {/* Widget 2: Schedule Month */}
            <div className="p-5 border" style={{ background: "#fdfdfc", borderColor: "#d8d7cd", borderRadius: 0 }}>
              <MonthYearPicker
                widgetId="schedule_month"
                label="Schedule Month"
                description="Choose the month and year when recurring transfers should begin."
                initialYear={2025}
                minDate={{ y: 2025, m: 8 }}
                onSubmit={props.onSubmit}
              />
            </div>

            {/* Widget 3: Compound */}
            <div className="p-5 border" style={{ background: "#fdfdfc", borderColor: "#d8d7cd", borderRadius: 0 }}>
              <CompoundPicker
                widgetId="compound"
                label="Start Date + Schedule Month"
                description="Combined picker — select a specific start date or choose a schedule month."
                initialMonth={5}
                initialYear={2025}
                minDate={{ y: 2025, m: 5, d: 1 }}
                onSubmit={props.onSubmit}
              />
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Quick actions */}
            <div className="p-4 border" style={{ background: "#fdfdfc", borderColor: "#d8d7cd", borderRadius: 0 }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#1A3A6B" }}>Quick Actions</h3>
              <div className="space-y-2">
                {["One-time Transfer", "View Statements", "Manage Payees"].map((a) => (
                  <button
                    key={a}
                    className="w-full text-left px-3 py-2 text-sm border"
                    style={{ borderColor: "#d8d7cd", background: "#f8f8f8", color: "#1A3A6B", borderRadius: 0 }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Card images */}
            <div className="border overflow-hidden" style={{ borderColor: "#d8d7cd", borderRadius: 0 }}>
              <img
                src="https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400&h=300&fit=crop"
                alt="Credit card"
                className="w-full h-48 object-cover"
              />
              <div className="p-3" style={{ background: "#fdfdfc" }}>
                <p className="text-xs font-medium" style={{ color: "#1A3A6B" }}>EchoBank Platinum Card</p>
                <p className="text-xs" style={{ color: "#6b7280" }}>Earn 2x on recurring payments</p>
              </div>
            </div>

            <div className="border overflow-hidden" style={{ borderColor: "#d8d7cd", borderRadius: 0 }}>
              <img
                src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop"
                alt="Savings coins"
                className="w-full h-48 object-cover"
              />
              <div className="p-3" style={{ background: "#fdfdfc" }}>
                <p className="text-xs font-medium" style={{ color: "#1A3A6B" }}>High-Yield Savings</p>
                <p className="text-xs" style={{ color: "#6b7280" }}>4.25% APY — grow your savings faster</p>
              </div>
            </div>

            {/* Recent transactions */}
            <div className="p-4 border" style={{ background: "#fdfdfc", borderColor: "#d8d7cd", borderRadius: 0 }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#1A3A6B" }}>Transfer History</h3>
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium" style={{ color: "#1A3A6B" }}>{tx.to}</p>
                      <p style={{ color: "#6b7280" }}>{tx.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium" style={{ color: "#1A3A6B" }}>{tx.amount}</p>
                      <p style={{ color: tx.status === "Scheduled" ? "#0A7CFF" : "#6b7280" }}>{tx.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 py-6 text-center text-xs" style={{ background: "#1A3A6B", color: "rgba(255,255,255,0.7)" }}>
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p>🏦 EchoBank — Member FDIC. Equal Housing Lender. NMLS #123456</p>
          <p>Deposits are insured up to $250,000 per depositor. Your session is protected with 256-bit encryption.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="#" className="underline">Privacy Policy</a>
            <a href="#" className="underline">Terms of Service</a>
            <a href="#" className="underline">Security Center</a>
            <a href="#" className="underline">Contact Support</a>
          </div>
          <p className="mt-2" style={{ opacity: 0.5 }}>© 2025 EchoBank. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
