import { useEffect, useState } from 'react';
import { Loader2, Mail, MessageCircle } from 'lucide-react';
import AppModal from '../../ui/AppModal';
import { Button } from '../../ui/button';
import { sendVoucherEmail, sendVoucherWhatsApp } from '../../../services/operationsVoucherApi';
import { normalizeWaPhone } from '../../../lib/phoneUtils';

function defaultRecipient(type, voucher, booking) {
  const p = voucher?.payload || {};
  if (type === 'hotel') {
    return {
      phone: p.hotelPhone || p.phone || p.frontOfficePhone || '',
      email: p.hotelEmail || p.email || '',
      label: p.hotelName || 'Hotel',
    };
  }
  if (type === 'transport') {
    const t = booking?.transport?.[0] || {};
    return {
      phone: p.vendorPhone || p.driverPhone || t.vendorPhone || t.driverPhone || '',
      email: p.vendorEmail || p.driverEmail || '',
      label: p.vendorName || p.driverName || t.vendorName || t.driverName || 'Cab Vendor / Driver',
    };
  }
  return {
    phone: booking?.customerPhone || '',
    email: booking?.customerEmail || '',
    label: booking?.customerName || 'Recipient',
  };
}

export default function VoucherSendModal({ open, onClose, channel, type, voucher, booking, onSent }) {
  const defaults = defaultRecipient(type, voucher, booking);
  const [phone, setPhone] = useState(defaults.phone);
  const [email, setEmail] = useState(defaults.email);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      const d = defaultRecipient(type, voucher, booking);
      setPhone(d.phone);
      setEmail(d.email);
    }
  }, [open, type, voucher, booking]);

  const handleSend = async () => {
    if (!voucher?._id) return;
    setSending(true);
    try {
      if (channel === 'whatsapp') {
        const normalized = normalizeWaPhone(phone);
        if (!normalized) return;
        await sendVoucherWhatsApp(voucher._id, normalized);
      } else {
        await sendVoucherEmail(voucher._id, email);
      }
      onSent?.();
      onClose?.();
    } finally {
      setSending(false);
    }
  };

  const isWa = channel === 'whatsapp';

  return (
    <AppModal open={open} onClose={onClose} size="md" lockDismiss={sending}>
      <div className="p-6">
        <h3 className="text-lg font-black text-content-primary flex items-center gap-2">
          {isWa ? <MessageCircle className="w-5 h-5 text-emerald-600" /> : <Mail className="w-5 h-5 text-violet-600" />}
          {isWa ? 'Send via WhatsApp' : 'Send via Email'}
        </h3>
        <p className="text-sm text-content-muted mt-1 mb-4">
          {type === 'hotel'
            ? 'Send hotel voucher to the property'
            : 'Send cab itinerary voucher (pickup, drop & places) to driver / vendor on WhatsApp'}
          {' — '}
          <strong>{defaults.label}</strong>
        </p>
        {isWa ? (
          <label className="block">
            <span className="text-xs font-semibold text-content-muted">WhatsApp Number</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="input-premium mt-1 w-full"
            />
          </label>
        ) : (
          <label className="block">
            <span className="text-xs font-semibold text-content-muted">Email Address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vendor@example.com"
              className="input-premium mt-1 w-full"
            />
          </label>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button
            onClick={handleSend}
            disabled={sending || (isWa ? !normalizeWaPhone(phone) : !email.trim())}
            className={isWa ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
          </Button>
        </div>
      </div>
    </AppModal>
  );
}
