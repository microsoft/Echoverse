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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function pad(n: number) {
  return n < 10 ? '0' + n : '' + n;
}

export default function Page_meeting_room(props: GeneratedPageProps) {
  const [currentMonth, setCurrentMonth] = useState(5);
  const [currentYear, setCurrentYear] = useState(2025);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [duration, setDuration] = useState(30);
  const [meetingType, setMeetingType] = useState('standup');
  const [filterRoom, setFilterRoom] = useState('all');

  const daysInMonth = useMemo(() => getDaysInMonth(currentYear, currentMonth), [currentYear, currentMonth]);
  const firstDay = useMemo(() => getFirstDayOfWeek(currentYear, currentMonth), [currentYear, currentMonth]);

  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [daysInMonth, firstDay]);

  const isWeekend = useCallback((day: number) => {
    const dow = new Date(currentYear, currentMonth, day).getDay();
    return dow === 0 || dow === 6;
  }, [currentYear, currentMonth]);

  const prevMonth = useCallback(() => {
    setSelectedDay(null);
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  }, [currentMonth]);

  const nextMonth = useCallback(() => {
    setSelectedDay(null);
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  }, [currentMonth]);

  const handleDayClick = useCallback((day: number) => {
    if (isWeekend(day)) return;
    setSelectedDay(day);
  }, [isWeekend]);

  const buildISO = useCallback(() => {
    if (selectedDay === null) return '';
    let h = selectedHour;
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return `${currentYear}-${pad(currentMonth + 1)}-${pad(selectedDay)}T${pad(h)}:${pad(selectedMinute)}:00`;
  }, [selectedDay, selectedHour, selectedMinute, ampm, currentYear, currentMonth]);

  const handleSubmit = useCallback(() => {
    const iso = buildISO();
    if (!iso) return;
    props.onSubmit({
      type: 'datetime',
      value: iso,
      raw: {
        widget_id: 'meeting_datetime',
        year: currentYear,
        month: currentMonth + 1,
        day: selectedDay,
        hour: selectedHour,
        minute: selectedMinute,
        ampm,
        duration,
        meetingType,
        iso,
      },
    });
  }, [buildISO, props, currentYear, currentMonth, selectedDay, selectedHour, selectedMinute, ampm, duration, meetingType]);

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const minutes = useMemo(() => [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], []);

  const upcomingMeetings = [
    { time: '10:00 AM', title: 'Sprint Review', room: 'Room A', participants: 6 },
    { time: '1:30 PM', title: 'Design Sync', room: 'Room B', participants: 4 },
    { time: '3:00 PM', title: 'Client Call', room: 'Room C', participants: 3 },
  ];

  const rooms = [
    { name: 'Room A — Horizon', capacity: 12, floor: '3rd' },
    { name: 'Room B — Summit', capacity: 8, floor: '3rd' },
    { name: 'Room C — Apex', capacity: 6, floor: '2nd' },
    { name: 'Room D — Nova', capacity: 4, floor: '2nd' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0c0b21', color: '#e2e2ea', fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      {/* Header */}
      <header className="w-full" style={{ backgroundColor: '#191929' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <span className="text-lg font-bold tracking-tight" style={{ color: '#ffffff' }}>EchoPlan</span>
            </div>
            <nav className="hidden md:flex items-center gap-4 text-sm" style={{ color: '#9b9baf' }}>
              {['Calendar', 'Rooms', 'Team', 'Reports'].map(item => (
                <a key={item} href="#" className="hover:opacity-80 transition-opacity" style={{ color: item === 'Calendar' ? '#7c8aff' : undefined }}>{item}</a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <select className="px-2 py-1 text-xs" style={{ backgroundColor: '#2b2d39', color: '#9b9baf', border: 'none', borderRadius: 0 }}>
              <option>UTC-5 (EST)</option>
              <option>UTC-8 (PST)</option>
              <option>UTC+0 (GMT)</option>
              <option>UTC+1 (CET)</option>
            </select>
            <div className="flex text-xs" style={{ backgroundColor: '#2b2d39' }}>
              {['Day', 'Week', 'Month'].map((v, i) => (
                <button key={v} className="px-2 py-1" style={{ backgroundColor: i === 2 ? '#535563' : 'transparent', color: i === 2 ? '#fff' : '#9b9baf' }}>{v}</button>
              ))}
            </div>
            <button className="relative p-1" style={{ color: '#9b9baf' }}>
              <span className="text-base">🔔</span>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ backgroundColor: '#ef4444' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative w-full overflow-hidden" style={{ maxHeight: 220 }}>
        <img
          src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=400&fit=crop"
          alt="Meeting room"
          className="w-full object-cover"
          style={{ height: 220 }}
        />
        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-5" style={{ background: 'linear-gradient(transparent 20%, #0c0b21 95%)' }}>
          <h1 className="text-2xl font-bold" style={{ color: '#ffffff' }}>Pick a Time</h1>
          <p className="text-sm mt-1" style={{ color: '#9b9baf' }}>Reserve a meeting room and schedule your next session with your team.</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <label className="text-xs" style={{ color: '#9b9baf' }}>Room:</label>
          <select
            value={filterRoom}
            onChange={e => setFilterRoom(e.target.value)}
            className="px-2 py-1 text-xs"
            style={{ backgroundColor: '#2b2d39', color: '#e2e2ea', border: 'none', borderRadius: 0 }}
          >
            <option value="all">All Rooms</option>
            <option value="a">Room A</option>
            <option value="b">Room B</option>
            <option value="c">Room C</option>
            <option value="d">Room D</option>
          </select>
          <label className="text-xs" style={{ color: '#9b9baf' }}>Duration:</label>
          <div className="flex text-xs">
            {[15, 30, 60].map(d => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className="px-3 py-1"
                style={{ backgroundColor: duration === d ? '#535563' : '#2b2d39', color: duration === d ? '#fff' : '#9b9baf' }}
              >{d} min</button>
            ))}
          </div>
          <label className="text-xs ml-auto" style={{ color: '#9b9baf' }}>Type:</label>
          {['standup', 'review', 'workshop'].map(t => (
            <label key={t} className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: meetingType === t ? '#e2e2ea' : '#9b9baf' }}>
              <input type="radio" name="meetingType" value={t} checked={meetingType === t} onChange={() => setMeetingType(t)} className="accent-blue-500" />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Datepicker Widget */}
          <div className="lg:col-span-2" data-widget-id="meeting_datetime">
            <div className="p-4" style={{ backgroundColor: '#191929' }}>
              <h2 className="text-base font-bold mb-1" style={{ color: '#ffffff' }}>Meeting Date &amp; Time</h2>
              <p className="text-xs mb-4" style={{ color: '#9b9baf' }}>Select a weekday and time for your meeting. Weekends are unavailable.</p>

              {/* Month Nav */}
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="px-2 py-1 text-sm" style={{ backgroundColor: '#2b2d39', color: '#e2e2ea' }}>◀</button>
                <span className="text-sm font-bold" style={{ color: '#ffffff' }}>{MONTHS[currentMonth]} {currentYear}</span>
                <button onClick={nextMonth} className="px-2 py-1 text-sm" style={{ backgroundColor: '#2b2d39', color: '#e2e2ea' }}>▶</button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 text-center text-xs mb-1" style={{ color: '#9b9baf' }}>
                {DAYS.map(d => <div key={d} className="py-1">{d}</div>)}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 text-center text-sm">
                {calendarCells.map((day, idx) => {
                  if (day === null) return <div key={idx} className="py-2" />;
                  const weekend = isWeekend(day);
                  const selected = selectedDay === day;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleDayClick(day)}
                      disabled={weekend}
                      className="py-2 transition-colors"
                      style={{
                        backgroundColor: selected ? '#1D4ED8' : 'transparent',
                        color: weekend ? '#3a3a4d' : selected ? '#ffffff' : '#e2e2ea',
                        cursor: weekend ? 'not-allowed' : 'pointer',
                        fontWeight: selected ? 700 : 400,
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Time Selection */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="text-xs" style={{ color: '#9b9baf' }}>Time:</label>
                <select
                  value={selectedHour}
                  onChange={e => setSelectedHour(Number(e.target.value))}
                  className="px-2 py-1 text-sm"
                  style={{ backgroundColor: '#2b2d39', color: '#e2e2ea', border: 'none', borderRadius: 0 }}
                >
                  {hours.map(h => <option key={h} value={h}>{pad(h)}</option>)}
                </select>
                <span style={{ color: '#9b9baf' }}>:</span>
                <select
                  value={selectedMinute}
                  onChange={e => setSelectedMinute(Number(e.target.value))}
                  className="px-2 py-1 text-sm"
                  style={{ backgroundColor: '#2b2d39', color: '#e2e2ea', border: 'none', borderRadius: 0 }}
                >
                  {minutes.map(m => <option key={m} value={m}>{pad(m)}</option>)}
                </select>
                <div className="flex">
                  <button
                    onClick={() => setAmpm('AM')}
                    className="px-3 py-1 text-xs"
                    style={{ backgroundColor: ampm === 'AM' ? '#1D4ED8' : '#2b2d39', color: ampm === 'AM' ? '#fff' : '#9b9baf' }}
                  >AM</button>
                  <button
                    onClick={() => setAmpm('PM')}
                    className="px-3 py-1 text-xs"
                    style={{ backgroundColor: ampm === 'PM' ? '#1D4ED8' : '#2b2d39', color: ampm === 'PM' ? '#fff' : '#9b9baf' }}
                  >PM</button>
                </div>
              </div>

              {/* Selection Preview */}
              {selectedDay !== null && (
                <div className="mt-3 px-3 py-2 text-xs" style={{ backgroundColor: '#2b2d39', color: '#10B981' }}>
                  Selected: {MONTHS[currentMonth]} {selectedDay}, {currentYear} at {pad(selectedHour)}:{pad(selectedMinute)} {ampm} — {duration} min {meetingType}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={selectedDay === null}
                className="mt-4 w-full py-2 text-sm font-bold transition-opacity"
                style={{
                  backgroundColor: selectedDay !== null ? '#1D4ED8' : '#343743',
                  color: selectedDay !== null ? '#ffffff' : '#6b6b7b',
                  cursor: selectedDay !== null ? 'pointer' : 'not-allowed',
                  borderRadius: 0,
                }}
              >
                Confirm Booking
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            {/* Upcoming Meetings */}
            <div className="p-4" style={{ backgroundColor: '#191929' }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: '#ffffff' }}>Upcoming Meetings</h3>
              <div className="flex flex-col gap-2">
                {upcomingMeetings.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 px-2 py-2" style={{ backgroundColor: '#2b2d39' }}>
                    <div className="text-xs font-bold" style={{ color: '#10B981', minWidth: 64 }}>{m.time}</div>
                    <div className="flex-1">
                      <div className="text-xs font-bold" style={{ color: '#e2e2ea' }}>{m.title}</div>
                      <div className="text-xs" style={{ color: '#9b9baf' }}>{m.room} · {m.participants} participants</div>
                    </div>
                    <div className="flex -space-x-1">
                      {Array.from({ length: Math.min(m.participants, 3) }).map((_, j) => (
                        <div key={j} className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: ['#535563', '#343743', '#1D4ED8'][j], color: '#fff', border: '1px solid #191929' }}>
                          {String.fromCharCode(65 + j)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Image */}
            <div style={{ backgroundColor: '#191929' }}>
              <img
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop"
                alt="Calendar desk"
                className="w-full h-48 object-cover"
              />
              <div className="px-4 py-3">
                <h4 className="text-xs font-bold" style={{ color: '#ffffff' }}>Meeting Link Preview</h4>
                <p className="text-xs mt-1" style={{ color: '#9b9baf' }}>A meeting link will be generated once you confirm your booking.</p>
                <div className="mt-2 px-2 py-1 text-xs" style={{ backgroundColor: '#2b2d39', color: '#7c8aff' }}>https://planit.app/room/...</div>
              </div>
            </div>
          </div>
        </div>

        {/* Room Availability Table */}
        <div className="mt-6 p-4" style={{ backgroundColor: '#191929' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#ffffff' }}>Room Availability</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2b2d39' }}>
                  <th className="text-left py-2 px-3" style={{ color: '#9b9baf' }}>Room</th>
                  <th className="text-left py-2 px-3" style={{ color: '#9b9baf' }}>Capacity</th>
                  <th className="text-left py-2 px-3" style={{ color: '#9b9baf' }}>Floor</th>
                  <th className="text-left py-2 px-3" style={{ color: '#9b9baf' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #2b2d39' }}>
                    <td className="py-2 px-3" style={{ color: '#e2e2ea' }}>{r.name}</td>
                    <td className="py-2 px-3" style={{ color: '#9b9baf' }}>{r.capacity} seats</td>
                    <td className="py-2 px-3" style={{ color: '#9b9baf' }}>{r.floor}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5" style={{ backgroundColor: i < 2 ? '#10B981' : '#535563', color: '#fff', fontSize: 10 }}>
                        {i < 2 ? 'Available' : 'Reserved'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-6 px-4" style={{ backgroundColor: '#191929', borderTop: '1px solid #2b2d39' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-xs" style={{ color: '#9b9baf' }}>
          <div>
            <h4 className="font-bold mb-2" style={{ color: '#ffffff' }}>Calendar Sync</h4>
            <p>EchoCal</p>
            <p>EchoMail</p>
            <p>EchoDate</p>
          </div>
          <div>
            <h4 className="font-bold mb-2" style={{ color: '#ffffff' }}>Notifications</h4>
            <p>Email Reminders</p>
            <p>EchoChat Alerts</p>
            <p>Push Notifications</p>
          </div>
          <div>
            <h4 className="font-bold mb-2" style={{ color: '#ffffff' }}>Integrations</h4>
            <p>EchoConf</p>
            <p>EchoTeam</p>
            <p>EchoMeet</p>
          </div>
          <div>
            <h4 className="font-bold mb-2" style={{ color: '#ffffff' }}>Help</h4>
            <p>Help Center</p>
            <p>Keyboard Shortcuts</p>
            <p>Contact Support</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-4 pt-3 text-center text-xs" style={{ borderTop: '1px solid #2b2d39', color: '#535563' }}>
          © 2025 EchoPlan · Privacy · Terms
        </div>
      </footer>
    </div>
  );
}
