import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import SourceAnalyticsPanel from '../components/dashboard/SourceAnalyticsPanel';
import ExecutivePerformancePanel from '../components/dashboard/ExecutivePerformancePanel';
import AgingChartPanel from '../components/dashboard/AgingChartPanel';
import { fetchLeadKpis, fetchSourceAnalytics, fetchExecutivePerformance } from '../services/leadEnterpriseApi';
import EnterpriseKpiStrip from '../components/dashboard/EnterpriseKpiStrip';

export default function LeadAnalytics() {
  const [kpis, setKpis] = useState(null);
  const [sources, setSources] = useState(null);
  const [executives, setExecutives] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchLeadKpis(),
      fetchSourceAnalytics(),
      fetchExecutivePerformance(),
    ])
      .then(([k, s, e]) => {
        setKpis(k);
        setSources(s);
        setExecutives(e);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-subtle bg-surface p-16 text-center text-content-muted animate-pulse">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Lead Analytics</h1>
          <p className="text-sm text-content-muted">Source conversion, executive performance & pipeline health</p>
        </div>
      </div>

      <EnterpriseKpiStrip kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SourceAnalyticsPanel data={sources} />
        <AgingChartPanel aging={kpis?.aging || []} />
      </div>

      <ExecutivePerformancePanel data={executives} />
    </div>
  );
}
