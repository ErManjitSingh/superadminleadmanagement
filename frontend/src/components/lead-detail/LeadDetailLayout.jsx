import LeadDetailHeader from './LeadDetailHeader';
import LeadStatusPipeline from './LeadStatusPipeline';
import LeadConvertedBanner from './LeadConvertedBanner';
import LeadContactActions from '../whatsapp-contact/LeadContactActions';
import LeadActivityTimeline from './LeadActivityTimeline';
import LeadNotesPanel from './LeadNotesPanel';
import LeadSummaryPanel from './LeadSummaryPanel';
import LeadQuotationSection from './LeadQuotationSection';
import LeadScoreBreakdown from './LeadScoreBreakdown';
import LeadActionPanel from './LeadActionPanel';
import { useLeadQuotationsQuery, useLeadNotesQuery } from '../../features/leads/hooks/useLeadRelatedQueries';
import { getLeadDetailData } from './leadDetailData';
import { DETAIL_CARD } from './leadDetailUtils';
import { cn } from '../../lib/utils';

export default function LeadDetailLayout({
  lead,
  leadId,
  activities,
  timelineLoading,
  relatedBasePath = '/leads',
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
  onConvertLead,
  canCreateFollowUp,
  canEditLead,
  canChangeStatus,
  canConvertLead,
  editHref,
  headerExtra,
  sidebarExtra,
  bottomExtra,
}) {
  const detail = getLeadDetailData(lead);
  const embeddedQuotations = lead.quotations || detail.quotations || [];
  const embeddedNotes = detail.notes?.length ? detail.notes : null;

  const { data: quotationsData, isLoading: quotationsLoading } = useLeadQuotationsQuery(leadId, {
    basePath: relatedBasePath,
    enabled: !embeddedQuotations.length,
  });
  const { data: notesData, isLoading: notesLoading } = useLeadNotesQuery(leadId, {
    basePath: relatedBasePath,
    enabled: !embeddedNotes && !lead.notes,
  });

  const quotations = embeddedQuotations.length ? embeddedQuotations : (quotationsData?.items || []);
  const notes = embeddedNotes || notesData?.items || [];

  return (
    <>
      <LeadDetailHeader lead={lead} backHref={backHref} backLabel={backLabel} />
      {headerExtra}

      <div className={cn(DETAIL_CARD, 'p-4 sm:p-5 mb-4')}>
        <LeadStatusPipeline status={lead.status} embedded />
      </div>

      <LeadContactActions
        embedded
        className="mb-5"
        lead={lead}
        leadId={leadId}
        contactEndpoint={contactEndpoint}
        onCreateQuote={onCreateQuote}
        onScheduleFollowUp={onScheduleFollowUp}
        onContactLogged={onContactLogged}
        onEmailSent={onEmailSent}
        onChangeStatus={onChangeStatus}
      />

      <LeadConvertedBanner status={lead.status} leadId={leadId} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch mb-5">
        <div className="xl:col-span-3 order-2 xl:order-1">
          <LeadNotesPanel notes={notes} legacyNote={lead.notes} loading={notesLoading} />
        </div>

        <div className="xl:col-span-6 order-1 xl:order-2">
          <LeadActivityTimeline
            activities={activities}
            loading={timelineLoading}
            quotations={quotations}
            leadId={leadId}
            compact
          />
        </div>

        <div className="xl:col-span-3 order-3 space-y-4">
          <LeadSummaryPanel lead={lead} />
          {(canEditLead || canConvertLead || onChangeStatus) && (
            <LeadActionPanel
              onLogCallNote={onLogCallNote}
              onAssign={onAssign}
              onChangeStatus={onChangeStatus}
              onConvertLead={onConvertLead}
              canConvertLead={canConvertLead}
              canCreateFollowUp={canCreateFollowUp}
              canEditLead={canEditLead}
              canChangeStatus={canChangeStatus}
              editHref={editHref}
            />
          )}
          {sidebarExtra}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <LeadQuotationSection quotations={quotations} loading={quotationsLoading} />
        <LeadScoreBreakdown lead={lead} />
      </div>

      {bottomExtra}
    </>
  );
}
