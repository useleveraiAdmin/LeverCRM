export const SLOT_MINUTES = 30;

type Window = { start_time: string; end_time: string };
type Block = { start_time: string | null; end_time: string | null };
type Booked = { start_at: string; end_at: string };

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Returns available slot start times ("HH:MM") for a given calendar date,
// given that instructor's weekly availability windows, date-specific blocks
// (full-day when start/end are null), and existing booked appointments.
export function computeAvailableSlots(
  date: Date,
  windows: Window[],
  blocks: Block[],
  booked: Booked[]
): string[] {
  const dayOfWeek = date.getDay();
  const dayWindows = windows; // caller pre-filters by day_of_week

  const fullDayBlocked = blocks.some((b) => b.start_time === null && b.end_time === null);
  if (fullDayBlocked) return [];

  const blockedRanges = blocks
    .filter((b) => b.start_time !== null && b.end_time !== null)
    .map((b) => [timeToMinutes(b.start_time!), timeToMinutes(b.end_time!)] as const);

  const bookedRanges = booked.map((b) => {
    const start = new Date(b.start_at);
    const end = new Date(b.end_at);
    return [start.getHours() * 60 + start.getMinutes(), end.getHours() * 60 + end.getMinutes()] as const;
  });

  const slots: string[] = [];
  for (const w of dayWindows) {
    const start = timeToMinutes(w.start_time);
    const end = timeToMinutes(w.end_time);
    for (let m = start; m + SLOT_MINUTES <= end; m += SLOT_MINUTES) {
      const slotEnd = m + SLOT_MINUTES;
      const overlapsBlock = blockedRanges.some(([bs, be]) => m < be && slotEnd > bs);
      const overlapsBooked = bookedRanges.some(([bs, be]) => m < be && slotEnd > bs);
      if (!overlapsBlock && !overlapsBooked) {
        const hh = String(Math.floor(m / 60)).padStart(2, "0");
        const mm = String(m % 60).padStart(2, "0");
        slots.push(`${hh}:${mm}`);
      }
    }
  }
  return slots;
}

export function dayOfWeekName(day: number): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day];
}
