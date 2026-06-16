import LeadDetailHeader from './LeadDetailHeader';
import LeadStatusPipeline from './LeadStatusPipeline';
import LeadConvertedBanner from './LeadConvertedBanner';
import LeadContactActions from '../whatsapp-contact/LeadContactActions';
import LeadCustomerPanel from './LeadCustomerPanel';
import LeadActivityTimeline from './LeadActivityTimeline';
import LeadActionPanel from './LeadActionPanel';
import LeadNotesPanel from './LeadNotesPanel';
import LeadUpcomingFollowUp from './LeadUpcomingFollowUp';
import LeadTagsPanel from './LeadTagsPanel';
import LeadQuotationSection from './LeadQuotationSection';
import LeadScoreBreakdown from './LeadScoreBreakdown';
import { getLeadDetailData } from './leadDetailData';

export default function LeadDetailLayout({
  lead,
  leadId,
  activities,
  timelineLoading,
  backHref,
  backLabel,
  contactEndpoint,
  onCreateQuote,
  onScheduleFollowUp,
  onContactLogged,
  onEmailSent,
  onLogCallNote,
  onAssign,
  onChangeStatus,
  canCreateFollowUp,
  canEditLead,
  canChangeStatus,
  editHref,
  headerExtra,
  sidebarExtra,
  bottomExtra,
}) {
  const detail = getLeadDetailData(lead);
  const followups = lead.followups || lead.followUps || detail.followUps || [];

  return (
    <>
      <LeadDetailHeader lead={lead} backHref={backHref} backLabel={backLabel} />
      {headerExtra}
      <LeadStatusPipeline status={lead.status} />
      <LeadConvertedBanner status={lead.status} />

      <LeadContactActions
        lead={lead}
        leadId={leadId}
        contactEndpoint={contactEndpoint}
        onCreateQuote={onCreateQuote}
        onScheduleFollowUp={onScheduleFollowUp}
        onContactLogged={onContactLogged}
        onEmailSent={onEmailSent}
        onChangeStatus={onChangeStatus}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start mb-5">
        <aside className="xl:col-span-3 space-y-4 order-2 xl:order-1">
          <LeadCustomerPanel lead={lead} />
        </aside>

        <main className="xl:col-span-6 space-y-4 order-1 xl:order-2">
          <LeadActivityTimeline
            activities={activities}
            loading={timelineLoading}
            quotations={lead.quotations || []}
          />
        </main>

        <aside className="xl:col-span-3 space-y-4 order-3">
          <LeadActionPanel
            onLogCallNote={onLogCallNote}
            onAssign={onAssign}
            onChangeStatus={onChangeStatus}
            canCreateFollowUp={canCreateFollowUp}
            canEditLead={canEditLead}
            canChangeStatus={canChangeStatus}
            editHref={editHref}
          />
          {sidebarExtra}
          <LeadNotesPanel notes={detail.notes} legacyNote={lead.notes} />
          <LeadUpcomingFollowUp followups={followups} lead={lead} />
          <LeadTagsPanel lead={lead} />
        </aside>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <LeadQuotationSection quotations={lead.quotations || detail.quotations || []} />
        <LeadScoreBreakdown lead={lead} />
      </div>

      {bottomExtra}
    </>
  );
}
