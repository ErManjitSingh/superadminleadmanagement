import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { superAdminApi } from '../../api/superadmin';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardTitle } from '../../components/ui/card';
import { MetricCard } from '../../components/website/MetricCard';
import { StatusBadge } from '../../components/website/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function WebsiteDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['website-dashboard'],
    queryFn: () => superAdminApi.getWebsiteDashboard().then((r) => r.data),
  });

  if (isLoading) return <div className="py-20 text-center">Loading website dashboard…</div>;

  const w = data?.widgets || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website Dashboard"
        description="Live overview of trekking website traffic, leads, content health, and SEO."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Today's Visitors" value={w.todaysVisitors ?? 0} />
        <MetricCard label="Today's Leads" value={w.todaysLeads ?? 0} />
        <MetricCard label="Bookings" value={w.bookings ?? 0} />
        <MetricCard label="Revenue" value={formatCurrency(w.revenue || 0)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="SEO Score" value={`${w.seoScore ?? 0}/100`} />
        <MetricCard
          label="Google Index"
          value={`${w.googleIndexStatus?.indexed ?? 0}/${w.googleIndexStatus?.total ?? 0}`}
          hint={`${w.googleIndexStatus?.coveragePercent ?? 0}% coverage`}
        />
        <MetricCard label="Broken Links" value={w.brokenLinks ?? 0} />
        <MetricCard
          label="Core Web Vitals"
          value={`LCP ${w.coreWebVitals?.lcp ?? '—'} · CLS ${w.coreWebVitals?.cls ?? '—'}`}
          hint={`FID ${w.coreWebVitals?.fid ?? '—'}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardTitle className="mb-4">Top Treks</CardTitle>
          <div className="space-y-3">
            {(data?.topTreks || []).map((t) => (
              <Link key={t.id} to={`/admin/website/treks?edit=${t.id}`} className="flex items-center justify-between text-sm hover:text-violet-600">
                <span className="truncate font-medium">{t.title}</span>
                <span className="text-[var(--text-muted)]">{t.viewCount || 0} views</span>
              </Link>
            ))}
            {!data?.topTreks?.length && <p className="text-sm text-[var(--text-muted)]">No published treks yet.</p>}
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-4">Top Destinations</CardTitle>
          <div className="space-y-3">
            {(data?.topDestinations || []).map((d) => (
              <div key={d.id} className="flex items-center justify-between text-sm">
                <span className="truncate font-medium">{d.title}</span>
                <span className="text-[var(--text-muted)]">{d.viewCount || 0}</span>
              </div>
            ))}
            {!data?.topDestinations?.length && <p className="text-sm text-[var(--text-muted)]">No destinations yet.</p>}
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-4">Popular Blogs</CardTitle>
          <div className="space-y-3">
            {(data?.popularBlogs || []).map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span className="truncate font-medium">{b.title}</span>
                <span className="text-[var(--text-muted)]">{b.viewCount || 0}</span>
              </div>
            ))}
            {!data?.popularBlogs?.length && <p className="text-sm text-[var(--text-muted)]">No blogs yet.</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Recent Enquiries</CardTitle>
            <Link to="/admin/website/leads" className="text-xs font-medium text-violet-600">View all</Link>
          </div>
          <div className="space-y-3">
            {(data?.recentEnquiries || []).map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium">{l.name || l.email || 'Anonymous'}</p>
                  <p className="text-xs text-[var(--text-muted)]">{l.type} · {formatDate(l.createdAt)}</p>
                </div>
                <StatusBadge status={l.status} />
              </div>
            ))}
            {!data?.recentEnquiries?.length && <p className="text-sm text-[var(--text-muted)]">No enquiries yet.</p>}
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-4">Website Health</CardTitle>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Published treks</span><span className="font-semibold">{w.websiteHealth?.publishedTreks ?? 0}</span></div>
            <div className="flex justify-between"><span>Draft treks</span><span className="font-semibold">{w.websiteHealth?.draftTreks ?? 0}</span></div>
            <div className="flex justify-between"><span>Pending reviews</span><span className="font-semibold">{w.pendingReviews ?? 0}</span></div>
            <div className="flex justify-between">
              <span>Status</span>
              <StatusBadge status={w.websiteHealth?.maintenanceRisk === 'healthy' ? 'published' : 'pending'} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
