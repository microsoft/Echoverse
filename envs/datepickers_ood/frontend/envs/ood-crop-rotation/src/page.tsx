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

export default function Page_ood_crop_rotation(props: GeneratedPageProps): JSX.Element {
  const [hour, setHour] = useState<string>("");
  const [minute, setMinute] = useState<string>("");
  const [second, setSecond] = useState<string>("00");
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeView, setActiveView] = useState<"hour" | "minute" | "second">("hour");
  const [task, setTask] = useState<ActiveTask | null>(null);

  useEffect(() => {
    const t = (window as any).__ACTIVE_TASK__ as ActiveTask | undefined;
    if (t) setTask(t);
  }, []);

  const constraintType = task?.constraint_type || "none";
  const constraintParams = task?.constraint_params || {};

  const isHourDisabled = useCallback(
    (h: number): boolean => {
      if (constraintType === "business_hours_only") {
        return h < 9 || h >= 17;
      }
      if (constraintType === "min_advance_notice") {
        const minHours = constraintParams.min_hours || 0;
        const nowHour = NOW.getHours();
        const earliest = (nowHour + minHours) % 24;
        if (minHours >= 24) return false;
        if (earliest > nowHour) {
          return h >= nowHour && h < earliest;
        }
      }
      return false;
    },
    [constraintType, constraintParams]
  );

  const isMinuteDisabled = useCallback((_m: number): boolean => false, []);
  const isSecondDisabled = useCallback((_s: number): boolean => false, []);

  const selectedValue = useMemo(() => {
    if (hour && minute && second) return `${hour}:${minute}:${second}`;
    return "";
  }, [hour, minute, second]);

  const isComplete = useMemo(() => {
    return hour !== "" && minute !== "";
  }, [hour, minute]);

  const handleSubmit = useCallback(() => {
    // guard removed (strip-only)
const val = `${hour}:${minute}:${second || "00"}`;
    props.onSubmit({
      type: "time",
      value: val,
      raw: {
        widget_id: "rotation_block",
        picker: "time_only",
        state: { hour, minute, second: second || "00" },
      },
    });
  }, [hour, minute, second, isComplete, props]);

  const handleNavPrev = useCallback(() => {
    if (activeView === "minute") setActiveView("hour");
    else if (activeView === "second") setActiveView("minute");
  }, [activeView]);

  const handleNavNext = useCallback(() => {
    if (activeView === "hour") setActiveView("minute");
    else if (activeView === "minute") setActiveView("second");
  }, [activeView]);

  const wobblyFilterSvg = (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <filter id="wobbly">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.02"
            numOctaves="3"
            result="noise"
            seed="2"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="2"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="paper-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.7"
            numOctaves="4"
            stitchTiles="stitch"
            result="grain"
          />
          <feColorMatrix
            type="saturate"
            values="0"
            in="grain"
            result="grainBW"
          />
          <feBlend in="SourceGraphic" in2="grainBW" mode="multiply" />
        </filter>
      </defs>
    </svg>
  );

  return (
    <div
      style={{ background: "#fdf6e3", color: "#2b2b2b", minHeight: "100vh" }}
      className="font-['Caveat',_'Indie_Flower',_'Patrick_Hand',_cursive] leading-relaxed"
    >
      {wobblyFilterSvg}

      {/* Header */}
      <header
        style={{
          background: "#fdf6e3",
          borderBottom: "2px dashed #4b4b4b",
          filter: "url(#wobbly)",
        }}
        className="p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span style={{ fontSize: "28px" }}>🌾</span>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#365F1A",
              transform: "rotate(-1deg)",
              display: "inline-block",
            }}
          >
            EchoHarvest
          </span>
        </div>
        <nav className="flex gap-6" style={{ fontSize: "18px", color: "#4b4b4b" }}>
          <span style={{ textDecoration: "underline", textDecorationStyle: "wavy", textDecorationColor: "#d97706" }}>Crops</span>
          <span>Equipment</span>
          <span>Weather</span>
          <span>Dealer</span>
        </nav>
      </header>

      {/* Hero */}
      <section
        className="p-6 text-center"
        style={{
          background: "linear-gradient(135deg, #fdf6e3 0%, #fde68a 100%)",
          borderBottom: "2px solid #4b4b4b",
          filter: "url(#wobbly)",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            transform: "rotate(-0.5deg)",
            color: "#365F1A",
          }}
        >
          🌱 Crop Rotation
        </h1>
        <p style={{ fontSize: "19px", color: "#4b4b4b", marginTop: "8px" }}>
          Plan your season with precision timing
        </p>
        <div className="flex justify-center gap-3 mt-3 flex-wrap">
          {["Corn", "Soybeans", "Wheat", "Alfalfa", "Cover Crop"].map((c) => (
            <span
              key={c}
              style={{
                background: "#fde68a",
                border: "1.5px solid #4b4b4b",
                borderRadius: "6px",
                padding: "4px 12px",
                fontSize: "16px",
                filter: "url(#wobbly)",
              }}
            >
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* Instruction banner */}
      {task?.instruction_text && (
        <div
          className="mx-4 mt-4 p-4 rounded-md"
          style={{
            background: "#fde68a",
            mixBlendMode: "multiply",
            border: "2px solid #d97706",
            fontSize: "19px",
            filter: "url(#wobbly)",
            fontWeight: 700,
          }}
        >
          ✏️ {task.instruction_text}
        </div>
      )}

      {/* Main content */}
      <main className="p-4 flex flex-col lg:flex-row gap-6 mt-4">
        {/* Form context sidebar */}
        <aside
          className="lg:w-1/3 p-4 rounded-md"
          style={{
            border: "2px solid #4b4b4b",
            background: "#fdf6e3",
            filter: "url(#wobbly)",
            boxShadow: "2px 3px 0 rgba(75,75,75,0.15)",
          }}
        >
          <h2 style={{ fontSize: "24px", fontWeight: 700, transform: "rotate(-0.5deg)", color: "#365F1A" }}>
            ✿ Field Details
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            <label style={{ fontSize: "17px" }}>
              Crop Type
              <select
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: "4px",
                  padding: "6px",
                  border: "1.5px solid #4b4b4b",
                  borderRadius: "6px",
                  background: "#fdf6e3",
                  fontFamily: "inherit",
                  fontSize: "17px",
                }}
              >
                <option>Corn (Zea mays)</option>
                <option>Soybeans</option>
                <option>Winter Wheat</option>
                <option>Alfalfa</option>
              </select>
            </label>
            <label style={{ fontSize: "17px" }}>
              Field / Parcel
              <select
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: "4px",
                  padding: "6px",
                  border: "1.5px solid #4b4b4b",
                  borderRadius: "6px",
                  background: "#fdf6e3",
                  fontFamily: "inherit",
                  fontSize: "17px",
                }}
              >
                <option>North 40 — Section A</option>
                <option>South Field — Parcel 3</option>
                <option>River Bottom</option>
              </select>
            </label>
            <label style={{ fontSize: "17px" }}>
              Acreage
              <input
                type="number"
                defaultValue={160}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: "4px",
                  padding: "6px",
                  border: "1.5px solid #4b4b4b",
                  borderRadius: "6px",
                  background: "#fdf6e3",
                  fontFamily: "inherit",
                  fontSize: "17px",
                }}
              />
            </label>
            <label style={{ fontSize: "17px" }}>
              Hardiness Zone
              <input
                type="text"
                defaultValue="5b"
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: "4px",
                  padding: "6px",
                  border: "1.5px solid #4b4b4b",
                  borderRadius: "6px",
                  background: "#fdf6e3",
                  fontFamily: "inherit",
                  fontSize: "17px",
                }}
              />
            </label>
            <label style={{ fontSize: "17px" }}>
              Planting Depth (in)
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.25"
                defaultValue="1.5"
                style={{ display: "block", width: "100%", marginTop: "4px" }}
              />
            </label>
          </div>
        </aside>

        {/* Picker card */}
        <div
          className="lg:w-2/3"
          data-widget-id="rotation_block"
        >
          <div
            data-testid="picker-root"
            className="p-6 rounded-md"
            style={{
              border: "2.5px solid #4b4b4b",
              background: "#fdf6e3",
              filter: "url(#wobbly)",
              boxShadow: "2px 3px 0 rgba(75,75,75,0.15)",
            }}
          >
            <h3
              style={{
                fontSize: "26px",
                fontWeight: 700,
                color: "#365F1A",
                transform: "rotate(-0.5deg)",
                marginBottom: "12px",
              }}
            >
              ↻ Rotation Block
            </h3>

            {constraintType !== "none" && (
              <p style={{ fontSize: "15px", color: "#9c8b6b", marginBottom: "8px", fontStyle: "italic" }}>
                Constraint: {constraintType.replace(/_/g, " ")}
                {constraintParams.min_hours && ` (min ${constraintParams.min_hours}h advance)`}
              </p>
            )}

            {/* Trigger */}
            <button
              data-testid="picker-trigger"
              onClick={() => setPanelOpen(!panelOpen)}
              style={{
                padding: "10px 20px",
                border: "2px solid #4b4b4b",
                borderRadius: "6px",
                background: "#fdf6e3",
                fontFamily: "inherit",
                fontSize: "19px",
                cursor: "pointer",
                filter: "url(#wobbly)",
                boxShadow: "2px 3px 0 rgba(75,75,75,0.15)",
              }}
            >
              {selectedValue
                ? `✎ ${selectedValue}`
                : "✏️ Pick a time"}
            </button>

            {/* Panel */}
            {panelOpen && (
              <div
                data-testid="picker-panel"
                className="mt-4 p-4 rounded-md"
                style={{
                  border: "2px dashed #4b4b4b",
                  background: "#fdf6e3",
                  boxShadow: "2px 3px 0 rgba(75,75,75,0.15)",
                }}
              >
                {/* Sub-view nav */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    data-testid="picker-nav-prev"
                    onClick={handleNavPrev}
                    style={{
                      border: "1.5px solid #4b4b4b",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      background: "#fdf6e3",
                      fontFamily: "inherit",
                      fontSize: "20px",
                      cursor: "pointer",
                    }}
                  >
                    ←
                  </button>
                  <span style={{ fontSize: "20px", fontWeight: 700, color: "#d97706" }}>
                    {activeView === "hour" && "★ Hours"}
                    {activeView === "minute" && "★ Minutes"}
                    {activeView === "second" && "★ Seconds"}
                  </span>
                  <button
                    data-testid="picker-nav-next"
                    onClick={handleNavNext}
                    style={{
                      border: "1.5px solid #4b4b4b",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      background: "#fdf6e3",
                      fontFamily: "inherit",
                      fontSize: "20px",
                      cursor: "pointer",
                    }}
                  >
                    →
                  </button>
                </div>

                <div data-testid="picker-clock-face">
                  {/* Hour list */}
                  <ul
                    data-testid="picker-hour-list"
                    style={{
                      display: activeView === "hour" ? "grid" : "none",
                      gridTemplateColumns: "repeat(6, 1fr)",
                      gap: "6px",
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      maxHeight: "260px",
                      overflowY: "auto",
                    }}
                  >
                    {Array.from({ length: 24 }, (_, h) => {
                      const hStr = String(h).padStart(2, "0");
                      const disabled = isHourDisabled(h);
                      const selected = hour === hStr;
                      return (
                        <li
                          key={h}
                          data-testid={`picker-cell-${hStr}`}
                          data-hour={h}
                          aria-disabled={disabled ? "true" : undefined}
                          onClick={() => {
                            if (!disabled) {
                              setHour(hStr);
                              setActiveView("minute");
                            }
                          }}
                          style={{
                            padding: "8px 4px",
                            textAlign: "center",
                            fontSize: "18px",
                            border: selected
                              ? "2.5px solid #d97706"
                              : "1.5px solid #4b4b4b",
                            borderRadius: "6px",
                            background: selected
                              ? "#fde68a"
                              : disabled
                              ? "#e8e0d0"
                              : "#fdf6e3",
                            color: disabled ? "#9c8b6b" : "#2b2b2b",
                            cursor: disabled ? "not-allowed" : "pointer",
                            textDecoration: disabled ? "line-through" : "none",
                            opacity: disabled ? 0.5 : 1,
                          }}
                        >
                          {hStr}
                        </li>
                      );
                    })}
                  </ul>

                  {/* Minute list */}
                  <ul
                    data-testid="picker-minute-list"
                    style={{
                      display: activeView === "minute" ? "grid" : "none",
                      gridTemplateColumns: "repeat(6, 1fr)",
                      gap: "4px",
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      maxHeight: "300px",
                      overflowY: "auto",
                    }}
                  >
                    {Array.from({ length: 60 }, (_, m) => {
                      const mStr = String(m).padStart(2, "0");
                      const disabled = isMinuteDisabled(m);
                      const selected = minute === mStr;
                      return (
                        <li
                          key={m}
                          data-testid={`picker-cell-min-${mStr}`}
                          data-minute={m}
                          aria-disabled={disabled ? "true" : undefined}
                          onClick={() => {
                            if (!disabled) {
                              setMinute(mStr);
                              setActiveView("second");
                            }
                          }}
                          style={{
                            padding: "6px 2px",
                            textAlign: "center",
                            fontSize: "16px",
                            border: selected
                              ? "2.5px solid #d97706"
                              : "1px solid #4b4b4b",
                            borderRadius: "5px",
                            background: selected
                              ? "#fde68a"
                              : disabled
                              ? "#e8e0d0"
                              : "#fdf6e3",
                            color: disabled ? "#9c8b6b" : "#2b2b2b",
                            cursor: disabled ? "not-allowed" : "pointer",
                            textDecoration: disabled ? "line-through" : "none",
                            opacity: disabled ? 0.5 : 1,
                          }}
                        >
                          {mStr}
                        </li>
                      );
                    })}
                  </ul>

                  {/* Second list */}
                  <ul
                    data-testid="picker-second-list"
                    style={{
                      display: activeView === "second" ? "grid" : "none",
                      gridTemplateColumns: "repeat(6, 1fr)",
                      gap: "4px",
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      maxHeight: "300px",
                      overflowY: "auto",
                    }}
                  >
                    {Array.from({ length: 60 }, (_, s) => {
                      const sStr = String(s).padStart(2, "0");
                      const disabled = isSecondDisabled(s);
                      const selected = second === sStr;
                      return (
                        <li
                          key={s}
                          data-testid={`picker-cell-sec-${sStr}`}
                          data-second={s}
                          aria-disabled={disabled ? "true" : undefined}
                          onClick={() => {
                            if (!disabled) {
                              setSecond(sStr);
                            }
                          }}
                          style={{
                            padding: "6px 2px",
                            textAlign: "center",
                            fontSize: "16px",
                            border: selected
                              ? "2.5px solid #d97706"
                              : "1px solid #4b4b4b",
                            borderRadius: "5px",
                            background: selected
                              ? "#fde68a"
                              : disabled
                              ? "#e8e0d0"
                              : "#fdf6e3",
                            color: disabled ? "#9c8b6b" : "#2b2b2b",
                            cursor: disabled ? "not-allowed" : "pointer",
                            textDecoration: disabled ? "line-through" : "none",
                            opacity: disabled ? 0.5 : 1,
                          }}
                        >
                          {sStr}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Selection summary inside panel */}
                <div className="mt-3 text-center" style={{ fontSize: "17px", color: "#4b4b4b" }}>
                  {hour && <span>H: <strong>{hour}</strong> </span>}
                  {minute && <span>M: <strong>{minute}</strong> </span>}
                  {second && <span>S: <strong>{second}</strong></span>}
                </div>
              </div>
            )}

            {/* Hidden selected value */}
            <span data-testid="picker-selected-value" hidden>
              {selectedValue || ""}
            </span>

            {/* Submit */}
            <div className="mt-4 flex items-center gap-4">
              <button
                data-testid="picker-submit"
                disabled={!isComplete}
                onClick={handleSubmit}
                style={{
                  padding: "10px 24px",
                  border: "2px solid #4b4b4b",
                  borderRadius: "6px",
                  background: isComplete ? "#d97706" : "#e8e0d0",
                  color: isComplete ? "#fdf6e3" : "#9c8b6b",
                  fontFamily: "inherit",
                  fontSize: "19px",
                  fontWeight: 700,
                  cursor: isComplete ? "pointer" : "not-allowed",
                  filter: "url(#wobbly)",
                  boxShadow: isComplete
                    ? "2px 3px 0 rgba(75,75,75,0.15)"
                    : "none",
                }}
              >
                ✓ Submit Time
              </button>
              <span style={{ fontSize: "15px", color: "#9c8b6b" }}>
                Format: HH:MM:SS (24-hour)
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Supporting content */}
      <section className="p-4 mt-4 mx-4">
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          style={{ filter: "url(#wobbly)" }}
        >
          <div
            className="p-4 rounded-md"
            style={{
              border: "1.5px dashed #4b4b4b",
              background: "#fdf6e3",
            }}
          >
            <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#365F1A" }}>
              🌤 Weather Forecast
            </h4>
            <p style={{ fontSize: "16px", color: "#4b4b4b", marginTop: "8px" }}>
              Clear skies expected. High 78°F, Low 54°F. Wind SSW 8mph.
              Optimal conditions for field operations.
            </p>
          </div>
          <div
            className="p-4 rounded-md"
            style={{
              border: "1.5px dashed #4b4b4b",
              background: "#fdf6e3",
            }}
          >
            <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#365F1A" }}>
              💧 Soil Moisture
            </h4>
            <p style={{ fontSize: "16px", color: "#4b4b4b", marginTop: "8px" }}>
              Current: 42% VWC at 6" depth. Field capacity adequate
              for planting operations. No irrigation required.
            </p>
          </div>
          <div
            className="p-4 rounded-md"
            style={{
              border: "1.5px dashed #4b4b4b",
              background: "#fdf6e3",
            }}
          >
            <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#365F1A" }}>
              🚜 Equipment
            </h4>
            <p style={{ fontSize: "16px", color: "#4b4b4b", marginTop: "8px" }}>
              Echo 8R 310 — Available. EchoPlant 1775NT ready.
              GPS guidance calibrated. Next service: 220 hrs.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="mt-8 p-6 text-center"
        style={{
          borderTop: "2px dashed #4b4b4b",
          background: "#fdf6e3",
          filter: "url(#wobbly)",
        }}
      >
        <div className="flex flex-wrap justify-center gap-6 mb-3" style={{ fontSize: "16px", color: "#4b4b4b" }}>
          <span>🏛 USDA Partner</span>
          <span>🌱 Extension Links</span>
          <span>🤝 Dealer Network</span>
          <span>♻️ Sustainability</span>
        </div>
        <p style={{ fontSize: "14px", color: "#9c8b6b" }}>
          © 2025 EchoHarvest — Cooperative Extension Program. Committed to sustainable agriculture practices.
        </p>
      </footer>
    </div>
  );
}
