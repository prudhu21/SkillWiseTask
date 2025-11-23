export function escapeCsvCell(value: string | number | null | undefined) {
  if (value == null) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(rows: Record<string, any>[], headers?: string[]) {
  if (!rows || rows.length === 0) return '';
  const keys = headers ?? Object.keys(rows[0]);
  const lines = [keys.join(',')];
  for (const r of rows) {
    const line = keys.map((k) => escapeCsvCell(r[k])).join(',');
    lines.push(line);
  }
  return lines.join('\n');
}
