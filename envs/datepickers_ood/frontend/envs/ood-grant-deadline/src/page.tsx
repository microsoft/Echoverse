import React, { useState, useMemo, useCallback, useEffect } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const NOW = new Date('2025-09-01T09:00:00');

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`;
}

function getDaysInYear(year: number): string[] {
  const days: string[] = [];
  for (let m = 1; m <= 12; m++) {
    const daysInMonth = new Date(year, m, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(toISO(year, m, d));
    }
  }
  return days;
}

function getDayOfWeek(iso: string): number {
  return new Date(iso + 'T00:00:00').getDay();
}

function parseISO(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, month: m, day: d };
}

function diffDays(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime();
  const db = new Date(b + 'T00:00:00').getTime();
  return Math.round((db - da) / 86400000);
}

function isDateInRange(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end;
}

function getIntensity(iso: string, year: number): number {
  const { month } = parseISO(iso);
  const seed = (month * 7 + parseInt(iso.slice(-2)) * 13) % 5;
  return seed;
}

function isDisabledByConstraint(
  iso: string,
  constraintType: string | undefined,
  constraintParams: any
): boolean {
  if (!constraintType || constraintType === 'none') return false;

  const dow = getDayOfWeek(iso);
  const nowISO = toISO(NOW.getFullYear(), NOW.getMonth() + 1, NOW.getDate());

  switch (constraintType) {
    case 'only_specific_weekday': {
      const weekday = constraintParams?.weekday;
      if (weekday !== undefined) return dow !== weekday;
      return false;
    }
    case 'weekday_only':
      return dow === 0 || dow === 6;
    case 'weekend_only':
      return dow !== 0 && dow !== 6;
    case 'business_days':
      return dow === 0 || dow === 6;
    case 'blackout_windows': {
      const windows = constraintParams?.blackout_windows;
      if (Array.isArray(windows)) {
        for (const [start, end] of windows) {
          if (isDateInRange(iso, start, end)) return true;
        }
      }
      return false;
    }
    case 'max_n_days_from_today': {
      const maxDays = constraintParams?.max_days;
      if (maxDays !== undefined) {
        const diff = diffDays(nowISO, iso);
        return diff < 0 || diff > maxDays;
      }
      return false;
    }
    case 'min_advance_notice': {
      const minDays = constraintParams?.min_days || 3;
      const diff = diffDays(nowISO, iso);
      return diff < minDays;
    }
    case 'fortnightly': {
      const epoch = new Date('2025-01-06T00:00:00').getTime();
      const target = new Date(iso + 'T00:00:00').getTime();
      const daysDiff = Math.round((target - epoch) / 86400000);
      return daysDiff % 14 !== 0;
    }
    case 'quarter_aligned': {
      const { month, day } = parseISO(iso);
      return !([1, 4, 7, 10].includes(month) && day === 1);
    }
    default:
      return false;
  }
}

export default function Page_ood_grant_deadline(props: GeneratedPageProps): JSX.Element {
  const task = typeof window !== 'undefined' ? (window as any).__ACTIVE_TASK__ : undefined;
  const instructionText = task?.instruction_text || '> SELECT A GRANT DEADLINE DATE';
  const constraintType = task?.constraint_type;
  const constraintParams = task?.constraint_params;
  const initialState = task?.initial_visible_state;

  const defaultYear = initialState?.visible_year || NOW.getFullYear();

  const [visibleYear, setVisibleYear] = useState<number>(defaultYear);
  const [selected, setSelected] = useState<string>('');
  const [panelOpen, setPanelOpen] = useState<boolean>(true);

  useEffect(() => {
    if (initialState?.visible_year) {
      setVisibleYear(initialState.visible_year);
    }
  }, []);

  const allDays = useMemo(() => getDaysInYear(visibleYear), [visibleYear]);

  const weeks = useMemo(() => {
    const firstDay = allDays[0];
    const firstDow = getDayOfWeek(firstDay);
    const startOffset = firstDow;
    const weekStarts: string[] = [];
    const firstDate = new Date(firstDay + 'T00:00:00');
    const startDate = new Date(firstDate.getTime() - startOffset * 86400000);

    let current = startDate;
    const lastDay = new Date(allDays[allDays.length - 1] + 'T00:00:00');
    while (current <= lastDay) {
      const iso = toISO(current.getFullYear(), current.getMonth() + 1, current.getDate());
      weekStarts.push(iso);
      current = new Date(current.getTime() + 7 * 86400000);
    }
    return weekStarts;
  }, [allDays]);

  const dayInColumn = useCallback((weekStartIso: string, weekday: number): string | null => {
    const start = new Date(weekStartIso + 'T00:00:00');
    const target = new Date(start.getTime() + weekday * 86400000);
    const y = target.getFullYear();
    const m = target.getMonth() + 1;
    const d = target.getDate();
    if (y !== visibleYear) return null;
    return toISO(y, m, d);
  }, [visibleYear]);

  const handleSelect = useCallback((iso: string) => {
    if (isDisabledByConstraint(iso, constraintType, constraintParams)) return;
    setSelected(iso);
  }, [constraintType, constraintParams]);

  const handleSubmit = useCallback(() => {
    if (!selected || !/^\d{4}-\d{2}-\d{2}$/.test(selected)) return;
    props.onSubmit({
      type: 'date',
      value: selected,
      raw: { widget_id: 'grant_deadline', picker: 'calendar_heatmap', state: { visibleYear, selected } },
    });
  }, [selected, visibleYear, props]);

  const nowISO = toISO(NOW.getFullYear(), NOW.getMonth() + 1, NOW.getDate());

  const intensityColors = ['#0d0208', '#1f3a1f', '#1a5c1a', '#2d8a2d', '#00ff41'];

  return (
    <div
      className="min-h-screen font-mono"
      style={{
        backgroundColor: '#0d0208',
        color: '#00ff41',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.06) 2px, rgba(0,255,65,0.06) 4px)',
      }}
    >
      {/* HEADER */}
      <header
        className="border-b px-4 py-3 flex items-center justify-between"
        style={{ borderColor: '#00ff41' }}
      >
        <div className="flex items-center gap-4">
          <span className="text-lg">❤️</span>
          <span className="uppercase tracking-wider font-bold text-base" style={{ color: '#00ff41' }}>
            EchoAid
          </span>
        </div>
        <nav className="hidden md:flex gap-4 text-sm uppercase tracking-wider">
          <span style={{ color: '#00ff41' }}>Our Work</span>
          <span style={{ color: '#1f3a1f' }}>│</span>
          <span style={{ color: '#00ff41' }}>Volunteer</span>
          <span style={{ color: '#1f3a1f' }}>│</span>
          <span style={{ color: '#00ff41' }}>Events</span>
          <span style={{ color: '#1f3a1f' }}>│</span>
          <span style={{ color: '#facc15' }}>Donate</span>
        </nav>
      </header>

      {/* HERO */}
      <section className="px-4 py-6 border-b" style={{ borderColor: '#00ff41' }}>
        <div className="text-xs uppercase tracking-wider mb-2" style={{ color: '#39ff14' }}>
          $ cat /mission.txt
        </div>
        <div className="text-lg uppercase font-bold tracking-wider mb-2" style={{ color: '#00ff41' }}>
          ┌─────────────────────────────────────────┐
        </div>
        <div className="text-lg uppercase font-bold tracking-wider px-2" style={{ color: '#00ff41' }}>
          │ SIGN UP FOR A SHIFT ─ GRANT DEADLINE   │
        </div>
        <div className="text-lg uppercase font-bold tracking-wider mb-3" style={{ color: '#00ff41' }}>
          └─────────────────────────────────────────┘
        </div>
        <div className="flex gap-8 text-sm">
          <span><span style={{ color: '#facc15' }}>■</span> 4,200 volunteers</span>
          <span><span style={{ color: '#facc15' }}>■</span> 89 programs</span>
          <span><span style={{ color: '#facc15' }}>■</span> $2.1M raised</span>
        </div>
      </section>

      {/* INSTRUCTION BANNER */}
      <div className="px-4 py-3 border-b" style={{ borderColor: '#facc15', backgroundColor: 'rgba(250,204,21,0.08)' }}>
        <span className="text-sm uppercase tracking-wider" style={{ color: '#facc15' }}>
          {'>'} TASK: {instructionText}
        </span>
        {constraintType && constraintType !== 'none' && (
          <div className="text-xs mt-1" style={{ color: '#39ff14' }}>
            [constraint: {constraintType}]
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* FORM CONTEXT (LEFT) */}
        <aside className="lg:w-64 p-4 border-r" style={{ borderColor: '#1f3a1f' }}>
          <div className="text-xs uppercase tracking-wider mb-3" style={{ color: '#39ff14' }}>
            $ form --fields
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <label className="block uppercase text-xs tracking-wider mb-1" style={{ color: '#00ff41' }}>
                Cause/Program
              </label>
              <select
                className="w-full px-2 py-1 font-mono text-sm"
                style={{ backgroundColor: '#0d0208', color: '#00ff41', border: '1px solid #00ff41', borderRadius: 0 }}
              >
                <option>Youth Education</option>
                <option>Food Security</option>
                <option>Housing Aid</option>
                <option>Health Services</option>
              </select>
            </div>
            <div>
              <label className="block uppercase text-xs tracking-wider mb-1" style={{ color: '#00ff41' }}>
                Shift Role
              </label>
              <select
                className="w-full px-2 py-1 font-mono text-sm"
                style={{ backgroundColor: '#0d0208', color: '#00ff41', border: '1px solid #00ff41', borderRadius: 0 }}
              >
                <option>Grant Writer</option>
                <option>Reviewer</option>
                <option>Coordinator</option>
              </select>
            </div>
            <div>
              <label className="block uppercase text-xs tracking-wider mb-1" style={{ color: '#00ff41' }}>
                Location
              </label>
              <input
                type="text"
                placeholder="City, State"
                className="w-full px-2 py-1 font-mono text-sm"
                style={{ backgroundColor: '#0d0208', color: '#00ff41', border: '1px solid #00ff41', borderRadius: 0 }}
              />
            </div>
            <div>
              <label className="block uppercase text-xs tracking-wider mb-1" style={{ color: '#00ff41' }}>
                Group Size
              </label>
              <input
                type="number"
                defaultValue={1}
                min={1}
                max={20}
                className="w-full px-2 py-1 font-mono text-sm"
                style={{ backgroundColor: '#0d0208', color: '#00ff41', border: '1px solid #00ff41', borderRadius: 0 }}
              />
            </div>
            <div>
              <label className="block uppercase text-xs tracking-wider mb-1" style={{ color: '#00ff41' }}>
                T-Shirt Size
              </label>
              <select
                className="w-full px-2 py-1 font-mono text-sm"
                style={{ backgroundColor: '#0d0208', color: '#00ff41', border: '1px solid #00ff41', borderRadius: 0 }}
              >
                <option>S</option>
                <option>M</option>
                <option>L</option>
                <option>XL</option>
              </select>
            </div>
          </div>
        </aside>

        {/* MAIN: PICKER CARD */}
        <main className="flex-1 p-4">
          <div data-testid="picker-root" data-widget-id="grant_deadline">
            {/* Trigger */}
            <button
              data-testid="picker-trigger"
              onClick={() => setPanelOpen(!panelOpen)}
              className="mb-4 px-3 py-2 font-mono text-sm uppercase tracking-wider"
              style={{
                backgroundColor: '#0d0208',
                color: '#00ff41',
                border: '1px solid #00ff41',
                borderRadius: 0,
                cursor: 'pointer',
              }}
            >
              {'>'} {selected || 'YYYY-MM-DD'}
              <span className="animate-pulse ml-1" style={{ color: '#00ff41' }}>█</span>
            </button>

            {panelOpen && (
              <div data-testid="picker-panel">
                {/* NAV */}
                <div className="flex items-center gap-4 mb-3">
                  <button
                    data-testid="picker-nav-prev"
                    onClick={() => setVisibleYear(y => y - 1)}
                    className="px-2 py-1 font-mono text-sm uppercase"
                    style={{ color: '#facc15', backgroundColor: 'transparent', border: '1px solid #facc15', borderRadius: 0, cursor: 'pointer' }}
                  >
                    ◀ PREV
                  </button>
                  <span
                    data-testid="picker-visible-year"
                    className="font-bold text-base uppercase tracking-wider"
                    style={{ color: '#00ff41' }}
                  >
                    {visibleYear}
                  </span>
                  <button
                    data-testid="picker-nav-next"
                    onClick={() => setVisibleYear(y => y + 1)}
                    className="px-2 py-1 font-mono text-sm uppercase"
                    style={{ color: '#facc15', backgroundColor: 'transparent', border: '1px solid #facc15', borderRadius: 0, cursor: 'pointer' }}
                  >
                    NEXT ▶
                  </button>
                </div>

                {/* HEATMAP GRID */}
                <div className="overflow-x-auto">
                  <table data-testid="picker-heatmap-grid" className="border-collapse" style={{ borderSpacing: 0 }}>
                    <tbody>
                      {[0, 1, 2, 3, 4, 5, 6].map(weekday => (
                        <tr key={weekday} data-testid={`picker-heatmap-weekday-${weekday}`}>
                          <td
                            className="pr-2 text-xs uppercase"
                            style={{ color: '#39ff14', width: '28px', whiteSpace: 'nowrap' }}
                          >
                            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][weekday]}
                          </td>
                          {weeks.map(weekStartIso => {
                            const iso = dayInColumn(weekStartIso, weekday);
                            if (!iso) return <td key={weekStartIso} style={{ width: '14px', height: '14px' }} />;
                            const disabled = isDisabledByConstraint(iso, constraintType, constraintParams);
                            const isSelected = iso === selected;
                            const isToday = iso === nowISO;
                            const intensity = getIntensity(iso, visibleYear);
                            let bgColor = intensityColors[intensity];
                            if (disabled) bgColor = '#1f3a1f';
                            if (isSelected) bgColor = '#00ff41';
                            if (isToday && !isSelected) bgColor = '#facc15';

                            return (
                              <td
                                key={iso}
                                data-testid={`picker-cell-${iso}`}
                                data-date={iso}
                                data-intensity={intensity}
                                aria-disabled={disabled ? 'true' : undefined}
                                onClick={() => !disabled && handleSelect(iso)}
                                title={iso}
                                style={{
                                  width: '14px',
                                  height: '14px',
                                  backgroundColor: bgColor,
                                  border: isSelected ? '1px solid #facc15' : '1px solid #0d0208',
                                  cursor: disabled ? 'not-allowed' : 'pointer',
                                  opacity: disabled ? 0.4 : 1,
                                  padding: '1px',
                                  borderRadius: 0,
                                }}
                              />
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MONTH LABELS */}
                <div className="mt-2 flex text-xs" style={{ color: '#39ff14', paddingLeft: '32px' }}>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                    <span key={i} className="uppercase" style={{ width: `${100 / 12}%` }}>{m}</span>
                  ))}
                </div>
              </div>
            )}

            {/* SELECTED VALUE (HIDDEN) */}
            <span data-testid="picker-selected-value" hidden>{selected}</span>

            {/* SUBMIT */}
            <div className="mt-4">
              <button
                data-testid="picker-submit"
                disabled={!selected || !/^\d{4}-\d{2}-\d{2}$/.test(selected)}
                onClick={handleSubmit}
                className="px-4 py-2 font-mono text-sm uppercase tracking-wider font-bold"
                style={{
                  backgroundColor: selected ? '#00ff41' : '#1f3a1f',
                  color: selected ? '#0d0208' : '#39ff14',
                  border: '1px solid #00ff41',
                  borderRadius: 0,
                  cursor: selected ? 'pointer' : 'not-allowed',
                  opacity: selected ? 1 : 0.5,
                }}
              >
                $ submit --date="{selected || '...'}"
              </button>
            </div>

            {/* Action footer hint */}
            <div className="mt-2 text-xs" style={{ color: '#39ff14' }}>
              Format: YYYY-MM-DD │ Selected: {selected || '(none)'}
            </div>
          </div>
        </main>
      </div>

      {/* SUPPORTING CONTENT */}
      <section className="px-4 py-6 border-t" style={{ borderColor: '#1f3a1f' }}>
        <div className="text-xs uppercase tracking-wider mb-3" style={{ color: '#39ff14' }}>
          $ cat /impact-stories.log
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'YOUTH LITERACY GRANT', amount: '$45,000', progress: 78 },
            { title: 'FOOD BANK EXPANSION', amount: '$120,000', progress: 92 },
            { title: 'HOUSING ASSISTANCE', amount: '$67,500', progress: 55 },
          ].map((story, i) => (
            <div
              key={i}
              className="p-3 text-sm"
              style={{ border: '1px solid #1f3a1f', backgroundColor: '#0d0208' }}
            >
              <div className="uppercase font-bold text-xs tracking-wider mb-1" style={{ color: '#00ff41' }}>
                ┌─ {story.title}
              </div>
              <div className="mb-1" style={{ color: '#facc15' }}>
                {story.amount} raised
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2" style={{ backgroundColor: '#1f3a1f' }}>
                  <div style={{ width: `${story.progress}%`, height: '100%', backgroundColor: '#00ff41' }} />
                </div>
                <span className="text-xs" style={{ color: '#39ff14' }}>{story.progress}%</span>
              </div>
              <div className="mt-1 text-xs" style={{ color: '#1f3a1f' }}>
                └───────────────────────
              </div>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="mt-4 p-3" style={{ border: '1px dashed #1f3a1f' }}>
          <div className="text-xs" style={{ color: '#39ff14' }}>
            {'>'} "EchoAid's grant program changed our community center forever."
          </div>
          <div className="text-xs mt-1" style={{ color: '#1f3a1f' }}>
            — Maria T., Community Organizer
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-4 py-4 border-t text-xs" style={{ borderColor: '#00ff41', color: '#1f3a1f' }}>
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div>
            <span style={{ color: '#39ff14' }}>EchoAid</span> │ 501(c)(3) EIN: 84-2057391
          </div>
          <div className="flex gap-3">
            <span>Privacy</span>
            <span>│</span>
            <span>Contact</span>
            <span>│</span>
            <span>EchoGuide ■</span>
            <span>│</span>
            <span>EchoRate ■</span>
          </div>
        </div>
        <div className="mt-2" style={{ color: '#1f3a1f' }}>
          ─────────────────────────────────────────────────────────────────────────
        </div>
        <div className="mt-1 flex gap-4">
          <span>Newsletter: grant-updates@echoaid.org</span>
          <span>│</span>
          <span>© 2025 EchoAid Foundation</span>
        </div>
      </footer>
    </div>
  );
}
