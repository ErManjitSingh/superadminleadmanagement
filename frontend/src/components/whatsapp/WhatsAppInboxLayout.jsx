import { cn } from '../../lib/utils';

export default function WhatsAppInboxLayout({
  listPanel,
  chatPanel,
  infoPanel,
  mobileView,
  className,
}) {
  return (
    <div className={cn('wa-inbox flex overflow-hidden rounded-2xl border border-wa-border shadow-2xl shadow-black/10', className)}>
      {/* Left — Lead List */}
      <div
        className={cn(
          'w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col',
          mobileView !== 'list' && 'hidden lg:flex'
        )}
      >
        {listPanel}
      </div>

      {/* Center — Conversation */}
      <div
        className={cn(
          'flex-1 min-w-0 flex flex-col border-x border-wa-border',
          mobileView === 'info' && 'hidden lg:flex',
          mobileView === 'list' && 'hidden lg:flex',
          mobileView === 'chat' && 'flex'
        )}
      >
        {chatPanel}
      </div>

      {/* Right — Lead Info */}
      <div
        className={cn(
          'w-full lg:w-[320px] xl:w-[360px] shrink-0 flex flex-col',
          mobileView === 'info' ? 'flex fixed inset-0 z-30 lg:relative lg:inset-auto' : 'hidden xl:flex',
          mobileView === 'list' && 'hidden xl:flex',
          mobileView === 'chat' && 'hidden xl:flex'
        )}
      >
        {infoPanel}
      </div>
    </div>
  );
}
