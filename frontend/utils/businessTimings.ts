export function timeInMinutes(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (minute > 59) return null;
  if (match[3]) {
    if (hour < 1 || hour > 12) return null;
    hour = hour % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  } else if (hour > 23) return null;
  return hour * 60 + minute;
}

export function validateBreakTimes(openAt: string, closeAt: string, breakStartAt: string, breakEndAt: string): Record<string, string> {
  if (!breakStartAt && !breakEndAt) return {};
  const errors: Record<string, string> = {};
  const open = timeInMinutes(openAt);
  const close = timeInMinutes(closeAt);
  if (open === null || close === null || open === close) return { timings: 'Select valid Open and Close times before adding a break.' };
  const start = timeInMinutes(breakStartAt);
  const end = timeInMinutes(breakEndAt);
  if (start === null) errors.breakStartAt = 'Select a valid Break Start time.';
  if (end === null) errors.breakEndAt = 'Select a valid Break End time.';
  // Normalize overnight business hours onto the same timeline.
  const offset = (time: number) => (time - open + 1440) % 1440;
  const duration = offset(close);
  if (start !== null && (offset(start) <= 0 || offset(start) >= duration)) errors.breakStartAt = 'Break Start must be after Open and before Close time.';
  if (end !== null && (offset(end) <= 0 || offset(end) >= duration)) errors.breakEndAt = 'Break End must be after Open and before Close time.';
  if (start !== null && end !== null && offset(end) <= offset(start)) errors.breakEndAt = 'Break End must be after Break Start time.';
  return errors;
}
