import GmailMailbox from '../components/email/GmailMailbox';

export default function EmailActivityPage() {
  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 h-[calc(100dvh-4.25rem)] min-h-[560px] overflow-hidden">
      <GmailMailbox />
    </div>
  );
}
