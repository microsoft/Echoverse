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

declare global {
  interface Window {
    __ACTIVE_TASK__?: ActiveTask;
  }
}

const NOW = new Date("2025-09-01T09:00:00");
const NOW_YEAR = NOW.getFullYear();
const NOW_QUARTER = Math.ceil((NOW.getMonth() + 1) / 3);

export default function Page_ood_irrigation_cycle(props: GeneratedPageProps): JSX.Element {
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [visibleYear, setVisibleYear] = useState<number>(NOW_YEAR);
  const [selected, setSelected] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>(""); // compound-widget
  const isCompound = activeTask?.task_type === "compound";

  useEffect(() => {
    const task = window.__ACTIVE_TASK__ || null;
    setActiveTask(task);
    if (task?.initial_visible_state) {
      const vs = task.initial_visible_state;
      if (vs.visible_year) {
        setVisibleYear(vs.visible_year);
      }
    }
  }, []);

  const constraintType = activeTask?.constraint_type || "none";
  const constraintParams = activeTask?.constraint_params || {};

  const isQuarterDisabled = useCallback(
    (quarter: number, year: number): boolean => {
      if (constraintType === "none") return false;

      if (constraintType === "quarter_aligned") {
        const currentQ = NOW_QUARTER;
        const currentY = NOW_YEAR;
        if (year < currentY) return true;
        if (year === currentY && quarter < currentQ) return true;
        return false;
      }

      if (constraintType === "max_n_days_from_today") {
        const maxDays = constraintParams.max_days || 14;
        const quarterStartMonth = (quarter - 1) * 3;
        const quarterStart = new Date(year, quarterStartMonth, 1);
        const diffMs = quarterStart.getTime() - NOW.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays > maxDays) return true;
        const quarterEnd = new Date(year, quarterStartMonth + 3, 0);
        const diffEndMs = quarterEnd.getTime() - NOW.getTime();
        const diffEndDays = diffEndMs / (1000 * 60 * 60 * 24);
        if (diffEndDays < 0) return true;
        return false;
      }

      if (constraintType === "min_advance_notice") {
        const minHours = constraintParams.min_hours || 24;
        const quarterStartMonth = (quarter - 1) * 3;
        const quarterStart = new Date(year, quarterStartMonth, 1);
        const diffMs = quarterStart.getTime() - NOW.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours < minHours) {
          const quarterEnd = new Date(year, quarterStartMonth + 3, 0);
          const diffEndMs = quarterEnd.getTime() - NOW.getTime();
          if (diffEndMs < 0) return true;
        }
        return false;
      }

      return false;
    },
    [constraintType, constraintParams]
  );

  const handleQuarterSelect = useCallback(
    (quarter: number) => {
      if (isQuarterDisabled(quarter, visibleYear)) return;
      setSelected(`${visibleYear}-Q${quarter}`);
    },
    [visibleYear, isQuarterDisabled]
  );

  const handleSubmit = useCallback(() => {
    // guard removed (strip-only)
props.onSubmit({
      type: "quarter",
      value: isCompound && selectedTime ? `${selected}|${selectedTime}:00` : selected,
      raw: {
        widget_id: "irrigation_cycle",
        picker: "quarter_picker",
        state: { selected, visibleYear },
      },
    });
  }, [selected, visibleYear, props]);

  const quarterLabels: Record<number, string> = {
    1: "Q1 · Jan–Mar",
    2: "Q2 · Apr–Jun",
    3: "Q3 · Jul–Sep",
    4: "Q4 · Oct–Dec",
  };

  return (
    <div
      style={{
        backgroundColor: "#f5ecd9",
        color: "#1a1a1a",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        fontSize: "14px",
        lineHeight: "1.45",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "3px double #1a1a1a",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#f5ecd9",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>🌾</span>
          <span
            style={{
              fontVariant: "small-caps",
              fontSize: "22px",
              fontWeight: 700,
              letterSpacing: "0.06em",
            }}
          >
            EchoHarvest
          </span>
        </div>
        <nav style={{ display: "flex", gap: "24px", fontSize: "14px" }}>
          {["Crops", "Equipment", "Weather", "Dealer"].map((item) => (
            <span
              key={item}
              style={{
                fontVariant: "small-caps",
                letterSpacing: "0.04em",
                cursor: "pointer",
              }}
            >
              {item}
            </span>
          ))}
        </nav>
      </header>

      {/* Hero */}
      <section
        style={{
          padding: "32px",
          borderBottom: "3px double #1a1a1a",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontVariant: "small-caps",
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            marginBottom: "8px",
          }}
        >
          § Irrigation Cycle
        </h1>
        <p style={{ color: "#6b5d3c", fontSize: "14px" }}>
          Plan your season · Select the quarter for your irrigation schedule
        </p>
      </section>

      {/* Instruction Banner */}
      {activeTask?.instruction_text && (
        <div
          style={{
            margin: "24px 32px 0",
            padding: "12px 16px",
            border: "1px solid #1a1a1a",
            backgroundColor: "#fff8e1",
            fontStyle: "italic",
            fontSize: "14px",
          }}
        >
          <span style={{ color: "#7a1f1f", fontWeight: 700, marginRight: "8px" }}>
            †
          </span>
          {activeTask.instruction_text}
        </div>
      )}

      <main style={{ padding: "32px", maxWidth: "800px", margin: "0 auto" }}>
        {/* Form Context */}
        <section style={{ marginBottom: "24px" }}>
          <h2
            style={{
              fontVariant: "small-caps",
              fontSize: "16px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              marginBottom: "16px",
            }}
          >
            § 1. Field Information
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontVariant: "small-caps",
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                  marginBottom: "4px",
                  color: "#6b5d3c",
                }}
              >
                Crop Type
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #1a1a1a",
                  borderRadius: "0",
                  backgroundColor: "#f5ecd9",
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
              >
                <option>Winter Wheat</option>
                <option>Corn (Maize)</option>
                <option>Soybeans</option>
                <option>Alfalfa</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontVariant: "small-caps",
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                  marginBottom: "4px",
                  color: "#6b5d3c",
                }}
              >
                Field / Parcel
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #1a1a1a",
                  borderRadius: "0",
                  backgroundColor: "#f5ecd9",
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
              >
                <option>North 40 — Parcel A</option>
                <option>South Ridge — Parcel B</option>
                <option>Creek Bottom — Parcel C</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontVariant: "small-caps",
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                  marginBottom: "4px",
                  color: "#6b5d3c",
                }}
              >
                Acreage
              </label>
              <input
                type="number"
                defaultValue={160}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #1a1a1a",
                  borderRadius: "0",
                  backgroundColor: "#f5ecd9",
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontVariant: "small-caps",
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                  marginBottom: "4px",
                  color: "#6b5d3c",
                }}
              >
                Hardiness Zone
              </label>
              <input
                type="text"
                defaultValue="6b"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #1a1a1a",
                  borderRadius: "0",
                  backgroundColor: "#f5ecd9",
                  fontFamily: "inherit",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>
        </section>

        <div style={{ borderTop: "3px double #1a1a1a", marginBottom: "24px" }} />

        {/* Picker Card */}
        <section data-widget-id="irrigation_cycle" style={{ marginBottom: "24px" }}>
          <h2
            style={{
              fontVariant: "small-caps",
              fontSize: "16px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              marginBottom: "16px",
            }}
          >
            § 2. Irrigation Cycle
          </h2>

          <div data-testid="picker-root" style={{ position: "relative" }}>
            {/* Trigger */}
            <label
              style={{
                display: "block",
                fontVariant: "small-caps",
                fontSize: "11px",
                letterSpacing: "0.06em",
                marginBottom: "4px",
                color: "#6b5d3c",
              }}
            >
              Select Quarter
            </label>
            <button
              data-testid="picker-trigger"
              onClick={() => setPanelOpen(!panelOpen)}
              style={{
                display: "block",
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #1a1a1a",
                borderRadius: "0",
                backgroundColor: "#f5ecd9",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: "14px",
                textAlign: "left",
                cursor: "pointer",
                color: selected ? "#1a1a1a" : "#6b5d3c",
              }}
            >
              {selected || "YYYY-Qn"}
            </button>

            {/* Panel */}
            {panelOpen && (
              <div
                data-testid="picker-panel"
                style={{
                  marginTop: "8px",
                  border: "1px solid #1a1a1a",
                  backgroundColor: "#f5ecd9",
                  padding: "16px",
                  position: "relative",
                }}
              >
                {/* SVG noise filter for paper texture */}
                <svg
                  style={{ position: "absolute", width: 0, height: 0 }}
                  aria-hidden="true"
                >
                  <filter id="paperNoise">
                    <feTurbulence
                      type="fractalNoise"
                      baseFrequency="0.9"
                      numOctaves="4"
                      result="noise"
                    />
                    <feColorMatrix
                      type="saturate"
                      values="0"
                      in="noise"
                      result="grayNoise"
                    />
                    <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" />
                  </filter>
                </svg>

                {/* Navigation */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                    borderBottom: "3px double #1a1a1a",
                    paddingBottom: "10px",
                  }}
                >
                  <button
                    data-testid="picker-nav-prev"
                    onClick={() => setVisibleYear((y) => y - 1)}
                    style={{
                      border: "none",
                      background: "none",
                      fontFamily: "inherit",
                      fontSize: "18px",
                      cursor: "pointer",
                      padding: "4px 8px",
                      color: "#1a1a1a",
                    }}
                  >
                    ‹
                  </button>
                  <span
                    data-testid="picker-visible-year"
                    style={{
                      fontVariant: "small-caps",
                      fontSize: "18px",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {visibleYear}
                  </span>
                  <button
                    data-testid="picker-nav-next"
                    onClick={() => setVisibleYear((y) => y + 1)}
                    style={{
                      border: "none",
                      background: "none",
                      fontFamily: "inherit",
                      fontSize: "18px",
                      cursor: "pointer",
                      padding: "4px 8px",
                      color: "#1a1a1a",
                    }}
                  >
                    ›
                  </button>
                </div>

                {/* Quarter Grid */}
                <div
                  data-testid="picker-quarter-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0",
                  }}
                >
                  {[1, 2, 3, 4].map((q) => {
                    const disabled = isQuarterDisabled(q, visibleYear);
                    const isSelected = selected === `${visibleYear}-Q${q}`;
                    return (
                      <button
                        key={q}
                        data-testid={`picker-cell-Q${q}`}
                        data-quarter={q}
                        data-year={visibleYear}
                        disabled={disabled}
                        aria-disabled={disabled ? "true" : undefined}
                        onClick={() => {
                          if (!disabled) handleQuarterSelect(q);
                        }}
                        style={{
                          padding: "14px 8px",
                          border: "1px solid #1a1a1a",
                          borderRadius: "0",
                          backgroundColor: isSelected
                            ? "#fff8e1"
                            : "#f5ecd9",
                          fontFamily: "'Georgia', 'Times New Roman', serif",
                          fontSize: "13px",
                          cursor: disabled ? "default" : "pointer",
                          color: disabled ? "#6b5d3c" : "#1a1a1a",
                          textDecoration: disabled ? "line-through" : "none",
                          opacity: disabled ? 0.5 : 1,
                          fontWeight: isSelected ? 700 : 400,
                          outline: isSelected
                            ? "1.5px solid #1a1a1a"
                            : "none",
                          outlineOffset: "-3px",
                          position: "relative",
                        }}
                      >
                        <span style={{ display: "block", fontWeight: 700 }}>
                          Q{q}
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: "11px",
                            color: disabled ? "#6b5d3c" : "#6b5d3c",
                            marginTop: "2px",
                          }}
                        >
                          {q === 1
                            ? "Jan – Mar"
                            : q === 2
                            ? "Apr – Jun"
                            : q === 3
                            ? "Jul – Sep"
                            : "Oct – Dec"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Constraint hint */}
                {constraintType !== "none" && (
                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "11px",
                      color: "#7a1f1f",
                      fontStyle: "italic",
                    }}
                  >
                    ◆ Constraint: {constraintType.replace(/_/g, " ")}
                    {constraintParams.max_days &&
                      ` (max ${constraintParams.max_days} days)`}
                    {constraintParams.min_hours &&
                      ` (min ${constraintParams.min_hours}h advance)`}
                  </div>
                )}
              </div>
            )}

            {/* Hidden selected value */}
            <span data-testid="picker-selected-value" hidden>
              {selected}
            </span>

            {/* Submit */}
            <div style={{ marginTop: "16px" }}>
            {isCompound && (
              <div data-testid="compound-time-block" style={{ marginTop: "12px", padding: "10px 12px", border: "1px dashed #888", borderRadius: "4px", backgroundColor: "#fafafa" }}>
                <label htmlFor="picker-b-time" style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: "#444" }}>
                  Also pick a Time of Day (HH:MM)
                </label>
                <input
                  id="picker-b-time"
                  type="time"
                  data-testid="picker-b-time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  step={60}
                  style={{ padding: "6px 10px", fontSize: "14px", border: "1px solid #999", borderRadius: "3px" }}
                />
              </div>
            )}

              <button
                data-testid="picker-submit"
                disabled={!selected || (isCompound && !selectedTime)}
                onClick={handleSubmit}
                style={{
                  padding: "10px 24px",
                  border: "1px solid #1a1a1a",
                  borderRadius: "0",
                  backgroundColor: selected ? "#fff8e1" : "#f5ecd9",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontVariant: "small-caps",
                  fontSize: "14px",
                  letterSpacing: "0.06em",
                  cursor: selected ? "pointer" : "default",
                  opacity: selected ? 1 : 0.5,
                  color: "#1a1a1a",
                }}
              >
                Submit Selection
              </button>
              <span
                style={{
                  marginLeft: "12px",
                  fontSize: "11px",
                  color: "#6b5d3c",
                }}
              >
                Format: YYYY-Qn (e.g. 2025-Q3)
              </span>
            </div>
          </div>
        </section>

        <div style={{ borderTop: "3px double #1a1a1a", marginBottom: "24px" }} />

        {/* Supporting content */}
        <section style={{ marginBottom: "24px" }}>
          <h2
            style={{
              fontVariant: "small-caps",
              fontSize: "16px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              marginBottom: "16px",
            }}
          >
            § 3. Soil &amp; Weather Reference
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "12px",
            }}
          >
            {[
              { label: "Soil Moisture", value: "34%" },
              { label: "Avg. Rainfall (Q3)", value: '3.2"' },
              { label: "Evapotranspiration", value: "0.21 in/day" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  border: "1px solid #1a1a1a",
                  padding: "12px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontVariant: "small-caps",
                    fontSize: "11px",
                    color: "#6b5d3c",
                    letterSpacing: "0.04em",
                    marginBottom: "4px",
                  }}
                >
                  {item.label}
                </div>
                <div style={{ fontSize: "18px", fontWeight: 700 }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Equipment table */}
        <section style={{ marginBottom: "24px" }}>
          <h2
            style={{
              fontVariant: "small-caps",
              fontSize: "16px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              marginBottom: "12px",
            }}
          >
            § 4. Equipment Availability
          </h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "3px double #1a1a1a" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "6px 8px",
                    fontVariant: "small-caps",
                    fontSize: "11px",
                    letterSpacing: "0.04em",
                  }}
                >
                  Equipment
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "6px 8px",
                    fontVariant: "small-caps",
                    fontSize: "11px",
                    letterSpacing: "0.04em",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "6px 8px",
                    fontVariant: "small-caps",
                    fontSize: "11px",
                    letterSpacing: "0.04em",
                  }}
                >
                  Next Service
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Center Pivot #1", status: "Operational", service: "2025-Q4" },
                { name: "Drip Line (South)", status: "Needs Repair", service: "2025-Q3" },
                { name: "Flood Gates", status: "Operational", service: "2026-Q1" },
              ].map((row) => (
                <tr key={row.name} style={{ borderBottom: "1px solid #1a1a1a" }}>
                  <td style={{ padding: "6px 8px" }}>{row.name}</td>
                  <td
                    style={{
                      padding: "6px 8px",
                      color:
                        row.status === "Needs Repair" ? "#7a1f1f" : "#1a1a1a",
                    }}
                  >
                    {row.status}
                  </td>
                  <td style={{ padding: "6px 8px" }}>{row.service}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "3px double #1a1a1a",
          padding: "24px 32px",
          fontSize: "11px",
          color: "#6b5d3c",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: "8px" }}>
          <span style={{ marginRight: "16px" }}>USDA Partner</span>
          <span style={{ marginRight: "16px" }}>◆</span>
          <span style={{ marginRight: "16px" }}>Cooperative Extension</span>
          <span style={{ marginRight: "16px" }}>◆</span>
          <span style={{ marginRight: "16px" }}>Dealer Network</span>
          <span style={{ marginRight: "16px" }}>◆</span>
          <span>Sustainability</span>
        </div>
        <div style={{ fontVariant: "small-caps", letterSpacing: "0.04em" }}>
          © 2025 EchoHarvest · All rights reserved · Printed form ref. HP-IRR-2025
        </div>
      </footer>
    </div>
  );
}
