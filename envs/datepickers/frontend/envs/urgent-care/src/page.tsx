import React, { useState, useCallback, useMemo } from "react";

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const MONTHS_SHORT = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function startDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function toMonthStr(y: number, m: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

/* ─── Widget 1: Visit Date (single_date, no constraints) ─── */
function VisitDatePicker(props: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(9); // October = index 9
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const totalDays = daysInMonth(year, month);
  const startDay = startDayOfMonth(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const handleSubmit = () => {
    if (!selectedDate) return;
    props.onSubmit({
      type: "date",
      value: selectedDate,
      raw: { widget_id: "visit_date", date: selectedDate, year, month: month + 1 },
    });
  };

  return (
    <div data-widget-id="visit_date" className="rounded-xl p-6" style={{ backgroundColor: "#3f4040", border: "1px solid #464645" }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "#fafafa" }}>Select Visit Date</h3>
      <p className="text-sm mb-4" style={{ color: "#7b776f" }}>Choose an available date for your urgent care visit.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="px-3 py-1 rounded-lg text-lg font-bold" style={{ color: "#fafafa", backgroundColor: "#464645" }} aria-label="Previous month">&larr;</button>
        <span className="font-semibold" style={{ color: "#fafafa" }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="px-3 py-1 rounded-lg text-lg font-bold" style={{ color: "#fafafa", backgroundColor: "#464645" }} aria-label="Next month">&rarr;</button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1" style={{ color: "#7b776f" }}>
        {DAYS.map(d => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const ds = toDateStr(year, month, day);
          const isSel = selectedDate === ds;
          return (
            <button
              key={day}
              onClick={() => setSelectedDate(ds)}
              className="py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: isSel ? "#0D9488" : "transparent",
                color: isSel ? "#fff" : "#fafafa",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <p className="text-sm mb-3" style={{ color: "#7b776f" }}>
          Selected: <span style={{ color: "#fafafa" }}>{selectedDate}</span>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedDate}
        className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity"
        style={{
          backgroundColor: selectedDate ? "#0D9488" : "#464645",
          color: selectedDate ? "#fff" : "#7b776f",
          opacity: selectedDate ? 1 : 0.6,
        }}
      >
        Confirm Visit Date
      </button>
    </div>
  );
}

/* ─── Widget 2: Symptom Start Month (month_year, past_only, max 2025-08) ─── */
function SymptomMonthPicker(props: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [year, setYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const maxYear = 2025;
  const maxMonth = 7; // August = index 7

  const isDisabled = useCallback(
    (mIdx: number) => {
      if (year > maxYear) return true;
      if (year === maxYear && mIdx > maxMonth) return true;
      return false;
    },
    [year]
  );

  const prevYear = () => setYear(y => y - 1);
  const nextYear = () => setYear(y => y + 1);

  const handleSubmit = () => {
    if (!selectedMonth) return;
    props.onSubmit({
      type: "month_year",
      value: selectedMonth,
      raw: { widget_id: "symptom_month", month_year: selectedMonth, year },
    });
  };

  return (
    <div data-widget-id="symptom_month" className="rounded-xl p-6" style={{ backgroundColor: "#3f4040", border: "1px solid #464645" }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "#fafafa" }}>Symptom Start Month</h3>
      <p className="text-sm mb-4" style={{ color: "#7b776f" }}>Select the month and year when your symptoms first began.</p>

      <div className="flex items-center justify-between mb-4">
        <button onClick={prevYear} className="px-3 py-1 rounded-lg text-lg font-bold" style={{ color: "#fafafa", backgroundColor: "#464645" }} aria-label="Previous year">&larr;</button>
        <span className="font-semibold text-lg" style={{ color: "#fafafa" }}>{year}</span>
        <button onClick={nextYear} className="px-3 py-1 rounded-lg text-lg font-bold" style={{ color: "#fafafa", backgroundColor: "#464645" }} aria-label="Next year">&rarr;</button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {MONTHS_SHORT.map((m, idx) => {
          const disabled = isDisabled(idx);
          const ms = toMonthStr(year, idx);
          const isSel = selectedMonth === ms;
          return (
            <button
              key={m}
              disabled={disabled}
              onClick={() => { if (!disabled) setSelectedMonth(ms); }}
              className="py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: isSel ? "#0D9488" : disabled ? "#343434" : "#464645",
                color: isSel ? "#fff" : disabled ? "#555" : "#fafafa",
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {m}
            </button>
          );
        })}
      </div>

      {selectedMonth && (
        <p className="text-sm mb-3" style={{ color: "#7b776f" }}>
          Selected: <span style={{ color: "#fafafa" }}>{selectedMonth}</span>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedMonth}
        className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity"
        style={{
          backgroundColor: selectedMonth ? "#0D9488" : "#464645",
          color: selectedMonth ? "#fff" : "#7b776f",
          opacity: selectedMonth ? 1 : 0.6,
        }}
      >
        Confirm Symptom Month
      </button>
    </div>
  );
}

/* ─── Widget 3: Compound (single_date + month_year) ─── */
function CompoundPicker(props: { onSubmit: GeneratedPageProps["onSubmit"] }) {
  const [tab, setTab] = useState<"date" | "month">("date");

  // Date picker state
  const [dYear, setDYear] = useState(2025);
  const [dMonth, setDMonth] = useState(5); // June = index 5
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Month picker state
  const [mYear, setMYear] = useState(2025);
  const [selectedMY, setSelectedMY] = useState<string | null>(null);
  const today = useMemo(() => new Date(2025, 0, 1), []);
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();

  const isMonthDisabled = useCallback(
    (mIdx: number) => {
      if (mYear > todayYear) return true;
      if (mYear === todayYear && mIdx > todayMonth) return true;
      return false;
    },
    [mYear, todayYear, todayMonth]
  );

  // Date calendar helpers
  const totalDays = daysInMonth(dYear, dMonth);
  const startDay = startDayOfMonth(dYear, dMonth);

  const prevMonth = () => {
    if (dMonth === 0) { setDMonth(11); setDYear(y => y - 1); } else setDMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (dMonth === 11) { setDMonth(0); setDYear(y => y + 1); } else setDMonth(m => m + 1);
  };

  const handleSubmitDate = () => {
    if (!selectedDate) return;
    props.onSubmit({
      type: "date",
      value: selectedDate,
      raw: { widget_id: "compound", sub_widget: "visit_date", date: selectedDate, year: dYear, month: dMonth + 1 },
    });
  };

  const handleSubmitMonth = () => {
    if (!selectedMY) return;
    props.onSubmit({
      type: "month_year",
      value: selectedMY,
      raw: { widget_id: "compound", sub_widget: "symptom_month", month_year: selectedMY, year: mYear },
    });
  };

  return (
    <div data-widget-id="compound" className="rounded-xl p-6" style={{ backgroundColor: "#3f4040", border: "1px solid #464645" }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "#fafafa" }}>Visit Date + Symptom Start Month</h3>
      <p className="text-sm mb-4" style={{ color: "#7b776f" }}>
        Use the tabs below to select both your visit date and the month your symptoms started.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("date")}
          className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
          style={{
            backgroundColor: tab === "date" ? "#0D9488" : "#464645",
            color: tab === "date" ? "#fff" : "#7b776f",
          }}
        >
          Visit Date
        </button>
        <button
          onClick={() => setTab("month")}
          className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
          style={{
            backgroundColor: tab === "month" ? "#0D9488" : "#464645",
            color: tab === "month" ? "#fff" : "#7b776f",
          }}
        >
          Symptom Month
        </button>
      </div>

      {tab === "date" && (
        <>
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="px-3 py-1 rounded-lg text-lg font-bold" style={{ color: "#fafafa", backgroundColor: "#464645" }} aria-label="Previous month">&larr;</button>
            <span className="font-semibold" style={{ color: "#fafafa" }}>{MONTHS[dMonth]} {dYear}</span>
            <button onClick={nextMonth} className="px-3 py-1 rounded-lg text-lg font-bold" style={{ color: "#fafafa", backgroundColor: "#464645" }} aria-label="Next month">&rarr;</button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1" style={{ color: "#7b776f" }}>
            {DAYS.map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: totalDays }, (_, i) => {
              const day = i + 1;
              const ds = toDateStr(dYear, dMonth, day);
              const isSel = selectedDate === ds;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(ds)}
                  className="py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: isSel ? "#0D9488" : "transparent",
                    color: isSel ? "#fff" : "#fafafa",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {selectedDate && (
            <p className="text-sm mb-3" style={{ color: "#7b776f" }}>
              Selected: <span style={{ color: "#fafafa" }}>{selectedDate}</span>
            </p>
          )}
          <button
            onClick={handleSubmitDate}
            disabled={!selectedDate}
            className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity"
            style={{
              backgroundColor: selectedDate ? "#0D9488" : "#464645",
              color: selectedDate ? "#fff" : "#7b776f",
              opacity: selectedDate ? 1 : 0.6,
            }}
          >
            Submit Visit Date
          </button>
        </>
      )}

      {tab === "month" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setMYear(y => y - 1)} className="px-3 py-1 rounded-lg text-lg font-bold" style={{ color: "#fafafa", backgroundColor: "#464645" }} aria-label="Previous year">&larr;</button>
            <span className="font-semibold text-lg" style={{ color: "#fafafa" }}>{mYear}</span>
            <button onClick={() => setMYear(y => y + 1)} className="px-3 py-1 rounded-lg text-lg font-bold" style={{ color: "#fafafa", backgroundColor: "#464645" }} aria-label="Next year">&rarr;</button>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {MONTHS_SHORT.map((m, idx) => {
              const disabled = isMonthDisabled(idx);
              const ms = toMonthStr(mYear, idx);
              const isSel = selectedMY === ms;
              return (
                <button
                  key={m}
                  disabled={disabled}
                  onClick={() => { if (!disabled) setSelectedMY(ms); }}
                  className="py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: isSel ? "#0D9488" : disabled ? "#343434" : "#464645",
                    color: isSel ? "#fff" : disabled ? "#555" : "#fafafa",
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
          {selectedMY && (
            <p className="text-sm mb-3" style={{ color: "#7b776f" }}>
              Selected: <span style={{ color: "#fafafa" }}>{selectedMY}</span>
            </p>
          )}
          <button
            onClick={handleSubmitMonth}
            disabled={!selectedMY}
            className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity"
            style={{
              backgroundColor: selectedMY ? "#0D9488" : "#464645",
              color: selectedMY ? "#fff" : "#7b776f",
              opacity: selectedMY ? 1 : 0.6,
            }}
          >
            Submit Symptom Month
          </button>
        </>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function Page_urgent_care(props: GeneratedPageProps) {
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#343434", color: "#fafafa" }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: "#3f4040", borderColor: "#464645" }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏥</span>
              <span className="text-xl font-bold" style={{ color: "#fafafa" }}>EchoMed</span>
            </div>
            <nav className="hidden md:flex items-center gap-5 text-sm font-medium" style={{ color: "#7b776f" }}>
              <a href="#" className="hover:opacity-80" style={{ color: "#0D9488" }}>Book</a>
              <a href="#" className="hover:opacity-80">Records</a>
              <a href="#" className="hover:opacity-80">Prescriptions</a>
              <a href="#" className="hover:opacity-80">Help</a>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span style={{ color: "#7b776f" }}>Emergency: <strong style={{ color: "#fafafa" }}>911</strong></span>
            <button className="px-4 py-1.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: "#0D9488", color: "#fff" }}>
              Patient Portal
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ maxHeight: "280px" }}>
        <img
          src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=400&fit=crop"
          alt="Clinic interior"
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 flex items-center" style={{ background: "linear-gradient(to right, rgba(52,52,52,0.92), rgba(52,52,52,0.4))" }}>
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: "#fafafa" }}>Urgent Care Visit</h1>
            <p className="text-lg" style={{ color: "#7b776f" }}>Book your appointment and provide symptom details below.</p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Context */}
        <div className="rounded-xl p-5 mb-8" style={{ backgroundColor: "#3f4040", border: "1px solid #464645" }}>
          <p className="text-sm leading-relaxed" style={{ color: "#7b776f" }}>
            Welcome to <strong style={{ color: "#fafafa" }}>EchoMed Urgent Care</strong>. Please complete the scheduling information below.
            Select your preferred visit date, indicate when your symptoms first started, and use the combined picker for compound scheduling.
            Walk-ins are welcome but appointments are strongly recommended to minimize wait times.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Doctor Card */}
          <div className="lg:col-span-1">
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#3f4040", border: "1px solid #464645" }}>
              <img
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=300&fit=crop"
                alt="Doctor portrait"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-base" style={{ color: "#fafafa" }}>Dr. Sarah Chen, MD</h3>
                <p className="text-xs mt-1" style={{ color: "#7b776f" }}>Board Certified — Emergency &amp; Urgent Care Medicine</p>
                <p className="text-xs mt-1" style={{ color: "#7b776f" }}>15+ years experience · Yale School of Medicine</p>
                <div className="flex items-center gap-1 mt-2">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ color: s <= 4 ? "#0D9488" : "#464645" }}>★</span>
                  ))}
                  <span className="text-xs ml-1" style={{ color: "#7b776f" }}>4.8 (312 reviews)</span>
                </div>
              </div>
            </div>

            {/* Visit Type */}
            <div className="rounded-xl p-4 mt-4" style={{ backgroundColor: "#3f4040", border: "1px solid #464645" }}>
              <label className="block text-sm font-semibold mb-2" style={{ color: "#fafafa" }}>Visit Type</label>
              <select className="w-full rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "#464645", color: "#fafafa", border: "1px solid #555" }}>
                <option>In-Person Visit</option>
                <option>Telehealth</option>
              </select>
              <label className="block text-sm font-semibold mt-3 mb-2" style={{ color: "#fafafa" }}>Insurance</label>
              <select className="w-full rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "#464645", color: "#fafafa", border: "1px solid #555" }}>
                <option>EchoBlue</option>
                <option>EchoCare</option>
                <option>EchoShield</option>
                <option>EchoHealth</option>
                <option>Self-Pay</option>
              </select>
              <label className="block text-sm font-semibold mt-3 mb-2" style={{ color: "#fafafa" }}>Reason for Visit</label>
              <textarea
                rows={3}
                placeholder="Describe your symptoms..."
                className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                style={{ backgroundColor: "#464645", color: "#fafafa", border: "1px solid #555" }}
              />
            </div>
          </div>

          {/* Datepicker Widgets */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <VisitDatePicker onSubmit={props.onSubmit} />
            <SymptomMonthPicker onSubmit={props.onSubmit} />
            <CompoundPicker onSubmit={props.onSubmit} />
          </div>
        </div>

        {/* Supporting Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl p-4" style={{ backgroundColor: "#3f4040", border: "1px solid #464645" }}>
            <img
              src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=300&fit=crop"
              alt="Stethoscope"
              className="w-full h-36 object-cover rounded-lg mb-3"
            />
            <h4 className="font-semibold text-sm mb-1" style={{ color: "#fafafa" }}>On-Site Diagnostics</h4>
            <p className="text-xs" style={{ color: "#7b776f" }}>X-ray, blood work, and rapid COVID/flu testing available during your visit.</p>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: "#3f4040", border: "1px solid #464645" }}>
            <h4 className="font-semibold text-sm mb-1" style={{ color: "#fafafa" }}>Accepted Insurance</h4>
            <p className="text-xs mb-2" style={{ color: "#7b776f" }}>We accept most major insurance plans including:</p>
            <div className="flex flex-wrap gap-2">
              {["EchoBlue","EchoCare","EchoShield","EchoHealth","EchoWell","Medicare"].map(ins => (
                <span key={ins} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: "#464645", color: "#7b776f" }}>{ins}</span>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: "#3f4040", border: "1px solid #464645" }}>
            <h4 className="font-semibold text-sm mb-1" style={{ color: "#fafafa" }}>Clinic Location</h4>
            <p className="text-xs" style={{ color: "#7b776f" }}>
              1200 Medical Center Drive, Suite 105<br />
              San Francisco, CA 94107<br /><br />
              Mon–Fri: 8:00 AM – 9:00 PM<br />
              Sat–Sun: 9:00 AM – 5:00 PM
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6" style={{ backgroundColor: "#3f4040", borderColor: "#464645" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs" style={{ color: "#7b776f" }}>
            <div className="flex items-center gap-4">
              <span>© 2025 EchoMed Urgent Care</span>
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Terms</a>
              <a href="#" className="hover:underline">HIPAA Notice</a>
            </div>
            <p>If you are experiencing a medical emergency, please call <strong style={{ color: "#fafafa" }}>911</strong> immediately.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
