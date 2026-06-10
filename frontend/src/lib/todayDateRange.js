/** ISO date strings (YYYY-MM-DD) for today's createdAt filter — local calendar day */
export function getTodayDateRange() {
  const today = new Date();
  const date = today.toISOString().slice(0, 10);
  return { dateFrom: date, dateTo: date };
}
