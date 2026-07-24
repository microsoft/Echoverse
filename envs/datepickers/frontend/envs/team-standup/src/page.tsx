import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const HOLIDAYS = new Set(['2025-01-01', '2025-07-04', '2025-12-25', '2025-11-28']);

function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

function firstDayOfMonth(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}

function fmt(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function isWeekend(y: number, m: number, d: number) {
  const dow = new Date(y, m, d).getDay();
  return dow === 0 || dow === 6;
}

function buildCells(y: number, m: number): (number | null)[] {
  const total = getDaysInMonth(y, m);
  const start = firstDayOfMonth(y, m);
  const cells: (number | null)[] = [];
  for (let i = 0; i < start; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isBusinessDayDisabled(y: number, m: number, d: number) {
  if (isWeekend(y, m, d)) return true;
  if (HOLIDAYS.has(fmt(y, m, d))) return true;
  return false;
}

/* ── Reusable sub-components ─────────────────────────────── */

function MonthNav({ year, month, onPrev, onNext }: {
  year: number; month: number; onPrev: () => void; onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <button
        onClick={onPrev}
        className="p-2 hover:bg-gray-100 transition-colors"
        style={{ borderRadius: '8px' }}
        aria-label="Previous month"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
          <path d="M10 12L6 8l4-4" stroke="#706f7c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <span className="text-sm font-semibold" style={{ color: '#333' }}>
        {MONTHS[month]} {year}
      </span>
      <button
        onClick={onNext}
        className="p-2 hover:bg-gray-100 transition-colors"
        style={{ borderRadius: '8px' }}
        aria-label="Next month"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
          <path d="M6 4l4 4-4 4" stroke="#706f7c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

function CalendarGrid({ year, month, selectedDate, onDayClick, isDisabled, rangeStart, rangeEnd }: {
  year: number;
  month: number;
  selectedDate?: string | null;
  onDayClick: (ds: string) => void;
  isDisabled?: (y: number, m: number, d: number) => boolean;
  rangeStart?: string | null;
  rangeEnd?: string | null;
}) {
  const cells = useMemo(() => buildCells(year, month), [year, month]);
  const isRange = rangeStart !== undefined;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#706f7c' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={idx} className="h-9" />;
          const ds = fmt(year, month, day);
          const disabled = isDisabled ? isDisabled(year, month, day) : false;
          const isSel = selectedDate === ds;
          const isStart = rangeStart === ds;
          const isEnd = rangeEnd === ds;
          const inRange = isRange && rangeStart && rangeEnd && ds > rangeStart && ds < rangeEnd;

          let bg = 'transparent';
          let fg = '#333';
          let fw = 400;

          if (disabled) {
            fg = '#c4c4c4';
          } else if (isSel || isStart || isEnd) {
            bg = '#1D4ED8';
            fg = '#fff';
            fw = 600;
          } else if (inRange) {
            bg = '#DBEAFE';
            fg = '#1D4ED8';
          }

          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => { if (!disabled) onDayClick(ds); }}
              className="h-9 w-full flex items-center justify-center text-sm transition-colors"
              style={{
                backgroundColor: bg,
                color: fg,
                fontWeight: fw,
                borderRadius: '8px',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main page component ─────────────────────────────────── */

export default function Page_team_standup(props: GeneratedPageProps) {
  /* Widget 1 – Standup Date & Time (datetime) */
  const [w1Month, setW1Month] = useState(9);
  const [w1Year, setW1Year] = useState(2025);
  const [w1Date, setW1Date] = useState<string | null>(null);
  const [w1Hour, setW1Hour] = useState(9);
  const [w1Min, setW1Min] = useState(0);
  const [w1Ampm, setW1Ampm] = useState<'AM' | 'PM'>('AM');

  /* Widget 2 – Sprint Dates (range) */
  const [w2Month, setW2Month] = useState(6);
  const [w2Year, setW2Year] = useState(2026);
  const [w2Start, setW2Start] = useState<string | null>(null);
  const [w2End, setW2End] = useState<string | null>(null);

  /* Widget 3 – Compound (date) */
  const [w3Month, setW3Month] = useState(5);
  const [w3Year, setW3Year] = useState(2025);
  const [w3Date, setW3Date] = useState<string | null>(null);

  /* Filters */
  const [durationFilter, setDurationFilter] = useState(15);

  /* Navigation helpers */
  const prev = (sm: React.Dispatch<React.SetStateAction<number>>, sy: React.Dispatch<React.SetStateAction<number>>, m: number, y: number) => {
    if (m === 0) { sm(11); sy(y - 1); } else sm(m - 1);
  };
  const next = (sm: React.Dispatch<React.SetStateAction<number>>, sy: React.Dispatch<React.SetStateAction<number>>, m: number, y: number) => {
    if (m === 11) { sm(0); sy(y + 1); } else sm(m + 1);
  };

  /* Widget 1 submit */
  const submitW1 = useCallback(() => {
    if (!w1Date) return;
    let h24 = w1Hour;
    if (w1Ampm === 'PM' && w1Hour !== 12) h24 += 12;
    if (w1Ampm === 'AM' && w1Hour === 12) h24 = 0;
    const iso = `${w1Date}T${String(h24).padStart(2, '0')}:${String(w1Min).padStart(2, '0')}:00`;
    props.onSubmit({
      type: 'datetime',
      value: iso,
      raw: { widget_id: 'standup_datetime', date: w1Date, hour: w1Hour, minute: w1Min, ampm: w1Ampm, iso },
    });
  }, [w1Date, w1Hour, w1Min, w1Ampm, props]);

  /* Widget 2 submit */
  const submitW2 = useCallback(() => {
    if (!w2Start || !w2End) return;
    const val = `${w2Start}/${w2End}`;
    props.onSubmit({
      type: 'date_range',
      value: val,
      raw: { widget_id: 'sprint_dates', start: w2Start, end: w2End },
    });
  }, [w2Start, w2End, props]);

  /* Widget 3 submit */
  const submitW3 = useCallback(() => {
    if (!w3Date) return;
    props.onSubmit({
      type: 'date',
      value: w3Date,
      raw: { widget_id: 'compound', date: w3Date },
    });
  }, [w3Date, props]);

  /* Widget 2 range click logic */
  const handleRangeClick = useCallback((ds: string) => {
    if (!w2Start || (w2Start && w2End)) {
      setW2Start(ds);
      setW2End(null);
    } else {
      if (ds < w2Start) {
        setW2End(w2Start);
        setW2Start(ds);
      } else {
        setW2End(ds);
      }
    }
  }, [w2Start, w2End]);

  const btnStyle = (enabled: boolean): React.CSSProperties => ({
    backgroundColor: enabled ? '#1D4ED8' : '#eeeff0',
    color: enabled ? '#fff' : '#aaa',
    borderRadius: '8px',
    cursor: enabled ? 'pointer' : 'not-allowed',
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#706f7c', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* ── Header ───────────────────────────────────────── */}
      <header style={{ backgroundColor: '#ffffff' }} className="shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <span className="text-lg font-bold" style={{ color: '#1D4ED8' }}>EchoPlan</span>
            </div>
            <nav className="hidden md:flex items-center gap-5">
              {['Calendar', 'Rooms', 'Team', 'Reports'].map(n => (
                <a key={n} href="#" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: '#706f7c' }}>{n}</a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="text-xs border px-2 py-1.5"
              style={{ borderRadius: '8px', borderColor: '#eeeff0', color: '#706f7c' }}
            >
              <option>UTC-5 (EST)</option>
              <option>UTC-8 (PST)</option>
              <option>UTC+0 (GMT)</option>
            </select>
            <div className="flex border overflow-hidden" style={{ borderRadius: '8px', borderColor: '#eeeff0' }}>
              {['Day', 'Week', 'Month'].map((v, i) => (
                <button
                  key={v}
                  className="text-xs px-3 py-1.5 font-medium"
                  style={{ backgroundColor: i === 2 ? '#1D4ED8' : '#ffffff', color: i === 2 ? '#fff' : '#706f7c' }}
                >{v}</button>
              ))}
            </div>
            <button className="relative p-1.5" style={{ color: '#706f7c' }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a2 2 0 01-2-2h4a2 2 0 01-2 2z"/>
              </svg>
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full" style={{ backgroundColor: '#EF4444' }} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=400&fit=crop"
          alt="Meeting room"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(29,78,216,0.55)' }}>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-1">Team Standup</h1>
            <p className="text-white text-sm opacity-90">Pick a time for your next standup meeting</p>
          </div>
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Filters / context bar */}
        <div className="p-5" style={{ backgroundColor: '#ffffff', borderRadius: '12px' }}>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#706f7c' }}>Duration</label>
              <div className="flex gap-2">
                {[15, 30, 60].map(d => (
                  <button
                    key={d}
                    onClick={() => setDurationFilter(d)}
                    className="text-xs px-3 py-1.5 border font-medium transition-colors"
                    style={{
                      borderRadius: '8px',
                      borderColor: d === durationFilter ? '#1D4ED8' : '#eeeff0',
                      backgroundColor: d === durationFilter ? '#EFF6FF' : '#ffffff',
                      color: d === durationFilter ? '#1D4ED8' : '#706f7c',
                    }}
                  >{d} min</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: '#706f7c' }}>Meeting Type</label>
              <div className="flex gap-4">
                {['Video', 'Phone', 'In Person'].map((t, i) => (
                  <label key={t} className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: '#706f7c' }}>
                    <input type="radio" name="meetType" defaultChecked={i === 0} className="accent-blue-700" />
                    {t}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Widget 1 : Standup Date & Time ─────────────── */}
        <div data-widget-id="standup_datetime" className="p-6" style={{ backgroundColor: '#ffffff', borderRadius: '12px' }}>
          <div className="mb-4">
            <h2 className="text-base font-semibold" style={{ color: '#333' }}>Standup Date &amp; Time</h2>
            <p className="text-xs mt-0.5" style={{ color: '#706f7c' }}>
              Select a business day and preferred time for the standup meeting.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <MonthNav
                year={w1Year}
                month={w1Month}
                onPrev={() => prev(setW1Month, setW1Year, w1Month, w1Year)}
                onNext={() => next(setW1Month, setW1Year, w1Month, w1Year)}
              />
              <CalendarGrid
                year={w1Year}
                month={w1Month}
                selectedDate={w1Date}
                onDayClick={setW1Date}
                isDisabled={isBusinessDayDisabled}
              />
            </div>

            {/* Time selectors */}
            <div className="md:w-44 flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#706f7c' }}>Hour</label>
                <select
                  value={w1Hour}
                  onChange={e => setW1Hour(Number(e.target.value))}
                  className="w-full border px-3 py-2 text-sm"
                  style={{ borderRadius: '8px', borderColor: '#eeeff0' }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#706f7c' }}>Minute</label>
                <select
                  value={w1Min}
                  onChange={e => setW1Min(Number(e.target.value))}
                  className="w-full border px-3 py-2 text-sm"
                  style={{ borderRadius: '8px', borderColor: '#eeeff0' }}
                >
                  {[0, 15, 30, 45].map(m => (
                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#706f7c' }}>Period</label>
                <div className="flex border overflow-hidden" style={{ borderRadius: '8px', borderColor: '#eeeff0' }}>
                  {(['AM', 'PM'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setW1Ampm(p)}
                      className="flex-1 py-2 text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: w1Ampm === p ? '#1D4ED8' : '#ffffff',
                        color: w1Ampm === p ? '#fff' : '#706f7c',
                      }}
                    >{p}</button>
                  ))}
                </div>
              </div>

              {w1Date && (
                <div className="text-xs p-3 mt-1" style={{ backgroundColor: '#EFF6FF', borderRadius: '8px', color: '#1D4ED8' }}>
                  {w1Date} at {w1Hour}:{String(w1Min).padStart(2, '0')} {w1Ampm}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={submitW1}
            disabled={!w1Date}
            className="mt-5 w-full py-2.5 text-sm font-semibold transition-opacity"
            style={btnStyle(!!w1Date)}
          >
            Submit Standup Date &amp; Time
          </button>
        </div>

        {/* ── Widget 2 : Sprint Dates ────────────────────── */}
        <div data-widget-id="sprint_dates" className="p-6" style={{ backgroundColor: '#ffffff', borderRadius: '12px' }}>
          <div className="mb-4">
            <h2 className="text-base font-semibold" style={{ color: '#333' }}>Sprint Dates</h2>
            <p className="text-xs mt-0.5" style={{ color: '#706f7c' }}>
              Click a start date, then an end date to define the sprint range.
            </p>
          </div>

          <MonthNav
            year={w2Year}
            month={w2Month}
            onPrev={() => prev(setW2Month, setW2Year, w2Month, w2Year)}
            onNext={() => next(setW2Month, setW2Year, w2Month, w2Year)}
          />
          <CalendarGrid
            year={w2Year}
            month={w2Month}
            onDayClick={handleRangeClick}
            rangeStart={w2Start}
            rangeEnd={w2End}
          />

          {(w2Start || w2End) && (
            <div className="mt-3 text-xs p-3 flex gap-4" style={{ backgroundColor: '#EFF6FF', borderRadius: '8px', color: '#1D4ED8' }}>
              {w2Start && <span>Start: {w2Start}</span>}
              {w2End && <span>End: {w2End}</span>}
            </div>
          )}

          <button
            onClick={submitW2}
            disabled={!w2Start || !w2End}
            className="mt-5 w-full py-2.5 text-sm font-semibold transition-opacity"
            style={btnStyle(!!(w2Start && w2End))}
          >
            Submit Sprint Dates
          </button>
        </div>

        {/* ── Widget 3 : Compound ────────────────────────── */}
        <div data-widget-id="compound" className="p-6" style={{ backgroundColor: '#ffffff', borderRadius: '12px' }}>
          <div className="mb-4">
            <h2 className="text-base font-semibold" style={{ color: '#333' }}>Standup Date &amp; Time + Sprint Dates</h2>
            <p className="text-xs mt-0.5" style={{ color: '#706f7c' }}>
              Select a date from the calendar below.
            </p>
          </div>

          <MonthNav
            year={w3Year}
            month={w3Month}
            onPrev={() => prev(setW3Month, setW3Year, w3Month, w3Year)}
            onNext={() => next(setW3Month, setW3Year, w3Month, w3Year)}
          />
          <CalendarGrid
            year={w3Year}
            month={w3Month}
            selectedDate={w3Date}
            onDayClick={setW3Date}
            isDisabled={isBusinessDayDisabled}
          />

          {w3Date && (
            <div className="mt-3 text-xs p-3" style={{ backgroundColor: '#EFF6FF', borderRadius: '8px', color: '#1D4ED8' }}>
              Selected: {w3Date}
            </div>
          )}

          <button
            onClick={submitW3}
            disabled={!w3Date}
            className="mt-5 w-full py-2.5 text-sm font-semibold transition-opacity"
            style={btnStyle(!!w3Date)}
          >
            Submit Date
          </button>
        </div>

        {/* ── Upcoming Meetings ──────────────────────────── */}
        <div className="p-6" style={{ backgroundColor: '#ffffff', borderRadius: '12px' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#333' }}>Upcoming Meetings</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: 'Sprint Planning', time: 'Mon 10:00 AM', people: 5, img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop' },
              { title: 'Design Review', time: 'Wed 2:00 PM', people: 3, img: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop' },
            ].map(m => (
              <div key={m.title} className="border overflow-hidden" style={{ borderRadius: '12px', borderColor: '#eeeff0' }}>
                <img src={m.img} alt={m.title} className="w-full h-32 object-cover" />
                <div className="p-4">
                  <h4 className="text-sm font-semibold" style={{ color: '#333' }}>{m.title}</h4>
                  <p className="text-xs mt-1" style={{ color: '#706f7c' }}>{m.time} · {m.people} participants</p>
                  <div className="flex -space-x-2 mt-2">
                    {Array.from({ length: Math.min(m.people, 4) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
                        style={{ backgroundColor: ['#1D4ED8', '#10B981', '#F59E0B', '#EF4444'][i] }}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                    {m.people > 4 && (
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium"
                        style={{ backgroundColor: '#eeeff0', color: '#706f7c' }}
                      >
                        +{m.people - 4}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer style={{ backgroundColor: '#ffffff' }} className="mt-4">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { title: 'Calendar Sync', items: ['EchoCal', 'EchoMail', 'EchoDate', 'CalDAV'] },
              { title: 'Notifications', items: ['Email Reminders', 'EchoChat Alerts', 'SMS Notifications', 'Push'] },
              { title: 'Integrations', items: ['EchoConf', 'EchoTeam', 'EchoMeet', 'EchoChat'] },
              { title: 'Help Center', items: ['Getting Started', 'FAQs', 'Contact Support', 'API Docs'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-xs font-semibold mb-3" style={{ color: '#333' }}>{col.title}</h4>
                <ul className="space-y-2">
                  {col.items.map(item => (
                    <li key={item}>
                      <a href="#" className="text-xs hover:underline" style={{ color: '#706f7c' }}>{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-5 border-t flex items-center justify-between" style={{ borderColor: '#eeeff0' }}>
            <div className="flex items-center gap-2">
              <span className="text-base">📅</span>
              <span className="text-sm font-bold" style={{ color: '#1D4ED8' }}>EchoPlan</span>
            </div>
            <p className="text-xs" style={{ color: '#706f7c' }}>© 2025 EchoPlan. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
