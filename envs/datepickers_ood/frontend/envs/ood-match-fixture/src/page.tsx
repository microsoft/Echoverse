import React, { useState, useEffect, useMemo, useCallback } from 'react';

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

const NOW = new Date('2025-09-01T09:00:00');

type DurationUnits = { Y: number; M: number; D: number; H: number; MIN: number; S: number };

const UNITS: (keyof DurationUnits)[] = ['Y', 'M', 'D', 'H', 'MIN', 'S'];
const UNIT_LABELS: Record<keyof DurationUnits, string> = {
  Y: 'Years', M: 'Months', D: 'Days', H: 'Hours', MIN: 'Minutes', S: 'Seconds'
};

function buildIsoDuration(v: DurationUnits): string {
  let date = '';
  if (v.Y > 0) date += `${v.Y}Y`;
  if (v.M > 0) date += `${v.M}M`;
  if (v.D > 0) date += `${v.D}D`;
  let time = '';
  if (v.H > 0) time += `${v.H}H`;
  if (v.MIN > 0) time += `${v.MIN}M`;
  if (v.S > 0) time += `${v.S}S`;
  return `P${date}${time ? 'T' + time : ''}`;
}

function getMaxForUnit(unit: keyof DurationUnits, constraintType?: string, constraintParams?: any): number {
  if (constraintType === 'max_n_days_from_today' && constraintParams?.max_days) {
    if (unit === 'D') return constraintParams.max_days;
    if (unit === 'Y') return Math.floor(constraintParams.max_days / 365);
    if (unit === 'M') return Math.floor(constraintParams.max_days / 30);
  }
  switch (unit) {
    case 'Y': return 99;
    case 'M': return 11;
    case 'D': return 365;
    case 'H': return 23;
    case 'MIN': return 59;
    case 'S': return 59;
    default: return 99;
  }
}

