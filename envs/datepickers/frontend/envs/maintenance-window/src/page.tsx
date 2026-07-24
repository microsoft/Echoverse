import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function startDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const DISABLED_DATES = new Set([
  '2025-08-01','2025-08-06','2025-08-08',
  '2025-08-17','2025-08-23','2025-08-25','2025-08-27',
]);

function MaintenanceDatePicker({
  onSubmit,
}: {
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(7); // August (0-indexed)
  const [selected, setSelected] = useState<string | null>(null);

  const totalDays = useMemo(() => daysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => startDay(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }, [month]);

  const handleSelect = useCallback((day: number) => {
    const iso = toISO(year, month, day);
    if (DISABLED_DATES.has(iso)) return;
    setSelected(iso);
  }, [year, month]);

  const handleSubmit = useCallback(() => {
    if (!selected) return;
    onSubmit({
      type: 'date',
      value: selected,
      raw: {
        widget_id: 'maintenance_date',
        year,
        month: month + 1,
        selected,
      },
    });
  }, [selected, onSubmit, year, month]);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`e-${i}`} />);
  }
  for (let d = 1; d <= totalDays; d++) {
    const iso = toISO(year, month, d);
    const isDisabled = DISABLED_DATES.has(iso);
    const isSelected = selected === iso;
    const isToday =
      iso ===
      toISO(
        new Date(2025, 0, 1).getFullYear(),
        new Date(2025, 0, 1).getMonth(),
        new Date(2025, 0, 1).getDate(),
      );

    let cellStyle: React.CSSProperties = {
      borderRadius: '9999px',
      transition: 'all 0.15s',
    };
    let cellClass =
      'w-10 h-10 flex items-center justify-center text-sm font-medium select-none';

    if (isDisabled) {
      cellStyle.color = '#dde0e5';
      cellStyle.cursor = 'not-allowed';
      cellStyle.backgroundColor = '#f8f8f9';
    } else if (isSelected) {
      cellStyle.backgroundColor = '#1D4ED8';
      cellStyle.color = '#ffffff';
      cellClass += ' cursor-pointer';
    } else {
      cellStyle.color = '#554b5f';
      cellStyle.cursor = 'pointer';
      if (isToday) {
        cellStyle.border = '2px solid #1D4ED8';
      }
    }

    cells.push(
      <div
        key={d}
        className={cellClass}
        style={cellStyle}
        onClick={() => !isDisabled && handleSelect(d)}
        aria-disabled={isDisabled}
      >
        {d}
      </div>,
    );
  }

  return (
    <div
      data-widget-id="maintenance_date"
      className="w-full max-w-sm mx-auto"
      style={{ backgroundColor: '#ffffff', borderRadius: '9999px' }}
    >
      <div
        className="p-6"
        style={{ backgroundColor: '#ffffff', borderRadius: '16px' }}
      >
        <h3
          className="text-base font-semibold mb-1"
          style={{ color: '#554b5f' }}
        >
          Maintenance Date
        </h3>
        <p className="text-xs mb-4" style={{ color: '#dde0e5' }}>
          Select the date for the scheduled maintenance window. Grayed-out dates
          are unavailable.
        </p>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center"
            style={{
              borderRadius: '9999px',
              backgroundColor: '#f8f8f9',
              color: '#554b5f',
            }}
            aria-label="Previous month"
          >
            ‹
          </button>
          <span
            className="text-sm font-semibold"
            style={{ color: '#554b5f' }}
          >
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center"
            style={{
              borderRadius: '9999px',
              backgroundColor: '#f8f8f9',
              color: '#554b5f',
            }}
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map(d => (
            <div
              key={d}
              className="w-10 h-8 flex items-center justify-center text-xs font-medium"
              style={{ color: '#dde0e5' }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">{cells}</div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: '#554b5f' }}>
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3"
              style={{ borderRadius: '9999px', backgroundColor: '#dde0e5' }}
            />
            Unavailable
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3"
              style={{ borderRadius: '9999px', backgroundColor: '#1D4ED8' }}
            />
            Selected
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3"
              style={{
                borderRadius: '9999px',
                border: '2px solid #1D4ED8',
                backgroundColor: 'transparent',
              }}
            />
            Today
          </span>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="w-full mt-5 py-2.5 text-sm font-semibold"
          style={{
            borderRadius: '9999px',
            backgroundColor: selected ? '#1D4ED8' : '#dde0e5',
            color: selected ? '#ffffff' : '#554b5f',
            cursor: selected ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.15s',
          }}
        >
          {selected ? `Confirm ${selected}` : 'Select a date'}
        </button>
      </div>
    </div>
  );
}

export default function Page_maintenance_window(props: GeneratedPageProps) {
  const [durationFilter, setDurationFilter] = useState<'15' | '30' | '60'>('30');
  const [meetingType, setMeetingType] = useState<'maintenance' | 'review' | 'standup'>('maintenance');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#554b5f', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-8 py-4"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold flex items-center gap-1.5" style={{ color: '#554b5f' }}>
            📅 EchoPlan
          </span>
          <nav className="hidden md:flex items-center gap-5 text-sm" style={{ color: '#554b5f' }}>
            {['Calendar', 'Rooms', 'Team', 'Reports'].map(item => (
              <a
                key={item}
                href="#"
                className="hover:opacity-70"
                style={{ color: '#554b5f' }}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs" style={{ color: '#dde0e5' }}>
            UTC-05:00
          </span>
          <div className="flex text-xs" style={{ borderRadius: '9999px', border: '1px solid #dde0e5' }}>
            {['Day', 'Week', 'Month'].map(v => (
              <span
                key={v}
                className="px-3 py-1"
                style={{
                  borderRadius: '9999px',
                  backgroundColor: v === 'Month' ? '#1D4ED8' : 'transparent',
                  color: v === 'Month' ? '#ffffff' : '#554b5f',
                  cursor: 'pointer',
                }}
              >
                {v}
              </span>
            ))}
          </div>
          <span
            className="w-8 h-8 flex items-center justify-center text-sm"
            style={{ borderRadius: '9999px', backgroundColor: '#f8f8f9', color: '#554b5f', cursor: 'pointer' }}
          >
            🔔
          </span>
        </div>
      </header>

      {/* Hero */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=400&fit=crop"
          alt="Meeting room"
          className="w-full h-48 object-cover"
        />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(85,75,95,0.55)' }}
        >
          <div className="text-center">
            <h1 className="text-2xl font-bold" style={{ color: '#ffffff' }}>
              Maintenance Window
            </h1>
            <p className="text-sm mt-1" style={{ color: '#f8f8f9' }}>
              Schedule your next maintenance window. Pick a time that works for your team.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left sidebar — filters & context */}
          <div className="md:col-span-1 space-y-6">
            {/* Filters */}
            <div className="p-5" style={{ backgroundColor: '#ffffff', borderRadius: '16px' }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: '#554b5f' }}>
                Filters
              </h2>

              {/* Duration */}
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#554b5f' }}>
                Duration
              </label>
              <div className="flex gap-2 mb-4">
                {(['15', '30', '60'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDurationFilter(d)}
                    className="flex-1 py-1.5 text-xs font-medium"
                    style={{
                      borderRadius: '9999px',
                      backgroundColor: durationFilter === d ? '#1D4ED8' : '#f8f8f9',
                      color: durationFilter === d ? '#ffffff' : '#554b5f',
                      cursor: 'pointer',
                    }}
                  >
                    {d} min
                  </button>
                ))}
              </div>

              {/* Meeting type */}
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#554b5f' }}>
                Type
              </label>
              <div className="space-y-2">
                {([
                  { value: 'maintenance', label: 'Maintenance' },
                  { value: 'review', label: 'Review' },
                  { value: 'standup', label: 'Standup' },
                ] as const).map(t => (
                  <label
                    key={t.value}
                    className="flex items-center gap-2 text-xs cursor-pointer"
                    style={{ color: '#554b5f' }}
                  >
                    <span
                      className="w-4 h-4 flex items-center justify-center border"
                      style={{
                        borderRadius: '9999px',
                        borderColor: meetingType === t.value ? '#1D4ED8' : '#dde0e5',
                      }}
                    >
                      {meetingType === t.value && (
                        <span
                          className="w-2 h-2 block"
                          style={{ borderRadius: '9999px', backgroundColor: '#1D4ED8' }}
                        />
                      )}
                    </span>
                    {t.label}
                  </label>
                ))}
              </div>

              {/* Timezone */}
              <label className="text-xs font-medium block mt-4 mb-1.5" style={{ color: '#554b5f' }}>
                Timezone
              </label>
              <div
                className="text-xs px-3 py-2"
                style={{
                  borderRadius: '9999px',
                  backgroundColor: '#f8f8f9',
                  color: '#554b5f',
                }}
              >
                America / New_York (UTC−05:00)
              </div>
            </div>

            {/* Upcoming meetings */}
            <div className="p-5" style={{ backgroundColor: '#ffffff', borderRadius: '16px' }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: '#554b5f' }}>
                Upcoming Meetings
              </h2>
              {[
                { title: 'Server Patch Deploy', time: 'Aug 10 · 2:00 PM', avatars: '👤👤' },
                { title: 'DB Migration Review', time: 'Aug 14 · 10:00 AM', avatars: '👤👤👤' },
                { title: 'Network Audit', time: 'Aug 20 · 9:00 AM', avatars: '👤' },
              ].map(m => (
                <div
                  key={m.title}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid #f8f8f9' }}
                >
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#554b5f' }}>
                      {m.title}
                    </p>
                    <p className="text-xs" style={{ color: '#dde0e5' }}>
                      {m.time}
                    </p>
                  </div>
                  <span className="text-xs">{m.avatars}</span>
                </div>
              ))}
            </div>

            {/* Room card */}
            <div style={{ borderRadius: '16px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
              <img
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop"
                alt="Calendar desk workspace"
                className="w-full h-36 object-cover"
              />
              <div className="p-4">
                <p className="text-xs font-semibold" style={{ color: '#554b5f' }}>
                  Ops Room A
                </p>
                <p className="text-xs" style={{ color: '#dde0e5' }}>
                  Available · seats 8
                </p>
              </div>
            </div>
          </div>

          {/* Center — datepicker */}
          <div className="md:col-span-2 space-y-8">
            <div className="p-6" style={{ backgroundColor: '#fefefe', borderRadius: '16px' }}>
              <h2
                className="text-lg font-bold mb-1"
                style={{ color: '#554b5f' }}
              >
                Pick a Maintenance Date
              </h2>
              <p className="text-sm mb-6" style={{ color: '#dde0e5' }}>
                Choose an available date to schedule the next system maintenance window.
                Unavailable dates are grayed out due to existing reservations.
              </p>

              <MaintenanceDatePicker onSubmit={props.onSubmit} />
            </div>

            {/* Meeting link preview */}
            <div className="p-5" style={{ backgroundColor: '#ffffff', borderRadius: '16px' }}>
              <h2 className="text-sm font-semibold mb-2" style={{ color: '#554b5f' }}>
                Meeting Link Preview
              </h2>
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ backgroundColor: '#f8f8f9', borderRadius: '9999px' }}
              >
                <span className="text-sm">🔗</span>
                <span className="text-xs" style={{ color: '#554b5f' }}>
                  https://planit.app/maintenance/window-2025-aug
                </span>
              </div>
            </div>

            {/* Room card inline */}
            <div
              className="flex gap-5 p-5"
              style={{ backgroundColor: '#ffffff', borderRadius: '16px' }}
            >
              <img
                src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop"
                alt="Classroom for team meeting"
                className="w-28 h-20 object-cover"
                style={{ borderRadius: '12px' }}
              />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#554b5f' }}>
                  Conference Hall B
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#dde0e5' }}>
                  Large room · 20 seats · AV equipped
                </p>
                <span
                  className="inline-block mt-2 text-xs px-3 py-1 font-medium"
                  style={{
                    borderRadius: '9999px',
                    backgroundColor: '#10B981',
                    color: '#ffffff',
                  }}
                >
                  Available
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-8" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-5xl mx-auto grid sm:grid-cols-4 gap-6 text-xs" style={{ color: '#554b5f' }}>
          <div>
            <p className="font-semibold mb-2">Calendar Sync</p>
            <ul className="space-y-1" style={{ color: '#dde0e5' }}>
              <li>EchoCal</li>
              <li>EchoMail</li>
              <li>EchoDate</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">Notifications</p>
            <ul className="space-y-1" style={{ color: '#dde0e5' }}>
              <li>Email reminders</li>
              <li>SMS alerts</li>
              <li>Push notifications</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">Integrations</p>
            <ul className="space-y-1" style={{ color: '#dde0e5' }}>
              <li>EchoChat</li>
              <li>EchoTeam</li>
              <li>EchoConf</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">Help</p>
            <ul className="space-y-1" style={{ color: '#dde0e5' }}>
              <li>Help Center</li>
              <li>Contact Support</li>
              <li>API Docs</li>
            </ul>
          </div>
        </div>
        <p className="text-center text-xs mt-6" style={{ color: '#dde0e5' }}>
          © 2025 EchoPlan. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
