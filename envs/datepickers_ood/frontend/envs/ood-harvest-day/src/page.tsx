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

function getISOWeekCount(year: number): number {
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
  result.setDate(result.getDate() + (week - 1) * 7);
  return result;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function padWeek(w: number): string {
  return String(w).padStart(2, "0");
}

function isWeekDisabled(
  year: number,
  week: number,
  constraintType: string,
  constraintParams: any
): boolean {
  if (constraintType === "none" || !constraintType) return false;

  const monday = getMondayOfISOWeek(year, week);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  if (constraintType === "blackout_windows" && constraintParams?.blackout_windows) {
    for (const [start, end] of constraintParams.blackout_windows) {
      const bStart = new Date(start + "T00:00:00");
      const bEnd = new Date(end + "T23:59:59");
      if (monday <= bEnd && sunday >= bStart) return true;
    }
    return false;
  }

  if (constraintType === "fortnightly") {
    return week % 2 !== 1;
  }

  if (constraintType === "max_n_days_from_today" && constraintParams?.max_days != null) {
    const maxDate = new Date(NOW);
    maxDate.setDate(maxDate.getDate() + constraintParams.max_days);
    const minDate = new Date(NOW);
    minDate.setDate(minDate.getDate() - constraintParams.max_days);
    if (monday > maxDate || sunday < minDate) return true;
    return false;
  }

  if (constraintType === "min_advance_notice" && constraintParams?.min_hours != null) {
    const minDate = new Date(NOW);
    minDate.setTime(minDate.getTime() + constraintParams.min_hours * 60 * 60 * 1000);
    if (sunday < minDate) return true;
    return false;
  }

  if (constraintType === "weekday_only") {
    return false;
  }

  if (constraintType === "weekend_only") {
    return false;
  }

  if (constraintType === "quarter_aligned") {
    const monthOfMonday = monday.getMonth();
    if (monthOfMonday % 3 !== 0) return true;
    if (monday.getDate() > 7) return true;
    return false;
  }

  return false;
}

export default function Page_ood_harvest_day(props: GeneratedPageProps): JSX.Element {
  const [task, setTask] = useState<ActiveTask | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [visibleYear, setVisibleYear] = useState(2025);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const t = window.__ACTIVE_TASK__ || null;
    setTask(t);
    if (t?.initial_visible_state) {
      const ivs = t.initial_visible_state;
      if (ivs.visible_year) setVisibleYear(ivs.visible_year);
    }
  }, []);

  const weekCount = useMemo(() => getISOWeekCount(visibleYear), [visibleYear]);

  const weeks = useMemo(() => {
    const result: Array<{
      week: number;
      monday: Date;
      sunday: Date;
      disabled: boolean;
      id: string;
    }> = [];
    const ct = task?.constraint_type || "none";
    const cp = task?.constraint_params || {};
    for (let w = 1; w <= weekCount; w++) {
      const monday = getMondayOfISOWeek(visibleYear, w);
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      result.push({
        week: w,
        monday,
        sunday,
        disabled: isWeekDisabled(visibleYear, w, ct, cp),
        id: `${visibleYear}-W${padWeek(w)}`,
      });
    }
    return result;
  }, [visibleYear, weekCount, task]);

  const handleWeekClick = useCallback(
    (weekId: string, disabled: boolean) => {
      if (disabled) return;
      setSelected(weekId);
    },
    []
  );

  const handleSubmit = useCallback(() => {
    // guard removed (strip-only)
props.onSubmit({
      type: "iso_week",
      value: selected,
      raw: {
        widget_id: "harvest_day",
        picker: "week_picker",
        state: { selected, visibleYear },
      },
    });
  }, [selected, visibleYear, props]);

  const instructionText = task?.instruction_text || "Select a harvest week using the picker below.";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ff6ec4 0%, #7873f5 50%, #4ade80 100%)",
        fontFamily: "'Inter', 'SF Pro', system-ui, sans-serif",
        fontSize: "15px",
        lineHeight: 1.5,
        letterSpacing: "-0.01em",
        color: "#ffffff",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.35)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
        className="px-6 py-4"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌾</span>
            <span className="text-xl font-semibold tracking-tight">EchoHarvest</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
            <a href="#" className="hover:text-white transition-colors">Crops</a>
            <a href="#" className="hover:text-white transition-colors">Equipment</a>
            <a href="#" className="hover:text-white transition-colors">Weather</a>
            <a href="#" className="hover:text-white transition-colors">Dealer</a>
          </nav>
          <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            <span>◇</span>
            <span>Find a Dealer</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-10 text-center">
        <h1 className="text-3xl font-semibold mb-2" style={{ letterSpacing: "-0.02em" }}>
          Harvest Day
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)" }} className="text-lg max-w-xl mx-auto">
          Plan your season — select the optimal harvest week for maximum yield.
        </p>
      </section>

      {/* Instruction Banner */}
      <div className="max-w-4xl mx-auto px-6 mb-6">
        <div
          style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "16px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
          className="px-5 py-4"
        >
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
            ✦ Task Instruction
          </p>
          <p className="mt-1" style={{ color: "#ffffff" }}>
            {instructionText}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form Context - Left Side */}
          <div className="md:col-span-1 space-y-4">
            {/* Crop Type */}
            <div
              style={{
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(16px) saturate(180%)",
                WebkitBackdropFilter: "blur(16px) saturate(180%)",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: "20px",
                boxShadow: "0 8px 32px rgba(31,38,135,0.25), inset 0 1px 0 rgba(255,255,255,0.5)",
              }}
              className="p-5"
            >
              <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>
                Crop Type
              </label>
              <select
                className="w-full px-3 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#ffffff",
                  outline: "none",
                }}
              >
                <option>Winter Wheat</option>
                <option>Corn</option>
                <option>Soybeans</option>
                <option>Barley</option>
              </select>

              <label className="block text-sm font-medium mb-2 mt-4" style={{ color: "rgba(255,255,255,0.8)" }}>
                Field / Parcel
              </label>
              <select
                className="w-full px-3 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#ffffff",
                  outline: "none",
                }}
              >
                <option>North 40 — 120ac</option>
                <option>South Ridge — 85ac</option>
                <option>River Bottom — 200ac</option>
              </select>

              <label className="block text-sm font-medium mb-2 mt-4" style={{ color: "rgba(255,255,255,0.8)" }}>
                Acreage
              </label>
              <input
                type="number"
                defaultValue={120}
                className="w-full px-3 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#ffffff",
                  outline: "none",
                }}
              />

              <label className="block text-sm font-medium mb-2 mt-4" style={{ color: "rgba(255,255,255,0.8)" }}>
                Hardiness Zone
              </label>
              <input
                type="text"
                defaultValue="6b"
                className="w-full px-3 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#ffffff",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Week Picker Card - Right Side */}
          <div className="md:col-span-2">
            <div
              data-testid="picker-root"
              data-widget-id="harvest_day"
              style={{
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: "24px",
                boxShadow: "0 8px 32px rgba(31,38,135,0.25), inset 0 1px 0 rgba(255,255,255,0.5)",
              }}
              className="p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">🌾 Harvest Day</h2>
                <button
                  data-testid="picker-trigger"
                  onClick={() => setPanelOpen(!panelOpen)}
                  className="px-4 py-2 rounded-2xl text-sm font-medium transition-all"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
                    color: "#ffffff",
                  }}
                >
                  {selected ? selected : "Pick a week"}
                </button>
              </div>

              {panelOpen && (
                <div data-testid="picker-panel" role="dialog">
                  {/* Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      data-testid="picker-nav-prev"
                      onClick={() => setVisibleYear((y) => y - 1)}
                      className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
                      style={{
                        background: "rgba(255,255,255,0.12)",
                        border: "1px solid rgba(255,255,255,0.25)",
                      }}
                    >
                      ‹
                    </button>
                    <span
                      data-testid="picker-visible-year"
                      className="text-lg font-semibold"
                    >
                      {visibleYear}
                    </span>
                    <button
                      data-testid="picker-nav-next"
                      onClick={() => setVisibleYear((y) => y + 1)}
                      className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
                      style={{
                        background: "rgba(255,255,255,0.12)",
                        border: "1px solid rgba(255,255,255,0.25)",
                      }}
                    >
                      ›
                    </button>
                  </div>

                  {/* Week List */}
                  <ul
                    data-testid="picker-week-list"
                    className="space-y-1 max-h-72 overflow-y-auto pr-1"
                    style={{
                      scrollbarWidth: "thin",
                      scrollbarColor: "rgba(255,255,255,0.3) transparent",
                    }}
                  >
                    {weeks.map((w) => {
                      const isSelected = selected === w.id;
                      const isCurrentWeek = (() => {
                        return NOW >= w.monday && NOW <= w.sunday;
                      })();

                      return (
                        <li
                          key={w.id}
                          data-testid={`picker-cell-${w.id}`}
                          data-week-number={w.week}
                          data-week-start={formatDate(w.monday)}
                          aria-disabled={w.disabled ? "true" : undefined}
                          onClick={() => handleWeekClick(w.id, w.disabled)}
                          className="flex items-center px-3 py-2 rounded-xl cursor-pointer transition-all text-sm"
                          style={{
                            background: isSelected
                              ? "rgba(255,255,255,0.95)"
                              : w.disabled
                              ? "rgba(255,255,255,0.04)"
                              : "rgba(255,255,255,0.08)",
                            border: isCurrentWeek && !isSelected
                              ? "1px solid rgba(255,255,255,0.7)"
                              : "1px solid transparent",
                            color: isSelected
                              ? "#7873f5"
                              : w.disabled
                              ? "rgba(255,255,255,0.3)"
                              : "rgba(255,255,255,0.9)",
                            cursor: w.disabled ? "not-allowed" : "pointer",
                            fontWeight: isSelected ? 600 : 400,
                          }}
                        >
                          <span className="w-12 font-medium">W{padWeek(w.week)}</span>
                          <span className="mx-2" style={{ color: w.disabled ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)" }}>—</span>
                          <span>{formatDate(w.monday)}</span>
                          <span className="mx-1" style={{ color: w.disabled ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)" }}>–</span>
                          <span>{formatDate(w.sunday)}</span>
                          {isCurrentWeek && (
                            <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(250,204,21,0.3)", color: "#facc15" }}>
                              now
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Selected Value (hidden) */}
              <span data-testid="picker-selected-value" hidden>
                {selected || ""}
              </span>

              {/* Submit */}
              <div className="mt-5 flex items-center justify-between">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Format: YYYY-Www (e.g. 2025-W36)
                </p>
                <button
                  data-testid="picker-submit"
                  disabled={!selected}
                  onClick={handleSubmit}
                  className="px-6 py-2.5 rounded-2xl text-sm font-semibold transition-all"
                  style={{
                    background: selected ? "#facc15" : "rgba(255,255,255,0.1)",
                    color: selected ? "#1a1a2e" : "rgba(255,255,255,0.4)",
                    border: selected ? "none" : "1px solid rgba(255,255,255,0.2)",
                    cursor: selected ? "pointer" : "not-allowed",
                    boxShadow: selected ? "0 4px 16px rgba(250,204,21,0.3)" : "none",
                  }}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Supporting Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {/* Weather */}
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "20px",
              boxShadow: "0 8px 32px rgba(31,38,135,0.15), inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
            className="p-5"
          >
            <h3 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.8)" }}>
              ⌘ Weather Forecast
            </h3>
            <div className="space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
              <div className="flex justify-between"><span>Mon</span><span>72°F ☀</span></div>
              <div className="flex justify-between"><span>Tue</span><span>68°F ⛅</span></div>
              <div className="flex justify-between"><span>Wed</span><span>65°F 🌧</span></div>
              <div className="flex justify-between"><span>Thu</span><span>70°F ☀</span></div>
              <div className="flex justify-between"><span>Fri</span><span>74°F ☀</span></div>
            </div>
          </div>

          {/* Soil Moisture */}
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "20px",
              boxShadow: "0 8px 32px rgba(31,38,135,0.15), inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
            className="p-5"
          >
            <h3 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.8)" }}>
              ◯ Soil Moisture
            </h3>
            <div className="space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
              <div className="flex justify-between"><span>North 40</span><span>32%</span></div>
              <div className="flex justify-between"><span>South Ridge</span><span>28%</span></div>
              <div className="flex justify-between"><span>River Bottom</span><span>41%</span></div>
            </div>
            <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-full rounded-full" style={{ width: "34%", background: "linear-gradient(90deg, #4ade80, #facc15)" }} />
            </div>
          </div>

          {/* Equipment */}
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "20px",
              boxShadow: "0 8px 32px rgba(31,38,135,0.15), inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
            className="p-5"
          >
            <h3 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.8)" }}>
              ✧ Equipment Availability
            </h3>
            <div className="space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
              <div className="flex justify-between"><span>Combine #1</span><span className="text-green-300">Available</span></div>
              <div className="flex justify-between"><span>Combine #2</span><span className="text-yellow-300">Scheduled</span></div>
              <div className="flex justify-between"><span>Grain Cart</span><span className="text-green-300">Available</span></div>
              <div className="flex justify-between"><span>Semi Truck</span><span className="text-red-300">In Use</span></div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,255,255,0.2)",
        }}
        className="px-6 py-8"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            <div>
              <p className="font-semibold text-white mb-2">🌾 EchoHarvest</p>
              <p>Precision agriculture scheduling for modern farms.</p>
              <p className="mt-2 text-xs">USDA Partner Program ✓</p>
            </div>
            <div>
              <p className="font-medium text-white mb-2">Resources</p>
              <p>Cooperative Extension</p>
              <p>Crop Insurance</p>
              <p>Soil Testing Labs</p>
            </div>
            <div>
              <p className="font-medium text-white mb-2">Dealer Network</p>
              <p>Find Equipment</p>
              <p>Parts Catalog</p>
              <p>Service Centers</p>
            </div>
            <div>
              <p className="font-medium text-white mb-2">Sustainability</p>
              <p>Cover Crops</p>
              <p>Carbon Credits</p>
              <p>Water Conservation</p>
            </div>
          </div>
          <div className="mt-6 pt-4 text-xs text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.4)" }}>
            © 2025 EchoHarvest. All rights reserved. Not affiliated with USDA.
          </div>
        </div>
      </footer>
    </div>
  );
}
