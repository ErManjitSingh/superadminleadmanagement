export function formatINR(n) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export function exportToCSV(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export function exportToExcel(filename, rows) {
  exportToCSV(filename.replace('.xlsx', '.csv').replace('.xls', '.csv'), rows);
}

export function buildExportRows(data) {
  return {
    summary: [data.summary],
    leadSources: data.leadSources,
    executives: data.executives,
    destinations: data.destinations,
    packages: data.packages,
    funnel: data.funnel,
  };
}
