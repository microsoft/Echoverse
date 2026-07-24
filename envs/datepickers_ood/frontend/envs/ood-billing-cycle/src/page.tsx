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

export default function Page_ood_billing_cycle(props: GeneratedPageProps): JSX.Element {
  const [task, setTask] = useState<ActiveTask | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [decadeStart, setDecadeStart] = useState<number>(2020);

  useEffect(() => {
    const activeTask = window.__ACTIVE_TASK__ || null;
    setTask(activeTask);
    if (activeTask?.initial_visible_state) {
      const visYear = activeTask.initial_visible_state.visible_year;
      if (visYear) {
        const start = Math.floor(visYear / 10) * 10;
        setDecadeStart(start);
      }
    }
  }, []);

  const constraintType = task?.constraint_type || "none";
  const constraintParams = task?.constraint_params || {};

  const isFYDisabled = useCallback(
    (fy: number): boolean => {
      if (constraintType === "none") return false;

      const nowYear = NOW.getFullYear();
      const nowMonth = NOW.getMonth();
      const nowDay = NOW.getDate();

      if (constraintType === "max_n_days_from_today") {
        const maxDays = constraintParams.max_days || 365;
        const maxDate = new Date(NOW.getTime() + maxDays * 24 * 60 * 60 * 1000);
        const fyStartDate = new Date(fy, 0, 1);
        const fyEndDate = new Date(fy, 11, 31);
        if (fyStartDate.getTime() > maxDate.getTime()) return true;
        if (fyEndDate.getTime() < NOW.getTime()) return true;
        return false;
      }

      if (constraintType === "min_advance_notice") {
        const minHours = constraintParams.min_hours || 24;
        const minDate = new Date(NOW.getTime() + minHours * 60 * 60 * 1000);
        const fyStartDate = new Date(fy, 0, 1);
        if (fyStartDate.getTime() < minDate.getTime() && new Date(fy, 11, 31).getTime() < minDate.getTime()) {
          return true;
        }
        return false;
      }

      if (constraintType === "quarter_aligned") {
        return false;
      }

      return false;
    },
    [constraintType, constraintParams]
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
        widget_id: "billing_cycle",
        picker: "fiscal_year_picker",
        state: { selected, decadeStart },
      },
    });
  }, [selected, decadeStart, props]);

  const decades = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => decadeStart + i);
  }, [decadeStart]);

  const instructionText = task?.instruction_text || "Select the billing cycle fiscal year.";

  return (
    <div style={{ background: "#ffffff", color: "#000000", minHeight: "100vh", fontFamily: "system-ui, 'Helvetica', Arial, sans-serif" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "4px solid #000",
          background: "#ffffff",
          padding: "0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "32px" }}>💡</span>
            <span
              style={{
                fontFamily: "'Times New Roman', serif",
                fontSize: "32px",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                lineHeight: "1.1",
                textTransform: "uppercase",
              }}
            >
              EchoEnergy
            </span>
          </div>
          <nav style={{ display: "flex", gap: "0" }}>
            {["Billing", "Usage", "Outages", "Service"].map((item) => (
              <span
                key={item}
                style={{
                  padding: "8px 16px",
                  border: "4px solid #000",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  fontSize: "14px",
                  letterSpacing: "-0.02em",
                  cursor: "pointer",
                  background: item === "Billing" ? "#ffff00" : "#ffffff",
                  marginLeft: "-4px",
                }}
              >
                {item}
              </span>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                border: "4px solid #000",
                padding: "4px 12px",
                fontWeight: 700,
                fontSize: "12px",
                textTransform: "uppercase",
                background: "#f0f0f0",
              }}
            >
              ACCT #4420-8891
            </span>
            <button
              style={{
                border: "4px solid #000",
                padding: "8px 16px",
                background: "#ff0000",
                color: "#ffffff",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "12px",
                cursor: "pointer",
                borderRadius: "0",
              }}
            >
              LOG OUT
            </button>
          </div>
        </div>
      </header>

      {/* Hero / Status Banner */}
      <section
        style={{
          borderBottom: "4px solid #000",
          padding: "24px",
          background: "#ffff00",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <span
            style={{
              width: "16px",
              height: "16px",
              background: "#00cc00",
              border: "3px solid #000",
              display: "inline-block",
            }}
          ></span>
          <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "14px" }}>
            ALL SYSTEMS OPERATIONAL — NO OUTAGES IN YOUR AREA
          </span>
        </div>
        <h1
          style={{
            fontFamily: "'Times New Roman', serif",
            fontSize: "48px",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            lineHeight: "1.1",
            textTransform: "uppercase",
            margin: "0",
          }}
        >
          Schedule a Service Appointment
        </h1>
      </section>

      {/* Instruction Banner */}
      <div
        style={{
          background: "#0000ff",
          color: "#ffffff",
          padding: "16px 24px",
          borderBottom: "4px solid #000",
          fontWeight: 700,
          fontSize: "16px",
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
        }}
      >
        ■ TASK: {instructionText}
      </div>

      {/* Main Content */}
      <main style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
        {/* Left: Form Context */}
        <div style={{ borderRight: "4px solid #000", padding: "24px" }}>
          <h2
            style={{
              fontFamily: "'Times New Roman', serif",
              fontSize: "24px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              lineHeight: "1.1",
              marginBottom: "24px",
              marginTop: "0",
            }}
          >
            Service Details
          </h2>

          {/* Service Type */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "12px",
                marginBottom: "8px",
              }}
            >
              SERVICE TYPE
            </label>
            <select
              style={{
                width: "100%",
                border: "4px solid #000",
                padding: "12px",
                fontSize: "16px",
                fontWeight: 700,
                background: "#ffffff",
                borderRadius: "0",
                appearance: "none",
              }}
            >
              <option>Installation</option>
              <option>Repair</option>
              <option>Meter Read</option>
            </select>
          </div>

          {/* Service Address */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "12px",
                marginBottom: "8px",
              }}
            >
              SERVICE ADDRESS
            </label>
            <input
              type="text"
              placeholder="123 MAIN ST, APT 4B"
              style={{
                width: "100%",
                border: "4px solid #000",
                padding: "12px",
                fontSize: "16px",
                fontWeight: 700,
                borderRadius: "0",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Technician Access Window */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "12px",
                marginBottom: "8px",
              }}
            >
              TECHNICIAN ACCESS WINDOW
            </label>
            <div style={{ display: "flex", gap: "0" }}>
              {["Morning", "Afternoon", "Evening"].map((slot) => (
                <label
                  key={slot}
                  style={{
                    border: "4px solid #000",
                    padding: "12px 16px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    fontSize: "12px",
                    cursor: "pointer",
                    background: "#ffffff",
                    marginLeft: slot !== "Morning" ? "-4px" : "0",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <input type="radio" name="access_window" style={{ accentColor: "#000" }} />
                  {slot}
                </label>
              ))}
            </div>
          </div>

          {/* Account Number */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "12px",
                marginBottom: "8px",
              }}
            >
              ACCOUNT NUMBER
            </label>
            <input
              type="text"
              placeholder="XXXX-XXXX"
              style={{
                width: "100%",
                border: "4px solid #000",
                padding: "12px",
                fontSize: "16px",
                fontWeight: 700,
                borderRadius: "0",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Current Bill Summary */}
          <div
            style={{
              border: "4px solid #000",
              boxShadow: "6px 6px 0 0 #000",
              padding: "16px",
              marginTop: "24px",
              background: "#f0f0f0",
            }}
          >
            <h3
              style={{
                fontWeight: 900,
                textTransform: "uppercase",
                fontSize: "14px",
                marginTop: "0",
                marginBottom: "12px",
              }}
            >
              CURRENT BILL SUMMARY
            </h3>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontWeight: 700, fontSize: "14px" }}>ELECTRICITY</span>
              <span style={{ fontWeight: 900, fontSize: "14px" }}>$142.30</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontWeight: 700, fontSize: "14px" }}>GAS</span>
              <span style={{ fontWeight: 900, fontSize: "14px" }}>$67.85</span>
            </div>
            <div
              style={{
                borderTop: "4px solid #000",
                paddingTop: "8px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontWeight: 900, fontSize: "16px", textTransform: "uppercase" }}>TOTAL DUE</span>
              <span style={{ fontWeight: 900, fontSize: "16px" }}>$210.15</span>
            </div>
          </div>
        </div>

        {/* Right: Picker Card */}
        <div style={{ padding: "24px" }}>
          <div
            data-widget-id="billing_cycle"
            data-testid="picker-root"
            style={{
              border: "4px solid #000",
              boxShadow: "6px 6px 0 0 #000",
              background: "#ffffff",
              padding: "24px",
            }}
          >
            <h2
              style={{
                fontFamily: "'Times New Roman', serif",
                fontSize: "24px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                lineHeight: "1.1",
                marginTop: "0",
                marginBottom: "16px",
              }}
            >
              Billing Cycle
            </h2>

            {/* Trigger */}
            <button
              data-testid="picker-trigger"
              onClick={() => setPanelOpen(!panelOpen)}
              style={{
                width: "100%",
                border: "4px solid #000",
                padding: "16px",
                fontSize: "16px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                background: selected ? "#ffff00" : "#ffffff",
                cursor: "pointer",
                borderRadius: "0",
                textAlign: "left",
                boxShadow: "4px 4px 0 0 #000",
              }}
            >
              {selected ? selected : "PICK FISCAL YEAR →"}
            </button>

            {/* Panel */}
            {panelOpen && (
              <div
                data-testid="picker-panel"
                style={{
                  border: "4px solid #000",
                  marginTop: "16px",
                  background: "#ffffff",
                }}
              >
                {/* Navigation */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "4px solid #000",
                    padding: "0",
                  }}
                >
                  <button
                    data-testid="picker-nav-prev"
                    onClick={() => setDecadeStart((d) => d - 10)}
                    style={{
                      border: "none",
                      borderRight: "4px solid #000",
                      padding: "16px 20px",
                      fontSize: "20px",
                      fontWeight: 900,
                      background: "#ffffff",
                      cursor: "pointer",
                      borderRadius: "0",
                    }}
                  >
                    {"<<"}
                  </button>
                  <span
                    data-testid="picker-visible-decade"
                    style={{
                      fontWeight: 900,
                      fontSize: "18px",
                      textTransform: "uppercase",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {decadeStart}–{decadeStart + 9}
                  </span>
                  <button
                    data-testid="picker-nav-next"
                    onClick={() => setDecadeStart((d) => d + 10)}
                    style={{
                      border: "none",
                      borderLeft: "4px solid #000",
                      padding: "16px 20px",
                      fontSize: "20px",
                      fontWeight: 900,
                      background: "#ffffff",
                      cursor: "pointer",
                      borderRadius: "0",
                    }}
                  >
                    {">>"}
                  </button>
                </div>

                {/* FY Grid */}
                <div
                  data-testid="picker-fy-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                  }}
                >
                  {decades.map((y, idx) => {
                    const disabled = isFYDisabled(y);
                    const isSelected = selected === `FY${y}`;
                    const bgColor = isSelected
                      ? "#ff0000"
                      : disabled
                      ? "#f0f0f0"
                      : "#ffffff";
                    const textColor = isSelected
                      ? "#ffffff"
                      : disabled
                      ? "#999999"
                      : "#000000";

                    return (
                      <button
                        key={y}
                        data-testid={`picker-cell-FY${y}`}
                        data-fy={y}
                        disabled={disabled}
                        aria-disabled={disabled ? "true" : undefined}
                        onClick={() => handleSelect(y)}
                        style={{
                          border: "2px solid #000",
                          padding: "16px 8px",
                          fontSize: "14px",
                          fontWeight: 900,
                          textTransform: "uppercase",
                          background: bgColor,
                          color: textColor,
                          cursor: disabled ? "not-allowed" : "pointer",
                          borderRadius: "0",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        FY{y}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Value (hidden) */}
            <span data-testid="picker-selected-value" hidden>
              {selected || ""}
            </span>

            {/* Constraint hint */}
            {constraintType !== "none" && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "8px 12px",
                  border: "2px solid #000",
                  background: "#f0f0f0",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                CONSTRAINT: {constraintType.replace(/_/g, " ")}
                {constraintParams.max_days && ` (MAX ${constraintParams.max_days} DAYS)`}
                {constraintParams.min_hours && ` (MIN ${constraintParams.min_hours}H NOTICE)`}
              </div>
            )}

            {/* Submit */}
            <button
              data-testid="picker-submit"
              disabled={!selected}
              onClick={handleSubmit}
              style={{
                width: "100%",
                marginTop: "16px",
                border: "4px solid #000",
                padding: "16px",
                fontSize: "18px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                background: selected ? "#ff0000" : "#f0f0f0",
                color: selected ? "#ffffff" : "#999999",
                cursor: selected ? "pointer" : "not-allowed",
                borderRadius: "0",
                boxShadow: selected ? "6px 6px 0 0 #000" : "none",
              }}
            >
              SUBMIT
            </button>

            {/* Helper text */}
            <div
              style={{
                marginTop: "12px",
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#666",
              }}
            >
              FORMAT: FY followed by 4-digit year (e.g. FY2026)
            </div>
          </div>

          {/* Supporting: Energy Tips */}
          <div
            style={{
              border: "4px solid #000",
              marginTop: "24px",
              padding: "16px",
              background: "#ffff00",
              boxShadow: "6px 6px 0 0 #000",
            }}
          >
            <h3
              style={{
                fontWeight: 900,
                textTransform: "uppercase",
                fontSize: "14px",
                marginTop: "0",
                marginBottom: "12px",
              }}
            >
              ★ ENERGY-SAVING TIPS
            </h3>
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "13px", fontWeight: 700 }}>
              <li style={{ marginBottom: "6px" }}>■ SET THERMOSTAT TO 68°F IN WINTER</li>
              <li style={{ marginBottom: "6px" }}>■ UNPLUG DEVICES WHEN NOT IN USE</li>
              <li style={{ marginBottom: "6px" }}>■ USE LED BULBS — SAVE UP TO 75%</li>
              <li style={{ marginBottom: "6px" }}>■ RUN DISHWASHER ONLY WHEN FULL</li>
            </ul>
          </div>

          {/* Outage Map Tile */}
          <div
            style={{
              border: "4px solid #000",
              marginTop: "24px",
              padding: "16px",
              background: "#f0f0f0",
              boxShadow: "6px 6px 0 0 #0000ff",
            }}
          >
            <h3
              style={{
                fontWeight: 900,
                textTransform: "uppercase",
                fontSize: "14px",
                marginTop: "0",
                marginBottom: "12px",
              }}
            >
              OUTAGE MAP
            </h3>
            <div
              style={{
                width: "100%",
                height: "80px",
                border: "2px solid #000",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "12px",
                textTransform: "uppercase",
                color: "#666",
              }}
            >
              [MAP PLACEHOLDER — NO OUTAGES DETECTED]
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "4px solid #000",
          background: "#000000",
          color: "#ffffff",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "24px",
          }}
        >
          <div>
            <div style={{ fontWeight: 900, textTransform: "uppercase", fontSize: "14px", marginBottom: "8px" }}>
              EchoEnergy
            </div>
            <div style={{ fontSize: "12px", color: "#999" }}>
              © 2025 EchoEnergy. All rights reserved. Service Area: Metro Region.
            </div>
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {["PUC Commission", "Accessibility", "Español", "Billing Disputes", "Privacy"].map((link) => (
              <span
                key={link}
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#ffffff",
                  borderBottom: "2px solid #ff0000",
                  cursor: "pointer",
                  paddingBottom: "2px",
                }}
              >
                {link}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
