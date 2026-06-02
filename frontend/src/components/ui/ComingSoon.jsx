import { Construction } from 'lucide-react';
import PageHeader from './PageHeader';

export default function ComingSoon({ title, description }) {
  return (
    <div className="animate-fade-up">
      <PageHeader title={title} description={description} />
      <div className="card-premium p-16 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-6">
          <Construction className="w-8 h-8 text-brand-500" />
        </div>
        <h2 className="text-lg font-semibold text-content-primary mb-2">Coming Soon</h2>
        <p className="text-sm text-content-secondary">
          Yeh module design phase mein hai. Pehle core pages complete ho rahe hain.
        </p>
      </div>
    </div>
  );
}
