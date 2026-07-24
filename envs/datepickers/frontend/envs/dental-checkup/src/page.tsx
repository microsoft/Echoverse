import React, { useState, useCallback, useMemo } from 'react';

interface GeneratedPageProps {
  taskId: string;
  onSubmit: (value: { type: string; value: string; raw: any }) => void;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function Page_dental_checkup(props: GeneratedPageProps) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [viewYear, setViewYear] = useState(2025);

  const handleMonthSelect = useCallback((month: number) => {
    setSelectedMonth(month);
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedMonth === null) return;
    const isoValue = `${viewYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    props.onSubmit({
      type: 'month_year',
      value: isoValue,
      raw: {
        widget_id: 'insurance_expiry',
        year: viewYear,
        month: selectedMonth + 1,
        month_name: MONTH_FULL[selectedMonth],
        iso: isoValue,
      },
    });
  }, [selectedMonth, viewYear, props]);

  const formattedSelection = useMemo(() => {
    if (selectedMonth === null) return null;
    return `${MONTH_FULL[selectedMonth]} ${viewYear}`;
  }, [selectedMonth, viewYear]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f1122', color: '#f1f2f2', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: '#161831', borderColor: '#1e2044' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏥</span>
              <span className="text-lg font-semibold" style={{ color: '#ffffff' }}>EchoMed</span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: '#8b909e' }}>
              <a href="#" className="hover:opacity-80" style={{ color: '#ffffff' }}>Book</a>
              <a href="#" className="hover:opacity-80">Records</a>
              <a href="#" className="hover:opacity-80">Prescriptions</a>
              <a href="#" className="hover:opacity-80">Help</a>
            </nav>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden sm:inline text-sm" style={{ color: '#8b909e' }}>Emergency: (800) 555-0199</span>
            <button
              className="text-sm px-4 py-2 rounded-xl font-medium"
              style={{ backgroundColor: '#0D9488', color: '#ffffff' }}
            >
              Patient Portal
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ backgroundColor: '#131533' }}>
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1 space-y-4">
            <span className="inline-block text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#0D948820', color: '#0D9488' }}>
              Dental Checkup
            </span>
            <h1 className="text-3xl lg:text-4xl font-bold leading-tight" style={{ color: '#ffffff' }}>
              Book Your Dental Checkup
            </h1>
            <p className="text-base leading-relaxed max-w-lg" style={{ color: '#8b909e' }}>
              Schedule your next dental visit with our experienced team. Please verify your insurance details below to ensure smooth coverage for your appointment.
            </p>
          </div>
          <div className="flex-shrink-0 w-full lg:w-96">
            <img
              src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&h=300&fit=crop"
              alt="Dental care"
              className="w-full h-48 object-cover rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel — Form & Widget */}
          <div className="lg:col-span-2 space-y-8">
            {/* Visit Type Filters */}
            <div className="rounded-xl p-6" style={{ backgroundColor: '#161831' }}>
              <h2 className="text-base font-semibold mb-4" style={{ color: '#ffffff' }}>Visit Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: '#8b909e' }}>Visit Type</label>
                  <select
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
                    style={{ backgroundColor: '#0f1122', borderColor: '#1e2044', color: '#f1f2f2' }}
                  >
                    <option>In-Person Visit</option>
                    <option>Telehealth</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: '#8b909e' }}>Insurance Provider</label>
                  <select
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
                    style={{ backgroundColor: '#0f1122', borderColor: '#1e2044', color: '#f1f2f2' }}
                  >
                    <option>Select provider...</option>
                    <option>EchoDental</option>
                    <option>EchoHealth</option>
                    <option>EchoCare</option>
                    <option>EchoLife</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs mb-1.5" style={{ color: '#8b909e' }}>Reason for Visit</label>
                <textarea
                  rows={2}
                  placeholder="Describe your reason for the visit..."
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border resize-none"
                  style={{ backgroundColor: '#0f1122', borderColor: '#1e2044', color: '#f1f2f2' }}
                />
              </div>
            </div>

            {/* Month/Year Picker Widget */}
            <div
              data-widget-id="insurance_expiry"
              className="rounded-xl p-6"
              style={{ backgroundColor: '#161831' }}
            >
              <div className="mb-5">
                <h2 className="text-base font-semibold" style={{ color: '#ffffff' }}>Insurance Expiry Month</h2>
                <p className="text-sm mt-1" style={{ color: '#8b909e' }}>
                  Select the month and year your dental insurance expires.
                </p>
              </div>

              {/* Year Navigation */}
              <div className="flex items-center justify-between mb-5">
                <button
                  onClick={() => { setViewYear((y) => y - 1); setSelectedMonth(null); }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-colors hover:opacity-80"
                  style={{ backgroundColor: '#0f1122', color: '#f1f2f2' }}
                  aria-label="Previous year"
                >
                  ‹
                </button>
                <span className="text-lg font-semibold" style={{ color: '#ffffff' }}>{viewYear}</span>
                <button
                  onClick={() => { setViewYear((y) => y + 1); setSelectedMonth(null); }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-colors hover:opacity-80"
                  style={{ backgroundColor: '#0f1122', color: '#f1f2f2' }}
                  aria-label="Next year"
                >
                  ›
                </button>
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {MONTHS.map((m, idx) => {
                  const isSelected = selectedMonth === idx;
                  return (
                    <button
                      key={m}
                      onClick={() => handleMonthSelect(idx)}
                      className="py-3 rounded-xl text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: isSelected ? '#0D9488' : '#0f1122',
                        color: isSelected ? '#ffffff' : '#f1f2f2',
                        border: isSelected ? 'none' : '1px solid #1e2044',
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>

              {/* Selection Display & Submit */}
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm" style={{ color: '#8b909e' }}>
                  {formattedSelection
                    ? <>Selected: <span style={{ color: '#0D9488' }} className="font-medium">{formattedSelection}</span></>
                    : 'No month selected'}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={selectedMonth === null}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity"
                  style={{
                    backgroundColor: selectedMonth !== null ? '#0D9488' : '#1e2044',
                    color: selectedMonth !== null ? '#ffffff' : '#8b909e',
                    cursor: selectedMonth !== null ? 'pointer' : 'not-allowed',
                  }}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel — Sidebar */}
          <aside className="space-y-6">
            {/* Doctor Card */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#161831' }}>
              <img
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=300&fit=crop"
                alt="Dr. Sarah Mitchell"
                className="w-full h-44 object-cover"
              />
              <div className="p-5 space-y-3">
                <h3 className="text-base font-semibold" style={{ color: '#ffffff' }}>Dr. Sarah Mitchell, DDS</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#8b909e' }}>
                  Board-certified dentist with 12+ years of experience in general and cosmetic dentistry.
                </p>
                <div className="flex items-center gap-1 text-xs" style={{ color: '#0D9488' }}>
                  <span>★★★★★</span>
                  <span style={{ color: '#8b909e' }} className="ml-1">4.9 (328 reviews)</span>
                </div>
              </div>
            </div>

            {/* Office Info */}
            <div className="rounded-xl p-5" style={{ backgroundColor: '#161831' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#ffffff' }}>Office Location</h3>
              <div className="space-y-2 text-xs" style={{ color: '#8b909e' }}>
                <p>1200 Wellness Blvd, Suite 300</p>
                <p>San Francisco, CA 94102</p>
                <p>Phone: (415) 555-0142</p>
              </div>
            </div>

            {/* Accepted Insurance */}
            <div className="rounded-xl p-5" style={{ backgroundColor: '#161831' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#ffffff' }}>Accepted Insurance</h3>
              <div className="flex flex-wrap gap-2">
                {['EchoDental', 'EchoHealth', 'EchoCare', 'EchoLife', 'EchoGuard'].map((ins) => (
                  <span key={ins} className="text-xs px-2.5 py-1 rounded-lg" style={{ backgroundColor: '#0f1122', color: '#8b909e' }}>
                    {ins}
                  </span>
                ))}
              </div>
            </div>

            {/* Stethoscope Image Card */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#161831' }}>
              <img
                src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=300&fit=crop"
                alt="Medical equipment"
                className="w-full h-36 object-cover"
              />
              <div className="p-4">
                <p className="text-xs" style={{ color: '#8b909e' }}>
                  State-of-the-art equipment for comprehensive dental diagnostics.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-10" style={{ backgroundColor: '#161831', borderColor: '#1e2044' }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs" style={{ color: '#8b909e' }}>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: '#ffffff' }}>Clinic Hours</h4>
              <p>Mon–Fri: 8:00 AM – 6:00 PM</p>
              <p>Sat: 9:00 AM – 2:00 PM</p>
              <p>Sun: Closed</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: '#ffffff' }}>Legal</h4>
              <p className="hover:underline cursor-pointer">Privacy Policy</p>
              <p className="hover:underline cursor-pointer">Terms of Service</p>
              <p className="hover:underline cursor-pointer">HIPAA Notice</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: '#ffffff' }}>Emergency</h4>
              <p>If you are experiencing a dental emergency, please call 911 or visit your nearest emergency room.</p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t text-xs text-center" style={{ borderColor: '#1e2044', color: '#8b909e' }}>
            © 2025 EchoMed Dental. All rights reserved. This site is HIPAA compliant.
          </div>
        </div>
      </footer>
    </div>
  );
}
