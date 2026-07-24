import React, { useState, useRef, useEffect } from 'react';
import { FiGlobe } from 'react-icons/fi';
import { useAppContext } from '../App';

export default function CurrencySelector() {
  const { currencies, selectedCurrency, setSelectedCurrency } = useAppContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-gray-100 transition text-sm font-medium text-gray-700"
        aria-label="Select currency"
      >
        <FiGlobe className="w-4 h-4" />
        {selectedCurrency ? (
          <span>
            {selectedCurrency.symbol} {selectedCurrency.code}
          </span>
        ) : (
          <span>Currency</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 max-h-80 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-2">
          <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Choose a currency
          </p>
          {currencies.map((currency) => (
            <button
              key={currency.code}
              onClick={async () => {
                setSelectedCurrency(currency);
                setOpen(false);
                try {
                  await fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ preferred_currency: currency.code }),
                  });
                } catch (err) {
                  console.error('Failed to save currency setting:', err);
                }
              }}
              className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 transition ${
                selectedCurrency?.code === currency.code ? 'bg-gray-50' : ''
              }`}
            >
              <div>
                <span className="text-sm font-medium text-gray-900">
                  {currency.name}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  {currency.symbol} &middot; {currency.code}
                </span>
              </div>
              {selectedCurrency?.code === currency.code && (
                <span className="text-rose-500 text-sm">✓</span>
              )}
            </button>
          ))}
          {currencies.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400">No currencies available</p>
          )}
        </div>
      )}
    </div>
  );
}
