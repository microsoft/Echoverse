import React, { useState, useEffect, useMemo, useCallback } from "react";

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

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const NOW = new Date("2025-09-01T09:00:00");

function getISOWeeksInYear(year: number): number {
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  const jan1Day = jan1.getDay() || 7;
  const dec31Day = dec31.getDay() || 7;
  if (jan1Day === 4 || dec31Day === 4) return 53;
  return 52;
}

function getMondayOfISOWeek(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setDate(jan4.getDate() - (jan4Day - 1));
  const result = new Date(mondayOfWeek1);
  result.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);
  return result;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isWeekDisabled(
  year: number,
  week: number,
  constraintType: string,
  constraintParams: any
): boolean {
  if (!constraintType || constraintType === "none") return false;

  const monday = getMondayOfISOWeek(year, week);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  if (constraintType === "blackout_windows" && constraintParams?.blackout_windows) {
    for (const window of constraintParams.blackout_windows) {
      const start = new Date(window[0] + "T00:00:00");
      const end = new Date(window[1] + "T23:59:59");
      if (monday <= end && sunday >= start) return true;
    }
    return false;
  }

  if (constraintType === "fortnightly") {
    return week % 2 !== 1;
  }

  if (constraintType === "quarter_aligned") {
    const quarterStartWeeks = [1, 14, 27, 40];
    return !quarterStartWeeks.some((qw) => week >= qw && week < qw + 13);
  }

  if (constraintType === "max_n_days_from_today" && constraintParams?.max_days) {
    const maxDate = new Date(NOW);
    maxDate.setDate(maxDate.getDate() + constraintParams.max_days);
    return monday > maxDate || sunday < NOW;
  }

  if (constraintType === "min_advance_notice" && constraintParams?.min_hours) {
    const minDate = new Date(NOW);
    minDate.setTime(minDate.getTime() + constraintParams.min_hours * 60 * 60 * 1000);
    return monday < minDate;
  }

  if (constraintType === "weekday_only") {
    return false;
  }

  if (constraintType === "weekend_only") {
    return false;
  }

  if (constraintType === "business_days") {
    return false;
  }

  return false;
}

