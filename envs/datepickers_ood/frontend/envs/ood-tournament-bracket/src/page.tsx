import React, { useState, useEffect, useMemo, useCallback } from 'react';

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

const NOW = new Date('2025-09-01T09:00:00');

const adImg = `data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%20320%20180%27%20width%3D%27320%27%20height%3D%27180%27%3E%3Crect%20width%3D%27320%27%20height%3D%27180%27%20fill%3D%27%23ffffff%27%2F%3E%3Cpath%20d%3D%27M40%20110%20Q%20130%2060%20250%2080%20Q%20200%20110%2070%20130%20Z%27%20fill%3D%27%23111827%27%20%2F%3E%3Cline%20x1%3D%2730%27%20y1%3D%27150%27%20x2%3D%27290%27%20y2%3D%27150%27%20stroke%3D%27%239ca3af%27%20stroke-width%3D%272%27%2F%3E%3Cline%20x1%3D%2730%27%20y1%3D%27160%27%20x2%3D%27290%27%20y2%3D%27160%27%20stroke%3D%27%239ca3af%27%20stroke-width%3D%271%27%2F%3E%3Ctext%20x%3D%27160%27%20y%3D%2740%27%20font-family%3D%27Helvetica%2CArial%2Csans-serif%27%20font-size%3D%2722%27%20font-weight%3D%27900%27%20text-anchor%3D%27middle%27%20fill%3D%27%23111827%27%3EEchoGear%3C%2Ftext%3E%3Ctext%20x%3D%27160%27%20y%3D%2762%27%20font-family%3D%27Helvetica%2CArial%2Csans-serif%27%20font-size%3D%2710%27%20text-anchor%3D%27middle%27%20fill%3D%27%236b7280%27%20letter-spacing%3D%272%27%3EECHO%20GEAR.%3C%2Ftext%3E%3C%2Fsvg%3E`; // brand-illustration EchoGear
const espnImg = `data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%20320%20180%27%20width%3D%27320%27%20height%3D%27180%27%3E%3Crect%20width%3D%27320%27%20height%3D%27180%27%20fill%3D%27%23fee2e2%27%2F%3E%3Crect%20x%3D%2740%27%20y%3D%2780%27%20width%3D%27240%27%20height%3D%2770%27%20rx%3D%274%27%20fill%3D%27%23111827%27%2F%3E%3Crect%20x%3D%2750%27%20y%3D%2790%27%20width%3D%27220%27%20height%3D%2735%27%20fill%3D%27%23dc2626%27%2F%3E%3Ctext%20x%3D%27160%27%20y%3D%27115%27%20font-family%3D%27monospace%27%20font-size%3D%2720%27%20font-weight%3D%27bold%27%20text-anchor%3D%27middle%27%20fill%3D%27%23fbbf24%27%3EHOME%2084%20%20AWAY%2079%3C%2Ftext%3E%3Cpath%20d%3D%27M40%2080%20Q%20160%2030%20280%2080%27%20fill%3D%27none%27%20stroke%3D%27%23374151%27%20stroke-width%3D%273%27%2F%3E%3Ctext%20x%3D%27160%27%20y%3D%27168%27%20font-family%3D%27Helvetica%2Csans-serif%27%20font-size%3D%2714%27%20font-weight%3D%27bold%27%20text-anchor%3D%27middle%27%20fill%3D%27%23dc2626%27%3EEchoSports%3C%2Ftext%3E%3C%2Fsvg%3E`; // brand-illustration ESPN+
const athleticImg = `data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%20320%20180%27%20width%3D%27320%27%20height%3D%27180%27%3E%3Crect%20width%3D%27320%27%20height%3D%27180%27%20fill%3D%27%23f9fafb%27%2F%3E%3Crect%20x%3D%2780%27%20y%3D%2730%27%20width%3D%27160%27%20height%3D%27120%27%20fill%3D%27%23ffffff%27%20stroke%3D%27%231f2937%27%20stroke-width%3D%272%27%2F%3E%3Crect%20x%3D%2790%27%20y%3D%2740%27%20width%3D%27140%27%20height%3D%2714%27%20fill%3D%27%231f2937%27%2F%3E%3Cline%20x1%3D%2790%27%20y1%3D%2765%27%20x2%3D%27230%27%20y2%3D%2765%27%20stroke%3D%27%239ca3af%27%20stroke-width%3D%271.5%27%2F%3E%3Cline%20x1%3D%2790%27%20y1%3D%2775%27%20x2%3D%27220%27%20y2%3D%2775%27%20stroke%3D%27%239ca3af%27%20stroke-width%3D%271.5%27%2F%3E%3Cline%20x1%3D%2790%27%20y1%3D%2785%27%20x2%3D%27225%27%20y2%3D%2785%27%20stroke%3D%27%239ca3af%27%20stroke-width%3D%271.5%27%2F%3E%3Crect%20x%3D%2790%27%20y%3D%27100%27%20width%3D%2765%27%20height%3D%2740%27%20fill%3D%27%23dc2626%27%2F%3E%3Cline%20x1%3D%27165%27%20y1%3D%27105%27%20x2%3D%27225%27%20y2%3D%27105%27%20stroke%3D%27%239ca3af%27%20stroke-width%3D%271.5%27%2F%3E%3Cline%20x1%3D%27165%27%20y1%3D%27115%27%20x2%3D%27225%27%20y2%3D%27115%27%20stroke%3D%27%239ca3af%27%20stroke-width%3D%271.5%27%2F%3E%3Cline%20x1%3D%27165%27%20y1%3D%27125%27%20x2%3D%27220%27%20y2%3D%27125%27%20stroke%3D%27%239ca3af%27%20stroke-width%3D%271.5%27%2F%3E%3Ctext%20x%3D%27160%27%20y%3D%27170%27%20font-family%3D%27Georgia%2Cserif%27%20font-size%3D%2713%27%20font-style%3D%27italic%27%20text-anchor%3D%27middle%27%20fill%3D%27%231f2937%27%3EEchoDesk%3C%2Ftext%3E%3C%2Fsvg%3E`; // brand-illustration The Athletic
const brImg = `data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%20320%20180%27%20width%3D%27320%27%20height%3D%27180%27%3E%3Crect%20width%3D%27320%27%20height%3D%27180%27%20fill%3D%27%23fffbeb%27%2F%3E%3Cpolygon%20points%3D%2740%2C150%20280%2C150%20260%2C90%2060%2C90%27%20fill%3D%27%23fbbf24%27%2F%3E%3Cline%20x1%3D%2760%27%20y1%3D%2790%27%20x2%3D%2760%27%20y2%3D%27150%27%20stroke%3D%27%2392400e%27%20stroke-width%3D%272%27%2F%3E%3Cline%20x1%3D%27110%27%20y1%3D%2790%27%20x2%3D%27110%27%20y2%3D%27150%27%20stroke%3D%27%2392400e%27%20stroke-width%3D%272%27%2F%3E%3Cline%20x1%3D%27160%27%20y1%3D%2790%27%20x2%3D%27160%27%20y2%3D%27150%27%20stroke%3D%27%2392400e%27%20stroke-width%3D%272%27%2F%3E%3Cline%20x1%3D%27210%27%20y1%3D%2790%27%20x2%3D%27210%27%20y2%3D%27150%27%20stroke%3D%27%2392400e%27%20stroke-width%3D%272%27%2F%3E%3Cline%20x1%3D%27260%27%20y1%3D%2790%27%20x2%3D%27260%27%20y2%3D%27150%27%20stroke%3D%27%2392400e%27%20stroke-width%3D%272%27%2F%3E%3Cline%20x1%3D%2740%27%20y1%3D%27110%27%20x2%3D%27280%27%20y2%3D%27110%27%20stroke%3D%27%2392400e%27%20stroke-width%3D%271.5%27%2F%3E%3Cline%20x1%3D%2740%27%20y1%3D%27130%27%20x2%3D%27280%27%20y2%3D%27130%27%20stroke%3D%27%2392400e%27%20stroke-width%3D%271.5%27%2F%3E%3Cpolygon%20points%3D%27220%2C30%20280%2C40%20280%2C70%20220%2C80%20240%2C55%27%20fill%3D%27%23dc2626%27%2F%3E%3Ctext%20x%3D%27160%27%20y%3D%27170%27%20font-family%3D%27Helvetica%2Csans-serif%27%20font-size%3D%2712%27%20font-weight%3D%27bold%27%20text-anchor%3D%27middle%27%20fill%3D%27%231f2937%27%3EEchoReport%3C%2Ftext%3E%3C%2Fsvg%3E`; // brand-illustration Bleacher Report

