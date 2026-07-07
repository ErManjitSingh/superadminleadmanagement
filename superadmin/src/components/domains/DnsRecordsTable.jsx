import { Copy } from 'lucide-react';

function CopyButton({ value, label }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(value)}
      className="shrink-0 rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-muted)] hover:bg-violet-50 hover:text-violet-600"
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
}

export default function DnsRecordsTable({ records = [], domain, compact = false }) {
  if (!records.length && !domain) {
    return <p className="text-sm text-[var(--text-muted)]">No DNS records required.</p>;
  }

  const rows = records.length ? records : [];

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {domain && (
        <p className="text-sm text-[var(--text-muted)]">
          Domain: <span className="font-mono font-semibold text-violet-700">{domain}</span>
        </p>
      )}
      {rows.map((rec) => (
        <div key={`${rec.type}-${rec.host}`} className="overflow-hidden rounded-xl border border-[var(--border)]">
          <div className={`px-3 py-1.5 text-xs font-semibold ${rec.recommended ? 'bg-violet-50 text-violet-800' : 'bg-slate-50 text-slate-600'}`}>
            {rec.type} — {rec.recommended ? 'Recommended' : 'Alternative'}
          </div>
          <table className="w-full text-xs sm:text-sm">
            <tbody>
              {[
                ['Host', rec.hostLabel || rec.host],
                ['Points to', rec.pointsTo],
                ['TTL', rec.ttl || 'Auto'],
              ].map(([label, value]) => (
                <tr key={label} className="border-t border-[var(--border)]">
                  <td className="w-28 bg-slate-50/50 px-3 py-2 font-medium text-[var(--text-muted)]">{label}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-between gap-2 font-mono">
                      <span className="break-all">{value}</span>
                      {label !== 'TTL' && <CopyButton value={value} label={label} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