export default function Page_ood_match_fixture(props: GeneratedPageProps): JSX.Element {
  const [values, setValues] = useState<DurationUnits>({ Y: 0, M: 0, D: 0, H: 0, MIN: 0, S: 0 });
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);

  useEffect(() => {
    const task = window.__ACTIVE_TASK__ || null;
    if (task) setActiveTask(task);
  }, []);

  const isoDuration = useMemo(() => buildIsoDuration(values), [values]);
  const isValid = isoDuration !== 'P';

  const constraintType = activeTask?.constraint_type || 'none';
  const constraintParams = activeTask?.constraint_params || {};

  const increment = useCallback((unit: keyof DurationUnits) => {
    setValues(prev => {
      const max = getMaxForUnit(unit, constraintType, constraintParams);
      const next = prev[unit] + 1;
      if (next > max) return prev;
      return { ...prev, [unit]: next };
    });
  }, [constraintType, constraintParams]);

  const decrement = useCallback((unit: keyof DurationUnits) => {
    setValues(prev => {
      const next = prev[unit] - 1;
      if (next < 0) return prev;
      return { ...prev, [unit]: next };
    });
  }, []);

  const incrementBy = useCallback((amount: number) => {
    setValues(prev => {
      const max = getMaxForUnit('D', constraintType, constraintParams);
      const next = Math.min(prev.D + amount, max);
      return { ...prev, D: next };
    });
  }, [constraintType, constraintParams]);

  const decrementBy = useCallback((amount: number) => {
    setValues(prev => {
      const next = Math.max(prev.D - amount, 0);
      return { ...prev, D: next };
    });
  }, []);

  const handleSubmit = useCallback(() => {
    // guard removed (strip-only)
props.onSubmit({
      type: 'iso_duration',
      value: isoDuration,
      raw: { widget_id: 'fixture_date', picker: 'duration_picker', state: values },
    });
  }, [isoDuration, isValid, values, props]);

  const instructionText = activeTask?.instruction_text || 'Select the fixture duration.';

  return (
    <div className="min-h-screen" style={{ background: '#ffffff', color: '#000000', fontFamily: "system-ui, 'Helvetica', Arial, sans-serif" }}>
      {/* HEADER */}
      <header
        className="w-full border-b-4"
        style={{ borderColor: '#000000', background: '#000000' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏟️</span>
            <span
              className="font-bold uppercase tracking-tight text-2xl"
              style={{ color: '#ffffff', fontFamily: "'Times New Roman', serif", letterSpacing: '-0.02em' }}
            >
              EchoMatch
            </span>
          </div>
          <nav className="flex gap-1">
            {['Schedule', 'Standings', 'Teams', 'Tickets'].map(item => (
              <a
                key={item}
                href="#"
                className="px-3 py-2 font-bold uppercase text-sm border-4"
                style={{
                  borderColor: '#000000',
                  background: item === 'Tickets' ? '#ff0000' : '#ffff00',
                  color: '#000000',
                  boxShadow: '3px 3px 0 0 #000',
                }}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section
        className="w-full border-b-4 relative overflow-hidden"
        style={{ borderColor: '#000000', background: '#f0f0f0' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-12 flex items-center justify-between">
          <div>
            <h1
              className="font-black uppercase leading-none"
              style={{
                fontFamily: "'Times New Roman', serif",
                fontSize: '48px',
                letterSpacing: '-0.02em',
                lineHeight: '1.1',
              }}
            >
              Book your match
            </h1>
            <p className="mt-3 text-lg font-bold" style={{ color: '#000000' }}>
              Set the duration for your next fixture ● Season 2025
            </p>
            <div className="flex gap-6 mt-4">
              {[
                { label: 'MATCHES', val: '248' },
                { label: 'TEAMS', val: '32' },
                { label: 'VENUES', val: '16' },
              ].map(stat => (
                <div key={stat.label} className="border-4 px-4 py-2" style={{ borderColor: '#000000', background: '#ffff00', boxShadow: '4px 4px 0 0 #000' }}>
                  <div className="text-2xl font-black">{stat.val}</div>
                  <div className="text-xs font-bold uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div
            className="border-4 w-64 h-48 flex items-center justify-center"
            style={{ borderColor: '#000000', background: '#ff0000', boxShadow: '6px 6px 0 0 #000' }}
          >
            <span className="text-6xl">⚽</span>
          </div>
        </div>
      </section>

      {/* INSTRUCTION BANNER */}
      <div
        className="w-full border-b-4 px-4 py-3"
        style={{ borderColor: '#000000', background: '#ffff00' }}
      >
        <p className="max-w-7xl mx-auto font-bold text-lg uppercase tracking-tight" style={{ color: '#000000' }}>
          → {instructionText}
        </p>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — FORM CONTEXT */}
        <div className="lg:col-span-1 space-y-4">
          <div className="border-4 p-4" style={{ borderColor: '#000000', background: '#ffffff', boxShadow: '6px 6px 0 0 #000' }}>
            <label className="block font-bold uppercase text-sm mb-1">Sport / League</label>
            <select
              className="w-full border-4 p-2 font-bold bg-white"
              style={{ borderColor: '#000000', borderRadius: 0 }}
            >
              <option>Echo Premier</option>
              <option>Echo Liga</option>
              <option>Echo Serie</option>
              <option>Echo Bundes</option>
            </select>
          </div>

          <div className="border-4 p-4" style={{ borderColor: '#000000', background: '#ffffff', boxShadow: '6px 6px 0 0 #000' }}>
            <label className="block font-bold uppercase text-sm mb-1">Venue</label>
            <select
              className="w-full border-4 p-2 font-bold bg-white"
              style={{ borderColor: '#000000', borderRadius: 0 }}
            >
              <option>Echo National Stadium</option>
              <option>Echo Catalan Park</option>
              <option>Echo Milan Park</option>
              <option>Echo Alliance Arena</option>
            </select>
          </div>

          <div className="border-4 p-4" style={{ borderColor: '#000000', background: '#ffffff', boxShadow: '6px 6px 0 0 #000' }}>
            <label className="block font-bold uppercase text-sm mb-1">Team Matchup</label>
            <div className="flex gap-2">
              <input
                className="w-1/2 border-4 p-2 font-bold"
                style={{ borderColor: '#000000', borderRadius: 0 }}
                placeholder="HOME"
                readOnly
                value="Echo City"
              />
              <span className="font-black text-xl self-center">VS</span>
              <input
                className="w-1/2 border-4 p-2 font-bold"
                style={{ borderColor: '#000000', borderRadius: 0 }}
                placeholder="AWAY"
                readOnly
                value="Echo United"
              />
            </div>
          </div>

          <div className="border-4 p-4" style={{ borderColor: '#000000', background: '#ffffff', boxShadow: '6px 6px 0 0 #000' }}>
            <label className="block font-bold uppercase text-sm mb-2">Broadcast Window</label>
            {['12:30 KO', '15:00 KO', '17:30 KO', '20:00 KO'].map(slot => (
              <label key={slot} className="flex items-center gap-2 mb-1 font-bold text-sm cursor-pointer">
                <input type="radio" name="broadcast" className="w-4 h-4" style={{ accentColor: '#ff0000' }} />
                {slot}
              </label>
            ))}
          </div>

          <div className="border-4 p-4" style={{ borderColor: '#000000', background: '#ffffff', boxShadow: '6px 6px 0 0 #000' }}>
            <label className="block font-bold uppercase text-sm mb-2">Ticket Tier</label>
            {['Standard', 'Premium', 'VIP', 'Corporate Box'].map(tier => (
              <label key={tier} className="flex items-center gap-2 mb-1 font-bold text-sm cursor-pointer">
                <input type="radio" name="tier" className="w-4 h-4" style={{ accentColor: '#0000ff' }} />
                {tier}
              </label>
            ))}
          </div>
        </div>

        {/* CENTER — PICKER CARD */}
        <div className="lg:col-span-2">
          <div
            data-widget-id="fixture_date"
            data-testid="picker-root"
            className="border-4 p-6"
            style={{ borderColor: '#000000', background: '#ffffff', boxShadow: '6px 6px 0 0 #000' }}
          >
            <h2
              className="font-black uppercase mb-4"
              style={{ fontFamily: "'Times New Roman', serif", fontSize: '32px', letterSpacing: '-0.02em', lineHeight: '1.1' }}
            >
              Fixture Date
            </h2>

            {constraintType !== 'none' && (
              <div
                className="border-4 px-3 py-2 mb-4 font-bold text-sm"
                style={{ borderColor: '#ff0000', background: '#f0f0f0' }}
              >
                ■ Constraint: {constraintType}
                {constraintParams?.max_days && ` (max ${constraintParams.max_days} days)`}
              </div>
            )}

            {/* TRIGGER */}
            <button
              data-testid="picker-trigger"
              onClick={() => setPanelOpen(!panelOpen)}
              className="w-full border-4 p-4 font-bold uppercase text-left text-lg"
              style={{
                borderColor: '#000000',
                background: panelOpen ? '#ffff00' : '#f0f0f0',
                boxShadow: '4px 4px 0 0 #000',
                borderRadius: 0,
              }}
            >
              {isValid ? isoDuration : 'SET DURATION →'}
            </button>

            {/* PANEL */}
            {panelOpen && (
              <div
                data-testid="picker-panel"
                className="border-4 border-t-0 p-6"
                style={{ borderColor: '#000000', background: '#ffffff' }}
              >
                {/* STEPPER GRID */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {UNITS.map(unit => {
                    const max = getMaxForUnit(unit, constraintType, constraintParams);
                    const atMax = values[unit] >= max;
                    const atMin = values[unit] <= 0;
                    return (
                      <div
                        key={unit}
                        data-testid={`picker-stepper-${unit}`}
                        className="border-4 p-3"
                        style={{ borderColor: '#000000', background: '#f0f0f0' }}
                      >
                        <div className="text-xs font-bold uppercase mb-2 text-center" style={{ color: '#000000' }}>
                          {UNIT_LABELS[unit]}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <button
                            data-testid={`picker-cell-${unit}-dec`}
                            onClick={() => decrement(unit)}
                            disabled={atMin}
                            className="border-4 w-10 h-10 font-black text-xl flex items-center justify-center"
                            style={{
                              borderColor: '#000000',
                              background: atMin ? '#f0f0f0' : '#ff0000',
                              color: atMin ? '#999' : '#ffffff',
                              boxShadow: atMin ? 'none' : '3px 3px 0 0 #000',
                              borderRadius: 0,
                              cursor: atMin ? 'not-allowed' : 'pointer',
                            }}
                            aria-disabled={atMin}
                          >
                            −
                          </button>
                          <span
                            data-testid={`picker-value-${unit}`}
                            className="text-2xl font-black text-center min-w-[3ch]"
                            style={{ color: '#000000' }}
                          >
                            {values[unit]}
                          </span>
                          <button
                            data-testid={`picker-cell-${unit}-inc`}
                            onClick={() => increment(unit)}
                            disabled={atMax}
                            className="border-4 w-10 h-10 font-black text-xl flex items-center justify-center"
                            style={{
                              borderColor: '#000000',
                              background: atMax ? '#f0f0f0' : '#0000ff',
                              color: atMax ? '#999' : '#ffffff',
                              boxShadow: atMax ? 'none' : '3px 3px 0 0 #000',
                              borderRadius: 0,
                              cursor: atMax ? 'not-allowed' : 'pointer',
                            }}
                            aria-disabled={atMax}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* NAV PREV / NEXT — jump by 7 days */}
                <div className="flex gap-4 justify-center mb-4">
                  <button
                    data-testid="picker-nav-prev"
                    onClick={() => decrementBy(7)}
                    className="border-4 px-6 py-2 font-black text-lg uppercase"
                    style={{
                      borderColor: '#000000',
                      background: '#ffff00',
                      boxShadow: '4px 4px 0 0 #000',
                      borderRadius: 0,
                    }}
                  >
                    {'<<'} −7D
                  </button>
                  <button
                    data-testid="picker-nav-next"
                    onClick={() => incrementBy(7)}
                    className="border-4 px-6 py-2 font-black text-lg uppercase"
                    style={{
                      borderColor: '#000000',
                      background: '#ffff00',
                      boxShadow: '4px 4px 0 0 #000',
                      borderRadius: 0,
                    }}
                  >
                    +7D {'>>'}
                  </button>
                </div>

                {/* LIVE VALUE DISPLAY */}
                <div
                  className="border-4 p-3 text-center font-black text-xl uppercase"
                  style={{ borderColor: '#000000', background: isValid ? '#ffff00' : '#f0f0f0' }}
                >
                  {isValid ? isoDuration : 'P (EMPTY)'}
                </div>
              </div>
            )}

            {/* HIDDEN SELECTED VALUE */}
            <span data-testid="picker-selected-value" hidden>{isoDuration}</span>

            {/* SUBMIT */}
            <button
              data-testid="picker-submit"
              disabled={!isValid}
              onClick={handleSubmit}
              className="w-full mt-4 border-4 p-4 font-black uppercase text-xl"
              style={{
                borderColor: '#000000',
                background: isValid ? '#ff0000' : '#f0f0f0',
                color: isValid ? '#ffffff' : '#999',
                boxShadow: isValid ? '6px 6px 0 0 #000' : 'none',
                borderRadius: 0,
                cursor: isValid ? 'pointer' : 'not-allowed',
              }}
            >
              {isValid ? `SUBMIT → ${isoDuration}` : 'SUBMIT (SET DURATION FIRST)'}
            </button>
          </div>

          {/* UPCOMING FIXTURES */}
          <div className="mt-6 border-4 p-4" style={{ borderColor: '#000000', background: '#ffffff', boxShadow: '6px 6px 0 0 #000' }}>
            <h3
              className="font-black uppercase mb-3"
              style={{ fontFamily: "'Times New Roman', serif", fontSize: '24px', letterSpacing: '-0.02em' }}
            >
              Upcoming Fixtures
            </h3>
            <div className="space-y-2">
              {[
                { home: 'Echo City', away: 'Echo United', date: 'Sep 14', venue: 'Echo Stadium' },
                { home: 'Echo Metro', away: 'Echo Harbor', date: 'Sep 21', venue: 'Echo Airfield' },
                { home: 'Echo North', away: 'Echo Red', date: 'Sep 28', venue: 'Echo North Park' },
                { home: 'Echo Castle', away: 'Echo Coast', date: 'Oct 05', venue: 'Echo Saints Park' },
              ].map((fixture, i) => (
                <div
                  key={i}
                  className="border-4 p-3 flex items-center justify-between"
                  style={{ borderColor: '#000000', background: i % 2 === 0 ? '#f0f0f0' : '#ffffff' }}
                >
                  <span className="font-bold">{fixture.home} <span style={{ color: '#ff0000' }}>VS</span> {fixture.away}</span>
                  <span className="font-bold text-sm">{fixture.date} ● {fixture.venue}</span>
                </div>
              ))}
            </div>
          </div>

          {/* LEADERBOARD */}
          <div className="mt-6 border-4 p-4" style={{ borderColor: '#000000', background: '#ffffff', boxShadow: '6px 6px 0 0 #0000ff' }}>
            <h3
              className="font-black uppercase mb-3"
              style={{ fontFamily: "'Times New Roman', serif", fontSize: '24px', letterSpacing: '-0.02em' }}
            >
              Standings
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: '#000000', color: '#ffffff' }}>
                  <th className="border-2 p-2 text-left font-bold uppercase text-sm" style={{ borderColor: '#000' }}>#</th>
                  <th className="border-2 p-2 text-left font-bold uppercase text-sm" style={{ borderColor: '#000' }}>Team</th>
                  <th className="border-2 p-2 text-center font-bold uppercase text-sm" style={{ borderColor: '#000' }}>W</th>
                  <th className="border-2 p-2 text-center font-bold uppercase text-sm" style={{ borderColor: '#000' }}>D</th>
                  <th className="border-2 p-2 text-center font-bold uppercase text-sm" style={{ borderColor: '#000' }}>L</th>
                  <th className="border-2 p-2 text-center font-bold uppercase text-sm" style={{ borderColor: '#000' }}>PTS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { pos: 1, team: 'Echo City', w: 3, d: 0, l: 0, pts: 9 },
                  { pos: 2, team: 'Echo Metro', w: 2, d: 1, l: 0, pts: 7 },
                  { pos: 3, team: 'Echo Harbor', w: 2, d: 0, l: 1, pts: 6 },
                  { pos: 4, team: 'Echo United', w: 1, d: 2, l: 0, pts: 5 },
                  { pos: 5, team: 'Echo North', w: 1, d: 1, l: 1, pts: 4 },
                ].map(row => (
                  <tr key={row.pos} style={{ background: row.pos === 1 ? '#ffff00' : '#ffffff' }}>
                    <td className="border-2 p-2 font-black" style={{ borderColor: '#000' }}>{row.pos}</td>
                    <td className="border-2 p-2 font-bold" style={{ borderColor: '#000' }}>{row.team}</td>
                    <td className="border-2 p-2 text-center font-bold" style={{ borderColor: '#000' }}>{row.w}</td>
                    <td className="border-2 p-2 text-center font-bold" style={{ borderColor: '#000' }}>{row.d}</td>
                    <td className="border-2 p-2 text-center font-bold" style={{ borderColor: '#000' }}>{row.l}</td>
                    <td className="border-2 p-2 text-center font-black" style={{ borderColor: '#000' }}>{row.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer
        className="w-full border-t-4 mt-8"
        style={{ borderColor: '#000000', background: '#000000', color: '#ffffff' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h4 className="font-black uppercase text-sm mb-2" style={{ color: '#ffff00' }}>League Partners</h4>
              <p className="text-xs">EchoGear ● EchoFit ● EchoStride ● Echo Sports Interactive</p>
            </div>
            <div>
              <h4 className="font-black uppercase text-sm mb-2" style={{ color: '#ffff00' }}>Broadcasting</h4>
              <p className="text-xs">EchoSport ● EchoSport+ ● EchoSports ● EchoLive</p>
            </div>
            <div>
              <h4 className="font-black uppercase text-sm mb-2" style={{ color: '#ffff00' }}>Legal</h4>
              <p className="text-xs">Terms of Service ● Privacy Policy ● Cookie Policy</p>
            </div>
            <div>
              <h4 className="font-black uppercase text-sm mb-2" style={{ color: '#ffff00' }}>Social</h4>
              <p className="text-xs">EchoX ● EchoGram ● EchoTube ● EchoClips</p>
            </div>
          </div>
          <div className="border-t-2 mt-4 pt-4 text-center text-xs" style={{ borderColor: '#333' }}>
            © 2025 EchoMatch. All rights reserved. Accessibility compliant.
          </div>
        </div>
      </footer>
    </div>
  );
}
