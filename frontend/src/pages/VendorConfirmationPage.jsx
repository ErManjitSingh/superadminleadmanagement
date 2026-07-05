import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Edit3, Loader2, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { fetchVendorConfirmation, submitVendorConfirmation } from '../services/operationsVoucherApi';
import { formatDate } from '../components/operations-manager/operationsUtils';
import { cn } from '../lib/utils';

export default function VendorConfirmationPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [notes, setNotes] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetchVendorConfirmation(token)
      .then(setData)
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async (action) => {
    setSubmitting(action);
    try {
      await submitVendorConfirmation(token, action, notes);
      setDone(true);
      const refreshed = await fetchVendorConfirmation(token);
      setData(refreshed);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-violet-900 to-slate-900">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  if (!data?.voucher) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-900 p-6">
        <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 text-center text-white max-w-md">
          <XCircle className="w-12 h-12 mx-auto mb-3 text-rose-300" />
          <h1 className="text-xl font-bold">Link expired or invalid</h1>
        </div>
      </div>
    );
  }

  const { voucher, booking } = data;
  const responded = voucher.vendorStatus !== 'pending';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-violet-900 to-slate-900 p-4 sm:p-8">
      <div className="max-w-lg mx-auto">
        <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8 bg-gradient-to-r from-indigo-600/40 to-violet-600/40 border-b border-white/10">
            <div className="flex items-center gap-3 text-white">
              <Building2 className="w-8 h-8" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Vendor Confirmation</p>
                <h1 className="text-xl font-black capitalize">{voucher.type} Voucher</h1>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-4 text-white">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-indigo-200 text-xs">Booking</p><p className="font-bold">{booking?.bookingNumber}</p></div>
              <div><p className="text-indigo-200 text-xs">Guest</p><p className="font-bold">{booking?.customerName}</p></div>
              <div><p className="text-indigo-200 text-xs">Destination</p><p className="font-bold">{booking?.destination}</p></div>
              <div><p className="text-indigo-200 text-xs">Travel</p><p className="font-bold">{formatDate(booking?.travelDate)}</p></div>
            </div>

            {responded ? (
              <div className={cn(
                'rounded-2xl p-4 text-center',
                voucher.vendorStatus === 'confirmed' ? 'bg-emerald-500/20' : 'bg-amber-500/20',
              )}
              >
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
                <p className="font-bold capitalize">Status: {voucher.vendorStatus.replace(/_/g, ' ')}</p>
                {voucher.vendorNotes && <p className="text-sm text-indigo-100 mt-2">{voucher.vendorNotes}</p>}
              </div>
            ) : (
              <>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes for the operations team..."
                  className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-indigo-200/60 p-3 text-sm min-h-[80px]"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-2"
                    disabled={!!submitting}
                    onClick={() => submit('accept')}
                  >
                    {submitting === 'accept' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Accept
                  </Button>
                  <Button
                    className="rounded-xl bg-rose-600 hover:bg-rose-700 gap-2"
                    disabled={!!submitting}
                    onClick={() => submit('reject')}
                  >
                    {submitting === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Reject
                  </Button>
                  <Button
                    className="rounded-xl bg-amber-600 hover:bg-amber-700 gap-2"
                    disabled={!!submitting}
                    onClick={() => submit('changes')}
                  >
                    {submitting === 'changes' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
                    Need Changes
                  </Button>
                </div>
              </>
            )}

            {done && !responded && (
              <p className="text-center text-sm text-emerald-300">Response submitted. Thank you!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
