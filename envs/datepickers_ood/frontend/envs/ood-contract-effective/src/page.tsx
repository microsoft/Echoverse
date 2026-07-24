import React, { useState, useEffect, useMemo, useCallback } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

type ActiveTask = {
  task_id: string;
  env_name?: string;
  instruction_text: string;
  datepicker_type?: string;
  category?: string;
  widget_id?: string;
  task_type?: string;
  initial_visible_state?: any;
  constraint_type?: string;
  constraint_params?: any;
  suite?: string;
};

const NOW = new Date("2025-09-01T09:00:00");

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  const counts = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return counts[month - 1];
}

function getDayOfWeek(year: number, month: number, day: number): number {
  const d = new Date(year, month - 1, day);
  return d.getDay();
}

function dateDiffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function Page_ood_contract_effective(props: GeneratedPageProps): JSX.Element {
  const [task, setTask] = useState<ActiveTask | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [visibleYear, setVisibleYear] = useState(2025);

  useEffect(() => {
    const active = window.__ACTIVE_TASK__ || null;
    setTask(active);
    if (active?.initial_visible_state) {
      const vy = active.initial_visible_state.visible_year;
      if (vy) setVisibleYear(vy);
    }
  }, []);

  const constraintType = task?.constraint_type || "none";
  const constraintParams = task?.constraint_params || {};

  const isDayDisabled = useCallback(
    (iso: string): boolean => {
      if (constraintType === "none") return false;

      const date = parseISO(iso);
      const dayOfWeek = date.getDay();

      if (constraintType === "weekday_only") {
        return dayOfWeek === 0 || dayOfWeek === 6;
      }
      if (constraintType === "weekend_only") {
        return dayOfWeek !== 0 && dayOfWeek !== 6;
      }
      if (constraintType === "only_specific_weekday") {
        const targetWeekday = constraintParams.weekday;
        if (targetWeekday !== undefined) {
          return dayOfWeek !== targetWeekday;
        }
        return false;
      }
      if (constraintType === "business_days") {
        return dayOfWeek === 0 || dayOfWeek === 6;
      }
      if (constraintType === "max_n_days_from_today") {
        const maxDays = constraintParams.max_days || 30;
        const diff = dateDiffDays(NOW, date);
        return diff < 0 || diff > maxDays;
      }
      if (constraintType === "min_advance_notice") {
        const minHours = constraintParams.min_hours || 48;
        const minMs = minHours * 60 * 60 * 1000;
        return date.getTime() < NOW.getTime() + minMs;
      }
      if (constraintType === "blackout_windows") {
        const windows: string[][] = constraintParams.blackout_windows || [];
        for (const [start, end] of windows) {
          const s = parseISO(start);
          const e = parseISO(end);
          if (date >= s && date <= e) return true;
        }
        return false;
      }
      if (constraintType === "fortnightly") {
        const diff = dateDiffDays(NOW, date);
        return diff % 14 !== 0;
      }
      if (constraintType === "quarter_aligned") {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return !(day === 1 && (month === 1 || month === 4 || month === 7 || month === 10));
      }
      return false;
    },
    [constraintType, constraintParams]
  );

  const generateIntensity = useCallback((iso: string): number => {
    let hash = 0;
    for (let i = 0; i < iso.length; i++) {
      hash = ((hash << 5) - hash + iso.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % 5;
  }, []);

  const yearData = useMemo(() => {
    const allDays: string[] = [];
    for (let m = 1; m <= 12; m++) {
      const days = daysInMonth(visibleYear, m);
      for (let d = 1; d <= days; d++) {
        allDays.push(toISO(visibleYear, m, d));
      }
    }

    const firstDayOfYear = getDayOfWeek(visibleYear, 1, 1);
    const weeks: string[] = [];
    let currentDate = new Date(visibleYear, 0, 1);
    currentDate.setDate(currentDate.getDate() - firstDayOfYear);

    const startSunday = new Date(currentDate);
    const endOfYear = new Date(visibleYear, 11, 31);
    const lastDayWeekday = endOfYear.getDay();
    const endSaturday = new Date(endOfYear);
    endSaturday.setDate(endSaturday.getDate() + (6 - lastDayWeekday));

    let cur = new Date(startSunday);
    while (cur <= endSaturday) {
      weeks.push(toISO(cur.getFullYear(), cur.getMonth() + 1, cur.getDate()));
      cur.setDate(cur.getDate() + 7);
    }

    return { allDays, weeks };
  }, [visibleYear]);

  const dayInColumn = useCallback(
    (weekStartIso: string, weekday: number): string | null => {
      const ws = parseISO(weekStartIso);
      const target = new Date(ws);
      target.setDate(target.getDate() + weekday);
      if (target.getFullYear() !== visibleYear) return null;
      return toISO(target.getFullYear(), target.getMonth() + 1, target.getDate());
    },
    [visibleYear]
  );

  const handleSelect = useCallback(
    (iso: string) => {
      if (!isDayDisabled(iso)) {
        setSelected(iso);
      }
    },
    [isDayDisabled]
  );

  const handleSubmit = useCallback(() => {
    if (selected && /^\d{4}-\d{2}-\d{2}$/.test(selected)) {
      props.onSubmit({
        type: "date",
        value: selected,
        raw: {
          widget_id: "effective_date",
          picker: "calendar_heatmap",
          state: { selected, visibleYear },
        },
      });
    }
  }, [selected, visibleYear, props]);

  const handlePrev = useCallback(() => setVisibleYear((y) => y - 1), []);
  const handleNext = useCallback(() => setVisibleYear((y) => y + 1), []);

  const intensityColors = [
    "rgba(75,75,75,0.05)",
    "rgba(217,119,6,0.2)",
    "rgba(217,119,6,0.4)",
    "rgba(217,119,6,0.6)",
    "rgba(217,119,6,0.8)",
  ];

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const wobblyFilterSvg = (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <filter id="wobbly">
          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" seed="2" result="turbulence" />
          <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="wobbly-border">
          <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="2" seed="5" result="turbulence" />
          <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        background: "#fdf6e3",
        fontFamily: "'Caveat', 'Indie Flower', 'Patrick Hand', cursive",
        fontSize: "17px",
        lineHeight: "1.5",
        color: "#2b2b2b",
      }}
    >
      {wobblyFilterSvg}

      {/* Header */}
      <header
        className="w-full px-6 py-4 flex items-center justify-between border-b-2"
        style={{
          borderColor: "#4b4b4b",
          filter: "url(#wobbly)",
          background: "#fdf6e3",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚖️</span>
          <span
            className="text-2xl font-bold"
            style={{
              fontFamily: "'Caveat', cursive",
              transform: "rotate(-0.5deg)",
              color: "#2b2b2b",
            }}
          >
            EchoLaw
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-lg" style={{ color: "#4b4b4b" }}>
          <a href="#" className="hover:underline decoration-wavy">Practice Areas</a>
          <a href="#" className="hover:underline decoration-wavy">Attorneys</a>
          <a href="#" className="hover:underline decoration-wavy">Resources</a>
          <a href="#" className="hover:underline decoration-wavy">Portal</a>
        </nav>
        <span className="hidden lg:block text-base" style={{ color: "#9c8b6b" }}>
          ☎ (555) 012-3456
        </span>
      </header>

      {/* Hero */}
      <section className="w-full px-6 py-8 text-center" style={{ background: "#fdf6e3" }}>
        <h1
          className="text-3xl md:text-4xl font-bold mb-2"
          style={{
            fontFamily: "'Caveat', cursive",
            transform: "rotate(-0.5deg)",
            color: "#2b2b2b",
          }}
        >
          Contract Effective
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "#9c8b6b" }}>
          Schedule a consultation — select the effective date for your contract below.
        </p>
        <div className="flex justify-center gap-4 mt-4 flex-wrap">
          {["EchoBar Certified", "50+ Years Experience", "Pro Bono Commitment"].map((badge) => (
            <span
              key={badge}
              className="px-3 py-1 rounded-md border-2 text-sm"
              style={{
                borderColor: "#4b4b4b",
                filter: "url(#wobbly-border)",
                background: "#fde68a",
                mixBlendMode: "multiply",
              }}
            >
              ★ {badge}
            </span>
          ))}
        </div>
      </section>

      {/* Instruction Banner */}
      {task?.instruction_text && (
        <div
          className="mx-4 md:mx-auto max-w-3xl px-5 py-3 mb-4 rounded-md border-2"
          style={{
            borderColor: "#d97706",
            background: "#fde68a",
            mixBlendMode: "multiply",
            filter: "url(#wobbly-border)",
            fontFamily: "'Caveat', cursive",
            fontSize: "19px",
          }}
        >
          ✏️ <strong>Instructions:</strong> {task.instruction_text}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 py-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Context (left) */}
          <div className="lg:col-span-1 space-y-4">
            <div
              className="p-4 rounded-md border-2"
              style={{ borderColor: "#4b4b4b", filter: "url(#wobbly-border)", background: "#fdf6e3" }}
            >
              <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "'Caveat', cursive" }}>
                Case Details
              </h3>
              <label className="block mb-2 text-base" style={{ color: "#4b4b4b" }}>
                Case Type
              </label>
              <select
                className="w-full px-3 py-2 rounded-md border-2 mb-3"
                style={{ borderColor: "#4b4b4b", background: "#fdf6e3", fontFamily: "'Caveat', cursive", fontSize: "16px" }}
              >
                <option>Contract Dispute</option>
                <option>Employment Law</option>
                <option>Intellectual Property</option>
                <option>Corporate Formation</option>
              </select>

              <label className="block mb-2 text-base" style={{ color: "#4b4b4b" }}>
                Jurisdiction
              </label>
              <select
                className="w-full px-3 py-2 rounded-md border-2 mb-3"
                style={{ borderColor: "#4b4b4b", background: "#fdf6e3", fontFamily: "'Caveat', cursive", fontSize: "16px" }}
              >
                <option>California</option>
                <option>New York</option>
                <option>Delaware</option>
                <option>Texas</option>
              </select>

              <label className="block mb-2 text-base" style={{ color: "#4b4b4b" }}>
                Attorney Assigned
              </label>
              <select
                className="w-full px-3 py-2 rounded-md border-2 mb-3"
                style={{ borderColor: "#4b4b4b", background: "#fdf6e3", fontFamily: "'Caveat', cursive", fontSize: "16px" }}
              >
                <option>J. Harrison, Esq.</option>
                <option>M. Caldwell, Esq.</option>
                <option>R. Pemberton, Esq.</option>
              </select>

              <label className="block mb-2 text-base" style={{ color: "#4b4b4b" }}>
                Matter Number
              </label>
              <input
                type="text"
                placeholder="e.g. MTR-2025-0042"
                className="w-full px-3 py-2 rounded-md border-2 mb-3"
                style={{ borderColor: "#4b4b4b", background: "#fdf6e3", fontFamily: "'Caveat', cursive", fontSize: "16px" }}
              />

              <label className="block mb-2 text-base" style={{ color: "#4b4b4b" }}>
                Consultation Length
              </label>
              <select
                className="w-full px-3 py-2 rounded-md border-2"
                style={{ borderColor: "#4b4b4b", background: "#fdf6e3", fontFamily: "'Caveat', cursive", fontSize: "16px" }}
              >
                <option>30 minutes</option>
                <option>60 minutes</option>
                <option>90 minutes</option>
              </select>
            </div>
          </div>

          {/* Picker Card (right) */}
          <div className="lg:col-span-2" data-widget-id="effective_date">
            <div
              data-testid="picker-root"
              className="p-4 rounded-md border-2"
              style={{
                borderColor: "#4b4b4b",
                filter: "url(#wobbly-border)",
                background: "#fdf6e3",
                boxShadow: "2px 3px 0 rgba(75,75,75,0.15)",
              }}
            >
              <label
                className="block text-xl font-bold mb-2"
                style={{
                  fontFamily: "'Caveat', cursive",
                  transform: "rotate(-1deg)",
                  color: "#2b2b2b",
                }}
              >
                ✎ Effective Date
              </label>

              <button
                data-testid="picker-trigger"
                onClick={() => setPanelOpen(!panelOpen)}
                className="px-4 py-2 rounded-md border-2 mb-4 cursor-pointer"
                style={{
                  borderColor: "#4b4b4b",
                  background: "#fdf6e3",
                  fontFamily: "'Caveat', cursive",
                  fontSize: "17px",
                  filter: "url(#wobbly-border)",
                }}
              >
                {selected ? `✏️ ${selected}` : "✏️ Click to pick a date..."}
              </button>

              {panelOpen && (
                <div data-testid="picker-panel">
                  {/* Navigation */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      data-testid="picker-nav-prev"
                      onClick={handlePrev}
                      className="px-3 py-1 rounded border-2 cursor-pointer text-lg"
                      style={{
                        borderColor: "#4b4b4b",
                        background: "#fdf6e3",
                        fontFamily: "'Caveat', cursive",
                        filter: "url(#wobbly-border)",
                      }}
                    >
                      ← prev
                    </button>
                    <span
                      data-testid="picker-visible-year"
                      className="text-2xl font-bold"
                      style={{ fontFamily: "'Caveat', cursive" }}
                    >
                      {visibleYear}
                    </span>
                    <button
                      data-testid="picker-nav-next"
                      onClick={handleNext}
                      className="px-3 py-1 rounded border-2 cursor-pointer text-lg"
                      style={{
                        borderColor: "#4b4b4b",
                        background: "#fdf6e3",
                        fontFamily: "'Caveat', cursive",
                        filter: "url(#wobbly-border)",
                      }}
                    >
                      next →
                    </button>
                  </div>

                  {/* Heatmap Grid */}
                  <div className="overflow-x-auto">
                    <table data-testid="picker-heatmap-grid" className="w-full border-collapse">
                      <tbody>
                        {[0, 1, 2, 3, 4, 5, 6].map((weekday) => (
                          <tr key={weekday} data-testid={`picker-heatmap-weekday-${weekday}`}>
                            <td
                              className="pr-2 text-sm text-right"
                              style={{
                                fontFamily: "'Caveat', cursive",
                                color: "#9c8b6b",
                                minWidth: "32px",
                              }}
                            >
                              {weekdayLabels[weekday]}
                            </td>
                            {yearData.weeks.map((weekStartIso) => {
                              const iso = dayInColumn(weekStartIso, weekday);
                              if (!iso) return <td key={weekStartIso} className="p-0" />;
                              const disabled = isDayDisabled(iso);
                              const isSelected = selected === iso;
                              const intensity = generateIntensity(iso);
                              const isToday = iso === toISO(NOW.getFullYear(), NOW.getMonth() + 1, NOW.getDate());

                              return (
                                <td
                                  key={iso}
                                  data-testid={`picker-cell-${iso}`}
                                  data-date={iso}
                                  data-intensity={intensity}
                                  aria-disabled={disabled ? "true" : undefined}
                                  onClick={() => !disabled && handleSelect(iso)}
                                  className="p-0"
                                  style={{ cursor: disabled ? "not-allowed" : "pointer" }}
                                >
                                  <div
                                    style={{
                                      width: "12px",
                                      height: "12px",
                                      margin: "1px",
                                      borderRadius: "3px",
                                      border: isSelected
                                        ? "2px solid #d97706"
                                        : "1px solid rgba(75,75,75,0.2)",
                                      background: disabled
                                        ? "rgba(75,75,75,0.1)"
                                        : isToday
                                        ? "#fde68a"
                                        : intensityColors[intensity],
                                      boxShadow: isSelected
                                        ? "0 0 0 2px #d97706"
                                        : "none",
                                      opacity: disabled ? 0.4 : 1,
                                      position: "relative",
                                    }}
                                    title={`${iso}${disabled ? " (disabled)" : ""}`}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Month labels */}
                  <div className="flex justify-between mt-2 px-8 text-sm" style={{ color: "#9c8b6b", fontFamily: "'Caveat', cursive" }}>
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Value */}
              <span data-testid="picker-selected-value" hidden>
                {selected || ""}
              </span>

              {/* Submit */}
              <div className="mt-4 flex items-center gap-4">
                <button
                  data-testid="picker-submit"
                  disabled={!selected || !/^\d{4}-\d{2}-\d{2}$/.test(selected)}
                  onClick={handleSubmit}
                  className="px-5 py-2 rounded-md border-2 text-lg font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    borderColor: "#4b4b4b",
                    background: selected ? "#d97706" : "#fdf6e3",
                    color: selected ? "#fdf6e3" : "#4b4b4b",
                    fontFamily: "'Caveat', cursive",
                    filter: "url(#wobbly-border)",
                    boxShadow: "2px 3px 0 rgba(75,75,75,0.15)",
                  }}
                >
                  ✐ Submit Effective Date
                </button>
                {selected && (
                  <span style={{ fontFamily: "'Caveat', cursive", color: "#d97706", fontSize: "18px" }}>
                    Selected: {selected}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm" style={{ color: "#9c8b6b" }}>
                Format: YYYY-MM-DD
              </p>
            </div>
          </div>
        </div>

        {/* Supporting Content */}
        <section className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Contract Law", icon: "📜", desc: "Expert drafting and dispute resolution" },
            { title: "Corporate Formation", icon: "🏢", desc: "LLC, S-Corp, and partnership structures" },
            { title: "Employment Law", icon: "👔", desc: "Compliance, termination, and benefits" },
          ].map((area) => (
            <div
              key={area.title}
              className="p-4 rounded-md border-2"
              style={{
                borderColor: "#4b4b4b",
                filter: "url(#wobbly-border)",
                background: "#fdf6e3",
                boxShadow: "2px 3px 0 rgba(75,75,75,0.15)",
              }}
            >
              <div className="text-2xl mb-2">{area.icon}</div>
              <h4 className="text-lg font-bold" style={{ fontFamily: "'Caveat', cursive" }}>
                {area.title}
              </h4>
              <p className="text-sm" style={{ color: "#9c8b6b" }}>{area.desc}</p>
            </div>
          ))}
        </section>

        {/* Testimonial */}
        <blockquote
          className="mt-8 p-4 rounded-md border-l-4 italic"
          style={{
            borderColor: "#d97706",
            background: "rgba(253,230,138,0.3)",
            fontFamily: "'Caveat', cursive",
            fontSize: "19px",
            color: "#4b4b4b",
          }}
        >
          "EchoLaw guided our contract negotiation flawlessly. Their attention to detail
          saved us from a costly oversight." — <strong>M. Richardson, CEO</strong>
        </blockquote>
      </main>

      {/* Footer */}
      <footer
        className="w-full px-6 py-6 mt-8 border-t-2"
        style={{
          borderColor: "#4b4b4b",
          background: "#fdf6e3",
          filter: "url(#wobbly)",
        }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 text-sm" style={{ color: "#9c8b6b" }}>
          <div>
            <p className="font-bold text-base" style={{ color: "#2b2b2b", fontFamily: "'Caveat', cursive" }}>
              ⚖️ EchoLaw
            </p>
            <p>Bar Registration: CA #184729</p>
            <p>EchoBar Member ID: 0042-LLC</p>
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: "#2b2b2b", fontFamily: "'Caveat', cursive" }}>
              Offices
            </p>
            <p>123 Courthouse Lane, Sacramento, CA 95814</p>
            <p>456 Litigation Ave, New York, NY 10001</p>
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: "#2b2b2b", fontFamily: "'Caveat', cursive" }}>
              Legal
            </p>
            <p>Privacy Policy | ADA Notice</p>
            <p>Attorney Advertising Disclaimer</p>
            <p className="mt-1 text-xs">
              This website is attorney advertising. Prior results do not guarantee a similar outcome.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
