/**
 * Benchmark "current date" for the echostay synthetic env.
 *
 * The seed data is anchored to a fixed present: completed bookings end on/before
 * 2026-03-23 and confirmed (upcoming) bookings start on/after 2026-04-24. Using
 * the real system clock (`new Date()`) made every booking "past" (so nothing
 * showed under Trips → Upcoming) and blocked booking env-future dates. All
 * date-relative UI logic must use this benchmark instead of the wall clock.
 */
export const ENV_TODAY_STR = '2026-04-01';

export function envToday(): Date {
  return new Date(`${ENV_TODAY_STR}T00:00:00`);
}
