import React, { useState, useCallback, useMemo } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatMonthYear(year: number, month: number): string {
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  return `${months[month]} ${year}`;
}

interface CalendarProps {
  widgetId: string;
  label: string;
  description: string;
  initialYear: number;
  initialMonth: number;
  minDate?: string;
  maxDate?: string;
  disabledDates?: string[];
  disabledWeekdays?: number[];
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

function Calendar({
  widgetId,
  label,
  description,
  initialYear,
  initialMonth,
  minDate,
  maxDate,
  disabledDates = [],
  disabledWeekdays = [],
  onSubmit,
}: CalendarProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string | null>(null);

  const disabledSet = useMemo(() => new Set(disabledDates), [disabledDates]);

  const isDisabled = useCallback(
    (iso: string, dayOfWeek: number) => {
      if (disabledSet.has(iso)) return true;
      if (disabledWeekdays.includes(dayOfWeek)) return true;
      if (minDate && iso < minDate) return true;
      if (maxDate && iso > maxDate) return true;
      return false;
    },
    [disabledSet, disabledWeekdays, minDate, maxDate]
  );

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleSubmit = () => {
    if (!selected) return;
    onSubmit({
      type: "date",
      value: selected,
      raw: { widget_id: widgetId, date: selected, year, month: month + 1 },
    });
  };

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toISO(year, month, d);
    const dow = new Date(year, month, d).getDay();
    const disabled = isDisabled(iso, dow);
    const isSelected = iso === selected;

    cells.push(
      <button
        key={iso}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setSelected(iso)}
        className={`
          h-9 w-full text-sm font-normal
          ${disabled ? "text-gray-300 cursor-not-allowed" : "cursor-pointer hover:bg-teal-50"}
          ${isSelected ? "font-semibold text-white" : ""}
        `}
        style={{
          borderRadius: 0,
          backgroundColor: isSelected ? "#0D9488" : undefined,
        }}
      >
        {d}
      </button>
    );
  }

  return (
    <div
      data-widget-id={widgetId}
      className="w-full"
      style={{ backgroundColor: "#fdfdfd", borderRadius: 0 }}
    >
      <div className="mb-2">
        <h3 className="text-base font-semibold text-gray-800">{label}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>

      <div
        className="border"
        style={{ borderColor: "#dddddd", borderRadius: 0 }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: "#f3f3f3" }}
        >
          <button
            type="button"
            onClick={prevMonth}
            className="text-gray-600 hover:text-gray-900 px-2 py-1 text-sm"
          >
            ◀
          </button>
          <span className="text-sm font-semibold text-gray-700">
            {formatMonthYear(year, month)}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="text-gray-600 hover:text-gray-900 px-2 py-1 text-sm"
          >
            ▶
          </button>
        </div>

        <div className="px-3 pb-3 pt-2">
          <div className="grid grid-cols-7 mb-1">
            {DAYS_OF_WEEK.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-gray-400 py-1"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">{cells}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {selected ? `Selected: ${selected}` : "No date selected"}
        </span>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selected}
          className={`
            px-5 py-2 text-sm font-medium text-white
            ${selected ? "hover:opacity-90" : "opacity-40 cursor-not-allowed"}
          `}
          style={{ backgroundColor: "#0D9488", borderRadius: 0 }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export default function Page_photography_booking(props: GeneratedPageProps) {
  return (
    <div
      className="min-h-screen font-sans"
      style={{ backgroundColor: "#dddddd" }}
    >
      {/* Header */}
      <header
        className="w-full border-b"
        style={{ backgroundColor: "#fdfdfd", borderColor: "#ededed" }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔧</span>
            <span
              className="text-lg font-semibold"
              style={{ color: "#0D9488" }}
            >
              EchoServe
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <a href="#" className="hover:text-gray-900">Home</a>
            <a href="#" className="hover:text-gray-900">Services</a>
            <a href="#" className="hover:text-gray-900" style={{ color: "#0D9488" }}>Book</a>
            <a href="#" className="hover:text-gray-900">Contact</a>
          </nav>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>📍 10001</span>
            <button
              className="px-3 py-1.5 text-white text-sm"
              style={{ backgroundColor: "#0D9488", borderRadius: 0 }}
            >
              Account
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative w-full overflow-hidden" style={{ maxHeight: 260 }}>
        <img
          src="https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=300&fit=crop"
          alt="Photography session"
          className="w-full object-cover"
          style={{ height: 260 }}
        />
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.55))" }}
        >
          <div className="text-center text-white px-4">
            <h1 className="text-2xl font-semibold mb-1">Book Your Photography Session</h1>
            <p className="text-sm opacity-90">
              Select dates for your shoot, editing deadlines, and more
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Context card */}
        <div
          className="mb-8 p-5 border"
          style={{
            backgroundColor: "#f9f9f9",
            borderColor: "#ededed",
            borderRadius: 0,
          }}
        >
          <h2 className="text-base font-semibold text-gray-800 mb-1">
            Photography Booking
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Use the date pickers below to schedule your photo shoot, set an
            editing deadline, and coordinate the full timeline. Each picker has
            its own constraints — read the description carefully before selecting.
          </p>
        </div>

        {/* Filters bar */}
        <div
          className="flex items-center gap-3 mb-6 px-4 py-2.5 border text-sm"
          style={{
            backgroundColor: "#f3f3f3",
            borderColor: "#ededed",
            borderRadius: 0,
          }}
        >
          <span className="text-gray-400 text-xs uppercase tracking-wide">Filter:</span>
          <button
            className="px-3 py-1 text-white text-xs"
            style={{ backgroundColor: "#0D9488", borderRadius: 0 }}
          >
            All Dates
          </button>
          <button
            className="px-3 py-1 text-xs text-gray-500 border"
            style={{ borderColor: "#dddddd", borderRadius: 0, backgroundColor: "#fdfdfd" }}
          >
            Weekdays
          </button>
          <button
            className="px-3 py-1 text-xs text-gray-500 border"
            style={{ borderColor: "#dddddd", borderRadius: 0, backgroundColor: "#fdfdfd" }}
          >
            This Month
          </button>
        </div>

        {/* Widget 1 — Photo Shoot Date */}
        <section
          className="mb-8 p-6 border"
          style={{
            backgroundColor: "#fdfdfd",
            borderColor: "#ededed",
            borderRadius: 0,
          }}
        >
          <Calendar
            widgetId="shoot_date"
            label="Photo Shoot Date"
            description="Select a future date for your photography session. Past dates are disabled."
            initialYear={2026}
            initialMonth={2}
            minDate="2026-03-01"
            onSubmit={props.onSubmit}
          />
        </section>

        {/* Widget 2 — Editing Deadline */}
        <section
          className="mb-8 p-6 border"
          style={{
            backgroundColor: "#fdfdfd",
            borderColor: "#ededed",
            borderRadius: 0,
          }}
        >
          <Calendar
            widgetId="editing_deadline"
            label="Editing Deadline"
            description="Choose a business day (Mon–Fri) for the editing deadline. Weekends and holidays are disabled."
            initialYear={2025}
            initialMonth={9}
            disabledDates={[
              "2025-01-01",
              "2025-07-04",
              "2025-12-25",
              "2025-11-28",
            ]}
            disabledWeekdays={[0, 6]}
            onSubmit={props.onSubmit}
          />
        </section>

        {/* Widget 3 — Compound */}
        <section
          className="mb-8 p-6 border"
          style={{
            backgroundColor: "#fdfdfd",
            borderColor: "#ededed",
            borderRadius: 0,
          }}
        >
          <Calendar
            widgetId="compound"
            label="Photo Shoot Date + Editing Deadline"
            description="Select a date from June 2025 onward to coordinate both your shoot and editing timeline."
            initialYear={2025}
            initialMonth={5}
            minDate="2025-06-01"
            onSubmit={props.onSubmit}
          />
        </section>

        {/* Service provider cards */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Top Photography Providers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className="border overflow-hidden"
              style={{
                backgroundColor: "#fdfdfd",
                borderColor: "#ededed",
                borderRadius: 0,
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop"
                alt="Wedding photography"
                className="w-full h-48 object-cover"
                style={{ borderRadius: 0 }}
              />
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-800">
                  Lena Studios
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  ★★★★★ 4.9 · 128 reviews
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Weddings, portraits & events
                </p>
                <p
                  className="text-sm font-semibold mt-2"
                  style={{ color: "#0D9488" }}
                >
                  From $250/session
                </p>
              </div>
            </div>
            <div
              className="border overflow-hidden"
              style={{
                backgroundColor: "#fdfdfd",
                borderColor: "#ededed",
                borderRadius: 0,
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop"
                alt="Team photo session"
                className="w-full h-48 object-cover"
                style={{ borderRadius: 0 }}
              />
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-800">
                  FrameCraft Co.
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  ★★★★☆ 4.7 · 84 reviews
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Corporate & product photography
                </p>
                <p
                  className="text-sm font-semibold mt-2"
                  style={{ color: "#0D9488" }}
                >
                  From $180/session
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t mt-4"
        style={{ backgroundColor: "#f9f9f9", borderColor: "#ededed" }}
      >
        <div className="max-w-5xl mx-auto px-6 py-6 text-xs text-gray-400">
          <div className="flex flex-wrap gap-6 mb-3">
            <span>✔ 100% Satisfaction Guarantee</span>
            <span>✔ Verified Providers</span>
            <span>✔ Secure Payments</span>
          </div>
          <div className="flex flex-wrap gap-4 mb-3">
            <a href="#" className="hover:text-gray-600">Help Center</a>
            <a href="#" className="hover:text-gray-600">Terms of Service</a>
            <a href="#" className="hover:text-gray-600">Privacy Policy</a>
          </div>
          <p>© 2026 EchoServe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
