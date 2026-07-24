import React, { useState, useEffect, useMemo, useCallback } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const NOW_BASELINE = new Date(2025, 8, 1, 9, 0, 0); // 2025-09-01T09:00:00

function getDaysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return leap ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function getDayOfWeek(year: number, month: number, day: number): number {
  // Zeller-like: 0=Sun,1=Mon,...6=Sat
  const d = new Date(year, month - 1, day);
  return d.getDay();
}

function isDateInRange(y: number, m: number, d: number, start: string, end: string): boolean {
  const dateStr = `${y}-${pad2(m)}-${pad2(d)}`;
  return dateStr >= start && dateStr <= end;
}

function dateDiffDays(y1: number, m1: number, d1: number, y2: number, m2: number, d2: number): number {
  const a = new Date(y1, m1 - 1, d1).getTime();
  const b = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export default function Page_ood_deposition_date(props: GeneratedPageProps): JSX.Element {
  const task = typeof window !== 'undefined' ? window.__ACTIVE_TASK__ : undefined;
  const instructionText = task?.instruction_text || 'Select the deposition date using the wheel picker below.';
  const initialState = task?.initial_visible_state || {};
  const constraintType = task?.constraint_type || 'none';
  const constraintParams = (task as any)?.constraint_params || {};

  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [centerYear, setCenterYear] = useState<number>(initialState.visible_year || 2025);

  useEffect(() => {
    if (initialState.visible_year) setCenterYear(initialState.visible_year);
  }, []);

  const years = useMemo(() => {
    const result: number[] = [];
    for (let y = centerYear - 3; y <= centerYear + 3; y++) {
      result.push(y);
    }
    return result;
  }, [centerYear]);

  const daysCount = useMemo(() => {
    if (selectedYear && selectedMonth) {
      return getDaysInMonth(selectedYear, selectedMonth);
    }
    return 31;
  }, [selectedYear, selectedMonth]);

  const days = useMemo(() => {
    const result: number[] = [];
    for (let d = 1; d <= daysCount; d++) {
      result.push(d);
    }
    return result;
  }, [daysCount]);

  // When days shrink, reset day if out of range
  useEffect(() => {
    if (selectedDay && selectedDay > daysCount) {
      setSelectedDay(null);
    }
  }, [daysCount, selectedDay]);

  const isDayDisabled = useCallback((day: number): boolean => {
    if (!selectedYear || !selectedMonth) return false;
    const y = selectedYear;
    const m = selectedMonth;

    if (constraintType === 'none') return false;

    if (constraintType === 'blackout_windows') {
      const windows: string[][] = constraintParams.blackout_windows || [];
      for (const [start, end] of windows) {
        if (isDateInRange(y, m, day, start, end)) return true;
      }
      return false;
    }

    if (constraintType === 'only_specific_weekday' || constraintType === 'weekday_only') {
      if (constraintType === 'only_specific_weekday') {
        const targetWeekday = constraintParams.weekday;
        if (targetWeekday !== undefined) {
          const dow = getDayOfWeek(y, m, day);
          return dow !== targetWeekday;
        }
      } else {
        const dow = getDayOfWeek(y, m, day);
        return dow === 0 || dow === 6;
      }
      return false;
    }

    if (constraintType === 'weekend_only') {
      const dow = getDayOfWeek(y, m, day);
      return dow !== 0 && dow !== 6;
    }

    if (constraintType === 'business_days') {
      const dow = getDayOfWeek(y, m, day);
      return dow === 0 || dow === 6;
    }

    if (constraintType === 'max_n_days_from_today') {
      const maxDays = constraintParams.max_days || 30;
      const baseY = NOW_BASELINE.getFullYear();
      const baseM = NOW_BASELINE.getMonth() + 1;
      const baseD = NOW_BASELINE.getDate();
      const diff = dateDiffDays(baseY, baseM, baseD, y, m, day);
      return diff < 0 || diff > maxDays;
    }

    if (constraintType === 'min_advance_notice') {
      const minHours = constraintParams.min_hours || 72;
      const minDays = Math.ceil(minHours / 24);
      const baseY = NOW_BASELINE.getFullYear();
      const baseM = NOW_BASELINE.getMonth() + 1;
      const baseD = NOW_BASELINE.getDate();
      const diff = dateDiffDays(baseY, baseM, baseD, y, m, day);
      return diff < minDays;
    }

    if (constraintType === 'fortnightly') {
      const baseY = NOW_BASELINE.getFullYear();
      const baseM = NOW_BASELINE.getMonth() + 1;
      const baseD = NOW_BASELINE.getDate();
      const diff = dateDiffDays(baseY, baseM, baseD, y, m, day);
      return diff < 0 || diff % 14 !== 0;
    }

    if (constraintType === 'quarter_aligned') {
      return ![1, 4, 7, 10].includes(m) || day !== 1;
    }

    return false;
  }, [selectedYear, selectedMonth, constraintType, constraintParams]);

  const canonicalValue = useMemo(() => {
    if (selectedYear && selectedMonth && selectedDay) {
      return `${selectedYear}-${pad2(selectedMonth)}-${pad2(selectedDay)}`;
    }
    return '';
  }, [selectedYear, selectedMonth, selectedDay]);

  const canSubmit = /^\d{4}-\d{2}-\d{2}$/.test(canonicalValue);

  const handleSubmit = () => {
    // guard removed (strip-only)
props.onSubmit({
      type: 'date',
      value: canonicalValue,
      raw: {
        widget_id: 'deposition_date',
        picker: 'wheel_scroller',
        state: { year: selectedYear, month: selectedMonth, day: selectedDay },
      },
    });
  };

  const handleNavPrev = () => setCenterYear((y) => y - 1);
  const handleNavNext = () => setCenterYear((y) => y + 1);

  return (
    <div
      className="min-h-screen font-['Comic_Sans_MS'] text-[14px] leading-[1.3]"
      style={{ background: 'linear-gradient(135deg, #00ff00, #ff00ff)' }}
    >
      {/* Header */}
      <header
        className="border-b-[3px] p-3"
        style={{ borderStyle: 'ridge', borderColor: '#c0c0c0', background: '#0F1E3D' }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-3xl">⚖️</span>
            <span
              className="font-['Press_Start_2P'] text-[18px] font-bold uppercase"
              style={{ color: '#C9A961', textShadow: '2px 2px 0 #ff00ff, 4px 4px 0 #00ffff' }}
            >
              EchoLaw
            </span>
          </div>
          <nav className="flex gap-4 flex-wrap">
            {['Practice Areas', 'Attorneys', 'Resources', 'Portal'].map((item) => (
              <a
                key={item}
                href="#"
                className="underline decoration-blue-700 font-bold"
                style={{ color: '#0000ff' }}
              >
                {item}
              </a>
            ))}
          </nav>
          <span style={{ color: '#ffff00' }} className="font-bold">
            📞 1-800-HALBERD
          </span>
        </div>
      </header>

      {/* Rainbow HR */}
      <div className="h-[6px] w-full" style={{ background: 'linear-gradient(90deg, red, orange, yellow, green, blue, violet)' }} />

      {/* Hero */}
      <section className="text-center py-6 px-4">
        <h1
          className="font-['Press_Start_2P'] text-[24px] font-bold uppercase mb-3"
          style={{ color: '#ffff00', textShadow: '2px 2px 0 #ff00ff, 4px 4px 0 #00ffff, 6px 6px 0 #ff0000' }}
        >
          ⭐ Schedule a Consultation ⭐
        </h1>
        <p style={{ color: '#ffffff' }} className="text-lg font-bold">
          🔥 Trusted by 10,000+ clients since 1997 🔥
        </p>
        <div className="flex justify-center gap-4 mt-3 flex-wrap">
          {['🏆 Top Rated', '✨ Free Consult', '💼 No Win No Fee'].map((badge) => (
            <span
              key={badge}
              className="px-3 py-1 font-bold border-[3px] text-sm"
              style={{ borderStyle: 'ridge', borderColor: '#c0c0c0', background: '#0F1E3D', color: '#C9A961' }}
            >
              {badge}
            </span>
          ))}
        </div>
      </section>

      {/* Rainbow HR */}
      <div className="h-[6px] w-full" style={{ background: 'linear-gradient(90deg, red, orange, yellow, green, blue, violet)' }} />

      {/* Instruction Banner */}
      <div
        className="max-w-4xl mx-auto mt-4 p-4 border-[3px] text-center animate-pulse"
        style={{ borderStyle: 'ridge', borderColor: '#ff0000', background: '#ffff00', color: '#000000' }}
      >
        <p className="font-bold text-lg">📋 {instructionText}</p>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4 mt-4 flex flex-col lg:flex-row gap-6">
        {/* Form Context (decorative) */}
        <div
          className="lg:w-1/3 p-4 border-[3px]"
          style={{ borderStyle: 'ridge', borderColor: '#c0c0c0', background: '#F5EFDC' }}
        >
          <h3
            className="font-['Press_Start_2P'] text-[12px] font-bold mb-4 uppercase"
            style={{ color: '#0F1E3D', textShadow: '1px 1px 0 #C9A961' }}
          >
            Case Details
          </h3>
          <label className="block mb-3">
            <span className="font-bold" style={{ color: '#0F1E3D' }}>Case Type</span>
            <select
              className="w-full mt-1 p-2 border-[3px]"
              style={{ borderStyle: 'ridge', borderColor: '#c0c0c0' }}
            >
              <option>Personal Injury</option>
              <option>Corporate Litigation</option>
              <option>Estate Planning</option>
              <option>Criminal Defense</option>
            </select>
          </label>
          <label className="block mb-3">
            <span className="font-bold" style={{ color: '#0F1E3D' }}>Jurisdiction</span>
            <select
              className="w-full mt-1 p-2 border-[3px]"
              style={{ borderStyle: 'ridge', borderColor: '#c0c0c0' }}
            >
              <option>New York</option>
              <option>California</option>
              <option>Texas</option>
              <option>Florida</option>
            </select>
          </label>
          <label className="block mb-3">
            <span className="font-bold" style={{ color: '#0F1E3D' }}>Attorney Assigned</span>
            <select
              className="w-full mt-1 p-2 border-[3px]"
              style={{ borderStyle: 'ridge', borderColor: '#c0c0c0' }}
            >
              <option>J. Morrison, Esq.</option>
              <option>R. Blackwell, Esq.</option>
              <option>T. Nakamura, Esq.</option>
            </select>
          </label>
          <label className="block mb-3">
            <span className="font-bold" style={{ color: '#0F1E3D' }}>Matter Number</span>
            <input
              type="text"
              className="w-full mt-1 p-2 border-[3px]"
              style={{ borderStyle: 'ridge', borderColor: '#c0c0c0' }}
              placeholder="e.g. MAT-2025-0491"
            />
          </label>
          <label className="block mb-3">
            <span className="font-bold" style={{ color: '#0F1E3D' }}>Consultation Length</span>
            <select
              className="w-full mt-1 p-2 border-[3px]"
              style={{ borderStyle: 'ridge', borderColor: '#c0c0c0' }}
            >
              <option>30 minutes</option>
              <option>60 minutes</option>
              <option>90 minutes</option>
            </select>
          </label>
          <div className="mt-4 text-center">
            <span className="text-sm">🚧 Under Construction 🚧</span>
          </div>
        </div>

        {/* Picker Card */}
        <div
          className="lg:w-2/3 p-4 border-[3px]"
          style={{ borderStyle: 'ridge', borderColor: '#c0c0c0', background: 'linear-gradient(135deg, #ff00ff, #00ff00)' }}
          data-widget-id="deposition_date"
        >
          <h2
            className="font-['Press_Start_2P'] text-[16px] font-bold text-center uppercase mb-4"
            style={{ color: '#ffff00', textShadow: '2px 2px 0 #ff00ff, 4px 4px 0 #00ffff' }}
          >
            🌈 Deposition Date 🌈
          </h2>

          <div data-testid="picker-root" className="wheel-scroller">
            <button
              data-testid="picker-trigger"
              className="w-full p-3 font-bold text-lg border-[3px] mb-4 cursor-pointer"
              style={{
                borderStyle: 'ridge',
                borderColor: '#c0c0c0',
                background: '#0F1E3D',
                color: '#ffff00',
                fontFamily: 'Comic Sans MS, cursive',
              }}
              onClick={() => setPanelOpen(!panelOpen)}
            >
              {canonicalValue ? `Selected: ${canonicalValue}` : '🎰 Spin to pick a date 🎰'}
            </button>

            {panelOpen && (
              <div data-testid="picker-panel" className="flex flex-col gap-3">
                {/* Navigation */}
                <div className="flex justify-between items-center mb-2">
                  <button
                    data-testid="picker-nav-prev"
                    className="px-4 py-2 font-bold rounded-[999px]"
                    style={{
                      background: '#ff00ff',
                      color: '#ffffff',
                      fontFamily: 'Comic Sans MS, cursive',
                      boxShadow: '4px 4px 0 #00ffff',
                    }}
                    onClick={handleNavPrev}
                  >
                    « PREV
                  </button>
                  <span
                    className="font-bold text-lg"
                    style={{ color: '#ffff00', textShadow: '2px 2px 0 #000' }}
                  >
                    Year Center: {centerYear}
                  </span>
                  <button
                    data-testid="picker-nav-next"
                    className="px-4 py-2 font-bold rounded-[999px]"
                    style={{
                      background: '#ff00ff',
                      color: '#ffffff',
                      fontFamily: 'Comic Sans MS, cursive',
                      boxShadow: '4px 4px 0 #00ffff',
                    }}
                    onClick={handleNavNext}
                  >
                    NEXT »
                  </button>
                </div>

                {/* Wheels Container */}
                <div className="flex gap-2 justify-center flex-wrap">
                  {/* Year Wheel */}
                  <div className="flex flex-col items-center">
                    <span
                      className="font-['Press_Start_2P'] text-[10px] uppercase font-bold mb-1"
                      style={{ color: '#ffffff', textShadow: '1px 1px 0 #ff00ff' }}
                    >
                      Year
                    </span>
                    <ul
                      data-testid="picker-wheel-year"
                      className="border-[3px] overflow-y-auto h-[200px] w-[90px]"
                      style={{ borderStyle: 'ridge', borderColor: '#c0c0c0', background: '#000000' }}
                    >
                      {years.map((y) => (
                        <li
                          key={y}
                          data-testid={`picker-cell-year-${y}`}
                          data-year={y}
                          aria-selected={y === selectedYear}
                          className={`px-2 py-2 text-center cursor-pointer font-bold border-b border-gray-600 ${
                            y === selectedYear ? 'animate-pulse' : ''
                          }`}
                          style={{
                            background: y === selectedYear ? '#ff0000' : y % 2 === 0 ? '#00ff00' : '#ffff00',
                            color: y === selectedYear ? '#ffffff' : '#000000',
                          }}
                          onClick={() => setSelectedYear(y)}
                        >
                          {y}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Month Wheel */}
                  <div className="flex flex-col items-center">
                    <span
                      className="font-['Press_Start_2P'] text-[10px] uppercase font-bold mb-1"
                      style={{ color: '#ffffff', textShadow: '1px 1px 0 #ff00ff' }}
                    >
                      Month
                    </span>
                    <ul
                      data-testid="picker-wheel-month"
                      className="border-[3px] overflow-y-auto h-[200px] w-[70px]"
                      style={{ borderStyle: 'ridge', borderColor: '#c0c0c0', background: '#000000' }}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                        const mm = pad2(m);
                        return (
                          <li
                            key={m}
                            data-testid={`picker-cell-month-${mm}`}
                            data-month={m}
                            aria-selected={m === selectedMonth}
                            className={`px-2 py-2 text-center cursor-pointer font-bold border-b border-gray-600 ${
                              m === selectedMonth ? 'animate-pulse' : ''
                            }`}
                            style={{
                              background: m === selectedMonth ? '#ff0000' : m % 2 === 0 ? '#00ff00' : '#ffff00',
                              color: m === selectedMonth ? '#ffffff' : '#000000',
                            }}
                            onClick={() => setSelectedMonth(m)}
                          >
                            {mm}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Day Wheel */}
                  <div className="flex flex-col items-center">
                    <span
                      className="font-['Press_Start_2P'] text-[10px] uppercase font-bold mb-1"
                      style={{ color: '#ffffff', textShadow: '1px 1px 0 #ff00ff' }}
                    >
                      Day
                    </span>
                    <ul
                      data-testid="picker-wheel-day"
                      className="border-[3px] overflow-y-auto h-[200px] w-[70px]"
                      style={{ borderStyle: 'ridge', borderColor: '#c0c0c0', background: '#000000' }}
                    >
                      {days.map((d) => {
                        const dd = pad2(d);
                        const disabled = isDayDisabled(d);
                        return (
                          <li
                            key={d}
                            data-testid={`picker-cell-day-${dd}`}
                            data-day={d}
                            aria-selected={d === selectedDay}
                            aria-disabled={disabled ? 'true' : undefined}
                            className={`px-2 py-2 text-center font-bold border-b border-gray-600 ${
                              disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                            } ${d === selectedDay && !disabled ? 'animate-pulse' : ''}`}
                            style={{
                              background: disabled
                                ? '#555555'
                                : d === selectedDay
                                ? '#ff0000'
                                : d % 2 === 0
                                ? '#00ff00'
                                : '#ffff00',
                              color: disabled ? '#999999' : d === selectedDay ? '#ffffff' : '#000000',
                            }}
                            onClick={() => {
                              if (!disabled) setSelectedDay(d);
                            }}
                          >
                            {dd}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* Constraint hint */}
                {constraintType !== 'none' && (
                  <div
                    className="mt-2 p-2 text-center text-sm font-bold border-[2px]"
                    style={{ borderStyle: 'ridge', borderColor: '#ff0000', background: '#ffff00', color: '#ff0000' }}
                  >
                    ⚠️ Constraint active: {constraintType.replace(/_/g, ' ')}
                  </div>
                )}
              </div>
            )}

            {/* Hidden selected value */}
            <span data-testid="picker-selected-value" hidden>
              {canonicalValue}
            </span>

            {/* Submit */}
            <button
              data-testid="picker-submit"
              disabled={!canSubmit}
              className={`w-full mt-4 p-3 font-bold text-lg uppercase border-[3px] ${
                canSubmit ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
              style={{
                borderStyle: 'ridge',
                borderColor: '#c0c0c0',
                background: canSubmit ? '#ff0000' : '#666666',
                color: '#ffffff',
                fontFamily: 'Comic Sans MS, cursive',
                boxShadow: canSubmit ? '4px 4px 0 #00ffff' : 'none',
              }}
              onClick={handleSubmit}
            >
              {canSubmit ? '🔥 Submit Deposition Date 🔥' : '⏳ Select Year, Month & Day'}
            </button>
          </div>

          {/* Under construction badge */}
          <div className="mt-3 text-center">
            <span
              className="inline-block px-3 py-1 text-xs font-bold border-[2px]"
              style={{ borderStyle: 'ridge', borderColor: '#000', background: '#ffff00', color: '#000' }}
            >
              🚧 Best Viewed in Echo Navigator 4.0 🚧
            </span>
          </div>
        </div>
      </main>

      {/* Rainbow HR */}
      <div className="h-[6px] w-full mt-6" style={{ background: 'linear-gradient(90deg, red, orange, yellow, green, blue, violet)' }} />

      {/* Supporting Content */}
      <section className="max-w-5xl mx-auto p-4 mt-4">
        <h3
          className="font-['Press_Start_2P'] text-[14px] font-bold text-center uppercase mb-4"
          style={{ color: '#ffff00', textShadow: '2px 2px 0 #ff00ff, 4px 4px 0 #00ffff' }}
        >
          ✨ Our Practice Areas ✨
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '⚖️', title: 'Litigation', desc: 'Aggressive courtroom advocacy' },
            { icon: '🏛️', title: 'Corporate', desc: 'Mergers, acquisitions & compliance' },
            { icon: '📜', title: 'Estate Planning', desc: 'Wills, trusts & probate' },
          ].map((area) => (
            <div
              key={area.title}
              className="p-4 border-[3px] text-center"
              style={{ borderStyle: 'ridge', borderColor: '#c0c0c0', background: '#0F1E3D' }}
            >
              <span className="text-3xl">{area.icon}</span>
              <h4 className="font-bold mt-2" style={{ color: '#C9A961' }}>
                {area.title}
              </h4>
              <p className="text-sm" style={{ color: '#ffffff' }}>
                {area.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="mt-8 p-4 border-t-[3px] text-center text-sm"
        style={{ borderStyle: 'ridge', borderColor: '#c0c0c0', background: '#0F1E3D', color: '#c0c0c0' }}
      >
        <p className="mb-2 font-bold" style={{ color: '#C9A961' }}>
          EchoLaw LLC — Attorneys at Law
        </p>
        <p>Bar Reg. #NY-19847 | #CA-33021 | #TX-55910</p>
        <p className="mt-1">
          Attorney Advertising. Prior results do not guarantee a similar outcome.
        </p>
        <div className="flex justify-center gap-4 mt-2 flex-wrap">
          {['Privacy Policy', 'ADA Notice', 'Terms of Service', 'Disclaimer'].map((link) => (
            <a key={link} href="#" className="underline" style={{ color: '#0000ff' }}>
              {link}
            </a>
          ))}
        </div>
        <p className="mt-2">Offices: New York, NY | Los Angeles, CA | Houston, TX</p>
        <p className="mt-2" style={{ color: '#ffff00' }}>
          👽 You are visitor #00{Math.floor(Math.random() * 9000) + 1000} 👽
        </p>
      </footer>
    </div>
  );
}
