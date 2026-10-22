// All "today / this week" maths in India time, whatever the server's clock is set to
const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfTodayIST(now = new Date()) {
    const ist = new Date(now.getTime() + IST_OFFSET_MS);
    ist.setUTCHours(0, 0, 0, 0);
    return new Date(ist.getTime() - IST_OFFSET_MS);
}

// Monday 00:00 IST of the current week
export function startOfWeekIST(now = new Date()) {
    const today = startOfTodayIST(now);
    const dayOfWeek = new Date(today.getTime() + IST_OFFSET_MS).getUTCDay(); // 0 = Sunday
    const daysSinceMonday = (dayOfWeek + 6) % 7;
    return new Date(today.getTime() - daysSinceMonday * DAY_MS);
}

export function addDays(date, days) {
    return new Date(date.getTime() + days * DAY_MS);
}