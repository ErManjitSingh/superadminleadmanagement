import { LeadWizard } from '../lead-wizard';

const EXECUTIVE_PATHS = {
  getLead: (id) => `/sales-executive/leads/${id}`,
  updateLead: (id) => `/sales-executive/leads/${id}`,
  createLead: '/sales-executive/leads',
  list: '/sales-executive/leads/all',
  detail: (id) => `/sales-executive/leads/${id}/view`,
  back: '/sales-executive/leads/all',
};

export default function ExecutiveLeadEditPage() {
  return <LeadWizard paths={EXECUTIVE_PATHS} />;
}