function getDecadeStart(year: number): number {
  return Math.floor(year / 10) * 10;
}

function isFYDisabled(fy: number, constraintType?: string, constraintParams?: any): boolean {
  if (!constraintType || constraintType === 'none') return false;

  const nowYear = NOW.getFullYear();
  const nowMonth = NOW.getMonth();

  if (constraintType === 'max_n_days_from_today') {
    const maxDays = constraintParams?.max_days ?? 365;
    const maxDate = new Date(NOW.getTime() + maxDays * 24 * 60 * 60 * 1000);
    const maxFY = maxDate.getFullYear() + (maxDate.getMonth() >= 6 ? 1 : 0);
    const currentFY = nowYear + (nowMonth >= 6 ? 1 : 0);
    return fy > maxFY || fy < currentFY;
  }

  if (constraintType === 'min_advance_notice') {
    const minHours = constraintParams?.min_hours ?? 72;
    const minDate = new Date(NOW.getTime() + minHours * 60 * 60 * 1000);
    const minFY = minDate.getFullYear() + (minDate.getMonth() >= 6 ? 1 : 0);
    return fy < minFY;
  }

  if (constraintType === 'quarter_aligned') {
    return false;
  }

  return false;
}

export default function Page_ood_tournament_bracket(props: GeneratedPageProps): JSX.Element {
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const [selected, setSelected] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>(""); // compound-widget
  const isCompound = activeTask?.task_type === "compound";
  const [panelOpen, setPanelOpen] = useState(false);
  const [decadeStart, setDecadeStart] = useState(() => getDecadeStart(NOW.getFullYear()));

  useEffect(() => {
    const task = (window as any).__ACTIVE_TASK__ || null;
    if (task) {
      setActiveTask(task);
      if (task.initial_visible_state) {
        const vy = task.initial_visible_state.visible_year;
        if (vy) {
          setDecadeStart(getDecadeStart(vy));
        }
      }
    }
  }, []);

  const constraintType = activeTask?.constraint_type;
  const constraintParams = activeTask?.constraint_params;

  const fiscalYears = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => decadeStart + i);
  }, [decadeStart]);

  const handleSelect = useCallback((fy: number) => {
    if (isFYDisabled(fy, constraintType, constraintParams)) return;
    setSelected(`FY${fy}`);
  }, [constraintType, constraintParams]);

  const handleSubmit = useCallback(() => {
    if (!selected || !/^FY\d{4}$/.test(selected)) return;
    props.onSubmit({
      type: 'fiscal_year',
      value: isCompound && selectedTime ? `${selected}|${selectedTime}:00` : selected,
      raw: {
        widget_id: 'bracket_date',
        picker: 'fiscal_year_picker',
        state: { selected, decadeStart, panelOpen },
      },
    });
  }, [selected, decadeStart, panelOpen, props]);

  const instructionText = activeTask?.instruction_text || 'Select a fiscal year for the tournament bracket.';

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", color: '#1a1a1a', fontSize: '13px', lineHeight: '1.45' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: '#cbd5e1', backgroundColor: '#1a1a1a' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between py-2 px-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">🏟️</span>
            <span className="text-white font-bold uppercase tracking-wide" style={{ fontSize: '14px', letterSpacing: '0.02em' }}>EchoMatch</span>
          </div>
          <nav className="flex gap-4">
            {['Schedule', 'Standings', 'Teams', 'Tickets'].map((item) => (
              <a key={item} href="#" className="text-xs uppercase tracking-wide" style={{ color: '#9ca3af', letterSpacing: '0.02em' }}>{item}</a>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b" style={{ borderColor: '#cbd5e1', backgroundColor: '#f3f4f6' }}>
        <div className="max-w-6xl mx-auto py-4 px-4">
          <h1 className="font-bold uppercase tracking-wide" style={{ fontSize: '16px', letterSpacing: '0.02em', color: '#1a1a1a' }}>Tournament Bracket</h1>
          <p className="mt-1" style={{ fontSize: '12px', color: '#6b7280' }}>Book your match · Select a fiscal year to lock in your bracket position</p>
        </div>
      </section>

      {/* Instruction Banner */}
      <section className="border-b" style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}>
        <div className="max-w-6xl mx-auto py-2 px-4">
          <p className="font-bold uppercase" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.02em' }}>§ INSTRUCTION</p>
          <p className="mt-1" style={{ fontSize: '13px', color: '#1a1a1a' }}>{instructionText}</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-4 flex gap-4">
        {/* Main Content */}
        <div className="flex-1">
          {/* Form Context */}
          <div className="border mb-4 p-3" style={{ borderColor: '#cbd5e1' }}>
            <p className="font-bold uppercase mb-2" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.02em', backgroundColor: '#f3f4f6', margin: '-12px -12px 8px -12px', padding: '4px 12px', borderBottom: '1px solid #e5e7eb' }}>Match Configuration</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block uppercase font-bold mb-1" style={{ fontSize: '10px', color: '#6b7280', letterSpacing: '0.02em' }}>League</label>
                <select className="w-full border py-1 px-2 bg-white" style={{ borderColor: '#cbd5e1', fontSize: '12px', borderRadius: '0' }}>
                  <option>Echo Premier</option>
                  <option>Echo Liga</option>
                  <option>Echo Serie</option>
                  <option>Echo Bundes</option>
                </select>
              </div>
              <div>
                <label className="block uppercase font-bold mb-1" style={{ fontSize: '10px', color: '#6b7280', letterSpacing: '0.02em' }}>Venue</label>
                <select className="w-full border py-1 px-2 bg-white" style={{ borderColor: '#cbd5e1', fontSize: '12px', borderRadius: '0' }}>
                  <option>Main Stadium</option>
                  <option>Arena West</option>
                  <option>Central Pitch</option>
                </select>
              </div>
              <div>
                <label className="block uppercase font-bold mb-1" style={{ fontSize: '10px', color: '#6b7280', letterSpacing: '0.02em' }}>Matchup</label>
                <select className="w-full border py-1 px-2 bg-white" style={{ borderColor: '#cbd5e1', fontSize: '12px', borderRadius: '0' }}>
                  <option>Team A vs Team B</option>
                  <option>Team C vs Team D</option>
                  <option>Quarterfinal TBD</option>
                </select>
              </div>
              <div>
                <label className="block uppercase font-bold mb-1" style={{ fontSize: '10px', color: '#6b7280', letterSpacing: '0.02em' }}>Broadcast Window</label>
                <div className="flex gap-2" style={{ fontSize: '11px' }}>
                  <label className="flex items-center gap-1"><input type="radio" name="broadcast" defaultChecked /> Morning</label>
                  <label className="flex items-center gap-1"><input type="radio" name="broadcast" /> Evening</label>
                  <label className="flex items-center gap-1"><input type="radio" name="broadcast" /> Primetime</label>
                </div>
              </div>
            </div>
          </div>

          {/* Picker Card */}
          <div className="border p-3" style={{ borderColor: '#cbd5e1' }} data-widget-id="bracket_date">
            <p className="font-bold uppercase" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.02em', backgroundColor: '#f3f4f6', margin: '-12px -12px 8px -12px', padding: '4px 12px', borderBottom: '1px solid #e5e7eb' }}>Bracket Date</p>

            <div data-testid="picker-root" className="fy-picker">
              <button
                data-testid="picker-trigger"
                onClick={() => setPanelOpen(!panelOpen)}
                className="border py-1 px-2 w-full text-left flex items-center justify-between"
                style={{ borderColor: '#cbd5e1', fontSize: '12px', borderRadius: '0', backgroundColor: '#ffffff' }}
              >
                <span>{selected ? selected : 'Select fiscal year…'}</span>
                <span style={{ color: '#6b7280', fontSize: '10px' }}>{panelOpen ? '▾' : '▸'}</span>
              </button>

              {panelOpen && (
                <div data-testid="picker-panel" className="border mt-1" style={{ borderColor: '#cbd5e1' }}>
                  {/* Navigation */}
                  <div className="flex items-center justify-between" style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb', padding: '4px 8px' }}>
                    <button
                      data-testid="picker-nav-prev"
                      onClick={() => setDecadeStart(decadeStart - 10)}
                      className="px-1"
                      style={{ color: '#6b7280', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}
                    >◂◂</button>
                    <span data-testid="picker-visible-decade" className="font-bold uppercase" style={{ fontSize: '12px', letterSpacing: '0.02em' }}>
                      {decadeStart}–{decadeStart + 9}
                    </span>
                    <button
                      data-testid="picker-nav-next"
                      onClick={() => setDecadeStart(decadeStart + 10)}
                      className="px-1"
                      style={{ color: '#6b7280', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}
                    >▸▸</button>
                  </div>

                  {/* FY Grid */}
                  <div data-testid="picker-fy-grid" className="grid grid-cols-5">
                    {fiscalYears.map((y) => {
                      const disabled = isFYDisabled(y, constraintType, constraintParams);
                      const isSelected = selected === `FY${y}`;
                      return (
                        <button
                          key={y}
                          data-testid={`picker-cell-FY${y}`}
                          data-fy={y}
                          disabled={disabled}
                          aria-disabled={disabled ? 'true' : undefined}
                          onClick={() => { if (!disabled) handleSelect(y); }}
                          className="border text-center py-2 px-1"
                          style={{
                            borderColor: '#e5e7eb',
                            fontSize: '11px',
                            fontWeight: isSelected ? 700 : 400,
                            backgroundColor: isSelected ? '#1a1a1a' : disabled ? '#f9fafb' : '#ffffff',
                            color: isSelected ? '#ffffff' : disabled ? '#9ca3af' : '#1a1a1a',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            borderRadius: '0',
                          }}
                        >
                          FY{y}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <span data-testid="picker-selected-value" hidden>{selected}</span>

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
                disabled={!selected || !/^FY\d{4}$/.test(selected)}
                onClick={handleSubmit}
                className="mt-2 w-full border py-1 px-3 font-bold uppercase"
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.02em',
                  borderColor: '#cbd5e1',
                  borderRadius: '0',
                  backgroundColor: (!selected || !/^FY\d{4}$/.test(selected)) ? '#f3f4f6' : '#1a1a1a',
                  color: (!selected || !/^FY\d{4}$/.test(selected)) ? '#9ca3af' : '#ffffff',
                  cursor: (!selected || !/^FY\d{4}$/.test(selected)) ? 'not-allowed' : 'pointer',
                }}
              >
                Submit
              </button>
            </div>

            {/* Helper text */}
            <p className="mt-2" style={{ fontSize: '10px', color: '#6b7280' }}>Answer format: FY followed by 4-digit year (e.g. FY2026)</p>
          </div>

          {/* Advertisement — between sections */}
          <aside
            data-type="advertisement"
            data-ad-placement="between_sections"
            data-advertiser="EchoGear"
            role="complementary"
            aria-label="Advertisement"
            className="border mt-4 p-3"
            style={{ borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}
          >
            <span className="text-[10px] uppercase tracking-widest" style={{ color: '#9ca3af' }}>Advertisement</span>
            <a
              href="#"
              target="_blank"
              rel="sponsored noopener noreferrer"
              data-ad-id="ad-1"
              className="block mt-2"
            >
              <img src={adImg} alt="Train Like a Champion — New EchoStride 41" style={{ width: '100%', maxWidth: '320px', height: 'auto' }} />
              <p className="mt-1 font-bold" style={{ fontSize: '12px', color: '#1a1a1a' }}>Train Like a Champion — New EchoStride 41</p>
              <p style={{ fontSize: '10px', color: '#6b7280' }}>EchoGear</p>
            </a>
          </aside>

          {/* Upcoming Fixtures */}
          <div className="border mt-4" style={{ borderColor: '#cbd5e1' }}>
            <p className="font-bold uppercase" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.02em', backgroundColor: '#f3f4f6', padding: '4px 12px', borderBottom: '1px solid #e5e7eb' }}>Upcoming Fixtures</p>
            <table className="w-full" style={{ fontSize: '11px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                  <th className="text-left py-1 px-2 font-bold uppercase" style={{ fontSize: '10px', letterSpacing: '0.02em', color: '#6b7280' }}>Date</th>
                  <th className="text-left py-1 px-2 font-bold uppercase" style={{ fontSize: '10px', letterSpacing: '0.02em', color: '#6b7280' }}>Match</th>
                  <th className="text-right py-1 px-2 font-bold uppercase" style={{ fontSize: '10px', letterSpacing: '0.02em', color: '#6b7280' }}>Venue</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#e5e7eb' }}>
                <tr><td className="py-1 px-2">Sep 15, 2025</td><td className="py-1 px-2">Falcons vs Eagles</td><td className="py-1 px-2 text-right">Main Stadium</td></tr>
                <tr><td className="py-1 px-2">Sep 22, 2025</td><td className="py-1 px-2">Lions vs Bears</td><td className="py-1 px-2 text-right">Arena West</td></tr>
                <tr><td className="py-1 px-2">Oct 01, 2025</td><td className="py-1 px-2">Wolves vs Hawks</td><td className="py-1 px-2 text-right">Central Pitch</td></tr>
                <tr><td className="py-1 px-2">Oct 08, 2025</td><td className="py-1 px-2">Sharks vs Panthers</td><td className="py-1 px-2 text-right">Main Stadium</td></tr>
              </tbody>
            </table>
          </div>

          {/* Leaderboard */}
          <div className="border mt-4" style={{ borderColor: '#cbd5e1' }}>
            <p className="font-bold uppercase" style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.02em', backgroundColor: '#f3f4f6', padding: '4px 12px', borderBottom: '1px solid #e5e7eb' }}>Leaderboard</p>
            <table className="w-full" style={{ fontSize: '11px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                  <th className="text-left py-1 px-2 font-bold uppercase" style={{ fontSize: '10px', letterSpacing: '0.02em', color: '#6b7280' }}>Rank</th>
                  <th className="text-left py-1 px-2 font-bold uppercase" style={{ fontSize: '10px', letterSpacing: '0.02em', color: '#6b7280' }}>Team</th>
                  <th className="text-right py-1 px-2 font-bold uppercase" style={{ fontSize: '10px', letterSpacing: '0.02em', color: '#6b7280' }}>W</th>
                  <th className="text-right py-1 px-2 font-bold uppercase" style={{ fontSize: '10px', letterSpacing: '0.02em', color: '#6b7280' }}>L</th>
                  <th className="text-right py-1 px-2 font-bold uppercase" style={{ fontSize: '10px', letterSpacing: '0.02em', color: '#6b7280' }}>Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#e5e7eb' }}>
                <tr><td className="py-1 px-2">1</td><td className="py-1 px-2">Falcons</td><td className="py-1 px-2 text-right">12</td><td className="py-1 px-2 text-right">2</td><td className="py-1 px-2 text-right">36</td></tr>
                <tr><td className="py-1 px-2">2</td><td className="py-1 px-2">Eagles</td><td className="py-1 px-2 text-right">10</td><td className="py-1 px-2 text-right">4</td><td className="py-1 px-2 text-right">30</td></tr>
                <tr><td className="py-1 px-2">3</td><td className="py-1 px-2">Lions</td><td className="py-1 px-2 text-right">9</td><td className="py-1 px-2 text-right">5</td><td className="py-1 px-2 text-right">27</td></tr>
                <tr><td className="py-1 px-2">4</td><td className="py-1 px-2">Wolves</td><td className="py-1 px-2 text-right">8</td><td className="py-1 px-2 text-right">6</td><td className="py-1 px-2 text-right">24</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-56 hidden md:block">
          <div className="border p-2 mb-4" style={{ borderColor: '#cbd5e1' }}>
            <p className="font-bold uppercase mb-2" style={{ fontSize: '10px', color: '#6b7280', letterSpacing: '0.02em' }}>Ticket Tier</p>
            <div className="space-y-1" style={{ fontSize: '11px' }}>
              <label className="flex items-center gap-1"><input type="radio" name="tier" defaultChecked /> Standard</label>
              <label className="flex items-center gap-1"><input type="radio" name="tier" /> Premium</label>
              <label className="flex items-center gap-1"><input type="radio" name="tier" /> VIP</label>
            </div>
          </div>
          <div className="border p-2" style={{ borderColor: '#cbd5e1' }}>
            <p className="font-bold uppercase mb-2" style={{ fontSize: '10px', color: '#6b7280', letterSpacing: '0.02em' }}>Broadcasters</p>
            <ul className="space-y-1" style={{ fontSize: '11px', color: '#6b7280' }}>
              <li>▸ EchoSports</li>
              <li>▸ EchoSport</li>
              <li>▸ EchoSports Net</li>
              <li>▸ EchoLive</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Sponsored Content */}
      <section
        data-type="sponsored-content"
        role="complementary"
        aria-label="Paid Partner Content"
        className="max-w-6xl mx-auto px-4 py-4 border-t"
        style={{ borderColor: '#e5e7eb' }}
      >
        <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#9ca3af' }}>Paid Partner Content</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
          <a href="#" target="_blank" rel="sponsored noopener noreferrer" data-sponsor="ESPN+" className="border p-2" style={{ borderColor: '#e5e7eb', textDecoration: 'none', color: '#1a1a1a' }}>
            <img src={espnImg} alt="5 Bracket Strategies the Pros Use Every March" style={{ width: '100%', height: 'auto' }} />
            <h3 className="font-bold mt-1" style={{ fontSize: '12px' }}>5 Bracket Strategies the Pros Use Every March</h3>
            <p style={{ fontSize: '10px', color: '#6b7280' }}>by EchoSports</p>
          </a>
          <a href="#" target="_blank" rel="sponsored noopener noreferrer" data-sponsor="The Athletic" className="border p-2" style={{ borderColor: '#e5e7eb', textDecoration: 'none', color: '#1a1a1a' }}>
            <img src={athleticImg} alt="Inside the Locker Room: A Coach's Daily Routine" style={{ width: '100%', height: 'auto' }} />
            <h3 className="font-bold mt-1" style={{ fontSize: '12px' }}>Inside the Locker Room: A Coach&#39;s Daily Routine</h3>
            <p style={{ fontSize: '10px', color: '#6b7280' }}>by EchoDesk</p>
          </a>
          <a href="#" target="_blank" rel="sponsored noopener noreferrer" data-sponsor="Bleacher Report" className="border p-2" style={{ borderColor: '#e5e7eb', textDecoration: 'none', color: '#1a1a1a' }}>
            <img src={brImg} alt="Underdog Stories That Defined the Decade" style={{ width: '100%', height: 'auto' }} />
            <h3 className="font-bold mt-1" style={{ fontSize: '12px' }}>Underdog Stories That Defined the Decade</h3>
            <p style={{ fontSize: '10px', color: '#6b7280' }}>by EchoReport</p>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-4" style={{ borderColor: '#cbd5e1', backgroundColor: '#f3f4f6' }}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center" style={{ fontSize: '10px', color: '#6b7280' }}>
            <div className="flex gap-3">
              <span className="uppercase font-bold" style={{ letterSpacing: '0.02em' }}>League Partners:</span>
              <span>EchoFit</span>
              <span>·</span>
              <span>EchoCola</span>
              <span>·</span>
              <span>EchoAir</span>
            </div>
            <div className="flex gap-3">
              <a href="#" style={{ color: '#6b7280' }}>Terms</a>
              <a href="#" style={{ color: '#6b7280' }}>Privacy</a>
              <a href="#" style={{ color: '#6b7280' }}>Accessibility</a>
            </div>
          </div>
          <div className="mt-2 flex justify-between items-center" style={{ fontSize: '10px', color: '#9ca3af' }}>
            <span>© 2025 EchoMatch. All broadcasting rights reserved.</span>
            <div className="flex gap-2">
              <span>𝕏</span>
              <span>ⓕ</span>
              <span>▶</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
