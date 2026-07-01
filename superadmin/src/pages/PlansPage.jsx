import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { superAdminApi } from '../api/superadmin';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { formatCurrency } from '../lib/utils';

export default function PlansPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => superAdminApi.listPlans().then((r) => r.data.data),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }) => superAdminApi.updatePlan(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });

  if (isLoading) return <div className="py-20 text-center">Loading plans…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription Plans</h1>
        <p className="text-[var(--text-secondary)]">Manage SaaS pricing tiers and limits</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {(data || []).map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  <Badge className={plan.status === 'active' ? 'bg-emerald-500/15 text-emerald-700' : 'bg-slate-500/15 text-slate-600'}>
                    {plan.status}
                  </Badge>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <div className="mb-4">
                <p className="text-3xl font-bold">{formatCurrency(plan.monthlyPrice)}</p>
                <p className="text-sm text-[var(--text-muted)]">per month · {formatCurrency(plan.yearlyPrice)}/year</p>
              </div>

              <ul className="mb-6 space-y-2 text-sm text-[var(--text-secondary)]">
                <li>{plan.userLimit} users</li>
                <li>{plan.storageLimitGb} GB storage</li>
                <li>{plan.leadLimit?.toLocaleString()} leads</li>
                <li>{plan.bookingLimit?.toLocaleString()} bookings</li>
              </ul>

              <div className="mb-4 flex flex-wrap gap-1">
                {(plan.features || []).map((f) => (
                  <Badge key={f} className="bg-brand-500/10 text-brand-700 capitalize">{f}</Badge>
                ))}
              </div>

              <Button
                variant="secondary"
                className="w-full"
                onClick={() =>
                  toggleMutation.mutate({
                    id: plan.id,
                    status: plan.status === 'active' ? 'inactive' : 'active',
                  })
                }
              >
                {plan.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