export default function Page_ood_driver_license_renewal(props: GeneratedPageProps): JSX.Element {
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [visibleYear, setVisibleYear] = useState(2025);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const task = (window as any).__ACTIVE_TASK__ as ActiveTask | undefined;
    if (task) {
      setActiveTask(task);
      if (task.initial_visible_state?.visible_year) {
        setVisibleYear(task.initial_visible_state.visible_year);
      }
    }
  }, []);

  const totalWeeks = useMemo(() => getISOWeeksInYear(visibleYear), [visibleYear]);

  const weeks = useMemo(() => {
    const result: Array<{
      week: number;
      label: string;
      mondayStr: string;
      sundayStr: string;
      disabled: boolean;
      testId: string;
      value: string;
    }> = [];
    for (let w = 1; w <= totalWeeks; w++) {
      const ww = String(w).padStart(2, "0");
      const monday = getMondayOfISOWeek(visibleYear, w);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const mondayStr = formatDate(monday);
      const sundayStr = formatDate(sunday);
      const disabled = isWeekDisabled(
        visibleYear,
        w,
        activeTask?.constraint_type || "none",
        activeTask?.constraint_params || {}
      );
      result.push({
        week: w,
        label: `W${ww} — ${mondayStr} – ${sundayStr}`,
        mondayStr,
        sundayStr,
        disabled,
        testId: `picker-cell-${visibleYear}-W${ww}`,
        value: `${visibleYear}-W${ww}`,
      });
    }
    return result;
  }, [visibleYear, totalWeeks, activeTask]);

  const handleSelect = useCallback((value: string, disabled: boolean) => {
    if (disabled) return;
    setSelected(value);
  }, []);

  const handleSubmit = useCallback(() => {
    // guard removed (strip-only)
props.onSubmit({
      type: "iso_week",
      value: selected,
      raw: { widget_id: "renewal_window", picker: "week_picker", state: { selected, visibleYear } },
    });
  }, [selected, visibleYear, props]);

  return (
    <div style={{ background: "#ffffff", color: "#000000", minHeight: "100vh", fontFamily: "system-ui, 'Helvetica', Arial, sans-serif" }}>
      {/* Utility Bar */}
      <div style={{ background: "#000000", color: "#ffffff", padding: "8px 24px", fontSize: "12px", display: "flex", justifyContent: "flex-end", gap: "16px" }}>
        <a href="#" style={{ color: "#ffffff", textDecoration: "underline" }}>Español</a>
        <a href="#" style={{ color: "#ffffff", textDecoration: "underline" }}>Accessibility</a>
        <a href="#" style={{ color: "#ffffff", textDecoration: "underline" }}>Contact</a>
      </div>

      {/* Header */}
      <header style={{ border: "0 0 4px 0", borderBottom: "4px solid #000000", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "36px" }}>🏛️</span>
          <span style={{ fontFamily: "'Times New Roman', serif", fontWeight: 900, fontSize: "32px", letterSpacing: "-0.02em", lineHeight: "1.1", textTransform: "uppercase" }}>EchoGov</span>
        </div>
        <nav style={{ display: "flex", gap: "24px", fontWeight: 700, textTransform: "uppercase", fontSize: "14px", letterSpacing: "0.05em" }}>
          <a href="#" style={{ color: "#000000", textDecoration: "none", borderBottom: "2px solid #000" }}>Services</a>
          <a href="#" style={{ color: "#000000", textDecoration: "none" }}>Forms</a>
          <a href="#" style={{ color: "#000000", textDecoration: "none" }}>Appointments</a>
          <a href="#" style={{ color: "#000000", textDecoration: "none" }}>Help</a>
        </nav>
      </header>

      {/* Hero */}
      <section style={{ background: "#ffff00", border: "4px solid #000000", margin: "24px", padding: "32px 24px" }}>
        <h1 style={{ fontFamily: "'Times New Roman', serif", fontWeight: 900, fontSize: "48px", letterSpacing: "-0.02em", lineHeight: "1.1", textTransform: "uppercase", margin: "0 0 12px 0" }}>
          Driver License Renewal
        </h1>
        <p style={{ fontSize: "18px", fontWeight: 400, margin: 0 }}>
          Schedule your renewal appointment. Select your preferred week below.
        </p>
      </section>

      {/* Instruction Banner */}
      {activeTask?.instruction_text && (
        <div style={{ background: "#ff0000", color: "#ffffff", border: "4px solid #000000", margin: "0 24px 24px 24px", padding: "16px 24px", fontWeight: 700, fontSize: "16px", boxShadow: "6px 6px 0 0 #000" }}>
          ■ INSTRUCTION: {activeTask.instruction_text}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", margin: "0 24px", gap: "24px" }}>
        {/* Form Context */}
        <div style={{ flex: "1 1 300px", minWidth: "280px" }}>
          <div style={{ border: "4px solid #000000", padding: "24px", boxShadow: "6px 6px 0 0 #000", marginBottom: "24px" }}>
            <h2 style={{ fontFamily: "'Times New Roman', serif", fontWeight: 900, fontSize: "24px", textTransform: "uppercase", letterSpacing: "-0.02em", margin: "0 0 16px 0" }}>Applicant Information</h2>

            <label style={{ display: "block", fontWeight: 700, textTransform: "uppercase", fontSize: "12px", marginBottom: "4px" }}>Service Type</label>
            <select style={{ width: "100%", border: "4px solid #000", padding: "8px", fontSize: "14px", marginBottom: "16px", borderRadius: 0, background: "#ffffff" }}>
              <option>Standard Renewal</option>
              <option>REAL ID Upgrade</option>
              <option>Commercial License</option>
            </select>

            <label style={{ display: "block", fontWeight: 700, textTransform: "uppercase", fontSize: "12px", marginBottom: "4px" }}>Applicant ID Number</label>
            <input type="text" placeholder="DL-XXXXXXXX" style={{ width: "100%", border: "4px solid #000", padding: "8px", fontSize: "14px", marginBottom: "16px", borderRadius: 0, boxSizing: "border-box" }} />

            <label style={{ display: "block", fontWeight: 700, textTransform: "uppercase", fontSize: "12px", marginBottom: "4px" }}>Office Location</label>
            <select style={{ width: "100%", border: "4px solid #000", padding: "8px", fontSize: "14px", marginBottom: "16px", borderRadius: 0, background: "#ffffff" }}>
              <option>Downtown DMV Office</option>
              <option>Westside Branch</option>
              <option>North County Office</option>
              <option>Eastgate Center</option>
            </select>

            <label style={{ display: "block", fontWeight: 700, textTransform: "uppercase", fontSize: "12px", marginBottom: "4px" }}>Confirmation Email</label>
            <input type="email" placeholder="you@example.gov" style={{ width: "100%", border: "4px solid #000", padding: "8px", fontSize: "14px", borderRadius: 0, boxSizing: "border-box" }} />
          </div>

          {/* Required Documents */}
          <div style={{ border: "4px solid #000000", padding: "24px", boxShadow: "6px 6px 0 0 #ffff00" }}>
            <h2 style={{ fontFamily: "'Times New Roman', serif", fontWeight: 900, fontSize: "20px", textTransform: "uppercase", letterSpacing: "-0.02em", margin: "0 0 12px 0" }}>Required Documents</h2>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", lineHeight: "2" }}>
              <li>■ Current driver license or ID card</li>
              <li>■ Proof of residency (utility bill, lease)</li>
              <li>■ Social Security card or W-2</li>
              <li>■ Passport or birth certificate</li>
              <li>■ Payment ($36 renewal fee)</li>
            </ul>
          </div>
        </div>

        {/* Picker Card */}
        <div style={{ flex: "1 1 400px", minWidth: "360px" }}>
          <div
            data-testid="picker-root"
            data-widget-id="renewal_window"
            style={{ border: "4px solid #000000", padding: "24px", boxShadow: "6px 6px 0 0 #000", background: "#ffffff" }}
          >
            <h2 style={{ fontFamily: "'Times New Roman', serif", fontWeight: 900, fontSize: "24px", textTransform: "uppercase", letterSpacing: "-0.02em", margin: "0 0 16px 0" }}>
              Renewal Window
            </h2>

            <button
              data-testid="picker-trigger"
              onClick={() => setPanelOpen(!panelOpen)}
              style={{
                width: "100%",
                border: "4px solid #000",
                background: selected ? "#ffff00" : "#ffffff",
                padding: "12px 16px",
                fontSize: "16px",
                fontWeight: 700,
                textTransform: "uppercase",
                cursor: "pointer",
                borderRadius: 0,
                boxShadow: "4px 4px 0 0 #000",
                textAlign: "left",
              }}
            >
              {selected ? selected : "→ PICK WEEK"}
            </button>

            {panelOpen && (
              <div data-testid="picker-panel" role="dialog" style={{ marginTop: "16px", border: "4px solid #000", background: "#ffffff" }}>
                {/* Navigation */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "4px solid #000", padding: "12px" }}>
                  <button
                    data-testid="picker-nav-prev"
                    onClick={() => setVisibleYear((y) => y - 1)}
                    style={{ border: "4px solid #000", background: "#ffffff", width: "44px", height: "44px", fontSize: "20px", fontWeight: 900, cursor: "pointer", borderRadius: 0 }}
                  >
                    {"<<"}
                  </button>
                  <span data-testid="picker-visible-year" style={{ fontWeight: 900, fontSize: "24px", textTransform: "uppercase", fontFamily: "'Times New Roman', serif" }}>
                    {visibleYear}
                  </span>
                  <button
                    data-testid="picker-nav-next"
                    onClick={() => setVisibleYear((y) => y + 1)}
                    style={{ border: "4px solid #000", background: "#ffffff", width: "44px", height: "44px", fontSize: "20px", fontWeight: 900, cursor: "pointer", borderRadius: 0 }}
                  >
                    {">>"}
                  </button>
                </div>

                {/* Week List */}
                <ul data-testid="picker-week-list" style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: "400px", overflowY: "auto" }}>
                  {weeks.map((w) => {
                    const isSelected = selected === w.value;
                    return (
                      <li
                        key={w.testId}
                        data-testid={w.testId}
                        data-week-number={w.week}
                        data-week-start={w.mondayStr}
                        aria-disabled={w.disabled ? "true" : undefined}
                        onClick={() => handleSelect(w.value, w.disabled)}
                        style={{
                          padding: "10px 12px",
                          borderBottom: "2px solid #000",
                          cursor: w.disabled ? "not-allowed" : "pointer",
                          background: isSelected ? "#ff0000" : w.disabled ? "#f0f0f0" : "#ffffff",
                          color: isSelected ? "#ffffff" : w.disabled ? "#999999" : "#000000",
                          fontWeight: isSelected ? 700 : 400,
                          fontSize: "13px",
                          fontFamily: "system-ui, 'Helvetica', Arial, sans-serif",
                          opacity: w.disabled ? 0.5 : 1,
                        }}
                      >
                        {w.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <span data-testid="picker-selected-value" hidden>
              {selected || ""}
            </span>

            <button
              data-testid="picker-submit"
              disabled={!selected}
              onClick={handleSubmit}
              style={{
                marginTop: "16px",
                width: "100%",
                border: "4px solid #000",
                background: selected ? "#ff0000" : "#f0f0f0",
                color: selected ? "#ffffff" : "#999999",
                padding: "14px 16px",
                fontSize: "18px",
                fontWeight: 900,
                textTransform: "uppercase",
                cursor: selected ? "pointer" : "not-allowed",
                borderRadius: 0,
                boxShadow: selected ? "6px 6px 0 0 #000" : "none",
                letterSpacing: "0.05em",
              }}
            >
              SUBMIT RENEWAL WINDOW
            </button>

            <p style={{ fontSize: "12px", marginTop: "8px", color: "#666" }}>
              Format: YYYY-Www (e.g. 2025-W36)
            </p>
          </div>

          {/* Office Hours */}
          <div style={{ border: "4px solid #000000", padding: "24px", marginTop: "24px", boxShadow: "6px 6px 0 0 #0000ff" }}>
            <h2 style={{ fontFamily: "'Times New Roman', serif", fontWeight: 900, fontSize: "20px", textTransform: "uppercase", letterSpacing: "-0.02em", margin: "0 0 12px 0" }}>Office Hours</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <tbody>
                <tr style={{ borderBottom: "2px solid #000" }}>
                  <td style={{ padding: "8px 0", fontWeight: 700 }}>Mon – Fri</td>
                  <td style={{ padding: "8px 0" }}>8:00 AM – 5:00 PM</td>
                </tr>
                <tr style={{ borderBottom: "2px solid #000" }}>
                  <td style={{ padding: "8px 0", fontWeight: 700 }}>Saturday</td>
                  <td style={{ padding: "8px 0" }}>9:00 AM – 1:00 PM</td>
                </tr>
                <tr>
                  <td style={{ padding: "8px 0", fontWeight: 700 }}>Sunday</td>
                  <td style={{ padding: "8px 0" }}>Closed</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <section style={{ margin: "24px", border: "4px solid #000", padding: "24px" }}>
        <h2 style={{ fontFamily: "'Times New Roman', serif", fontWeight: 900, fontSize: "24px", textTransform: "uppercase", letterSpacing: "-0.02em", margin: "0 0 16px 0" }}>Frequently Asked Questions</h2>
        <div style={{ borderBottom: "2px solid #000", paddingBottom: "12px", marginBottom: "12px" }}>
          <p style={{ fontWeight: 700, margin: "0 0 4px 0" }}>▲ How early can I renew?</p>
          <p style={{ margin: 0, fontSize: "14px" }}>You may renew up to 6 months before your license expires.</p>
        </div>
        <div style={{ borderBottom: "2px solid #000", paddingBottom: "12px", marginBottom: "12px" }}>
          <p style={{ fontWeight: 700, margin: "0 0 4px 0" }}>▲ What if I miss my appointment?</p>
          <p style={{ margin: 0, fontSize: "14px" }}>You may reschedule online. Walk-ins are accepted but subject to wait times.</p>
        </div>
        <div>
          <p style={{ fontWeight: 700, margin: "0 0 4px 0" }}>▲ Is the REAL ID upgrade mandatory?</p>
          <p style={{ margin: 0, fontSize: "14px" }}>REAL ID is required for domestic air travel starting May 2025.</p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#000000", color: "#ffffff", padding: "32px 24px", marginTop: "48px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "48px", marginBottom: "24px" }}>
          <div>
            <h3 style={{ fontWeight: 900, textTransform: "uppercase", fontSize: "14px", margin: "0 0 8px 0" }}>Agency</h3>
            <p style={{ fontSize: "12px", margin: 0, lineHeight: "1.8" }}>
              EchoGov Department of Motor Vehicles<br />
              1200 Federal Plaza, Suite 400<br />
              Washington, DC 20001
            </p>
          </div>
          <div>
            <h3 style={{ fontWeight: 900, textTransform: "uppercase", fontSize: "14px", margin: "0 0 8px 0" }}>Legal</h3>
            <p style={{ fontSize: "12px", margin: 0, lineHeight: "1.8" }}>
              <a href="#" style={{ color: "#ffff00", textDecoration: "underline" }}>Privacy Act Statement</a><br />
              <a href="#" style={{ color: "#ffff00", textDecoration: "underline" }}>FOIA</a><br />
              <a href="#" style={{ color: "#ffff00", textDecoration: "underline" }}>Section 508 Accessibility</a><br />
              <a href="#" style={{ color: "#ffff00", textDecoration: "underline" }}>USA.gov</a>
            </p>
          </div>
          <div>
            <h3 style={{ fontWeight: 900, textTransform: "uppercase", fontSize: "14px", margin: "0 0 8px 0" }}>Forms</h3>
            <p style={{ fontSize: "12px", margin: 0, lineHeight: "1.8" }}>
              <a href="#" style={{ color: "#ffff00", textDecoration: "underline" }}>DL-44 Application</a><br />
              <a href="#" style={{ color: "#ffff00", textDecoration: "underline" }}>REG-343 Vehicle Transfer</a><br />
              <a href="#" style={{ color: "#ffff00", textDecoration: "underline" }}>SR-1 Accident Report</a>
            </p>
          </div>
        </div>
        <div style={{ borderTop: "2px solid #ffffff", paddingTop: "16px", fontSize: "11px", opacity: 0.7 }}>
          © 2025 EchoGov. An official government website. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
