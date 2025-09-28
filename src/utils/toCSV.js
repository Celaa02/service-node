export function toCSV(rows) {
  if (!rows || !rows.length) return '';
  const headers = Object.keys(rows[0]);

  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const head = headers.join(',');
  const body = rows.map((r) => headers.map((h) => escape(r[h])).join(',')).join('\n');
  return head + '\n' + body;
}
