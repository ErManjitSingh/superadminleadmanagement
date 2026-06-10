import { Link } from 'react-router-dom';
import {
  Eye,
  Pencil,
  UserCheck,
  UserPlus,
  RefreshCw,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../ui/dropdown-menu';
import { cn } from '../../lib/utils';

function MenuActionIcon({ icon: Icon, tone }) {
  const tones = {
    sky: 'bg-sky-500/12 text-sky-600 ring-sky-500/20',
    violet: 'bg-violet-500/12 text-violet-600 ring-violet-500/20',
    emerald: 'bg-emerald-500/12 text-emerald-600 ring-emerald-500/20',
    fuchsia: 'bg-fuchsia-500/12 text-fuchsia-600 ring-fuchsia-500/20',
    rose: 'bg-rose-500/12 text-rose-600 ring-rose-500/20',
  };

  return (
    <span
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
        tones[tone]
      )}
    >
      <Icon className="w-3.5 h-3.5" />
    </span>
  );
}

function AssignedChip({ name }) {
  return (
    <div
      title={name}
      className="inline-flex h-8 max-w-[108px] items-center gap-1.5 rounded-l-xl border border-r-0 border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent pl-1.5 pr-2"
    >
      <Avatar name={name} size="sm" className="!h-5 !w-5 !text-[8px] ring-2 ring-emerald-500/25 shrink-0" />
      <span className="truncate text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">{name}</span>
    </div>
  );
}

function ActionCluster({ children, className }) {
  return (
    <div
      className={cn(
        'inline-flex items-stretch overflow-hidden rounded-xl',
        'bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm',
        'ring-1 ring-violet-500/20 shadow-sm shadow-violet-500/10',
        className
      )}
    >
      {children}
    </div>
  );
}

function AssignButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 px-2.5 text-[11px] font-semibold text-white',
        'bg-gradient-to-r from-violet-600 via-indigo-600 to-brand-600',
        'hover:brightness-110 active:scale-[0.98] transition-all',
        'shadow-inner shadow-white/10'
      )}
    >
      <UserPlus className="w-3.5 h-3.5 shrink-0" />
      <span>Assign</span>
    </button>
  );
}

function MoreMenuButton({ solo = false }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center',
        'text-content-muted hover:text-violet-600',
        'bg-white/60 dark:bg-slate-800/60 hover:bg-violet-500/10',
        'border-violet-500/15 transition-colors',
        solo ? 'rounded-xl border' : 'border-l'
      )}
      aria-label="More actions"
    >
      <MoreHorizontal className="w-4 h-4" />
    </button>
  );
}

export default function LeadRowActions({
  lead,
  onRowClick,
  onDelete,
  onAssign,
  onTransferBranch,
  canEditLead = true,
  actions,
  showAssignButton = true,
}) {
  const assignedName = lead.assignedTo?.name;
  const showAssign = showAssignButton && actions.assign && !assignedName && onAssign;
  const showAssignedName = Boolean(assignedName);
  const showEdit = actions.edit && canEditLead;
  const showAssignMenu = actions.assign && onAssign;
  const showTransfer = actions.transferBranch && onTransferBranch;
  const showDelete = actions.delete && onDelete;
  const hasMenuItems = actions.view || showEdit || showAssignMenu || showTransfer || showDelete;
  const hasLeading = showAssign || showAssignedName;

  const menuContent = (
    <DropdownMenuContent
      align="end"
      sideOffset={8}
      className="min-w-[232px] rounded-2xl border-violet-500/15 bg-surface/95 p-1.5 shadow-xl shadow-violet-500/10 backdrop-blur-xl"
    >
      <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-600/80">
        Lead Actions
      </DropdownMenuLabel>
      {actions.view && (
        <DropdownMenuItem
          onClick={() => onRowClick?.(lead)}
          className="gap-3 rounded-xl px-2 py-2.5 focus:bg-violet-500/8"
        >
          <MenuActionIcon icon={Eye} tone="sky" />
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold text-content-primary">View Lead</p>
            <p className="text-[11px] text-content-muted">Open quick preview</p>
          </div>
        </DropdownMenuItem>
      )}
      {showEdit && (
        <DropdownMenuItem asChild className="gap-3 rounded-xl px-2 py-2.5 focus:bg-violet-500/8">
          <Link to={`/leads/${lead._id}/edit`}>
            <MenuActionIcon icon={Pencil} tone="violet" />
            <div className="min-w-0 text-left">
              <p className="text-sm font-semibold text-content-primary">Edit Lead</p>
              <p className="text-[11px] text-content-muted">Update customer details</p>
            </div>
          </Link>
        </DropdownMenuItem>
      )}
      {showAssignMenu && (
        <DropdownMenuItem
          onClick={() => onAssign(lead)}
          className="gap-3 rounded-xl px-2 py-2.5 focus:bg-violet-500/8"
        >
          <MenuActionIcon icon={UserCheck} tone="emerald" />
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold text-content-primary">
              {assignedName ? 'Reassign Lead' : 'Assign Lead'}
            </p>
            <p className="text-[11px] text-content-muted">Pick sales executive or manager</p>
          </div>
        </DropdownMenuItem>
      )}
      {showTransfer && (
        <DropdownMenuItem
          onClick={() => onTransferBranch(lead)}
          className="gap-3 rounded-xl px-2 py-2.5 focus:bg-violet-500/8"
        >
          <MenuActionIcon icon={RefreshCw} tone="fuchsia" />
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold text-content-primary">Transfer Branch</p>
            <p className="text-[11px] text-content-muted">Move to another office</p>
          </div>
        </DropdownMenuItem>
      )}
      {showDelete && (
        <>
          <DropdownMenuSeparator className="my-1.5 bg-violet-500/10" />
          <DropdownMenuItem
            className="gap-3 rounded-xl px-2 py-2.5 text-rose-600 focus:bg-rose-500/10 focus:text-rose-600"
            onClick={() => onDelete(lead._id)}
          >
            <MenuActionIcon icon={Trash2} tone="rose" />
            <div className="min-w-0 text-left">
              <p className="text-sm font-semibold">Delete Lead</p>
              <p className="text-[11px] text-rose-500/80">Permanent removal</p>
            </div>
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  );

  if (!hasLeading && !hasMenuItems) return null;

  if (!hasLeading && hasMenuItems) {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenuRoot>
          <DropdownMenuTrigger asChild>
            <ActionCluster>
              <MoreMenuButton solo />
            </ActionCluster>
          </DropdownMenuTrigger>
          {menuContent}
        </DropdownMenuRoot>
      </div>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <ActionCluster>
        {showAssign && <AssignButton onClick={() => onAssign(lead)} />}
        {showAssignedName && !showAssign && <AssignedChip name={assignedName} />}
        {hasMenuItems && (
          <DropdownMenuRoot>
            <DropdownMenuTrigger asChild>
              <MoreMenuButton />
            </DropdownMenuTrigger>
            {menuContent}
          </DropdownMenuRoot>
        )}
      </ActionCluster>
    </div>
  );
}
