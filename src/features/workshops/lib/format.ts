// `workshopDate` comes from an <input type="date"> and is stored as UTC
// midnight — format with UTC parts so a viewer's timezone never shifts the day.
export function formatWorkshopDate(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getUTCFullYear()}`;
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}
