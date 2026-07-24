import { useRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { ENV_TODAY_STR } from '../lib/benchmark';

const COMPLETE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A date string is only "complete" once all segments are filled AND the year
 * is plausible. Native <input type="date"> segment-editing (and automated
 * agents typing the year digit-by-digit) can momentarily yield years like
 * 0002 / 0020 / 0202 before 2026 — committing those corrupts search/booking
 * state (negative-night stays, 0-result searches). We reject them.
 */
export function isCompleteDate(s: string): boolean {
  if (!COMPLETE.test(s)) return false;
  const year = Number(s.slice(0, 4));
  return year >= 2000 && year <= 2100;
}

interface DateInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Hardened wrapper around the native <input type="date"> calendar picker.
 * Robustness measures (native picker is kept intact):
 *  - `min`/`max` are always set (default min = the env "today", so the calendar
 *    is constrained and out-of-range entries are flagged invalid by the browser).
 *  - Only complete, IN-RANGE dates are propagated to app state. This rejects not
 *    just implausible years (0026) but also dates outside [min, max] — e.g. a
 *    checkout typed before the check-in, or a wrong month that lands before the
 *    minimum — which are the common segment-typing corruptions in booking flows.
 *  - On blur, if the field holds an uncommitted / out-of-range entry, the display
 *    is snapped back to the last valid value so a mistyped date can never leave
 *    the picker stuck on a corrupt value.
 */
export default function DateInput({ value, onChange, min, max, ...rest }: DateInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  const minBound = typeof min === 'string' && min ? min : ENV_TODAY_STR;
  const maxBound = typeof max === 'string' && max ? max : '2030-12-31';

  const isAcceptable = (v: string): boolean =>
    v === '' || (isCompleteDate(v) && v >= minBound && v <= maxBound);

  return (
    <input
      ref={ref}
      type="date"
      value={value}
      min={minBound}
      max={maxBound}
      onChange={(e) => {
        const v = e.target.value;
        if (isAcceptable(v)) onChange(v);
      }}
      onBlur={(e) => {
        if (!isAcceptable(e.target.value) && ref.current) ref.current.value = value;
      }}
      {...rest}
    />
  );
}
