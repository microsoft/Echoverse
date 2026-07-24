import React, { useState, useEffect, useMemo, useCallback } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

interface ActiveTask {
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
}

declare global {
  interface Window {
    __ACTIVE_TASK__?: ActiveTask;
  }
}

const NOW = new Date("2025-09-01T09:00:00");

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isSameDay(a: string, b: string): boolean {
  return a === b;
}

export default function Page_ood_donation_drive(props: GeneratedPageProps): JSX.Element {
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [visibleYear, setVisibleYear] = useState(2025);
  const [visibleMonth, setVisibleMonth] = useState(8); // 0-indexed, 8 = September
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    const task = window.__ACTIVE_TASK__ || null;
    setActiveTask(task);
    if (task?.initial_visible_state) {
      const vs = task.initial_visible_state;
      if (vs.visible_month !== undefined) setVisibleMonth(vs.visible_month - 1);
      if (vs.visible_year !== undefined) setVisibleYear(vs.visible_year);
    }
  }, []);

  const todayISO = useMemo(() => {
    return formatISO(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  }, []);

  const isDateDisabled = useCallback(
    (iso: string): boolean => {
      if (!activeTask) return false;
      const ct = activeTask.constraint_type;
      const cp = activeTask.constraint_params || {};
      const date = parseISO(iso);

      if (ct === "none") return false;

      if (ct === "only_specific_weekday" || ct === "weekday_only") {
        if (ct === "only_specific_weekday" && cp.weekday !== undefined) {
          return date.getDay() !== cp.weekday;
        }
        const day = date.getDay();
        return day === 0 || day === 6;
      }

      if (ct === "weekend_only") {
        const day = date.getDay();
        return day !== 0 && day !== 6;
      }

      if (ct === "business_days") {
        const day = date.getDay();
        return day === 0 || day === 6;
      }

      if (ct === "blackout_windows") {
        const windows: string[][] = cp.blackout_windows || [];
        for (const [start, end] of windows) {
          const s = parseISO(start);
          const e = parseISO(end);
          if (date >= s && date <= e) return true;
        }
        return false;
      }

      if (ct === "max_n_days_from_today") {
        const maxDays = cp.max_days || 30;
        const diffMs = date.getTime() - NOW.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return diffDays < 0 || diffDays > maxDays;
      }

      if (ct === "min_advance_notice") {
        const minHours = cp.min_hours || 24;
        const minMs = minHours * 60 * 60 * 1000;
        return date.getTime() < NOW.getTime() + minMs;
      }

      if (ct === "fortnightly") {
        const diffMs = date.getTime() - NOW.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        return diffDays < 0 || diffDays % 14 !== 0;
      }

      if (ct === "quarter_aligned") {
        const d = date.getDate();
        return d !== 1 && d !== 15;
      }

      return false;
    },
    [activeTask]
  );

  const toggle = useCallback(
    (iso: string) => {
      if (isDateDisabled(iso)) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(iso)) {
          next.delete(iso);
        } else {
          next.add(iso);
        }
        return next;
      });
    },
    [isDateDisabled]
  );

  const goNext = useCallback(() => {
    setVisibleMonth((m) => {
      if (m === 11) {
        setVisibleYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const goPrev = useCallback(() => {
    setVisibleMonth((m) => {
      if (m === 0) {
        setVisibleYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const monthDays = useMemo(() => {
    const days: string[] = [];
    const numDays = getDaysInMonth(visibleYear, visibleMonth);
    for (let d = 1; d <= numDays; d++) {
      days.push(formatISO(visibleYear, visibleMonth, d));
    }
    return days;
  }, [visibleYear, visibleMonth]);

  const firstDayOffset = useMemo(() => {
    return getFirstDayOfWeek(visibleYear, visibleMonth);
  }, [visibleYear, visibleMonth]);

  const sortedSelected = useMemo(() => {
    return [...selected].sort();
  }, [selected]);

  const canonicalValue = useMemo(() => {
    return sortedSelected.join(",");
  }, [sortedSelected]);

  const isSubmitEnabled = selected.size >= 2;

  const handleSubmit = useCallback(() => {
    // guard removed (strip-only)
props.onSubmit({
      type: "multi_date",
      value: canonicalValue,
      raw: {
        widget_id: "drive_window",
        picker: "multi_date_picker",
        state: { selected: sortedSelected, visibleYear, visibleMonth },
      },
    });
  }, [isSubmitEnabled, canonicalValue, sortedSelected, visibleYear, visibleMonth, props]);

  const visibleMonthLabel = `${visibleYear}-${String(visibleMonth + 1).padStart(2, "0")}`;
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const instructionText = activeTask?.instruction_text || "Select multiple dates for the donation drive window.";

  return (
    <div
      style={{
        backgroundColor: "#fffbe6",
        backgroundImage: "radial-gradient(#1112 1px, transparent 1px)",
        backgroundSize: "8px 8px",
        minHeight: "100vh",
        fontFamily: "'Comic Neue', cursive",
        fontWeight: 700,
        fontSize: "16px",
        color: "#111111",
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: "#fffbe6",
          borderBottom: "4px solid #111",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "32px" }}>❤️</span>
          <span
            style={{
              fontFamily: "'Bangers', cursive",
              fontSize: "30px",
              letterSpacing: "0.02em",
              lineHeight: 1.2,
            }}
          >
            EchoAid
          </span>
        </div>
        <nav style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {["Our Work", "Volunteer", "Events", "Donate"].map((item) => (
            <span
              key={item}
              style={{
                fontFamily: "'Bangers', cursive",
                fontSize: "18px",
                letterSpacing: "0.02em",
                padding: "4px 12px",
                border: item === "Donate" ? "3px solid #111" : "none",
                borderRadius: item === "Donate" ? "8px" : "0",
                backgroundColor: item === "Donate" ? "#ef4444" : "transparent",
                color: item === "Donate" ? "#fff" : "#111",
                boxShadow: item === "Donate" ? "4px 4px 0 0 #111" : "none",
                cursor: "pointer",
              }}
            >
              {item}
            </span>
          ))}
        </nav>
      </header>

      {/* Hero Section */}
      <section
        style={{
          padding: "32px 24px",
          textAlign: "center",
          borderBottom: "4px solid #111",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "30px",
            fontSize: "48px",
            transform: "rotate(12deg)",
          }}
        >
          💥
        </div>
        <h1
          style={{
            fontFamily: "'Bangers', cursive",
            fontSize: "44px",
            letterSpacing: "0.02em",
            lineHeight: 1.2,
            margin: "0 0 8px 0",
          }}
        >
          Donation Drive
        </h1>
        <p style={{ fontSize: "18px", maxWidth: "600px", margin: "0 auto 12px" }}>
          Sign up for a shift and make a difference! Choose your drive window dates below.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "16px" }}>
          {[
            { num: "12,450", label: "Volunteers" },
            { num: "3.2M", label: "Meals Served" },
            { num: "98%", label: "Satisfaction" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                border: "3px solid #111",
                borderRadius: "12px",
                padding: "12px 20px",
                backgroundColor: "#facc15",
                boxShadow: "4px 4px 0 0 #111",
              }}
            >
              <div style={{ fontFamily: "'Bangers', cursive", fontSize: "28px" }}>{stat.num}</div>
              <div style={{ fontSize: "14px" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Instruction Banner */}
      <div
        style={{
          margin: "24px auto",
          maxWidth: "700px",
          padding: "16px 24px",
          backgroundColor: "#2563eb",
          color: "#fff",
          border: "4px solid #111",
          borderRadius: "12px",
          boxShadow: "4px 4px 0 0 #111",
          position: "relative",
          fontFamily: "'Comic Neue', cursive",
          fontSize: "16px",
          fontWeight: 700,
        }}
      >
        <span style={{ fontSize: "20px", marginRight: "8px" }}>📢</span>
        {instructionText}
        {/* Speech bubble tail */}
        <div
          style={{
            position: "absolute",
            bottom: "-12px",
            left: "40px",
            width: 0,
            height: 0,
            borderLeft: "12px solid transparent",
            borderRight: "12px solid transparent",
            borderTop: "12px solid #2563eb",
          }}
        />
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
        {/* Form Context */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {/* Cause Dropdown */}
          <div>
            <label
              style={{ fontFamily: "'Bangers', cursive", fontSize: "16px", display: "block", marginBottom: "4px" }}
            >
              Cause / Program
            </label>
            <select
              style={{
                width: "100%",
                padding: "10px",
                border: "3px solid #111",
                borderRadius: "8px",
                fontFamily: "'Comic Neue', cursive",
                fontWeight: 700,
                fontSize: "16px",
                boxShadow: "4px 4px 0 0 #111",
                backgroundColor: "#fff",
              }}
            >
              <option>Food Bank Distribution</option>
              <option>Clothing Drive</option>
              <option>Disaster Relief</option>
              <option>Youth Mentoring</option>
            </select>
          </div>
          {/* Role Selector */}
          <div>
            <label
              style={{ fontFamily: "'Bangers', cursive", fontSize: "16px", display: "block", marginBottom: "4px" }}
            >
              Shift Role
            </label>
            <select
              style={{
                width: "100%",
                padding: "10px",
                border: "3px solid #111",
                borderRadius: "8px",
                fontFamily: "'Comic Neue', cursive",
                fontWeight: 700,
                fontSize: "16px",
                boxShadow: "4px 4px 0 0 #111",
                backgroundColor: "#fff",
              }}
            >
              <option>Sorter</option>
              <option>Driver</option>
              <option>Team Lead</option>
              <option>Greeter</option>
            </select>
          </div>
          {/* Location */}
          <div>
            <label
              style={{ fontFamily: "'Bangers', cursive", fontSize: "16px", display: "block", marginBottom: "4px" }}
            >
              Location
            </label>
            <input
              type="text"
              placeholder="Enter your city..."
              style={{
                width: "100%",
                padding: "10px",
                border: "3px solid #111",
                borderRadius: "8px",
                fontFamily: "'Comic Neue', cursive",
                fontWeight: 700,
                fontSize: "16px",
                boxShadow: "4px 4px 0 0 #111",
                boxSizing: "border-box",
              }}
            />
          </div>
          {/* Group Size */}
          <div>
            <label
              style={{ fontFamily: "'Bangers', cursive", fontSize: "16px", display: "block", marginBottom: "4px" }}
            >
              Group Size
            </label>
            <input
              type="number"
              min={1}
              max={20}
              defaultValue={1}
              style={{
                width: "100%",
                padding: "10px",
                border: "3px solid #111",
                borderRadius: "8px",
                fontFamily: "'Comic Neue', cursive",
                fontWeight: 700,
                fontSize: "16px",
                boxShadow: "4px 4px 0 0 #111",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Picker Card */}
        <div
          data-testid="picker-root"
          data-widget-id="drive_window"
          style={{
            border: "4px solid #111",
            borderRadius: "12px",
            backgroundColor: "#fffbe6",
            backgroundImage: "radial-gradient(#1112 1px, transparent 1px)",
            backgroundSize: "8px 8px",
            padding: "24px",
            boxShadow: "4px 4px 0 0 #111",
            marginBottom: "24px",
          }}
        >
          {/* Widget Label in speech bubble */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: "16px" }}>
            <div
              style={{
                backgroundColor: "#facc15",
                border: "3px solid #111",
                borderRadius: "12px",
                padding: "6px 16px",
                fontFamily: "'Bangers', cursive",
                fontSize: "22px",
                letterSpacing: "0.02em",
                position: "relative",
              }}
            >
              ⭐ Drive Window
              <div
                style={{
                  position: "absolute",
                  bottom: "-10px",
                  left: "24px",
                  width: 0,
                  height: 0,
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderTop: "10px solid #facc15",
                }}
              />
            </div>
          </div>

          {/* Trigger */}
          <button
            data-testid="picker-trigger"
            onClick={() => setPanelOpen(!panelOpen)}
            style={{
              display: "block",
              width: "100%",
              padding: "12px 16px",
              border: "3px solid #111",
              borderRadius: "12px",
              backgroundColor: "#fff",
              boxShadow: "4px 4px 0 0 #111",
              fontFamily: "'Comic Neue', cursive",
              fontWeight: 700,
              fontSize: "16px",
              cursor: "pointer",
              textAlign: "left",
              marginBottom: "16px",
            }}
          >
            {sortedSelected.length > 0
              ? `${sortedSelected.length} date(s) selected`
              : "Pick dates for the drive window"}
          </button>

          {/* Panel */}
          {panelOpen && (
            <div
              data-testid="picker-panel"
              style={{
                border: "4px solid #111",
                borderRadius: "12px",
                padding: "16px",
                backgroundColor: "#fffbe6",
                backgroundImage: "radial-gradient(#1112 1px, transparent 1px)",
                backgroundSize: "6px 6px",
              }}
            >
              {/* Navigation */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <button
                  data-testid="picker-nav-prev"
                  onClick={goPrev}
                  style={{
                    border: "3px solid #111",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    backgroundColor: "#fff",
                    boxShadow: "4px 4px 0 0 #111",
                    fontFamily: "'Bangers', cursive",
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                >
                  ← BACK
                </button>
                <span
                  data-testid="picker-visible-month"
                  style={{
                    fontFamily: "'Bangers', cursive",
                    fontSize: "24px",
                    letterSpacing: "0.02em",
                  }}
                >
                  {visibleMonthLabel}
                </span>
                <button
                  data-testid="picker-nav-next"
                  onClick={goNext}
                  style={{
                    border: "3px solid #111",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    backgroundColor: "#fff",
                    boxShadow: "4px 4px 0 0 #111",
                    fontFamily: "'Bangers', cursive",
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                >
                  NEXT →
                </button>
              </div>

              {/* Weekday Headers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "4px",
                  marginBottom: "4px",
                }}
              >
                {weekdays.map((wd) => (
                  <div
                    key={wd}
                    style={{
                      textAlign: "center",
                      fontFamily: "'Bangers', cursive",
                      fontSize: "14px",
                      textTransform: "uppercase",
                      padding: "4px",
                      backgroundColor: "#facc15",
                      border: "2px solid #111",
                      borderRadius: "4px",
                      backgroundImage: "radial-gradient(#1112 1px, transparent 1px)",
                      backgroundSize: "4px 4px",
                    }}
                  >
                    {wd}
                  </div>
                ))}
              </div>

              {/* Month Grid */}
              <div
                data-testid="picker-month-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "4px",
                }}
              >
                {/* Empty offset cells */}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {/* Day cells */}
                {monthDays.map((iso) => {
                  const isSelected = selected.has(iso);
                  const isToday = isSameDay(iso, todayISO);
                  const disabled = isDateDisabled(iso);

                  return (
                    <button
                      key={iso}
                      data-testid={`picker-cell-${iso}`}
                      data-date={iso}
                      aria-pressed={isSelected}
                      aria-disabled={disabled}
                      disabled={disabled}
                      onClick={() => {
                        if (!disabled) toggle(iso);
                      }}
                      style={{
                        position: "relative",
                        padding: "8px 4px",
                        border: isSelected ? "3px solid #111" : "3px solid #111",
                        borderRadius: "8px",
                        backgroundColor: disabled
                          ? "#e5e5e5"
                          : isSelected
                          ? "#ef4444"
                          : isToday
                          ? "#facc15"
                          : "#fff",
                        color: disabled ? "#999" : isSelected ? "#fff" : "#111",
                        fontFamily: isSelected ? "'Bangers', cursive" : "'Comic Neue', cursive",
                        fontWeight: 700,
                        fontSize: "16px",
                        cursor: disabled ? "not-allowed" : "pointer",
                        boxShadow: isSelected ? "3px 3px 0 0 #111" : "2px 2px 0 0 #111",
                        textAlign: "center",
                      }}
                    >
                      {Number(iso.slice(8))}
                      {isSelected && (
                        <span
                          style={{
                            position: "absolute",
                            top: "-4px",
                            right: "-4px",
                            fontSize: "12px",
                          }}
                        >
                          ⭐
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected List */}
              <ul
                data-testid="picker-selected-list"
                style={{
                  marginTop: "12px",
                  padding: "8px 12px",
                  border: sortedSelected.length > 0 ? "3px solid #111" : "none",
                  borderRadius: "8px",
                  backgroundColor: sortedSelected.length > 0 ? "#fff" : "transparent",
                  listStyle: "none",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {sortedSelected.map((iso) => (
                  <li
                    key={iso}
                    style={{
                      backgroundColor: "#2563eb",
                      color: "#fff",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: "2px solid #111",
                      fontFamily: "'Comic Neue', cursive",
                      fontWeight: 700,
                      fontSize: "14px",
                    }}
                  >
                    {iso}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hidden canonical value */}
          <span data-testid="picker-selected-value" hidden>
            {canonicalValue}
          </span>

          {/* Submit Button */}
          <button
            data-testid="picker-submit"
            disabled={!isSubmitEnabled}
            onClick={handleSubmit}
            style={{
              marginTop: "16px",
              padding: "14px 32px",
              border: "4px solid #111",
              borderRadius: "12px",
              backgroundColor: isSubmitEnabled ? "#ef4444" : "#ccc",
              color: isSubmitEnabled ? "#fff" : "#666",
              fontFamily: "'Bangers', cursive",
              fontSize: "22px",
              letterSpacing: "0.02em",
              cursor: isSubmitEnabled ? "pointer" : "not-allowed",
              boxShadow: isSubmitEnabled ? "4px 4px 0 0 #111" : "none",
              width: "100%",
            }}
          >
            💥 SUBMIT DRIVE DATES
          </button>
        </div>

        {/* T-shirt size (optional context field) */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{ fontFamily: "'Bangers', cursive", fontSize: "16px", display: "block", marginBottom: "4px" }}
          >
            T-Shirt Size (optional)
          </label>
          <select
            style={{
              padding: "10px",
              border: "3px solid #111",
              borderRadius: "8px",
              fontFamily: "'Comic Neue', cursive",
              fontWeight: 700,
              fontSize: "16px",
              boxShadow: "4px 4px 0 0 #111",
              backgroundColor: "#fff",
            }}
          >
            <option>S</option>
            <option>M</option>
            <option selected>L</option>
            <option>XL</option>
            <option>XXL</option>
          </select>
        </div>

        {/* Impact Story Cards */}
        <section style={{ marginBottom: "32px" }}>
          <h2
            style={{
              fontFamily: "'Bangers', cursive",
              fontSize: "30px",
              letterSpacing: "0.02em",
              marginBottom: "16px",
            }}
          >
            ✊ Impact Stories
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            {[
              {
                title: "Maria's Kitchen",
                desc: "Fed 500 families during the holiday drive.",
                emoji: "🍲",
              },
              {
                title: "Backpack Heroes",
                desc: "Supplied 2,000 students with school supplies.",
                emoji: "🎒",
              },
              {
                title: "Warm Coat Rally",
                desc: "Collected 3,400 coats for winter shelters.",
                emoji: "🧥",
              },
            ].map((story) => (
              <div
                key={story.title}
                style={{
                  border: "3px solid #111",
                  borderRadius: "12px",
                  padding: "16px",
                  backgroundColor: "#fff",
                  boxShadow: "4px 4px 0 0 #111",
                }}
              >
                <div style={{ fontSize: "36px", marginBottom: "8px" }}>{story.emoji}</div>
                <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: "20px", margin: "0 0 4px" }}>
                  {story.title}
                </h3>
                <p style={{ fontSize: "14px", margin: 0 }}>{story.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Progress Bars */}
        <section style={{ marginBottom: "32px" }}>
          <h2
            style={{
              fontFamily: "'Bangers', cursive",
              fontSize: "30px",
              letterSpacing: "0.02em",
              marginBottom: "16px",
            }}
          >
            ⚡ Drive Progress
          </h2>
          {[
            { label: "Food Items", pct: 78 },
            { label: "Volunteer Hours", pct: 62 },
            { label: "Funds Raised", pct: 45 },
          ].map((bar) => (
            <div key={bar.label} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontFamily: "'Bangers', cursive", fontSize: "16px" }}>{bar.label}</span>
                <span style={{ fontFamily: "'Bangers', cursive", fontSize: "16px" }}>{bar.pct}%</span>
              </div>
              <div
                style={{
                  border: "3px solid #111",
                  borderRadius: "8px",
                  height: "24px",
                  backgroundColor: "#fff",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${bar.pct}%`,
                    height: "100%",
                    backgroundColor: "#ef4444",
                    borderRadius: "5px",
                  }}
                />
              </div>
            </div>
          ))}
        </section>

        {/* Testimonial */}
        <section style={{ marginBottom: "32px" }}>
          <blockquote
            style={{
              border: "3px solid #111",
              borderRadius: "12px",
              padding: "20px",
              backgroundColor: "#fff",
              boxShadow: "4px 4px 0 0 #2563eb",
              fontStyle: "italic",
              fontSize: "18px",
              position: "relative",
            }}
          >
            <span style={{ position: "absolute", top: "-12px", left: "16px", fontSize: "32px" }}>
              💬
            </span>
            "Volunteering with EchoAid changed my life. The team made everything so easy — I
            just showed up and felt like I was truly making a difference!"
            <footer style={{ marginTop: "8px", fontStyle: "normal", fontWeight: 700, fontSize: "14px" }}>
              — Sarah M., Volunteer since 2023
            </footer>
          </blockquote>
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "4px solid #111",
          padding: "24px",
          backgroundColor: "#111",
          color: "#fffbe6",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: "12px" }}>
          <span style={{ fontFamily: "'Bangers', cursive", fontSize: "22px" }}>❤️ EchoAid</span>
        </div>
        <div style={{ fontSize: "14px", marginBottom: "8px" }}>
          501(c)(3) Tax ID: 84-2194753 | EchoGuide | EchoRate ★★★★
        </div>
        <div style={{ fontSize: "13px", marginBottom: "12px", display: "flex", justifyContent: "center", gap: "16px" }}>
          <span>Privacy Policy</span>
          <span>Terms</span>
          <span>Contact</span>
          <span>Careers</span>
        </div>
        <div style={{ fontSize: "20px", display: "flex", justifyContent: "center", gap: "12px" }}>
          <span>📘</span>
          <span>🐦</span>
          <span>📷</span>
          <span>▶️</span>
        </div>
        <div style={{ marginTop: "12px", fontSize: "12px", opacity: 0.7 }}>
          © 2025 EchoAid Foundation. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
