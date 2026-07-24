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

function MonthYearPicker(props: {
  widgetId: string;
  label: string;
  description: string;
  initialMonth: number;
  initialYear: number;
  minDate: { month: number; year: number } | null;
  onSubmit: GeneratedPageProps['onSubmit'];
}) {
  const { widgetId, label, description, initialMonth, initialYear, minDate, onSubmit } = props;
  const [viewYear, setViewYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const isMonthDisabled = useCallback(
    (month: number, year: number) => {
      if (minDate) {
        if (year < minDate.year) return true;
        if (year === minDate.year && month < minDate.month) return true;
      }
      return false;
    },
    [minDate],
  );

  const canGoPrev = useMemo(() => {
    if (!minDate) return true;
    return viewYear > minDate.year;
  }, [viewYear, minDate]);

  const handlePrev = useCallback(() => {
    if (canGoPrev) setViewYear((y) => y - 1);
  }, [canGoPrev]);

  const handleNext = useCallback(() => {
    setViewYear((y) => y + 1);
  }, []);

  const handleSelect = useCallback(
    (month: number) => {
      if (isMonthDisabled(month, viewYear)) return;
      setSelectedMonth(month);
      setSelectedYear(viewYear);
    },
    [viewYear, isMonthDisabled],
  );

  const handleSubmit = useCallback(() => {
    if (selectedMonth === null || selectedYear === null) return;
    const iso = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    onSubmit({
      type: 'month_year',
      value: iso,
      raw: {
        widget_id: widgetId,
        month: selectedMonth,
        year: selectedYear,
        month_name: MONTH_FULL[selectedMonth - 1],
        iso,
      },
    });
  }, [selectedMonth, selectedYear, widgetId, onSubmit]);

  return (
    <div data-widget-id={widgetId} className="w-full">
      <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
        {label}
      </label>
      <p className="text-xs mb-3" style={{ color: '#6B7280' }}>
        {description}
      </p>

      <div
        className="rounded p-4 border"
        style={{ backgroundColor: '#fcfbfb', borderColor: '#eae9e8' }}
      >
        {/* Year navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canGoPrev}
            className="w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-colors"
            style={{
              color: canGoPrev ? '#374151' : '#D1D5DB',
              backgroundColor: canGoPrev ? '#f5f5f5' : 'transparent',
              cursor: canGoPrev ? 'pointer' : 'not-allowed',
            }}
            aria-label="Previous year"
          >
            ‹
          </button>
          <span className="text-base font-semibold" style={{ color: '#374151' }}>
            {viewYear}
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-colors"
            style={{ color: '#374151', backgroundColor: '#f5f5f5' }}
            aria-label="Next year"
          >
            ›
          </button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((name, idx) => {
            const month = idx + 1;
            const disabled = isMonthDisabled(month, viewYear);
            const isSelected = selectedMonth === month && selectedYear === viewYear;

            return (
              <button
                key={name}
                type="button"
                onClick={() => handleSelect(month)}
                disabled={disabled}
                className="py-2 px-1 rounded text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isSelected
                    ? '#2563EB'
                    : disabled
                      ? '#f5f5f5'
                      : '#f8f5f3',
                  color: isSelected
                    ? '#ffffff'
                    : disabled
                      ? '#C0BFBE'
                      : '#374151',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: isSelected ? '#2563EB' : '#eae9e8',
                }}
              >
                {name}
              </button>
            );
          })}
        </div>

        {/* Selection display */}
        {selectedMonth !== null && selectedYear !== null && (
          <p className="mt-3 text-sm text-center" style={{ color: '#374151' }}>
            Selected: <span className="font-semibold">{MONTH_FULL[selectedMonth - 1]} {selectedYear}</span>
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={selectedMonth === null}
        className="mt-4 w-full py-2 px-4 rounded text-sm font-medium transition-colors"
        style={{
          backgroundColor: selectedMonth !== null ? '#2563EB' : '#D1D5DB',
          color: '#ffffff',
          cursor: selectedMonth !== null ? 'pointer' : 'not-allowed',
        }}
      >
        Submit Graduation Month
      </button>
    </div>
  );
}

export default function Page_student_enrollment(props: GeneratedPageProps) {
  const steps = ['Personal Info', 'Academic Details', 'Documents', 'Review'];
  const currentStep = 1;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#eae9e8', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header
        className="w-full border-b"
        style={{ backgroundColor: '#fcfbfb', borderColor: '#eae9e8' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <span className="text-base font-semibold" style={{ color: '#374151' }}>
              EchoID
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: '#6B7280' }}>
            <a href="#" className="hover:underline">Settings</a>
            <a href="#" className="hover:underline">Security</a>
            <a href="#" className="hover:underline">Plan</a>
            <a href="#" className="hover:underline">Help</a>
          </nav>
          <div className="flex items-center gap-4 text-sm" style={{ color: '#6B7280' }}>
            <span>Student Portal</span>
            <button type="button" className="hover:underline" style={{ color: '#2563EB' }}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div style={{ backgroundColor: '#f8f5f3', borderColor: '#eae9e8' }} className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-2 text-xs" style={{ color: '#6B7280' }}>
          Dashboard &rsaquo; Enrollment &rsaquo; <span style={{ color: '#374151' }}>Academic Details</span>
        </div>
      </div>

      {/* Hero image */}
      <div className="w-full max-w-6xl mx-auto px-6 mt-6">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=400&fit=crop"
          alt="Office workspace"
          className="w-full h-48 object-cover rounded"
        />
      </div>

      {/* Main content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold" style={{ color: '#374151' }}>
            Complete Your Profile
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            Fill in your academic details to finalize your student enrollment.
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                  style={{
                    backgroundColor: i <= currentStep ? '#2563EB' : '#eae9e8',
                    color: i <= currentStep ? '#fff' : '#6B7280',
                  }}
                >
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span
                  className="text-sm"
                  style={{ color: i === currentStep ? '#374151' : '#9CA3AF' }}
                >
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="flex-1 h-px min-w-[24px]"
                  style={{ backgroundColor: i < currentStep ? '#2563EB' : '#D1D5DB' }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Name / email fields (decorative) */}
            <div
              className="rounded p-6 border"
              style={{ backgroundColor: '#fcfbfb', borderColor: '#eae9e8' }}
            >
              <h2 className="text-sm font-semibold mb-4" style={{ color: '#374151' }}>
                Personal Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#6B7280' }}>
                    First Name
                  </label>
                  <div
                    className="rounded px-3 py-2 text-sm border"
                    style={{ backgroundColor: '#f8f5f3', borderColor: '#eae9e8', color: '#9CA3AF' }}
                  >
                    Jane
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#6B7280' }}>
                    Last Name
                  </label>
                  <div
                    className="rounded px-3 py-2 text-sm border"
                    style={{ backgroundColor: '#f8f5f3', borderColor: '#eae9e8', color: '#9CA3AF' }}
                  >
                    Doe
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#6B7280' }}>
                    Email
                  </label>
                  <div
                    className="rounded px-3 py-2 text-sm border"
                    style={{ backgroundColor: '#f8f5f3', borderColor: '#eae9e8', color: '#9CA3AF' }}
                  >
                    jane.doe@university.edu
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#6B7280' }}>
                    Phone
                  </label>
                  <div
                    className="rounded px-3 py-2 text-sm border"
                    style={{ backgroundColor: '#f8f5f3', borderColor: '#eae9e8', color: '#9CA3AF' }}
                  >
                    (555) 012-3456
                  </div>
                </div>
              </div>
            </div>

            {/* Graduation Month picker */}
            <div
              className="rounded p-6 border"
              style={{ backgroundColor: '#fcfbfb', borderColor: '#eae9e8' }}
            >
              <h2 className="text-sm font-semibold mb-1" style={{ color: '#374151' }}>
                Academic Details
              </h2>
              <p className="text-xs mb-4" style={{ color: '#6B7280' }}>
                Select your expected graduation month. Only future dates are available.
              </p>
              <MonthYearPicker
                widgetId="graduation_month"
                label="Expected Graduation Month"
                description="Choose the month and year you expect to graduate."
                initialMonth={6}
                initialYear={2025}
                minDate={{ month: 6, year: 2025 }}
                onSubmit={props.onSubmit}
              />
            </div>

            {/* Document upload area (decorative) */}
            <div
              className="rounded p-6 border"
              style={{ backgroundColor: '#fcfbfb', borderColor: '#eae9e8' }}
            >
              <h2 className="text-sm font-semibold mb-4" style={{ color: '#374151' }}>
                Document Upload
              </h2>
              <div
                className="rounded border-2 border-dashed p-8 text-center"
                style={{ borderColor: '#D1D5DB', color: '#9CA3AF' }}
              >
                <p className="text-sm">Drag &amp; drop your transcript or enrollment letter here</p>
                <p className="text-xs mt-1">PDF, JPG, or PNG · Max 10 MB</p>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Requirements checklist */}
            <div
              className="rounded p-5 border"
              style={{ backgroundColor: '#fcfbfb', borderColor: '#eae9e8' }}
            >
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>
                Requirements Checklist
              </h3>
              <ul className="space-y-2 text-xs" style={{ color: '#6B7280' }}>
                {[
                  { done: true, text: 'Personal information' },
                  { done: false, text: 'Graduation date' },
                  { done: false, text: 'Transcript uploaded' },
                  { done: false, text: 'Enrollment letter' },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                      style={{
                        backgroundColor: item.done ? '#2563EB' : '#eae9e8',
                        color: item.done ? '#fff' : '#9CA3AF',
                      }}
                    >
                      {item.done ? '✓' : '·'}
                    </span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Graduation image card */}
            <div
              className="rounded border overflow-hidden"
              style={{ borderColor: '#eae9e8' }}
            >
              <img
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop"
                alt="Graduation ceremony"
                className="w-full h-48 object-cover"
              />
              <div className="p-4" style={{ backgroundColor: '#fcfbfb' }}>
                <h4 className="text-sm font-semibold" style={{ color: '#374151' }}>
                  Graduation Information
                </h4>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                  Your expected graduation month helps us coordinate commencement logistics and degree conferral timelines.
                </p>
              </div>
            </div>

            {/* Help tooltip card */}
            <div
              className="rounded p-5 border"
              style={{ backgroundColor: '#f7f5f2', borderColor: '#eae9e8' }}
            >
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#374151' }}>
                💡 Need Help?
              </h3>
              <p className="text-xs" style={{ color: '#6B7280' }}>
                If you are unsure about your graduation date, consult your academic advisor or check your degree audit in the student portal.
              </p>
              <a
                href="#"
                className="inline-block mt-2 text-xs font-medium"
                style={{ color: '#2563EB' }}
              >
                Contact Academic Advising →
              </a>
            </div>

            {/* ID card image */}
            <div
              className="rounded border overflow-hidden"
              style={{ borderColor: '#eae9e8' }}
            >
              <img
                src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop"
                alt="ID card and documents"
                className="w-full h-48 object-cover"
              />
              <div className="p-4" style={{ backgroundColor: '#fcfbfb' }}>
                <h4 className="text-sm font-semibold" style={{ color: '#374151' }}>
                  Document Status
                </h4>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                  Upload your official documents to complete enrollment verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="w-full border-t mt-auto"
        style={{ backgroundColor: '#f8f5f3', borderColor: '#eae9e8' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs" style={{ color: '#9CA3AF' }}>
            <div className="flex flex-wrap gap-4">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Data Handling Notice</a>
              <a href="#" className="hover:underline">Contact Support</a>
              <a href="#" className="hover:underline">Accessibility Statement</a>
            </div>
            <span>© 2026 EchoID · Student Enrollment Portal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
