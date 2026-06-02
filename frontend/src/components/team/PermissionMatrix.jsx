import { Check, X } from 'lucide-react';
import { PERMISSION_MODULES } from './constants';

export default function PermissionMatrix({ permissions, onChange, readOnly = false }) {
  return (
    <div className="rounded-xl border border-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-elevated/60 border-b border-subtle">
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-content-muted">Module</th>
              {['view', 'create', 'edit', 'delete', 'approve', 'export'].map((action) => (
                <th key={action} className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-content-muted text-center capitalize">{action}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {Object.entries(PERMISSION_MODULES).map(([mod, cfg]) => (
              <tr key={mod} className="hover:bg-brand-500/[0.02] transition-colors">
                <td className="px-4 py-3 font-medium text-content-primary whitespace-nowrap">{cfg.label}</td>
                {['view', 'create', 'edit', 'delete', 'approve', 'export'].map((action) => {
                  const available = cfg.actions.includes(action);
                  const checked = permissions?.[mod]?.[action] ?? false;
                  if (!available) {
                    return <td key={action} className="px-3 py-3 text-center"><span className="text-content-muted/30">—</span></td>;
                  }
                  if (readOnly) {
                    return (
                      <td key={action} className="px-3 py-3 text-center">
                        {checked ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-content-muted/40 mx-auto" />}
                      </td>
                    );
                  }
                  return (
                    <td key={action} className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onChange?.(mod, action, e.target.checked)}
                        className="w-4 h-4 rounded border-subtle text-brand-600 focus:ring-brand-500/30 cursor-pointer accent-brand-600"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
