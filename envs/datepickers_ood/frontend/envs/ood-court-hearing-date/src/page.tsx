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

declare global {
  interface Window {
    __ACTIVE_TASK__?: ActiveTask;
  }
}

const PINNED_NOW = new Date("2025-09-01T09:00:00");
const PINNED_NOW_DATE = "2025-09-01";

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(base: Date, days: number): Date {
  const result = new Date(base.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(base: Date, months: number): Date {
  const result = new Date(base.getTime());
  result.setMonth(result.getMonth() + months);
  return result;
}

function addWeeks(base: Date, weeks: number): Date {
  return addDays(base, weeks * 7);
}

function getNextWeekday(base: Date, targetDay: number): Date {
  const current = base.getDay();
  let daysAhead = targetDay - current;
  if (daysAhead <= 0) daysAhead += 7;
  return addDays(base, daysAhead);
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateDiffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

interface Preset {
  label: string;
  iso: string;
}

function generateAllPresets(): Preset[] {
  return [
    { label: "Today", iso: toISO(PINNED_NOW) },
    { label: "Tomorrow", iso: toISO(addDays(PINNED_NOW, 1)) },
    { label: "In 2 Days", iso: toISO(addDays(PINNED_NOW, 2)) },
    { label: "In 3 Days", iso: toISO(addDays(PINNED_NOW, 3)) },
    { label: "In 5 Days", iso: toISO(addDays(PINNED_NOW, 5)) },
    { label: "In 1 Week", iso: toISO(addWeeks(PINNED_NOW, 1)) },
    { label: "Next Monday", iso: toISO(getNextWeekday(PINNED_NOW, 1)) },
    { label: "Next Wednesday", iso: toISO(getNextWeekday(PINNED_NOW, 3)) },
    { label: "Next Friday", iso: toISO(getNextWeekday(PINNED_NOW, 5)) },
    { label: "In 2 Weeks", iso: toISO(addWeeks(PINNED_NOW, 2)) },
    { label: "In 3 Weeks", iso: toISO(addWeeks(PINNED_NOW, 3)) },
    { label: "In 1 Month", iso: toISO(addMonths(PINNED_NOW, 1)) },
    { label: "In 2 Months", iso: toISO(addMonths(PINNED_NOW, 2)) },
    { label: "In 3 Months", iso: toISO(addMonths(PINNED_NOW, 3)) },
    { label: "In 6 Months", iso: toISO(addMonths(PINNED_NOW, 6)) },
    { label: "In 9 Months", iso: toISO(addMonths(PINNED_NOW, 9)) },
    { label: "In 1 Year", iso: toISO(addMonths(PINNED_NOW, 12)) },
    { label: "In 90 Days", iso: toISO(addDays(PINNED_NOW, 90)) },
  ];
}

const PRESETS_PER_PAGE = 6;

export default function Page_ood_court_hearing_date(props: GeneratedPageProps): JSX.Element {
  const [task, setTask] = useState<ActiveTask | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const active = (window as any).__ACTIVE_TASK__ || null;
    setTask(active);
  }, []);

  const constraintType = task?.constraint_type || "none";
  const constraintParams = task?.constraint_params || {};

  const isPresetDisabled = useCallback(
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
        const diff = dateDiffDays(PINNED_NOW, date);
        return diff < 0 || diff > maxDays;
      }
      if (constraintType === "min_advance_notice") {
        const minHours = constraintParams.min_hours || 48;
        const minMs = minHours * 60 * 60 * 1000;
        return date.getTime() < PINNED_NOW.getTime() + minMs;
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
        const diff = dateDiffDays(PINNED_NOW, date);
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

  const allPresets = useMemo(() => generateAllPresets(), []);

  const totalPages = Math.ceil(allPresets.length / PRESETS_PER_PAGE);

  const visiblePresets = useMemo(() => {
    const start = page * PRESETS_PER_PAGE;
    return allPresets.slice(start, start + PRESETS_PER_PAGE);
  }, [allPresets, page]);

  const handleSelect = useCallback(
    (iso: string) => {
      if (!isPresetDisabled(iso)) {
        setSelected(iso);
      }
    },
    [isPresetDisabled]
  );

  const handleSubmit = useCallback(() => {
    if (selected && /^\d{4}-\d{2}-\d{2}$/.test(selected)) {
      props.onSubmit({
        type: "date",
        value: selected,
        raw: {
          widget_id: "hearing_date",
          picker: "relative_date_picker",
          state: { selected, page },
        },
      });
    }
  }, [selected, page, props]);

  const handlePrev = useCallback(() => {
    setPage((p) => (p > 0 ? p - 1 : totalPages - 1));
  }, [totalPages]);

  const handleNext = useCallback(() => {
    setPage((p) => (p < totalPages - 1 ? p + 1 : 0));
  }, [totalPages]);

  const instructionText = task?.instruction_text || "Select the hearing date using the preset options below.";

  return (
    <div
      style={{ backgroundColor: "#000000", color: "#ffffff", minHeight: "100vh" }}
      className="flex flex-col font-light"
    >
      {/* Header */}
      <header
        style={{ borderBottom: "1px solid #ffffff" }}
        className="flex items-center justify-between px-8 py-5"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚖️</span>
          <span
            className="tracking-tight"
            style={{ fontSize: "20px", fontWeight: 200, letterSpacing: "-0.02em" }}
          >
            EchoLaw
          </span>
        </div>
        <nav className="flex items-center gap-8" style={{ fontSize: "14px", color: "#ffffff" }}>
          <a href="#" className="hover:opacity-70 transition-opacity">Practice Areas</a>
          <a href="#" className="hover:opacity-70 transition-opacity">Attorneys</a>
          <a href="#" className="hover:opacity-70 transition-opacity">Resources</a>
          <a href="#" className="hover:opacity-70 transition-opacity">Portal</a>
        </nav>
        <span style={{ fontSize: "13px", color: "#777777" }}>(212) 555-0147</span>
      </header>

      {/* Hero */}
      <section className="px-8 py-16" style={{ borderBottom: "1px solid #ffffff" }}>
        <h1
          style={{ fontSize: "36px", fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1.2 }}
          className="mb-4"
        >
          Court Hearing Date
        </h1>
        <p style={{ color: "#777777", fontSize: "15px", maxWidth: "600px", lineHeight: 1.6 }}>
          Schedule your court hearing with precision. Select a date from the available options
          to ensure proper filing and notification timelines are met.
        </p>
        <div className="flex gap-6 mt-8" style={{ fontSize: "12px", color: "#777777" }}>
          <span>○ EchoBar Certified</span>
          <span>□ 25+ Years Practice</span>
          <span>△ Multi-Jurisdiction</span>
        </div>
      </section>

      {/* Instruction Banner */}
      <div
        className="px-8 py-4"
        style={{ backgroundColor: "#000000", borderBottom: "1px solid #777777" }}
      >
        <p style={{ fontSize: "14px", color: "#ffffff", lineHeight: 1.5 }}>
          <span style={{ color: "#777777", marginRight: "8px" }}>INSTRUCTION →</span>
          {instructionText}
        </p>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-8 py-12">
        <div className="flex gap-16 flex-wrap">
          {/* Form Context */}
          <div className="flex flex-col gap-6" style={{ minWidth: "240px" }}>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: "11px", color: "#777777", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Case Type
              </label>
              <select
                style={{
                  backgroundColor: "#000000",
                  color: "#ffffff",
                  borderBottom: "1px solid #ffffff",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  padding: "8px 0",
                  fontSize: "14px",
                  borderRadius: 0,
                }}
              >
                <option>Civil Litigation</option>
                <option>Criminal Defense</option>
                <option>Family Law</option>
                <option>Corporate</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: "11px", color: "#777777", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Jurisdiction
              </label>
              <select
                style={{
                  backgroundColor: "#000000",
                  color: "#ffffff",
                  borderBottom: "1px solid #ffffff",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  padding: "8px 0",
                  fontSize: "14px",
                  borderRadius: 0,
                }}
              >
                <option>New York Supreme Court</option>
                <option>Federal District Court</option>
                <option>State Appellate Court</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: "11px", color: "#777777", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Attorney Assigned
              </label>
              <input
                type="text"
                placeholder="Enter attorney name"
                style={{
                  backgroundColor: "#000000",
                  color: "#ffffff",
                  borderBottom: "1px solid #ffffff",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  padding: "8px 0",
                  fontSize: "14px",
                  borderRadius: 0,
                  outline: "none",
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: "11px", color: "#777777", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Matter Number
              </label>
              <input
                type="text"
                placeholder="e.g., 2025-CV-00421"
                style={{
                  backgroundColor: "#000000",
                  color: "#ffffff",
                  borderBottom: "1px solid #ffffff",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  padding: "8px 0",
                  fontSize: "14px",
                  borderRadius: 0,
                  outline: "none",
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: "11px", color: "#777777", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Consultation Length
              </label>
              <select
                style={{
                  backgroundColor: "#000000",
                  color: "#ffffff",
                  borderBottom: "1px solid #ffffff",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  padding: "8px 0",
                  fontSize: "14px",
                  borderRadius: 0,
                }}
              >
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>2 hours</option>
              </select>
            </div>
          </div>

          {/* Picker Card */}
          <div
            data-testid="picker-root"
            data-widget-id="hearing_date"
            className="relative-picker flex-1"
            style={{ minWidth: "340px", maxWidth: "480px" }}
          >
            <div className="mb-6">
              <h2
                style={{ fontSize: "18px", fontWeight: 200, letterSpacing: "-0.02em" }}
                className="mb-2"
              >
                Hearing Date
              </h2>
              <p style={{ fontSize: "12px", color: "#777777" }}>
                Select a relative date for the hearing
              </p>
            </div>

            {/* Trigger */}
            <button
              data-testid="picker-trigger"
              onClick={() => setPanelOpen(!panelOpen)}
              style={{
                backgroundColor: "#000000",
                color: selected ? "#ffffff" : "#777777",
                borderBottom: "1px solid #ffffff",
                borderTop: "none",
                borderLeft: "none",
                borderRight: "none",
                padding: "12px 0",
                fontSize: "14px",
                fontWeight: 300,
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                borderRadius: 0,
              }}
            >
              {selected
                ? allPresets.find((p) => p.iso === selected)?.label || selected
                : "Select date"}
            </button>

            {/* Panel */}
            {panelOpen && (
              <div
                data-testid="picker-panel"
                style={{
                  border: "1px solid #ffffff",
                  backgroundColor: "#000000",
                  marginTop: "16px",
                  padding: "24px",
                }}
              >
                {/* Constraint hint */}
                {constraintType !== "none" && (
                  <p style={{ fontSize: "11px", color: "#777777", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Constraint: {constraintType.replace(/_/g, " ")}
                    {constraintParams && Object.keys(constraintParams).length > 0 && (
                      <span> — {JSON.stringify(constraintParams)}</span>
                    )}
                  </p>
                )}

                {/* Preset buttons */}
                <div className="flex flex-col gap-3 mb-6">
                  {visiblePresets.map((preset) => {
                    const disabled = isPresetDisabled(preset.iso);
                    const isSelected = selected === preset.iso;
                    return (
                      <button
                        key={preset.iso}
                        data-testid={`picker-cell-${preset.iso}`}
                        data-preset={preset.label}
                        data-iso={preset.iso}
                        disabled={disabled}
                        aria-disabled={disabled ? "true" : undefined}
                        onClick={() => {
                          if (!disabled) handleSelect(preset.iso);
                        }}
                        style={{
                          backgroundColor: isSelected ? "#ffffff" : disabled ? "#000000" : "#000000",
                          color: isSelected ? "#000000" : disabled ? "#333333" : "#ffffff",
                          border: isSelected
                            ? "1px solid #ffffff"
                            : disabled
                            ? "1px solid #333333"
                            : "1px solid #ffffff",
                          padding: "10px 16px",
                          fontSize: "14px",
                          fontWeight: isSelected ? 400 : 300,
                          cursor: disabled ? "not-allowed" : "pointer",
                          textAlign: "left",
                          borderRadius: 0,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "background-color 0.15s, color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (!disabled && !isSelected) {
                            (e.currentTarget as HTMLElement).style.backgroundColor = "#ffffff";
                            (e.currentTarget as HTMLElement).style.color = "#000000";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!disabled && !isSelected) {
                            (e.currentTarget as HTMLElement).style.backgroundColor = "#000000";
                            (e.currentTarget as HTMLElement).style.color = "#ffffff";
                          }
                        }}
                      >
                        <span>{preset.label}</span>
                        <span style={{ fontSize: "12px", opacity: disabled ? 0.3 : 0.6 }}>
                          {preset.iso}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    data-testid="picker-nav-prev"
                    onClick={handlePrev}
                    style={{
                      backgroundColor: "#000000",
                      color: "#ffffff",
                      border: "1px solid #ffffff",
                      padding: "6px 14px",
                      fontSize: "16px",
                      cursor: "pointer",
                      borderRadius: 0,
                      transition: "background-color 0.15s, color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#ffffff";
                      (e.currentTarget as HTMLElement).style.color = "#000000";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#000000";
                      (e.currentTarget as HTMLElement).style.color = "#ffffff";
                    }}
                  >
                    ←
                  </button>
                  <span style={{ fontSize: "12px", color: "#777777" }}>
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    data-testid="picker-nav-next"
                    onClick={handleNext}
                    style={{
                      backgroundColor: "#000000",
                      color: "#ffffff",
                      border: "1px solid #ffffff",
                      padding: "6px 14px",
                      fontSize: "16px",
                      cursor: "pointer",
                      borderRadius: 0,
                      transition: "background-color 0.15s, color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#ffffff";
                      (e.currentTarget as HTMLElement).style.color = "#000000";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#000000";
                      (e.currentTarget as HTMLElement).style.color = "#ffffff";
                    }}
                  >
                    →
                  </button>
                </div>
              </div>
            )}

            {/* Hidden selected value */}
            <span data-testid="picker-selected-value" hidden>
              {selected || ""}
            </span>

            {/* Submit */}
            <button
              data-testid="picker-submit"
              disabled={!selected}
              onClick={handleSubmit}
              style={{
                marginTop: "20px",
                width: "100%",
                padding: "14px",
                fontSize: "14px",
                fontWeight: 300,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                backgroundColor: selected ? "#ffffff" : "#333333",
                color: selected ? "#000000" : "#777777",
                border: selected ? "1px solid #ffffff" : "1px solid #333333",
                cursor: selected ? "pointer" : "not-allowed",
                borderRadius: 0,
                transition: "background-color 0.15s, color 0.15s",
              }}
            >
              Submit
            </button>

            {/* Answer format hint */}
            <p style={{ fontSize: "11px", color: "#777777", marginTop: "12px" }}>
              Format: YYYY-MM-DD
            </p>
          </div>
        </div>
      </main>

      {/* Supporting Content */}
      <section className="px-8 py-12" style={{ borderTop: "1px solid #ffffff" }}>
        <h3
          style={{ fontSize: "16px", fontWeight: 200, letterSpacing: "-0.02em", marginBottom: "24px" }}
        >
          Practice Areas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Civil Litigation", desc: "Complex commercial disputes and breach of contract matters." },
            { title: "Criminal Defense", desc: "Federal and state criminal defense representation." },
            { title: "Corporate Law", desc: "Mergers, acquisitions, and corporate governance advisory." },
          ].map((area) => (
            <div key={area.title} style={{ borderBottom: "1px solid #777777", paddingBottom: "16px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 400, marginBottom: "8px" }}>{area.title}</h4>
              <p style={{ fontSize: "13px", color: "#777777", lineHeight: 1.5 }}>{area.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-8 py-8"
        style={{ borderTop: "1px solid #ffffff", fontSize: "11px", color: "#777777" }}
      >
        <div className="flex flex-wrap gap-8 mb-6">
          <span>© 2025 EchoLaw LLP</span>
          <a href="#" style={{ color: "#777777" }}>Privacy Policy</a>
          <a href="#" style={{ color: "#777777" }}>ADA Notice</a>
          <a href="#" style={{ color: "#777777" }}>Terms of Service</a>
        </div>
        <p style={{ lineHeight: 1.6 }}>
          Bar Registration: NY #4521987 | CA #312456 | DC #78432.
          Attorney Advertising. Prior results do not guarantee a similar outcome.
          This website is not intended to create an attorney-client relationship.
        </p>
        <p style={{ marginTop: "8px" }}>
          Offices: 450 Park Avenue, New York, NY 10022 | 1900 K Street NW, Washington, DC 20006
        </p>
      </footer>
    </div>
  );
}
