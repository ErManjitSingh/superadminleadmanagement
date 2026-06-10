import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, User, Mail, MapPin, X } from 'lucide-react';
import API from '../../api/axios';
import { buildListParams, unwrapPagination } from '../../utils/apiHelpers';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import AppModal from '../ui/AppModal';
import EmailComposerModal from './EmailComposerModal';

function useEmailRolePaths() {
  const { pathname } = useLocation();
  return useMemo(() => {
    if (pathname.includes('/sales-executive')) {
      return {
        leadsEndpoint: '/sales-executive/leads',
        emailEndpoint: '/sales-executive/leads',
      };
    }
    if (pathname.includes('/sales-manager')) {
      return {
        leadsEndpoint: '/sales-manager/leads',
        emailEndpoint: '/leads',
      };
    }
    if (pathname.includes('/team-leader')) {
      return {
        leadsEndpoint: '/team-leader/leads',
        emailEndpoint: '/leads',
      };
    }
    return {
      leadsEndpoint: '/leads',
      emailEndpoint: '/leads',
    };
  }, [pathname]);
}

async function searchLeads(endpoint, search) {
  const { data } = await API.get(endpoint, {
    params: buildListParams({
      page: 1,
      limit: 12,
      filters: { search, filter: 'all' },
    }),
    skipSuccessToast: true,
  });
  return unwrapPagination(data).data || [];
}

export default function GmailComposeLeadPicker({ open, onClose, onSent }) {
  const { leadsEndpoint, emailEndpoint } = useEmailRolePaths();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setLeads([]);
      setSelectedLead(null);
      setComposerOpen(false);
      return;
    }

    if (!debouncedSearch.trim() || debouncedSearch.trim().length < 2) {
      setLeads([]);
      return;
    }

    setLoading(true);
    searchLeads(leadsEndpoint, debouncedSearch.trim())
      .then((rows) => setLeads(rows.filter((l) => l.email)))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [open, debouncedSearch, leadsEndpoint]);

  const handlePick = (lead) => {
    setSelectedLead(lead);
    setComposerOpen(true);
  };

  const handleClose = () => {
    if (composerOpen) return;
    onClose();
  };

  const handleComposerClose = () => {
    setComposerOpen(false);
    setSelectedLead(null);
    onClose();
  };

  const handleSent = () => {
    onSent?.();
    setComposerOpen(false);
    setSelectedLead(null);
    onClose();
  };

  return (
    <>
      <AppModal open={open && !composerOpen} onClose={handleClose} size="lg" className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#dadce0] bg-[#f6f8fc]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-[14px] font-medium text-[#202124]">New message</h3>
              <p className="text-[11px] text-[#5f6368] mt-0.5">Search lead by name, email, or phone</p>
            </div>
            <button type="button" onClick={handleClose} className="p-1 rounded-full hover:bg-[#e8eaed]">
              <X className="w-4 h-4 text-[#5f6368]" />
            </button>
          </div>
          <div className="mt-2 flex items-center bg-white rounded-full px-3 h-8 border border-[#dadce0]">
            <Search className="w-3.5 h-3.5 text-[#5f6368] shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads…"
              className="flex-1 bg-transparent border-0 outline-none text-[12px] px-2 text-[#202124] placeholder:text-[#5f6368]"
            />
          </div>
        </div>

        <div className="max-h-[280px] overflow-y-auto bg-white">
          {search.trim().length < 2 && (
            <div className="p-4 text-center text-[#5f6368] text-[12px]">
              Type at least 2 characters to find a lead with email
            </div>
          )}

          {search.trim().length >= 2 && loading && (
            <div className="p-4 text-center text-[#5f6368] text-[12px]">Searching…</div>
          )}

          {search.trim().length >= 2 && !loading && leads.length === 0 && (
            <div className="p-4 text-center text-[#5f6368] text-[12px]">
              No leads with email found. Add email on the lead first.
            </div>
          )}

          {leads.map((lead) => (
            <button
              key={lead._id}
              type="button"
              onClick={() => handlePick(lead)}
              className="w-full text-left px-4 py-2 border-b border-[#f1f3f4] hover:bg-[#f6f8fc] transition-colors"
            >
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-[#d3e3fd] text-[#001d35] flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[12px] text-[#202124] truncate">{lead.name || 'Lead'}</p>
                  <p className="text-[11px] text-[#5f6368] flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 shrink-0" />
                    {lead.email}
                  </p>
                  {lead.destination && (
                    <p className="text-[10px] text-[#5f6368] flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {lead.destination}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </AppModal>

      <EmailComposerModal
        open={composerOpen}
        onClose={handleComposerClose}
        lead={selectedLead}
        leadId={selectedLead?._id}
        emailEndpoint={emailEndpoint}
        onSent={handleSent}
      />
    </>
  );
}
