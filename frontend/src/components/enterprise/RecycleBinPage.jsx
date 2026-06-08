import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArchiveRestore, Trash2, ChevronRight } from 'lucide-react';
import { fetchRecycleBin, restoreLead } from '../../services/leadEnterpriseApi';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { compactTable, compactTh, compactTd } from '../ui/compactTable';
import API from '../../api/axios';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';

export default function RecycleBinPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { confirm, dialogNode } = useConfirmDialog();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchRecycleBin({ page, limit: 15 });
      setRows(res?.data || []);
      setTotal(res?.pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleRestore = async (id) => {
    await restoreLead(id);
    load();
  };

  const handlePermanentDelete = async (lead) => {
    const ok = await confirm({
      title: 'Permanently delete lead?',
      message: `${lead.name} will be removed forever. This cannot be undone.`,
      confirmLabel: 'Delete Forever',
      tone: 'danger',
    });
    if (!ok) return;
    await API.delete(`/leads/${lead._id}/permanent`);
    load();
  };

  const pageCount = Math.max(1, Math.ceil(total / 15));

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content-primary">Recycle Bin</h1>
        <p className="text-sm text-content-muted mt-1">Soft-deleted leads — restore or permanently remove</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-subtle bg-surface p-16 text-center text-content-muted">Loading...</div>
      ) : !rows.length ? (
        <div className="rounded-2xl border border-dashed border-subtle bg-surface p-16 text-center">
          <ArchiveRestore className="w-10 h-10 text-content-muted mx-auto mb-3 opacity-50" />
          <p className="text-content-muted">Recycle bin is empty</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-subtle bg-surface shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className={compactTable}>
              <thead>
                <tr className="border-b border-subtle bg-surface-elevated/50">
                  {['Customer', 'Phone', 'Deleted', 'Deleted By', 'Actions'].map((h) => (
                    <th key={h} className={compactTh}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {rows.map((lead) => (
                  <tr key={lead._id} className="hover:bg-brand-500/[0.03]">
                    <td className={`${compactTd} font-medium`}>{lead.name}</td>
                    <td className={compactTd}>{lead.phone}</td>
                    <td className={compactTd}>
                      {lead.deletedAt ? new Date(lead.deletedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className={compactTd}>{lead.deletedBy?.name || '—'}</td>
                    <td className={compactTd}>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleRestore(lead._id)}>
                          <ArchiveRestore className="w-3.5 h-3.5" /> Restore
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-rose-600 gap-1"
                            onClick={() => handlePermanentDelete(lead)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Link to={`/leads/${lead._id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-subtle text-sm">
              <span className="text-content-muted">{total} deleted · Page {page}/{pageCount}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}
      {dialogNode}
    </div>
  );
}
