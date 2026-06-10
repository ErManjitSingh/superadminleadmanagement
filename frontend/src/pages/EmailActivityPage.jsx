import { useCallback, useEffect, useState } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import EmailStatsPanel from '../components/dashboard/EmailStatsPanel';
import { Button } from '../components/ui/button';
import { fetchEmailStats } from '../services/emailApi';
import API from '../api/axios';

export default function EmailActivityPage({ breadcrumbs = ['Email Activity'] }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchEmailStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const syncReplies = async () => {
    setSyncing(true);
    try {
      await API.post('/emails/sync-replies', {}, { skipSuccessToast: false });
      load();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Activity"
        description="Today's outbound emails and client reply sync · sales@unotrips.com"
        breadcrumbs={breadcrumbs}
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={syncReplies}
            disabled={syncing || loading}
            className="gap-2 rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync client replies
          </Button>
        }
      />

      {loading && !stats && (
        <div className="rounded-2xl border border-subtle bg-surface p-12 text-center text-content-muted">
          Loading email activity…
        </div>
      )}

      {!loading && stats && <EmailStatsPanel stats={stats} />}

      {!loading && !stats && (
        <div className="rounded-2xl border border-dashed border-subtle bg-surface/60 p-12 text-center">
          <Mail className="w-10 h-10 mx-auto mb-3 text-content-muted opacity-40" />
          <p className="font-medium text-content-primary">Email activity unavailable</p>
          <p className="text-sm text-content-muted mt-1">Check your permissions or SMTP configuration.</p>
        </div>
      )}
    </div>
  );
}
