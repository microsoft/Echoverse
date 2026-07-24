import React, { useState, useEffect, useMemo, useCallback } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

type ActiveTask = {
  task_id: string;
  env_name: string;
  instruction_text: string;
  datepicker_type: string;
  category: string;
  widget_id: string;
  task_type: "single" | "compound";
  initial_visible_state: any;
  constraint_type: string;
  constraint_params?: any;
  suite: "ood";
};



const NOW = new Date("2025-09-01T09:00:00");

export default function Page_ood_benefits_enrollment(props: GeneratedPageProps): JSX.Element {
  const task = typeof window !== "undefined" ? window.__ACTIVE_TASK__ : undefined;

  const initialYear = task?.initial_visible_state?.visible_year ?? 2025;
  const initialDecadeStart = Math.floor(initialYear / 10) * 10;

  const [decadeStart, setDecadeStart] = useState<number>(initialDecadeStart);
  const [selected, setSelected] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (task?.initial_visible_state?.visible_year) {
      const yr = task.initial_visible_state.visible_year;
      setDecadeStart(Math.floor(yr / 10) * 10);
    }
  }, []);

  const isFYDisabled = useCallback(
    (fy: number): boolean => {
      if (!task) return false;
      const ct = task.constraint_type;
      if (ct === "none" || !ct) return false;

      if (ct === "max_n_days_from_today") {
        const maxDays = (task as any).constraint_params?.max_days ?? 365;
        const maxDate = new Date(NOW.getTime() + maxDays * 86400000);
        const fyStartDate = new Date(fy, 0, 1);
        if (fyStartDate > maxDate) return true;
        return false;
      }

      if (ct === "min_advance_notice") {
        const minHours = (task as any).constraint_params?.min_hours ?? 24;
        const minDate = new Date(NOW.getTime() + minHours * 3600000);
        const fyEndDate = new Date(fy, 11, 31);
        if (fyEndDate < minDate) return true;
        return false;
      }

      if (ct === "quarter_aligned") {
        return fy % 4 !== 0;
      }

      return false;
    },
    [task]
  );

  const handleSelect = useCallback(
    (fy: number) => {
      if (isFYDisabled(fy)) return;
      setSelected(`FY${fy}`);
    },
    [isFYDisabled]
  );

  const handleSubmit = useCallback(() => {
    // guard removed (strip-only)
props.onSubmit({
      type: "fiscal_year",
      value: selected,
      raw: {
        widget_id: "enrollment_window",
        picker: "fiscal_year_picker",
        state: { selected, decadeStart },
      },
    });
  }, [selected, decadeStart, props]);

  const constraintHint = useMemo(() => {
    if (!task || task.constraint_type === "none" || !task.constraint_type) return null;
    const ct = task.constraint_type;
    if (ct === "max_n_days_from_today") {
      return `Must be within ${(task as any).constraint_params?.max_days ?? "N"} days from today`;
    }
    if (ct === "min_advance_notice") {
      return `Requires ${(task as any).constraint_params?.min_hours ?? "N"} hours advance notice`;
    }
    return `Constraint: ${ct}`;
  }, [task]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#000000", color: "#ffffff", fontFamily: "'Inter', 'Helvetica Neue', system-ui, sans-serif" }}
    >
      {/* Header */}
      <header
        className="w-full border-b"
        style={{ borderColor: "#ffffff" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-xl font-light tracking-tight">🧾 EchoLedger</span>
            <nav className="hidden md:flex gap-6 text-sm" style={{ color: "#777777" }}>
              <a href="#" className="hover:text-white transition-colors">Home</a>
              <a href="#" className="hover:text-white transition-colors">Time Off</a>
              <a href="#" className="hover:text-white transition-colors">Payroll</a>
              <a href="#" className="hover:text-white transition-colors">Reports</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 flex items-center justify-center text-xs border"
              style={{ borderColor: "#ffffff" }}
            >
              JD
            </div>
          </div>
        </div>
      </header>

      {/* Hero / KPI area */}
      <section className="w-full max-w-6xl mx-auto px-6 py-10">
        <h1
          className="text-3xl font-light tracking-tight mb-8"
          style={{ letterSpacing: "-0.02em" }}
        >
          Benefits Enrollment
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="border-b pb-4" style={{ borderColor: "#ffffff" }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#777777" }}>PTO Balance</p>
            <p className="text-2xl font-light">14 days</p>
          </div>
          <div className="border-b pb-4" style={{ borderColor: "#ffffff" }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#777777" }}>Next Payday</p>
            <p className="text-2xl font-light">Sep 15, 2025</p>
          </div>
          <div className="border-b pb-4" style={{ borderColor: "#ffffff" }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#777777" }}>Enrollment Status</p>
            <p className="text-2xl font-light">Open</p>
          </div>
        </div>
      </section>

      {/* Instruction Banner */}
      {task?.instruction_text && (
        <section className="w-full max-w-6xl mx-auto px-6 pb-6">
          <div
            className="border px-5 py-4"
            style={{ borderColor: "#ffffff", backgroundColor: "#000000" }}
          >
            <p className="text-sm font-light" style={{ color: "#ffffff" }}>
              {task.instruction_text}
            </p>
          </div>
        </section>
      )}

      {/* Main content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Picker Card */}
          <div className="lg:col-span-2">
            <div
              data-widget-id="enrollment_window"
              data-testid="picker-root"
              className="border p-6"
              style={{ borderColor: "#ffffff" }}
            >
              <h2
                className="text-lg font-light tracking-tight mb-6"
                style={{ letterSpacing: "-0.02em" }}
              >
                Enrollment Window
              </h2>

              {constraintHint && (
                <p className="text-xs mb-4" style={{ color: "#777777" }}>
                  {constraintHint}
                </p>
              )}

              {/* Trigger */}
              <button
                data-testid="picker-trigger"
                onClick={() => setPanelOpen(!panelOpen)}
                className="w-full text-left border-b pb-2 mb-6 bg-transparent outline-none cursor-pointer"
                style={{
                  borderColor: "#ffffff",
                  color: selected ? "#ffffff" : "rgba(255,255,255,0.4)",
                  fontWeight: 300,
                  fontSize: "15px",
                }}
              >
                {selected ? selected : "Select fiscal year"}
              </button>

              {/* Panel */}
              {panelOpen && (
                <div
                  data-testid="picker-panel"
                  className="border p-5 mb-6"
                  style={{ borderColor: "#ffffff", backgroundColor: "#000000" }}
                >
                  {/* Navigation */}
                  <div className="flex items-center justify-between mb-5">
                    <button
                      data-testid="picker-nav-prev"
                      onClick={() => setDecadeStart((d: number) => d - 10)}
                      className="px-3 py-1 text-sm border bg-transparent cursor-pointer transition-colors"
                      style={{ borderColor: "#ffffff", color: "#ffffff" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#ffffff";
                        e.currentTarget.style.color = "#000000";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#ffffff";
                      }}
                    >
                      ←
                    </button>
                    <span
                      data-testid="picker-visible-decade"
                      className="text-sm font-light tracking-tight"
                    >
                      {decadeStart}–{decadeStart + 9}
                    </span>
                    <button
                      data-testid="picker-nav-next"
                      onClick={() => setDecadeStart((d: number) => d + 10)}
                      className="px-3 py-1 text-sm border bg-transparent cursor-pointer transition-colors"
                      style={{ borderColor: "#ffffff", color: "#ffffff" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#ffffff";
                        e.currentTarget.style.color = "#000000";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#ffffff";
                      }}
                    >
                      →
                    </button>
                  </div>

                  {/* FY Grid */}
                  <div data-testid="picker-fy-grid" className="grid grid-cols-5 gap-2">
                    {Array.from({ length: 10 }, (_: unknown, i: number) => decadeStart + i).map((y: number) => {
                      const disabled = isFYDisabled(y);
                      const isSelected = selected === `FY${y}`;
                      return (
                        <button
                          key={y}
                          data-testid={`picker-cell-FY${y}`}
                          data-fy={y}
                          disabled={disabled}
                          aria-disabled={disabled ? "true" : undefined}
                          onClick={() => {
                            if (!disabled) handleSelect(y);
                          }}
                          className="py-3 text-center text-sm font-light transition-colors cursor-pointer"
                          style={{
                            backgroundColor: isSelected ? "#ffffff" : "transparent",
                            color: isSelected
                              ? "#000000"
                              : disabled
                              ? "#333333"
                              : "#ffffff",
                            border: "none",
                            cursor: disabled ? "not-allowed" : "pointer",
                          }}
                          onMouseEnter={(e) => {
                            if (!disabled && !isSelected) {
                              e.currentTarget.style.backgroundColor = "#ffffff";
                              e.currentTarget.style.color = "#000000";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!disabled && !isSelected) {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.color = "#ffffff";
                            }
                          }}
                        >
                          FY{y}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Hidden selected value */}
              <span data-testid="picker-selected-value" hidden>
                {selected ?? ""}
              </span>

              {/* Submit */}
              <button
                data-testid="picker-submit"
                disabled={!selected}
                onClick={handleSubmit}
                className="w-full py-3 text-sm font-light tracking-wide border transition-colors"
                style={{
                  borderColor: !selected ? "#333333" : "#ffffff",
                  backgroundColor: !selected ? "transparent" : "#ffffff",
                  color: !selected ? "#333333" : "#000000",
                  cursor: !selected ? "not-allowed" : "pointer",
                }}
              >
                Submit
              </button>
            </div>
          </div>

          {/* Form Context Sidebar */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#777777" }}>
                Leave Type
              </label>
              <select
                className="w-full bg-transparent border-b pb-2 text-sm font-light outline-none"
                style={{ borderColor: "#ffffff", color: "#ffffff" }}
                defaultValue="pto"
              >
                <option value="pto" style={{ backgroundColor: "#000" }}>PTO</option>
                <option value="sick" style={{ backgroundColor: "#000" }}>Sick</option>
                <option value="bereavement" style={{ backgroundColor: "#000" }}>Bereavement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#777777" }}>
                Manager Approver
              </label>
              <div
                className="inline-block border px-3 py-1 text-xs font-light"
                style={{ borderColor: "#ffffff" }}
              >
                M. Chen
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#777777" }}>
                Hours Per Day
              </label>
              <input
                type="number"
                defaultValue={8}
                className="w-full bg-transparent border-b pb-2 text-sm font-light outline-none"
                style={{ borderColor: "#ffffff", color: "#ffffff" }}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#777777" }}>
                Coverage Notes
              </label>
              <textarea
                rows={3}
                placeholder="Add notes..."
                className="w-full bg-transparent border-b pb-2 text-sm font-light outline-none resize-none"
                style={{ borderColor: "#ffffff", color: "#ffffff" }}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#777777" }}>
                Payroll Cycle Reference
              </label>
              <p className="text-sm font-light" style={{ color: "#777777" }}>
                Bi-weekly · Period 18 of 26
              </p>
            </div>
          </div>
        </div>

        {/* Supporting Tables */}
        <section className="mt-16 space-y-10">
          <div>
            <h3 className="text-sm uppercase tracking-widest mb-4" style={{ color: "#777777" }}>
              Pending Requests
            </h3>
            <div className="border-t" style={{ borderColor: "#ffffff" }}>
              {[
                { type: "PTO", dates: "Aug 18–22, 2025", status: "Approved" },
                { type: "Sick", dates: "Jul 3, 2025", status: "Pending" },
              ].map((r, i) => (
                <div
                  key={i}
                  className="flex justify-between py-3 border-b text-sm font-light"
                  style={{ borderColor: "#333333" }}
                >
                  <span>{r.type}</span>
                  <span style={{ color: "#777777" }}>{r.dates}</span>
                  <span>{r.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-widest mb-4" style={{ color: "#777777" }}>
              Payroll History
            </h3>
            <div className="border-t" style={{ borderColor: "#ffffff" }}>
              {[
                { period: "Period 17", date: "Aug 29, 2025", amount: "$3,845.12" },
                { period: "Period 16", date: "Aug 15, 2025", amount: "$3,845.12" },
                { period: "Period 15", date: "Aug 1, 2025", amount: "$3,690.00" },
              ].map((r, i) => (
                <div
                  key={i}
                  className="flex justify-between py-3 border-b text-sm font-light"
                  style={{ borderColor: "#333333" }}
                >
                  <span>{r.period}</span>
                  <span style={{ color: "#777777" }}>{r.date}</span>
                  <span>{r.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="w-full border-t mt-auto"
        style={{ borderColor: "#ffffff" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-wrap gap-6 text-xs font-light" style={{ color: "#777777" }}>
            <a href="#" className="hover:text-white transition-colors">Privacy & Data Handling</a>
            <a href="#" className="hover:text-white transition-colors">Employee Handbook</a>
            <a href="#" className="hover:text-white transition-colors">Support Ticket</a>
            <span>Build v2.14.7</span>
          </div>
          <div className="flex gap-4 mt-3 text-xs" style={{ color: "#333333" }}>
            <span>SOC2</span>
            <span>ISO 27001</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
