import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS_HEADER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function pad(n: number) { return n < 10 ? '0' + n : '' + n; }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getStartDow(y: number, m: number) {
  const d = new Date(y, m, 1).getDay();
  return d === 0 ? 6 : d - 1;
}
function isWeekendDay(y: number, m: number, d: number) {
  const dow = new Date(y, m, d).getDay();
  return dow === 0 || dow === 6;
}

/* ────────────────────────────────────────────
   Widget 1 — Session Date & Time
   ──────────────────────────────────────────── */
function SessionDateTimePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(11);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const startDow = useMemo(() => getStartDow(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const handleDayClick = useCallback((d: number) => {
    if (isWeekendDay(year, month, d)) return;
    setSelectedDate(toISO(year, month, d));
  }, [year, month]);

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    const h24 = ampm === 'PM' ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
    const timeStr = `${pad(h24)}:${pad(minute)}:00`;
    const value = `${selectedDate}T${timeStr}`;
    onSubmit({
      type: 'datetime',
      value,
      raw: { widget_id: 'session_datetime', date: selectedDate, hour, minute, ampm, iso: value },
    });
  }, [selectedDate, hour, minute, ampm, onSubmit]);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startDow; i++) cells.push(<div key={`e${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toISO(year, month, d);
    const weekend = isWeekendDay(year, month, d);
    const sel = selectedDate === iso;
    cells.push(
      <button key={d} type="button" disabled={weekend} onClick={() => handleDayClick(d)}
        className={`h-9 w-full text-sm rounded-lg transition-colors
          ${weekend ? 'text-gray-600 cursor-not-allowed opacity-30' : sel ? 'text-white font-semibold' : 'text-gray-300 hover:bg-white/10'}`}
        style={{ backgroundColor: sel ? '#0D9488' : 'transparent' }}>
        {d}
      </button>,
    );
  }

  return (
    <div data-widget-id="session_datetime" className="flex flex-col">
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#ffffff' }}>Session Date &amp; Time</h3>
      <p className="text-xs mb-4" style={{ color: '#b8bab0' }}>Choose a weekday and time for your tutoring session</p>

      <div className="rounded-xl p-4 flex-1" style={{ backgroundColor: '#1e1e2a' }}>
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={prevMonth} className="text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors" aria-label="Previous month">‹</button>
          <span className="text-sm font-medium text-white">{MONTHS[month]} {year}</span>
          <button type="button" onClick={nextMonth} className="text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors" aria-label="Next month">›</button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS_HEADER.map(d => (
            <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#b8bab0' }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{cells}</div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
          <label className="text-xs" style={{ color: '#b8bab0' }}>Time</label>
          <select value={hour} onChange={e => setHour(Number(e.target.value))}
            className="rounded-lg px-2 py-1.5 text-sm text-white border border-white/10 outline-none" style={{ backgroundColor: '#191922' }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <span className="text-white font-medium">:</span>
          <select value={minute} onChange={e => setMinute(Number(e.target.value))}
            className="rounded-lg px-2 py-1.5 text-sm text-white border border-white/10 outline-none" style={{ backgroundColor: '#191922' }}>
            {[0, 15, 30, 45].map(m => <option key={m} value={m}>{pad(m)}</option>)}
          </select>
          <div className="flex rounded-lg overflow-hidden border border-white/10 ml-auto">
            {(['AM', 'PM'] as const).map(v => (
              <button key={v} type="button" onClick={() => setAmpm(v)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${ampm === v ? 'text-white' : 'text-gray-500'}`}
                style={{ backgroundColor: ampm === v ? '#0D9488' : '#191922' }}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      <button type="button" onClick={handleSubmit} disabled={!selectedDate}
        className={`mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${selectedDate ? 'text-white hover:opacity-90' : 'text-gray-500 cursor-not-allowed'}`}
        style={{ backgroundColor: selectedDate ? '#0D9488' : '#2a2a36' }}>
        Confirm Session
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────
   Widget 2 — Student DOB
   ──────────────────────────────────────────── */
function StudentDOBPicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const MIN_DATE = '1960-12-30';
  const MAX_DATE = '1961-04-07';

  const [year, setYear] = useState(1961);
  const [month, setMonth] = useState(2);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const years = useMemo(() => Array.from({ length: 2015 - 1950 + 1 }, (_, i) => 1950 + i), []);
  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const startDow = useMemo(() => getStartDow(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const handleDayClick = useCallback((d: number) => {
    const iso = toISO(year, month, d);
    if (iso < MIN_DATE || iso > MAX_DATE) return;
    setSelectedDate(iso);
  }, [year, month]);

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    onSubmit({
      type: 'dob',
      value: selectedDate,
      raw: { widget_id: 'student_dob', dob: selectedDate, year, month: month + 1 },
    });
  }, [selectedDate, onSubmit, year, month]);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startDow; i++) cells.push(<div key={`e${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toISO(year, month, d);
    const outOfRange = iso < MIN_DATE || iso > MAX_DATE;
    const sel = selectedDate === iso;
    cells.push(
      <button key={d} type="button" disabled={outOfRange} onClick={() => handleDayClick(d)}
        className={`h-9 w-full text-sm rounded-lg transition-colors
          ${outOfRange ? 'text-gray-600 cursor-not-allowed opacity-30' : sel ? 'text-white font-semibold' : 'text-gray-300 hover:bg-white/10'}`}
        style={{ backgroundColor: sel ? '#F59E0B' : 'transparent' }}>
        {d}
      </button>,
    );
  }

  return (
    <div data-widget-id="student_dob" className="flex flex-col">
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#ffffff' }}>Student Date of Birth</h3>
      <p className="text-xs mb-4" style={{ color: '#b8bab0' }}>Select DOB between Dec 30, 1960 – Apr 7, 1961</p>

      <div className="rounded-xl p-4 flex-1" style={{ backgroundColor: '#1e1e2a' }}>
        <div className="flex gap-2 mb-3">
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="flex-1 rounded-lg px-2 py-1.5 text-sm text-white border border-white/10 outline-none" style={{ backgroundColor: '#191922' }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="flex-1 rounded-lg px-2 py-1.5 text-sm text-white border border-white/10 outline-none" style={{ backgroundColor: '#191922' }}>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>

        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={prevMonth} className="text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors" aria-label="Previous month">‹</button>
          <span className="text-sm font-medium text-white">{MONTHS[month]} {year}</span>
          <button type="button" onClick={nextMonth} className="text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors" aria-label="Next month">›</button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS_HEADER.map(d => (
            <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#b8bab0' }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{cells}</div>
      </div>

      <button type="button" onClick={handleSubmit} disabled={!selectedDate}
        className={`mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${selectedDate ? 'text-white hover:opacity-90' : 'text-gray-500 cursor-not-allowed'}`}
        style={{ backgroundColor: selectedDate ? '#F59E0B' : '#2a2a36' }}>
        Confirm Date of Birth
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────
   Widget 3 — Compound (standard date calendar)
   ──────────────────────────────────────────── */
function CompoundDatePicker({ onSubmit }: { onSubmit: GeneratedPageProps['onSubmit'] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const startDow = useMemo(() => getStartDow(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }, [month]);
  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }, [month]);

  const handleDayClick = useCallback((d: number) => {
    if (isWeekendDay(year, month, d)) return;
    setSelectedDate(toISO(year, month, d));
  }, [year, month]);

  const handleSubmit = useCallback(() => {
    if (!selectedDate) return;
    onSubmit({
      type: 'date',
      value: selectedDate,
      raw: { widget_id: 'compound', date: selectedDate },
    });
  }, [selectedDate, onSubmit]);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startDow; i++) cells.push(<div key={`e${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toISO(year, month, d);
    const weekend = isWeekendDay(year, month, d);
    const sel = selectedDate === iso;
    cells.push(
      <button key={d} type="button" disabled={weekend} onClick={() => handleDayClick(d)}
        className={`h-9 w-full text-sm rounded-lg transition-colors
          ${weekend ? 'text-gray-600 cursor-not-allowed opacity-30' : sel ? 'text-white font-semibold' : 'text-gray-300 hover:bg-white/10'}`}
        style={{ backgroundColor: sel ? '#0D9488' : 'transparent' }}>
        {d}
      </button>,
    );
  }

  return (
    <div data-widget-id="compound" className="flex flex-col">
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#ffffff' }}>Session Date &amp; Student DOB</h3>
      <p className="text-xs mb-4" style={{ color: '#b8bab0' }}>Select a weekday for your combined session booking</p>

      <div className="rounded-xl p-4 flex-1" style={{ backgroundColor: '#1e1e2a' }}>
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={prevMonth} className="text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors" aria-label="Previous month">‹</button>
          <span className="text-sm font-medium text-white">{MONTHS[month]} {year}</span>
          <button type="button" onClick={nextMonth} className="text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors" aria-label="Next month">›</button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS_HEADER.map(d => (
            <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#b8bab0' }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{cells}</div>
      </div>

      <button type="button" onClick={handleSubmit} disabled={!selectedDate}
        className={`mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${selectedDate ? 'text-white hover:opacity-90' : 'text-gray-500 cursor-not-allowed'}`}
        style={{ backgroundColor: selectedDate ? '#0D9488' : '#2a2a36' }}>
        Confirm Date
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────
   Main Page
   ──────────────────────────────────────────── */
export default function Page_tutoring_session(props: GeneratedPageProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#191922', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <header className="border-b border-white/5" style={{ backgroundColor: '#1e1e2a' }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔧</span>
              <span className="text-base font-semibold text-white tracking-tight">EchoServe</span>
            </div>
            <nav className="hidden md:flex items-center gap-5">
              {['Home', 'Services', 'Book', 'Contact'].map(item => (
                <a key={item} href="#" className="text-sm transition-colors" style={{ color: '#b8bab0' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#b8bab0')}>{item}</a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-1.5 border border-white/10" style={{ backgroundColor: '#191922' }}>
              <svg className="w-4 h-4" fill="none" stroke="#b8bab0" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" placeholder="Search services..." className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-36" />
            </div>
            <div className="hidden sm:flex items-center gap-1 text-xs" style={{ color: '#b8bab0' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>10001</span>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: '#0D9488' }}>SP</div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative">
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop"
          alt="Tutoring session in progress"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 flex items-center" style={{ background: 'linear-gradient(to right, #191922ee 40%, #19192200 100%)' }}>
          <div className="max-w-7xl mx-auto px-6 w-full">
            <h1 className="text-2xl font-bold text-white mb-1">Book a Tutoring Session</h1>
            <p className="text-sm" style={{ color: '#b8bab0' }}>Find expert tutors near you — schedule on your terms</p>
          </div>
        </div>
      </section>

      {/* ── Context bar ── */}
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-white/10" style={{ color: '#fbfdfc', backgroundColor: '#1e1e2a' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#0D9488' }} />
            Tutoring Session
          </span>
          <span className="text-xs" style={{ color: '#b8bab0' }}>Complete the fields below to book your session, verify student info, and confirm dates.</span>
        </div>
      </div>

      {/* ── Main content: 3 widgets ── */}
      <main className="max-w-7xl mx-auto px-6 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <SessionDateTimePicker onSubmit={props.onSubmit} />
          <StudentDOBPicker onSubmit={props.onSubmit} />
          <CompoundDatePicker onSubmit={props.onSubmit} />
        </div>
      </main>

      {/* ── Service Provider cards ── */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <h2 className="text-base font-semibold text-white mb-4">Top-Rated Tutors Near You</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { name: 'Maria G.', specialty: 'Math & Physics', rate: '$45/hr', rating: 4.9, reviews: 132, img: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400&h=300&fit=crop', alt: 'Fitness and tutoring professional' },
            { name: 'James T.', specialty: 'English & Writing', rate: '$38/hr', rating: 4.8, reviews: 87, img: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=300&fit=crop', alt: 'Professional educator' },
            { name: 'Priya K.', specialty: 'Chemistry & Biology', rate: '$50/hr', rating: 5.0, reviews: 64, img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=400&fit=crop', alt: 'Science tutor at work' },
          ].map(tutor => (
            <div key={tutor.name} className="rounded-xl overflow-hidden border border-white/5" style={{ backgroundColor: '#1e1e2a' }}>
              <img src={tutor.img} alt={tutor.alt} className="w-full h-48 object-cover" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white">{tutor.name}</span>
                  <span className="text-xs font-medium" style={{ color: '#F59E0B' }}>★ {tutor.rating}</span>
                </div>
                <p className="text-xs mb-2" style={{ color: '#b8bab0' }}>{tutor.specialty}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#b8bab0' }}>{tutor.reviews} reviews</span>
                  <span className="text-sm font-semibold" style={{ color: '#0D9488' }}>{tutor.rate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5" style={{ backgroundColor: '#1e1e2a' }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <h4 className="text-xs font-semibold text-white mb-2 uppercase tracking-wider">Guarantee</h4>
              <p className="text-xs leading-relaxed" style={{ color: '#b8bab0' }}>100% satisfaction guarantee on every session. Free rebooking if you're not happy.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white mb-2 uppercase tracking-wider">Verified Tutors</h4>
              <p className="text-xs leading-relaxed" style={{ color: '#b8bab0' }}>All providers are background-checked and credential-verified.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white mb-2 uppercase tracking-wider">Help Center</h4>
              <ul className="space-y-1">
                {['FAQs', 'Contact Support', 'Cancellation Policy'].map(l => (
                  <li key={l}><a href="#" className="text-xs hover:underline" style={{ color: '#b8bab0' }}>{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white mb-2 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-1">
                {['Terms of Service', 'Privacy Policy', 'Cookie Settings'].map(l => (
                  <li key={l}><a href="#" className="text-xs hover:underline" style={{ color: '#b8bab0' }}>{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-4 border-t border-white/5 text-center">
            <span className="text-xs" style={{ color: '#b8bab0' }}>© 2025 EchoServe. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
