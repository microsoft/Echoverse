import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

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
  task_type: 'single' | 'compound';
  initial_visible_state: any;
  constraint_type: string;
  constraint_params?: any;
  suite: string;
};

declare global {
  interface Window {
    __ACTIVE_TASK__?: ActiveTask;
  }
}

const NOW = new Date(2025, 8, 1, 9, 0, 0);

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getDayOfWeek(iso: string): number {
  return parseIso(iso).getDay();
}

function isDateInBlackout(iso: string, blackouts: string[][]): boolean {
  for (const [start, end] of blackouts) {
    if (iso >= start && iso <= end) return true;
  }
  return false;
}

function isDateDisabled(
  iso: string,
  constraintType: string,
  constraintParams: any
): boolean {
  if (constraintType === 'none') return false;

  if (constraintType === 'only_specific_weekday' || constraintType === 'weekday_only') {
    if (constraintParams?.weekday !== undefined) {
      return getDayOfWeek(iso) !== constraintParams.weekday;
    }
    const dow = getDayOfWeek(iso);
    return dow === 0 || dow === 6;
  }

  if (constraintType === 'weekend_only') {
    const dow = getDayOfWeek(iso);
    return dow !== 0 && dow !== 6;
  }

  if (constraintType === 'business_days') {
    const dow = getDayOfWeek(iso);
    return dow === 0 || dow === 6;
  }

  if (constraintType === 'blackout_windows') {
    const blackouts = constraintParams?.blackout_windows || [];
    return isDateInBlackout(iso, blackouts);
  }

  if (constraintType === 'max_n_days_from_today') {
    const maxDays = constraintParams?.max_days || 30;
    const nowIso = toIso(NOW);
    const maxDate = toIso(addDays(NOW, maxDays));
    return iso < nowIso || iso > maxDate;
  }

  if (constraintType === 'min_advance_notice') {
    const minHours = constraintParams?.min_hours || 24;
    const minDays = Math.ceil(minHours / 24);
    const minDate = toIso(addDays(NOW, minDays));
    return iso < minDate;
  }

  if (constraintType === 'fortnightly') {
    const refDate = NOW;
    const target = parseIso(iso);
    const diff = Math.round((target.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff % 14 !== 0;
  }

  if (constraintType === 'quarter_aligned') {
    const d = parseIso(iso);
    const day = d.getDate();
    return day !== 1;
  }

  return false;
}

export default function Page_ood_arbitration_window(props: GeneratedPageProps): JSX.Element {
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [rangeStartDate, setRangeStartDate] = useState<Date>(new Date(2025, 8, 1));
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const VISIBLE_DAYS = 14;

  useEffect(() => {
    const task = window.__ACTIVE_TASK__;
    if (task) {
      setActiveTask(task);
      if (task.initial_visible_state) {
        const { visible_month, visible_year } = task.initial_visible_state;
        if (visible_month !== undefined && visible_year !== undefined) {
          setRangeStartDate(new Date(visible_year, visible_month - 1, 1));
        }
      }
    }
  }, []);

  const constraintType = activeTask?.constraint_type || 'none';
  const constraintParams = (activeTask as any)?.constraint_params || {};

  const ticks = useMemo(() => {
    const result: string[] = [];
    for (let i = 0; i < VISIBLE_DAYS; i++) {
      result.push(toIso(addDays(rangeStartDate, i)));
    }
    return result;
  }, [rangeStartDate]);

  const rangeStart = ticks[0];
  const rangeEnd = ticks[ticks.length - 1];

  const navigatePrev = useCallback(() => {
    setRangeStartDate(prev => addDays(prev, -7));
  }, []);

  const navigateNext = useCallback(() => {
    setRangeStartDate(prev => addDays(prev, 7));
  }, []);

  const handleTickClick = useCallback((iso: string) => {
    if (isDateDisabled(iso, constraintType, constraintParams)) return;
    setSelected(iso);
  }, [constraintType, constraintParams]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    handleDragMove(e.nativeEvent);
  }, [ticks, constraintType, constraintParams]);

  const handleDragMove = useCallback((e: MouseEvent | React.MouseEvent<Element, MouseEvent> | { clientX: number }) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = ('clientX' in e ? e.clientX : 0) - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const idx = Math.round(pct * (ticks.length - 1));
    const iso = ticks[idx];
    if (iso && !isDateDisabled(iso, constraintType, constraintParams)) {
      setSelected(iso);
    }
  }, [ticks, constraintType, constraintParams]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => handleDragMove(e);
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, handleDragMove]);

  const markerPercent = useMemo(() => {
    if (!selected) return 0;
    const idx = ticks.indexOf(selected);
    if (idx < 0) return 0;
    return (idx / (ticks.length - 1)) * 100;
  }, [selected, ticks]);

  const isValid = selected !== null && /^\d{4}-\d{2}-\d{2}$/.test(selected);

  const handleSubmit = useCallback(() => {
    // guard removed (strip-only)
props.onSubmit({
      type: 'date',
      value: selected,
      raw: { widget_id: 'arbitration_window', picker: 'timeline_slider', state: { selected, rangeStart, rangeEnd } },
    });
  }, [isValid, selected, rangeStart, rangeEnd, props]);

  const instructionText = activeTask?.instruction_text || 'Select an arbitration window date on the timeline below.';

  return (
    <div
      style={{ background: '#fffbe6', minHeight: '100vh', fontFamily: "'Comic Neue', cursive", fontWeight: 700 }}
      className="relative"
    >
      {/* Halftone overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#1112 1px, transparent 1px)',
          backgroundSize: '8px 8px',
          zIndex: 0,
        }}
      />

      {/* Header */}
      <header
        style={{
          background: '#fffbe6',
          borderBottom: '4px solid #111',
          position: 'relative',
          zIndex: 10,
        }}
        className="px-6 py-4"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚖️</span>
            <span
              style={{ fontFamily: "'Bangers', cursive", fontSize: '28px', letterSpacing: '0.02em', color: '#111' }}
            >
              EchoLaw
            </span>
          </div>
          <nav className="flex gap-4">
            {['Practice Areas', 'Attorneys', 'Resources', 'Portal'].map(item => (
              <span
                key={item}
                style={{
                  fontFamily: "'Comic Neue', cursive",
                  fontWeight: 700,
                  fontSize: '16px',
                  color: '#111',
                  padding: '4px 12px',
                  border: '3px solid #111',
                  borderRadius: '8px',
                  background: '#fff',
                  boxShadow: '3px 3px 0 0 #111',
                  cursor: 'pointer',
                }}
              >
                {item}
              </span>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section
        style={{
          position: 'relative',
          zIndex: 5,
          background: '#2563eb',
          borderBottom: '4px solid #111',
          padding: '40px 24px',
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Action burst */}
          <div className="inline-block relative mb-4">
            <span style={{ fontSize: '40px' }}>💥</span>
          </div>
          <h1
            style={{
              fontFamily: "'Bangers', cursive",
              fontSize: '44px',
              letterSpacing: '0.02em',
              color: '#facc15',
              lineHeight: 1.2,
              textShadow: '3px 3px 0 #111',
            }}
          >
            Arbitration Window
          </h1>
          <p
            style={{
              fontFamily: "'Comic Neue', cursive",
              fontWeight: 700,
              fontSize: '18px',
              color: '#fff',
              marginTop: '12px',
            }}
          >
            Schedule your arbitration hearing date with confidence ⚡
          </p>
          {/* Trust badges */}
          <div className="flex justify-center gap-4 mt-4">
            {['⭐ EchoBar Certified', '✊ 500+ Cases Won', '✨ Free Consult'].map(badge => (
              <span
                key={badge}
                style={{
                  fontFamily: "'Comic Neue', cursive",
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#111',
                  background: '#facc15',
                  border: '3px solid #111',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  boxShadow: '2px 2px 0 0 #111',
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Main content */}
      <main style={{ position: 'relative', zIndex: 5 }} className="max-w-5xl mx-auto px-6 py-8">
        {/* Instruction Banner - speech bubble */}
        <div className="mb-6 relative">
          <div
            style={{
              background: '#fff',
              border: '4px solid #111',
              borderRadius: '12px',
              padding: '16px 24px',
              boxShadow: '4px 4px 0 0 #111',
              position: 'relative',
            }}
          >
            <span style={{ fontSize: '20px', marginRight: '8px' }}>💬</span>
            <span
              style={{
                fontFamily: "'Comic Neue', cursive",
                fontWeight: 700,
                fontSize: '18px',
                color: '#111',
              }}
            >
              {instructionText}
            </span>
            {/* Speech bubble tail */}
            <div
              style={{
                position: 'absolute',
                bottom: '-14px',
                left: '40px',
                width: 0,
                height: 0,
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderTop: '14px solid #111',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-9px',
                left: '42px',
                width: 0,
                height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: '12px solid #fff',
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form context - left column */}
          <div className="lg:col-span-1 space-y-4">
            <div
              style={{
                background: '#fff',
                border: '3px solid #111',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '4px 4px 0 0 #111',
              }}
            >
              <h3
                style={{
                  fontFamily: "'Bangers', cursive",
                  fontSize: '22px',
                  letterSpacing: '0.02em',
                  color: '#111',
                  marginBottom: '12px',
                }}
              >
                ❗ Case Details
              </h3>

              {/* Case Type */}
              <label style={{ fontFamily: "'Comic Neue', cursive", fontWeight: 700, fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                Case Type
              </label>
              <select
                style={{
                  width: '100%',
                  border: '3px solid #111',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontFamily: "'Comic Neue', cursive",
                  fontWeight: 700,
                  fontSize: '14px',
                  boxShadow: '3px 3px 0 0 #111',
                  marginBottom: '12px',
                  background: '#fff',
                }}
              >
                <option>Commercial Dispute</option>
                <option>Employment</option>
                <option>Construction</option>
                <option>IP / Patent</option>
              </select>

              {/* Jurisdiction */}
              <label style={{ fontFamily: "'Comic Neue', cursive", fontWeight: 700, fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                Jurisdiction
              </label>
              <select
                style={{
                  width: '100%',
                  border: '3px solid #111',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontFamily: "'Comic Neue', cursive",
                  fontWeight: 700,
                  fontSize: '14px',
                  boxShadow: '3px 3px 0 0 #111',
                  marginBottom: '12px',
                  background: '#fff',
                }}
              >
                <option>New York, NY</option>
                <option>Los Angeles, CA</option>
                <option>Chicago, IL</option>
                <option>Houston, TX</option>
              </select>

              {/* Attorney */}
              <label style={{ fontFamily: "'Comic Neue', cursive", fontWeight: 700, fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                Attorney Assigned
              </label>
              <select
                style={{
                  width: '100%',
                  border: '3px solid #111',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontFamily: "'Comic Neue', cursive",
                  fontWeight: 700,
                  fontSize: '14px',
                  boxShadow: '3px 3px 0 0 #111',
                  marginBottom: '12px',
                  background: '#fff',
                }}
              >
                <option>J. Martinez, Esq.</option>
                <option>R. Chen, Esq.</option>
                <option>A. Okafor, Esq.</option>
              </select>

              {/* Matter Number */}
              <label style={{ fontFamily: "'Comic Neue', cursive", fontWeight: 700, fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                Matter Number
              </label>
              <input
                type="text"
                placeholder="ARB-2025-XXXX"
                style={{
                  width: '100%',
                  border: '3px solid #111',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontFamily: "'Comic Neue', cursive",
                  fontWeight: 700,
                  fontSize: '14px',
                  boxShadow: '3px 3px 0 0 #111',
                  marginBottom: '12px',
                  background: '#fff',
                }}
              />

              {/* Consultation Length */}
              <label style={{ fontFamily: "'Comic Neue', cursive", fontWeight: 700, fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                Consultation Length
              </label>
              <select
                style={{
                  width: '100%',
                  border: '3px solid #111',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontFamily: "'Comic Neue', cursive",
                  fontWeight: 700,
                  fontSize: '14px',
                  boxShadow: '3px 3px 0 0 #111',
                  background: '#fff',
                }}
              >
                <option>30 minutes</option>
                <option>60 minutes</option>
                <option>90 minutes</option>
                <option>Half-day (4 hrs)</option>
              </select>
            </div>
          </div>

          {/* Picker Card - main column */}
          <div className="lg:col-span-2">
            <div
              data-widget-id="arbitration_window"
              data-testid="picker-root"
              style={{
                background: '#fff',
                border: '4px solid #111',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '4px 4px 0 0 #111',
                backgroundImage: 'radial-gradient(#1112 1px, transparent 1px)',
                backgroundSize: '8px 8px',
              }}
            >
              {/* Label in speech bubble */}
              <div className="relative mb-4 inline-block">
                <div
                  style={{
                    background: '#facc15',
                    border: '3px solid #111',
                    borderRadius: '12px',
                    padding: '6px 16px',
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Bangers', cursive",
                      fontSize: '20px',
                      letterSpacing: '0.02em',
                      color: '#111',
                    }}
                  >
                    ⭐ Arbitration Window
                  </span>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-10px',
                      left: '20px',
                      width: 0,
                      height: 0,
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderTop: '10px solid #111',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-7px',
                      left: '21px',
                      width: 0,
                      height: 0,
                      borderLeft: '7px solid transparent',
                      borderRight: '7px solid transparent',
                      borderTop: '8px solid #facc15',
                    }}
                  />
                </div>
              </div>

              {/* Trigger */}
              <button
                data-testid="picker-trigger"
                onClick={() => setPanelOpen(!panelOpen)}
                style={{
                  display: 'block',
                  width: '100%',
                  background: '#fff',
                  border: '3px solid #111',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  boxShadow: '4px 4px 0 0 #111',
                  fontFamily: "'Comic Neue', cursive",
                  fontWeight: 700,
                  fontSize: '16px',
                  color: selected ? '#111' : '#666',
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  marginTop: '12px',
                }}
              >
                {selected ? `📅 ${selected}` : '📅 Click to open timeline...'}
              </button>

              {/* Panel */}
              {panelOpen && (
                <div data-testid="picker-panel">
                  {/* Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      data-testid="picker-nav-prev"
                      onClick={navigatePrev}
                      style={{
                        fontFamily: "'Bangers', cursive",
                        fontSize: '16px',
                        background: '#fff',
                        border: '3px solid #111',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        boxShadow: '4px 4px 0 0 #111',
                        cursor: 'pointer',
                        color: '#111',
                      }}
                    >
                      ← BACK
                    </button>
                    <span
                      data-testid="picker-visible-range"
                      style={{
                        fontFamily: "'Bangers', cursive",
                        fontSize: '18px',
                        letterSpacing: '0.02em',
                        color: '#111',
                        background: '#facc15',
                        border: '3px solid #111',
                        borderRadius: '8px',
                        padding: '4px 12px',
                      }}
                    >
                      {rangeStart} – {rangeEnd}
                    </span>
                    <button
                      data-testid="picker-nav-next"
                      onClick={navigateNext}
                      style={{
                        fontFamily: "'Bangers', cursive",
                        fontSize: '16px',
                        background: '#fff',
                        border: '3px solid #111',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        boxShadow: '4px 4px 0 0 #111',
                        cursor: 'pointer',
                        color: '#111',
                      }}
                    >
                      NEXT →
                    </button>
                  </div>

                  {/* Timeline Track */}
                  <div
                    data-testid="picker-timeline-track"
                    ref={trackRef}
                    role="slider"
                    aria-valuemin={0}
                    aria-valuemax={ticks.length - 1}
                    aria-valuenow={selected ? ticks.indexOf(selected) : 0}
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '120px',
                      background: '#fffbe6',
                      border: '3px solid #111',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: '12px 8px',
                      gap: '2px',
                      userSelect: 'none',
                      overflow: 'hidden',
                    }}
                    onMouseDown={handleMouseDown}
                  >
                    {ticks.map((iso, idx) => {
                      const disabled = isDateDisabled(iso, constraintType, constraintParams);
                      const isSelected = selected === iso;
                      const isToday = iso === toIso(NOW);
                      const dayNum = parseIso(iso).getDate();
                      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][parseIso(iso).getDay()];

                      return (
                        <button
                          key={iso}
                          data-testid={`picker-cell-${iso}`}
                          data-iso={iso}
                          aria-pressed={isSelected}
                          aria-disabled={disabled ? 'true' : undefined}
                          disabled={disabled}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTickClick(iso);
                          }}
                          style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            height: '80px',
                            border: isSelected ? '3px solid #111' : '3px solid #111',
                            borderRadius: '8px',
                            background: disabled
                              ? '#ccc'
                              : isSelected
                              ? '#ef4444'
                              : isToday
                              ? '#facc15'
                              : '#fff',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled ? 0.5 : 1,
                            position: 'relative',
                            padding: '4px 2px',
                            boxShadow: isSelected ? '3px 3px 0 0 #111' : 'none',
                            transition: 'background 0.1s',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'Comic Neue', cursive",
                              fontWeight: 700,
                              fontSize: '10px',
                              color: isSelected ? '#fff' : '#666',
                            }}
                          >
                            {dayName}
                          </span>
                          <span
                            style={{
                              fontFamily: "'Bangers', cursive",
                              fontSize: '18px',
                              color: isSelected ? '#fff' : '#111',
                              lineHeight: 1.2,
                            }}
                          >
                            {dayNum}
                          </span>
                          {isSelected && (
                            <span style={{ position: 'absolute', top: '-4px', right: '-4px', fontSize: '12px' }}>
                              ⭐
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {/* Draggable marker */}
                    <span
                      data-testid="picker-timeline-marker"
                      style={{
                        position: 'absolute',
                        top: '4px',
                        left: `calc(${markerPercent}% - 8px)`,
                        width: '16px',
                        height: '16px',
                        background: '#ef4444',
                        border: '3px solid #111',
                        borderRadius: '50%',
                        boxShadow: '2px 2px 0 0 #111',
                        pointerEvents: 'none',
                        transition: isDragging ? 'none' : 'left 0.15s ease',
                        display: selected ? 'block' : 'none',
                      }}
                    />
                  </div>

                  {/* Constraint hint */}
                  {constraintType !== 'none' && (
                    <div
                      style={{
                        marginTop: '8px',
                        fontFamily: "'Comic Neue', cursive",
                        fontWeight: 700,
                        fontSize: '13px',
                        color: '#ef4444',
                        background: '#fff',
                        border: '2px solid #ef4444',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        display: 'inline-block',
                      }}
                    >
                      💢 Constraint: {constraintType.replace(/_/g, ' ')}
                      {constraintParams && Object.keys(constraintParams).length > 0 && (
                        <span style={{ marginLeft: '8px', color: '#666' }}>
                          ({JSON.stringify(constraintParams)})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Hidden selected value */}
              <span data-testid="picker-selected-value" hidden>
                {selected || ''}
              </span>

              {/* Submit */}
              <button
                data-testid="picker-submit"
                disabled={!isValid}
                onClick={handleSubmit}
                style={{
                  marginTop: '20px',
                  width: '100%',
                  fontFamily: "'Bangers', cursive",
                  fontSize: '22px',
                  letterSpacing: '0.02em',
                  color: isValid ? '#fff' : '#999',
                  background: isValid ? '#ef4444' : '#e5e5e5',
                  border: '3px solid #111',
                  borderRadius: '12px',
                  padding: '14px 24px',
                  boxShadow: isValid ? '4px 4px 0 0 #111' : 'none',
                  cursor: isValid ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >
                {isValid ? '💥 SUBMIT ARBITRATION DATE' : 'SELECT A DATE FIRST'}
              </button>
            </div>
          </div>
        </div>

        {/* Supporting content */}
        <section className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '⚡', title: 'Commercial Arbitration', desc: 'Swift resolution for business disputes with binding outcomes.' },
            { icon: '✊', title: 'Employment Claims', desc: 'Expert representation in workplace arbitration proceedings.' },
            { icon: '⭐', title: 'International ADR', desc: 'Cross-border dispute resolution under ICC/LCIA rules.' },
          ].map(card => (
            <div
              key={card.title}
              style={{
                background: '#fff',
                border: '3px solid #111',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '4px 4px 0 0 #111',
              }}
            >
              <span style={{ fontSize: '28px' }}>{card.icon}</span>
              <h4
                style={{
                  fontFamily: "'Bangers', cursive",
                  fontSize: '20px',
                  letterSpacing: '0.02em',
                  color: '#111',
                  marginTop: '8px',
                }}
              >
                {card.title}
              </h4>
              <p
                style={{
                  fontFamily: "'Comic Neue', cursive",
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#444',
                  marginTop: '6px',
                }}
              >
                {card.desc}
              </p>
            </div>
          ))}
        </section>

        {/* Testimonial */}
        <div
          className="mt-8"
          style={{
            background: '#2563eb',
            border: '4px solid #111',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '4px 4px 0 0 #111',
          }}
        >
          <p
            style={{
              fontFamily: "'Comic Neue', cursive",
              fontWeight: 700,
              fontSize: '18px',
              color: '#fff',
              fontStyle: 'italic',
            }}
          >
            "EchoLaw secured a favorable arbitration outcome in record time. Their scheduling system made the process seamless."
          </p>
          <p
            style={{
              fontFamily: "'Bangers', cursive",
              fontSize: '16px',
              color: '#facc15',
              marginTop: '8px',
            }}
          >
            — Director of Operations, TechCorp Inc.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          background: '#111',
          borderTop: '4px solid #facc15',
          padding: '32px 24px',
          marginTop: '40px',
          position: 'relative',
          zIndex: 5,
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span style={{ fontFamily: "'Bangers', cursive", fontSize: '20px', color: '#facc15' }}>
                ⚖️ EchoLaw
              </span>
              <p style={{ fontFamily: "'Comic Neue', cursive", fontWeight: 700, fontSize: '13px', color: '#aaa', marginTop: '8px' }}>
                100 Justice Blvd, Suite 400<br />
                New York, NY 10001<br />
                (212) 555-0199
              </p>
            </div>
            <div>
              <p style={{ fontFamily: "'Comic Neue', cursive", fontWeight: 700, fontSize: '13px', color: '#aaa' }}>
                Bar Registration: NY #123456, CA #789012<br />
                ATTORNEY ADVERTISING: Prior results do not guarantee a similar outcome.<br />
                Licensed in NY, CA, IL, TX.
              </p>
            </div>
            <div>
              <p style={{ fontFamily: "'Comic Neue', cursive", fontWeight: 700, fontSize: '13px', color: '#aaa' }}>
                Privacy Policy | Terms of Service | ADA Notice<br />
                © 2025 EchoLaw LLP. All rights reserved.<br />
                Arbitration services subject to applicable rules.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
