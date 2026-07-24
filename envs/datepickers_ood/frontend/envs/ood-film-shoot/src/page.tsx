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

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function getDaysInYear(year: number): string[] {
  const days: string[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const cur = new Date(start);
  while (cur <= end) {
    days.push(toISO(cur.getFullYear(), cur.getMonth(), cur.getDate()));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function getWeekday(iso: string): number {
  const d = new Date(iso + "T00:00:00");
  return d.getDay();
}

function parseISO(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

function diffDays(a: string, b: string): number {
  const da = parseISO(a).getTime();
  const db = parseISO(b).getTime();
  return Math.round((da - db) / (1000 * 60 * 60 * 24));
}

function isDateInBlackout(iso: string, blackoutWindows: string[][]): boolean {
  const d = parseISO(iso).getTime();
  for (const window of blackoutWindows) {
    const start = parseISO(window[0]).getTime();
    const end = parseISO(window[1]).getTime();
    if (d >= start && d <= end) return true;
  }
  return false;
}

function isDisabledByConstraint(
  iso: string,
  constraintType: string,
  constraintParams: any
): boolean {
  if (!constraintType || constraintType === "none") return false;

  const nowISO = toISO(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());

  switch (constraintType) {
    case "blackout_windows": {
      const windows = constraintParams?.blackout_windows || [];
      return isDateInBlackout(iso, windows);
    }
    case "only_specific_weekday": {
      const weekday = constraintParams?.weekday;
      if (weekday === undefined) return false;
      return getWeekday(iso) !== weekday;
    }
    case "fortnightly": {
      const anchor = constraintParams?.anchor || nowISO;
      const diff = diffDays(iso, anchor);
      return diff % 14 !== 0;
    }
    case "max_n_days_from_today": {
      const maxDays = constraintParams?.max_days || 30;
      const diff = diffDays(iso, nowISO);
      return diff < 0 || diff > maxDays;
    }
    case "min_advance_notice": {
      const minDays = constraintParams?.min_days || 7;
      const diff = diffDays(iso, nowISO);
      return diff < minDays;
    }
    case "weekday_only": {
      const wd = getWeekday(iso);
      return wd === 0 || wd === 6;
    }
    case "weekend_only": {
      const wd = getWeekday(iso);
      return wd !== 0 && wd !== 6;
    }
    case "business_days": {
      const wd = getWeekday(iso);
      return wd === 0 || wd === 6;
    }
    case "quarter_aligned": {
      const d = parseISO(iso);
      const day = d.getDate();
      return day !== 1;
    }
    default:
      return false;
  }
}

export default function Page_ood_film_shoot(props: GeneratedPageProps): JSX.Element {
  const [task, setTask] = useState<ActiveTask | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [visibleYear, setVisibleYear] = useState(2025);
  const [selected, setSelected] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>(""); // compound-widget
  const isCompound = task?.task_type === "compound";

  useEffect(() => {
    const t = window.__ACTIVE_TASK__ || null;
    setTask(t);
    if (t?.initial_visible_state) {
      if (t.initial_visible_state.visible_year) {
        setVisibleYear(t.initial_visible_state.visible_year);
      }
    }
  }, []);

  const allDays = useMemo(() => getDaysInYear(visibleYear), [visibleYear]);

  const weeks = useMemo(() => {
    const weekStarts: string[] = [];
    const jan1 = new Date(visibleYear, 0, 1);
    const jan1Day = jan1.getDay();
    const startOffset = jan1Day === 0 ? 0 : -jan1Day;
    const firstSunday = new Date(visibleYear, 0, 1 + startOffset);
    const cur = new Date(firstSunday);
    const dec31 = new Date(visibleYear, 11, 31);
    while (cur <= dec31) {
      const iso = toISO(cur.getFullYear(), cur.getMonth(), cur.getDate());
      weekStarts.push(iso);
      cur.setDate(cur.getDate() + 7);
    }
    return weekStarts;
  }, [visibleYear]);

  const dayInColumn = useCallback(
    (weekStartIso: string, weekday: number): string | null => {
      const start = parseISO(weekStartIso);
      const target = new Date(start);
      target.setDate(target.getDate() + weekday);
      if (target.getFullYear() !== visibleYear) return null;
      return toISO(target.getFullYear(), target.getMonth(), target.getDate());
    },
    [visibleYear]
  );

  const getIntensity = useCallback((iso: string): number => {
    const hash = iso.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return hash % 5;
  }, []);

  const constraintType = task?.constraint_type || "none";
  const constraintParams = task?.constraint_params || {};

  const handleCellClick = useCallback(
    (iso: string) => {
      if (isDisabledByConstraint(iso, constraintType, constraintParams)) return;
      setSelected(iso);
    },
    [constraintType, constraintParams]
  );

  const handleSubmit = useCallback(() => {
    if (!selected || !/^\d{4}-\d{2}-\d{2}$/.test(selected)) return;
    props.onSubmit({
      type: "date",
      value: isCompound && selectedTime ? `${selected}|${selectedTime}:00` : selected,
      raw: {
        widget_id: "shoot_window",
        picker: "calendar_heatmap",
        state: { selected, visibleYear },
      },
    });
  }, [selected, visibleYear, props]);

  const instructionText =
    task?.instruction_text || "Select the shoot date on the heatmap calendar below.";

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div
      style={{
        background: "#f5ecd9",
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
          background: "#fff8e1",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "24px" }}>🚚</span>
          <span
            style={{
              fontVariant: "small-caps",
              fontWeight: 700,
              fontSize: "20px",
              letterSpacing: "0.06em",
            }}
          >
            EchoRoute
          </span>
        </div>
        <nav style={{ display: "flex", gap: "24px", fontVariant: "small-caps", fontSize: "13px", letterSpacing: "0.06em" }}>
          <span style={{ cursor: "pointer" }}>Freight</span>
          <span>◆</span>
          <span style={{ cursor: "pointer" }}>Equipment</span>
          <span>◆</span>
          <span style={{ cursor: "pointer" }}>Schedule</span>
          <span>◆</span>
          <span style={{ cursor: "pointer" }}>Support</span>
        </nav>
        <div
          style={{
            border: "1px solid #1a1a1a",
            padding: "4px 12px",
            fontVariant: "small-caps",
            fontSize: "12px",
            letterSpacing: "0.06em",
            color: "#7a1f1f",
            fontWeight: 700,
          }}
        >
          § Operations Portal
        </div>
      </header>

      {/* Hero */}
      <section
        style={{
          borderBottom: "3px double #1a1a1a",
          padding: "32px",
          background: "#f5ecd9",
        }}
      >
        <h1
          style={{
            fontVariant: "small-caps",
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            margin: "0 0 8px 0",
          }}
        >
          § 1. Film Shoot — Scheduling Portal
        </h1>
        <p style={{ color: "#6b5d3c", margin: 0 }}>
          Book a freight slot for film production equipment. Select your shoot window below.
        </p>
      </section>

      {/* Instruction Banner */}
      <section
        style={{
          borderBottom: "1px solid #1a1a1a",
          padding: "16px 32px",
          background: "#fff8e1",
        }}
      >
        <p
          style={{
            margin: 0,
            fontStyle: "italic",
            color: "#7a1f1f",
            fontWeight: 700,
          }}
        >
          † Instruction: {instructionText}
        </p>
      </section>

      <div style={{ display: "flex", gap: "0", flexWrap: "wrap" }}>
        {/* Form Context (left side) */}
        <aside
          style={{
            flex: "0 0 280px",
            borderRight: "1px solid #1a1a1a",
            padding: "24px 20px",
          }}
        >
          <h2
            style={{
              fontVariant: "small-caps",
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              marginBottom: "16px",
              borderBottom: "3px double #1a1a1a",
              paddingBottom: "8px",
            }}
          >
            § 2. Freight Details
          </h2>

          <div style={{ marginBottom: "16px" }}>
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
              a) Equipment / Asset
            </label>
            <select
              style={{
                width: "100%",
                border: "1px solid #1a1a1a",
                background: "#f5ecd9",
                padding: "6px 8px",
                fontFamily: "inherit",
                fontSize: "13px",
                borderRadius: 0,
              }}
            >
              <option>Camera Rig (40ft Container)</option>
              <option>Lighting Array (20ft)</option>
              <option>Set Pieces (Flatbed)</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
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
              b) Origin
            </label>
            <input
              type="text"
              defaultValue="Los Angeles, CA"
              style={{
                width: "100%",
                border: "1px solid #1a1a1a",
                background: "#f5ecd9",
                padding: "6px 8px",
                fontFamily: "inherit",
                fontSize: "13px",
                borderRadius: 0,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
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
              c) Destination
            </label>
            <input
              type="text"
              defaultValue="Atlanta, GA"
              style={{
                width: "100%",
                border: "1px solid #1a1a1a",
                background: "#f5ecd9",
                padding: "6px 8px",
                fontFamily: "inherit",
                fontSize: "13px",
                borderRadius: 0,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
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
              d) Shift Block
            </label>
            <select
              style={{
                width: "100%",
                border: "1px solid #1a1a1a",
                background: "#f5ecd9",
                padding: "6px 8px",
                fontFamily: "inherit",
                fontSize: "13px",
                borderRadius: 0,
              }}
            >
              <option>AM (06:00–14:00)</option>
              <option>PM (14:00–22:00)</option>
              <option>Overnight (22:00–06:00)</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
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
              e) Driver / Operator
            </label>
            <input
              type="text"
              defaultValue="J. Martinez"
              style={{
                width: "100%",
                border: "1px solid #1a1a1a",
                background: "#f5ecd9",
                padding: "6px 8px",
                fontFamily: "inherit",
                fontSize: "13px",
                borderRadius: 0,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
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
              f) Payload Weight (lbs)
            </label>
            <input
              type="number"
              defaultValue={42000}
              style={{
                width: "100%",
                border: "1px solid #1a1a1a",
                background: "#f5ecd9",
                padding: "6px 8px",
                fontFamily: "inherit",
                fontSize: "13px",
                borderRadius: 0,
                boxSizing: "border-box",
              }}
            />
          </div>
        </aside>

        {/* Main Picker Area */}
        <main style={{ flex: 1, padding: "24px 32px", minWidth: "600px" }}>
          <div data-testid="picker-root" data-widget-id="shoot_window">
            <h2
              style={{
                fontVariant: "small-caps",
                fontSize: "18px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                marginBottom: "12px",
                borderBottom: "3px double #1a1a1a",
                paddingBottom: "8px",
              }}
            >
              § 3. Shoot Window
            </h2>

            {/* Trigger */}
            <div style={{ marginBottom: "16px" }}>
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
                Date of Shoot
              </label>
              <button
                data-testid="picker-trigger"
                onClick={() => setPanelOpen(!panelOpen)}
                style={{
                  display: "block",
                  width: "220px",
                  border: "1px solid #1a1a1a",
                  background: "#f5ecd9",
                  padding: "8px 12px",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: "14px",
                  textAlign: "left",
                  cursor: "pointer",
                  borderRadius: 0,
                  color: selected ? "#1a1a1a" : "#6b5d3c",
                }}
              >
                {selected || "DD / MM / YYYY"}
              </button>
            </div>

            {/* Panel */}
            {panelOpen && (
              <div
                data-testid="picker-panel"
                style={{
                  border: "1px solid #1a1a1a",
                  background: "#f5ecd9",
                  padding: "16px",
                  position: "relative",
                }}
              >
                {/* Navigation */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "16px",
                    marginBottom: "12px",
                    borderBottom: "3px double #1a1a1a",
                    paddingBottom: "12px",
                  }}
                >
                  <button
                    data-testid="picker-nav-prev"
                    onClick={() => setVisibleYear((y) => y - 1)}
                    style={{
                      border: "1px solid #1a1a1a",
                      background: "transparent",
                      fontFamily: "inherit",
                      fontSize: "16px",
                      cursor: "pointer",
                      padding: "2px 8px",
                      borderRadius: 0,
                    }}
                  >
                    ‹
                  </button>
                  <span
                    data-testid="picker-visible-year"
                    style={{
                      fontVariant: "small-caps",
                      fontWeight: 700,
                      fontSize: "16px",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {visibleYear}
                  </span>
                  <button
                    data-testid="picker-nav-next"
                    onClick={() => setVisibleYear((y) => y + 1)}
                    style={{
                      border: "1px solid #1a1a1a",
                      background: "transparent",
                      fontFamily: "inherit",
                      fontSize: "16px",
                      cursor: "pointer",
                      padding: "2px 8px",
                      borderRadius: 0,
                    }}
                  >
                    ›
                  </button>
                </div>

                {/* Month labels row */}
                <div
                  style={{
                    display: "flex",
                    marginBottom: "4px",
                    paddingLeft: "32px",
                    fontSize: "10px",
                    fontVariant: "small-caps",
                    letterSpacing: "0.04em",
                    color: "#6b5d3c",
                  }}
                >
                  {(() => {
                    const months = [
                      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                    ];
                    const totalWeeks = weeks.length;
                    const cellW = 14;
                    const els: JSX.Element[] = [];
                    let lastMonthStart = 0;
                    for (let m = 0; m < 12; m++) {
                      const firstOfMonth = toISO(visibleYear, m, 1);
                      let weekIdx = 0;
                      for (let w = 0; w < weeks.length; w++) {
                        for (let d = 0; d < 7; d++) {
                          const iso = dayInColumn(weeks[w], d);
                          if (iso === firstOfMonth) {
                            weekIdx = w;
                            break;
                          }
                        }
                        if (weekIdx > 0) break;
                      }
                      els.push(
                        <span
                          key={m}
                          style={{
                            position: "absolute",
                            left: `${32 + weekIdx * (cellW + 2)}px`,
                          }}
                        >
                          {months[m]}
                        </span>
                      );
                    }
                    return (
                      <div style={{ position: "relative", width: "100%", height: "14px" }}>
                        {els}
                      </div>
                    );
                  })()}
                </div>

                {/* Heatmap Grid */}
                <div style={{ overflowX: "auto" }}>
                  <table
                    data-testid="picker-heatmap-grid"
                    style={{
                      borderCollapse: "collapse",
                      borderSpacing: 0,
                    }}
                  >
                    <tbody>
                      {[0, 1, 2, 3, 4, 5, 6].map((weekday) => (
                        <tr
                          key={weekday}
                          data-testid={`picker-heatmap-weekday-${weekday}`}
                        >
                          <td
                            style={{
                              fontSize: "10px",
                              fontVariant: "small-caps",
                              paddingRight: "6px",
                              color: "#6b5d3c",
                              width: "28px",
                              textAlign: "right",
                            }}
                          >
                            {weekday % 2 === 1 ? weekdayLabels[weekday] : ""}
                          </td>
                          {weeks.map((weekStartIso, wIdx) => {
                            const iso = dayInColumn(weekStartIso, weekday);
                            if (!iso) {
                              return (
                                <td
                                  key={`empty-${wIdx}`}
                                  style={{ width: "14px", height: "14px", padding: "1px" }}
                                />
                              );
                            }
                            const disabled = isDisabledByConstraint(
                              iso,
                              constraintType,
                              constraintParams
                            );
                            const isSelected = iso === selected;
                            const intensity = getIntensity(iso);
                            const intensityColors = [
                              "#f5ecd9",
                              "#e8dcc4",
                              "#d4c4a0",
                              "#b8a47a",
                              "#8c7a54",
                            ];
                            let bgColor = intensityColors[intensity];
                            if (disabled) bgColor = "#e8e4dc";
                            if (isSelected) bgColor = "#fff8e1";

                            return (
                              <td
                                key={iso}
                                data-testid={`picker-cell-${iso}`}
                                data-date={iso}
                                data-intensity={intensity}
                                aria-disabled={disabled ? "true" : undefined}
                                onClick={() => {
                                  if (!disabled) handleCellClick(iso);
                                }}
                                style={{
                                  width: "14px",
                                  height: "14px",
                                  padding: "1px",
                                  cursor: disabled ? "not-allowed" : "pointer",
                                  position: "relative",
                                }}
                              >
                                <div
                                  style={{
                                    width: "12px",
                                    height: "12px",
                                    background: bgColor,
                                    border: isSelected
                                      ? "1.5px solid #1a1a1a"
                                      : "1px solid #c4b89a",
                                    borderRadius: isSelected ? "50%" : "0",
                                    boxSizing: "border-box",
                                    position: "relative",
                                    textDecoration: disabled
                                      ? "line-through"
                                      : "none",
                                    opacity: disabled ? 0.4 : 1,
                                  }}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div
                  style={{
                    marginTop: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "10px",
                    color: "#6b5d3c",
                    borderTop: "1px solid #1a1a1a",
                    paddingTop: "8px",
                  }}
                >
                  <span>Less</span>
                  {["#f5ecd9", "#e8dcc4", "#d4c4a0", "#b8a47a", "#8c7a54"].map(
                    (c, i) => (
                      <div
                        key={i}
                        style={{
                          width: "12px",
                          height: "12px",
                          background: c,
                          border: "1px solid #c4b89a",
                        }}
                      />
                    )
                  )}
                  <span>More</span>
                </div>
              </div>
            )}

            {/* Selected value (hidden) */}
            <span data-testid="picker-selected-value" hidden>
              {selected}
            </span>

            {/* Submit */}
            <div style={{ marginTop: "16px", borderTop: "3px double #1a1a1a", paddingTop: "16px" }}>
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
                disabled={!selected || !/^\d{4}-\d{2}-\d{2}$/.test(selected)}
                onClick={handleSubmit}
                style={{
                  border: "1px solid #1a1a1a",
                  background: selected ? "#fff8e1" : "#e8e4dc",
                  padding: "8px 24px",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontVariant: "small-caps",
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  cursor: selected ? "pointer" : "not-allowed",
                  borderRadius: 0,
                  color: selected ? "#7a1f1f" : "#6b5d3c",
                  opacity: selected ? 1 : 0.6,
                }}
              >
                ‡ Confirm Shoot Date
              </button>
              <p style={{ fontSize: "11px", color: "#6b5d3c", marginTop: "8px" }}>
                Canonical format: YYYY-MM-DD
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Supporting Content */}
      <section
        style={{
          borderTop: "3px double #1a1a1a",
          padding: "24px 32px",
        }}
      >
        <h2
          style={{
            fontVariant: "small-caps",
            fontSize: "15px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            marginBottom: "12px",
          }}
        >
          § 4. Fleet Status
        </h2>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "3px double #1a1a1a" }}>
              <th style={{ textAlign: "left", padding: "6px 8px", fontVariant: "small-caps" }}>
                Unit
              </th>
              <th style={{ textAlign: "left", padding: "6px 8px", fontVariant: "small-caps" }}>
                Status
              </th>
              <th style={{ textAlign: "left", padding: "6px 8px", fontVariant: "small-caps" }}>
                Location
              </th>
              <th style={{ textAlign: "left", padding: "6px 8px", fontVariant: "small-caps" }}>
                ETA
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["IR-4401", "In Transit", "I-10 West, NM", "09/03/2025"],
              ["IR-4402", "At Dock", "Atlanta Hub", "—"],
              ["IR-4407", "Loaded", "Los Angeles Yard", "09/02/2025"],
              ["IR-4415", "Maintenance", "Phoenix Shop", "09/05/2025"],
            ].map(([unit, status, loc, eta], i) => (
              <tr key={i} style={{ borderBottom: "1px solid #c4b89a" }}>
                <td style={{ padding: "6px 8px", fontWeight: 700 }}>{unit}</td>
                <td style={{ padding: "6px 8px" }}>{status}</td>
                <td style={{ padding: "6px 8px" }}>{loc}</td>
                <td style={{ padding: "6px 8px" }}>{eta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Safety Counter */}
      <section
        style={{
          borderTop: "1px solid #1a1a1a",
          padding: "16px 32px",
          display: "flex",
          gap: "32px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            border: "1px solid #7a1f1f",
            padding: "12px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "10px", fontVariant: "small-caps", color: "#7a1f1f", letterSpacing: "0.06em" }}>
            Days Without Incident
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#7a1f1f" }}>247</div>
        </div>
        <div style={{ fontSize: "12px", color: "#6b5d3c" }}>
          <p style={{ margin: "0 0 4px 0" }}>◆ Dock utilization: 78% (Atlanta Hub)</p>
          <p style={{ margin: "0 0 4px 0" }}>◆ Active loads this week: 34</p>
          <p style={{ margin: 0 }}>◆ Next scheduled maintenance window: 09/08/2025</p>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "3px double #1a1a1a",
          padding: "24px 32px",
          fontSize: "11px",
          color: "#6b5d3c",
          display: "flex",
          flexWrap: "wrap",
          gap: "24px",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p style={{ margin: "0 0 4px 0", fontWeight: 700, fontVariant: "small-caps" }}>
            EchoRoute Logistics, Inc.
          </p>
          <p style={{ margin: "0 0 2px 0" }}>DOT# 2847391 &nbsp;|&nbsp; MC# 891204</p>
          <p style={{ margin: 0 }}>ISO 9001:2015 Certified</p>
        </div>
        <div>
          <p style={{ margin: "0 0 4px 0", fontVariant: "small-caps", fontWeight: 700 }}>
            Compliance
          </p>
          <p style={{ margin: "0 0 2px 0" }}>OSHA Safety Standards</p>
          <p style={{ margin: "0 0 2px 0" }}>Terms of Carriage</p>
          <p style={{ margin: 0 }}>FMCSA Regulations</p>
        </div>
        <div>
          <p style={{ margin: "0 0 4px 0", fontVariant: "small-caps", fontWeight: 700 }}>
            Regional Offices
          </p>
          <p style={{ margin: "0 0 2px 0" }}>Los Angeles, CA</p>
          <p style={{ margin: "0 0 2px 0" }}>Atlanta, GA</p>
          <p style={{ margin: "0 0 2px 0" }}>Dallas, TX</p>
          <p style={{ margin: 0 }}>Chicago, IL</p>
        </div>
        <div style={{ alignSelf: "flex-end" }}>
          <p style={{ margin: 0, fontStyle: "italic" }}>
            © 2025 EchoRoute Logistics. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
