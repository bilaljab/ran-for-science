type Cell = string | number | boolean | null | undefined;

// Leading characters Excel/Sheets treat as the start of a formula (CSV injection).
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

function escapeCell(cell: Cell): string {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "number") return String(cell);
  if (typeof cell === "boolean") return cell ? "نعم" : "لا";
  const safe = FORMULA_TRIGGER.test(cell) ? `'${cell}` : cell;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

// The caller prepends the UTF-8 BOM (`﻿`) when responding so Excel reads Arabic correctly.
export function toCsv(headers: string[], rows: Cell[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
}
