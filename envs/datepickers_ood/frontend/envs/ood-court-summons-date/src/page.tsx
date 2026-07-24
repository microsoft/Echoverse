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

export default function Page_ood_court_summons_date(props: GeneratedPageProps): JSX.Element {
  const [task, setTask] = useState<ActiveTask | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [decadeStart, setDecadeStart] = useState(2020);

  useEffect(() => {
    const active = window.__ACTIVE_TASK__ || null;
    setTask(active);
    if (active?.initial_visible_state) {
      const visYear = active.initial_visible_state.visible_year;
      if (visYear) {
        setDecadeStart(Math.floor(visYear / 10) * 10);
      }
    }
  }, []);

  const constraintType = task?.constraint_type || "none";
  const constraintParams = task?.constraint_params || {};

  const isFYDisabled = useCallback(
    (fy: number): boolean => {
      if (constraintType === "none") return false;

      const fyStartDate = new Date(`${fy - 1}-10-01T00:00:00`);
      const fyEndDate = new Date(`${fy}-09-30T23:59:59`);

      if (constraintType === "max_n_days_from_today") {
        const maxDays = constraintParams.max_days || 365;
        const maxDate = new Date(NOW.getTime() + maxDays * 24 * 60 * 60 * 1000);
        return fyStartDate.getTime() > maxDate.getTime();
      }

      if (constraintType === "min_advance_notice") {
        const minHours = constraintParams.min_hours || 48;
        const minDate = new Date(NOW.getTime() + minHours * 60 * 60 * 1000);
        return fyEndDate.getTime() < minDate.getTime();
      }

      if (constraintType === "quarter_aligned") {
        return fy % 4 !== 0;
      }

      return false;
    },
    [constraintType, constraintParams]
  );

  const handleSelect = useCallback(
    (fy: number) => {
      if (!isFYDisabled(fy)) {
        setSelected(`FY${fy}`);
      }
    },
    [isFYDisabled]
  );

  const handleSubmit = useCallback(() => {
    if (selected && /^FY\d{4}$/.test(selected)) {
      props.onSubmit({
        type: "fiscal_year",
        value: selected,
        raw: {
          widget_id: "summons_date",
          picker: "fiscal_year_picker",
          state: { selected, decadeStart },
        },
      });
    }
  }, [selected, decadeStart, props]);

  const handlePrev = useCallback(() => {
    setDecadeStart((d) => d - 10);
  }, []);

  const handleNext = useCallback(() => {
    setDecadeStart((d) => d + 10);
  }, []);

  const fyYears = useMemo(
    () => Array.from({ length: 10 }, (_, i) => decadeStart + i),
    [decadeStart]
  );

  const glassCard =
    "bg-white/15 backdrop-blur-xl backdrop-saturate-150 border border-white/30 rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.25)]";
  const innerHighlight = "shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]";

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        background: "linear-gradient(135deg, #ff6ec4 0%, #7873f5 50%, #4ade80 100%)",
        fontFamily: "'Inter', 'SF Pro', system-ui, sans-serif",
        fontSize: "15px",
        lineHeight: "1.5",
        letterSpacing: "-0.01em",
        color: "#ffffff",
      }}
    >
      {/* Utility Bar */}
      <div className="w-full py-2 px-6 flex justify-end gap-4 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
        <a href="#" className="hover:underline">Español</a>
        <span>|</span>
        <a href="#" className="hover:underline">Accessibility</a>
        <span>|</span>
        <a href="#" className="hover:underline">Contact</a>
      </div>

      {/* Header */}
      <header className={`mx-4 mt-2 px-6 py-4 flex items-center justify-between ${glassCard} ${innerHighlight}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏛️</span>
          <span className="text-xl font-semibold tracking-tight">EchoGov</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
          <a href="#" className="hover:text-white">Services</a>
          <a href="#" className="hover:text-white">Forms</a>
          <a href="#" className="hover:text-white">Appointments</a>
          <a href="#" className="hover:text-white">Help</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-4 mt-6 px-8 py-8 text-center">
        <h1 className="text-2xl md:text-3xl font-semibold mb-2">Court Summons Date</h1>
        <p style={{ color: "rgba(255,255,255,0.7)" }} className="max-w-xl mx-auto">
          Schedule your appointment. Select the fiscal year for your court summons below.
        </p>
      </section>

      {/* Instruction Banner */}
      {task?.instruction_text && (
        <div className={`mx-auto max-w-2xl px-6 py-3 mb-4 ${glassCard} ${innerHighlight} text-center`}>
          <p className="font-medium" style={{ color: "#facc15" }}>
            ✦ {task.instruction_text}
          </p>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 pb-12">
        <div className={`w-full max-w-2xl p-6 ${glassCard} ${innerHighlight}`}>
          {/* Form Context Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm mb-1 font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                Service Type
              </label>
              <select
                className="w-full px-4 py-2 rounded-xl bg-white/15 backdrop-blur-xl border border-white/30 text-white placeholder-white/60 outline-none"
                defaultValue=""
              >
                <option value="" disabled style={{ color: "#333" }}>Select service...</option>
                <option value="civil" style={{ color: "#333" }}>Civil Court</option>
                <option value="criminal" style={{ color: "#333" }}>Criminal Court</option>
                <option value="family" style={{ color: "#333" }}>Family Court</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1 font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                Applicant ID
              </label>
              <input
                type="text"
                placeholder="e.g. A-123456789"
                className="w-full px-4 py-2 rounded-xl bg-white/15 backdrop-blur-xl border border-white/30 text-white placeholder-white/60 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                Office Location
              </label>
              <select
                className="w-full px-4 py-2 rounded-xl bg-white/15 backdrop-blur-xl border border-white/30 text-white placeholder-white/60 outline-none"
                defaultValue=""
              >
                <option value="" disabled style={{ color: "#333" }}>Select office...</option>
                <option value="downtown" style={{ color: "#333" }}>Downtown Courthouse</option>
                <option value="north" style={{ color: "#333" }}>North District Office</option>
                <option value="south" style={{ color: "#333" }}>South District Office</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1 font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                Confirmation Email
              </label>
              <input
                type="email"
                placeholder="your@email.gov"
                className="w-full px-4 py-2 rounded-xl bg-white/15 backdrop-blur-xl border border-white/30 text-white placeholder-white/60 outline-none"
              />
            </div>
          </div>

          {/* Picker Card */}
          <div data-testid="picker-root" data-widget-id="summons_date" className="mt-2">
            <label className="block text-sm mb-2 font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
              Summons Date
            </label>

            {/* Trigger */}
            <button
              data-testid="picker-trigger"
              onClick={() => setPanelOpen(!panelOpen)}
              className={`w-full px-4 py-3 text-left rounded-2xl bg-white/15 backdrop-blur-[16px] border border-white/30 text-white font-medium hover:bg-white/20 transition-colors ${innerHighlight}`}
            >
              {selected ? selected : "Pick a fiscal year"}
              <span className="float-right" style={{ color: "rgba(255,255,255,0.6)" }}>◇</span>
            </button>

            {/* Panel */}
            {panelOpen && (
              <div
                data-testid="picker-panel"
                className={`mt-3 p-5 rounded-3xl bg-white/18 backdrop-blur-[24px] backdrop-saturate-150 border border-white/35 ${innerHighlight}`}
                style={{
                  boxShadow: "0 8px 32px rgba(31,38,135,0.25)",
                  background: "rgba(255,255,255,0.18)",
                }}
              >
                {/* Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    data-testid="picker-nav-prev"
                    onClick={handlePrev}
                    className="px-3 py-1 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-colors text-white font-medium"
                  >
                    ‹‹
                  </button>
                  <span data-testid="picker-visible-decade" className="font-semibold text-lg">
                    {decadeStart}–{decadeStart + 9}
                  </span>
                  <button
                    data-testid="picker-nav-next"
                    onClick={handleNext}
                    className="px-3 py-1 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-colors text-white font-medium"
                  >
                    ››
                  </button>
                </div>

                {/* Constraint hint */}
                {constraintType !== "none" && (
                  <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Constraint: {constraintType.replace(/_/g, " ")}
                    {constraintParams.max_days && ` (max ${constraintParams.max_days} days)`}
                    {constraintParams.min_hours && ` (min ${constraintParams.min_hours}h advance)`}
                  </p>
                )}

                {/* FY Grid */}
                <div data-testid="picker-fy-grid" className="grid grid-cols-5 gap-2">
                  {fyYears.map((y) => {
                    const disabled = isFYDisabled(y);
                    const isSelected = selected === `FY${y}`;
                    return (
                      <button
                        key={y}
                        data-testid={`picker-cell-FY${y}`}
                        data-fy={y}
                        disabled={disabled}
                        aria-disabled={disabled ? "true" : undefined}
                        onClick={() => handleSelect(y)}
                        className={`py-2 px-1 rounded-xl text-sm font-medium transition-all ${
                          disabled
                            ? "opacity-30 cursor-not-allowed"
                            : isSelected
                            ? "bg-white text-transparent border border-white/50"
                            : "bg-white/10 border border-white/20 hover:bg-white/25 text-white"
                        }`}
                        style={
                          isSelected
                            ? {
                                background: "#ffffff",
                                color: "#7873f5",
                                fontWeight: 600,
                              }
                            : disabled
                            ? { color: "rgba(255,255,255,0.35)" }
                            : undefined
                        }
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

            {/* Submit */}
            <div className="mt-4 flex items-center gap-4">
              <button
                data-testid="picker-submit"
                disabled={!selected || !/^FY\d{4}$/.test(selected)}
                onClick={handleSubmit}
                className={`px-6 py-3 rounded-2xl font-semibold transition-all ${
                  selected && /^FY\d{4}$/.test(selected)
                    ? "bg-white/90 text-[#7873f5] hover:bg-white cursor-pointer shadow-lg"
                    : "bg-white/10 text-white/40 cursor-not-allowed border border-white/15"
                }`}
                style={
                  selected && /^FY\d{4}$/.test(selected)
                    ? { boxShadow: "0 4px 16px rgba(120,115,245,0.3)" }
                    : undefined
                }
              >
                Submit
              </button>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                Format: FY{"{YYYY}"}
              </span>
            </div>
          </div>
        </div>

        {/* Supporting Content */}
        <div className={`w-full max-w-2xl mt-6 p-6 ${glassCard} ${innerHighlight}`}>
          <h2 className="text-lg font-semibold mb-3">Required Documents</h2>
          <ul className="space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
            <li className="flex items-center gap-2">✧ Valid government-issued photo ID</li>
            <li className="flex items-center gap-2">✧ Court summons notice (original)</li>
            <li className="flex items-center gap-2">✧ Proof of address (utility bill or bank statement)</li>
            <li className="flex items-center gap-2">✧ Case reference number</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6 mb-3">Office Hours</h2>
          <div className="overflow-hidden rounded-xl border border-white/20">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.1)" }}>
                  <th className="px-4 py-2 text-left font-medium">Day</th>
                  <th className="px-4 py-2 text-left font-medium">Hours</th>
                </tr>
              </thead>
              <tbody style={{ color: "rgba(255,255,255,0.75)" }}>
                <tr className="border-t border-white/10">
                  <td className="px-4 py-2">Monday – Friday</td>
                  <td className="px-4 py-2">8:00 AM – 5:00 PM</td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="px-4 py-2">Saturday</td>
                  <td className="px-4 py-2">9:00 AM – 1:00 PM</td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="px-4 py-2">Sunday</td>
                  <td className="px-4 py-2">Closed</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto px-6 py-8 border-t border-white/15" style={{ background: "rgba(0,0,0,0.15)" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
          <div>
            <h3 className="font-semibold text-white mb-2">EchoGov</h3>
            <p>123 Government Plaza<br />Washington, DC 20001</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">Legal</h3>
            <ul className="space-y-1">
              <li><a href="#" className="hover:underline">Privacy Act Statement</a></li>
              <li><a href="#" className="hover:underline">FOIA</a></li>
              <li><a href="#" className="hover:underline">Section 508 Accessibility</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">Resources</h3>
            <ul className="space-y-1">
              <li><a href="#" className="hover:underline">USA.gov</a></li>
              <li><a href="#" className="hover:underline">Forms & Publications</a></li>
              <li><a href="#" className="hover:underline">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center mt-6 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          © 2025 EchoGov. An official government service.
        </div>
      </footer>
    </div>
  );
}
