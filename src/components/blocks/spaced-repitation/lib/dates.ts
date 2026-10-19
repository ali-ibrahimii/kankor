const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

export function addMinutes(date: Date, minutes: number): Date {
	return new Date(date.getTime() + minutes * MS_PER_MINUTE);
}

export function addDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * MS_PER_DAY);
}

/** Whole days elapsed between two instants, never negative. */
export function daysBetween(from: string | Date, to: Date): number {
	const start = typeof from === "string" ? new Date(from) : from;
	const elapsed = (to.getTime() - start.getTime()) / MS_PER_DAY;
	return Math.max(0, Math.floor(elapsed));
}

/** End of the current local day — everything due before this counts as "due today". */
export function endOfToday(now: Date): Date {
	const end = new Date(now);
	end.setHours(23, 59, 59, 999);
	return end;
}

/** Start of the current local day. */
export function startOfToday(now: Date): Date {
	const start = new Date(now);
	start.setHours(0, 0, 0, 0);
	return start;
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}
