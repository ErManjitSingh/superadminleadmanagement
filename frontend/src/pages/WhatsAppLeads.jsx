import { WhatsAppLeadsPage } from '../components/whatsapp';
import { useTenantFeatures } from '../context/TenantContext';
import { isFeatureEnabled } from '../lib/featureFlags';
import FeatureUpgradePrompt from '../components/FeatureUpgradePrompt';

export default function WhatsAppLeads() {
  const features = useTenantFeatures();

  if (!isFeatureEnabled(features, 'whatsapp')) {
    return <FeatureUpgradePrompt />;
  }

  return <WhatsAppLeadsPage />;
}
