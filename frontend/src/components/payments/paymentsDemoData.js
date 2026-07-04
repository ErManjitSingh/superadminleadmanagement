const today = new Date();
const daysFromNow = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

export const DEMO_CUSTOMER_PAYMENTS = [
  {
    id: 'cp-1',
    customerName: 'Rahul Sharma',
    leadId: 'LD-2401',
    leadCode: 'LD-2401',
    quotationId: 'QT-8841',
    quoteNumber: 'QT-8841',
    packageName: 'Manali Honeymoon 5N/6D',
    destination: 'Manali',
    executive: 'Priya Mehta',
    branch: 'Delhi',
    total: 85000,
    received: 25000,
    pending: 60000,
    status: 'partial',
    method: 'upi',
    dueDate: daysFromNow(3),
    phone: '9876543210',
    email: 'rahul@example.com',
    invoiceNumber: 'INV-2026-101',
    timeline: [
      { label: 'Booking Amount', amount: 25500, paid: 25000, state: 'partial' },
      { label: 'Second Installment', amount: 42500, paid: 0, state: 'pending' },
      { label: 'Final Payment', amount: 17000, paid: 0, state: 'pending' },
    ],
    invoices: [{ no: 'INV-2026-101', type: 'Tax Invoice', amount: 85000, status: 'open' }],
    receipts: [{ no: 'RCP-101', amount: 25000, date: daysFromNow(-5) }],
    refunds: [],
    transactions: [{ id: 'txn-1', amount: 25000, method: 'upi', date: daysFromNow(-5), ref: 'UPI2401', status: 'success' }],
    notes: ['Customer requested EMI option for balance.'],
  },
  {
    id: 'cp-2',
    customerName: 'Ananya Gupta',
    leadId: 'LD-2408',
    leadCode: 'LD-2408',
    quotationId: 'QT-8852',
    quoteNumber: 'QT-8852',
    packageName: 'Goa Family Escape 4N',
    destination: 'Goa',
    executive: 'Amit Verma',
    branch: 'Mumbai',
    total: 62000,
    received: 62000,
    pending: 0,
    status: 'completed',
    method: 'card',
    dueDate: daysFromNow(-2),
    phone: '9811122233',
    email: 'ananya@example.com',
    invoiceNumber: 'INV-2026-108',
    timeline: [
      { label: 'Booking Amount', amount: 18600, paid: 18600, state: 'paid' },
      { label: 'Second Installment', amount: 31000, paid: 31000, state: 'paid' },
      { label: 'Final Payment', amount: 12400, paid: 12400, state: 'paid' },
    ],
    invoices: [{ no: 'INV-2026-108', type: 'Tax Invoice', amount: 62000, status: 'paid' }],
    receipts: [{ no: 'RCP-108', amount: 62000, date: daysFromNow(-1) }],
    refunds: [],
    transactions: [{ id: 'txn-2', amount: 62000, method: 'card', date: daysFromNow(-1), ref: 'CARD8852', status: 'success' }],
    notes: [],
  },
  {
    id: 'cp-3',
    customerName: 'Vikram Singh',
    leadId: 'LD-2412',
    leadCode: 'LD-2412',
    quotationId: 'QT-8860',
    quoteNumber: 'QT-8860',
    packageName: 'Kashmir Premium 6N',
    destination: 'Srinagar',
    executive: 'Priya Mehta',
    branch: 'Delhi',
    total: 145000,
    received: 0,
    pending: 145000,
    status: 'overdue',
    method: 'bank_transfer',
    dueDate: daysFromNow(-4),
    phone: '9900011122',
    email: 'vikram@example.com',
    invoiceNumber: 'INV-2026-112',
    timeline: [
      { label: 'Booking Amount', amount: 43500, paid: 0, state: 'pending' },
      { label: 'Second Installment', amount: 72500, paid: 0, state: 'pending' },
      { label: 'Final Payment', amount: 29000, paid: 0, state: 'pending' },
    ],
    invoices: [{ no: 'INV-2026-112', type: 'Proforma', amount: 145000, status: 'open' }],
    receipts: [],
    refunds: [],
    transactions: [],
    notes: ['Reminder sent twice via WhatsApp.'],
  },
  {
    id: 'cp-4',
    customerName: 'Neha Kapoor',
    leadId: 'LD-2420',
    leadCode: 'LD-2420',
    quotationId: 'QT-8871',
    quoteNumber: 'QT-8871',
    packageName: 'Kerala Backwaters 5N',
    destination: 'Kochi',
    executive: 'Sneha Rao',
    branch: 'Bangalore',
    total: 98000,
    received: 29400,
    pending: 68600,
    status: 'pending',
    method: 'upi',
    dueDate: daysFromNow(8),
    phone: '9765432109',
    email: 'neha@example.com',
    invoiceNumber: 'INV-2026-120',
    timeline: [
      { label: 'Booking Amount', amount: 29400, paid: 29400, state: 'paid' },
      { label: 'Second Installment', amount: 49000, paid: 0, state: 'pending' },
      { label: 'Final Payment', amount: 19600, paid: 0, state: 'pending' },
    ],
    invoices: [{ no: 'INV-2026-120', type: 'Tax Invoice', amount: 98000, status: 'open' }],
    receipts: [{ no: 'RCP-120', amount: 29400, date: daysFromNow(-10) }],
    refunds: [],
    transactions: [{ id: 'txn-4', amount: 29400, method: 'upi', date: daysFromNow(-10), ref: 'UPI2420', status: 'success' }],
    notes: [],
  },
  {
    id: 'cp-5',
    customerName: 'Arjun Patel',
    leadId: 'LD-2425',
    leadCode: 'LD-2425',
    quotationId: 'QT-8878',
    quoteNumber: 'QT-8878',
    packageName: 'Rajasthan Heritage 7N',
    destination: 'Jaipur',
    executive: 'Amit Verma',
    branch: 'Mumbai',
    total: 112000,
    received: 56000,
    pending: 56000,
    status: 'partial',
    method: 'net_banking',
    dueDate: daysFromNow(1),
    phone: '9822001122',
    email: 'arjun@example.com',
    invoiceNumber: 'INV-2026-125',
    timeline: [
      { label: 'Booking Amount', amount: 33600, paid: 33600, state: 'paid' },
      { label: 'Second Installment', amount: 56000, paid: 22400, state: 'partial' },
      { label: 'Final Payment', amount: 22400, paid: 0, state: 'pending' },
    ],
    invoices: [{ no: 'INV-2026-125', type: 'Tax Invoice', amount: 112000, status: 'open' }],
    receipts: [{ no: 'RCP-125', amount: 56000, date: daysFromNow(-3) }],
    refunds: [],
    transactions: [{ id: 'txn-5', amount: 56000, method: 'net_banking', date: daysFromNow(-3), ref: 'NB8878', status: 'success' }],
    notes: [],
  },
];

export const DEMO_SUPPLIERS = [
  { id: 'sp-1', name: 'Snow Valley Resort', type: 'Hotels', amountDue: 185000, paid: 120000, pending: 65000, dueDate: daysFromNow(2), status: 'partial' },
  { id: 'sp-2', name: 'Himalayan Cabs', type: 'Transport', amountDue: 42000, paid: 42000, pending: 0, dueDate: daysFromNow(-1), status: 'completed' },
  { id: 'sp-3', name: 'Local Guide Collective', type: 'Guides', amountDue: 18000, paid: 0, pending: 18000, dueDate: daysFromNow(5), status: 'pending' },
  { id: 'sp-4', name: 'Adventure Trails Co.', type: 'Activities', amountDue: 27500, paid: 10000, pending: 17500, dueDate: daysFromNow(-3), status: 'overdue' },
  { id: 'sp-5', name: 'SkyJet Holidays', type: 'Flights', amountDue: 96000, paid: 48000, pending: 48000, dueDate: daysFromNow(1), status: 'partial' },
  { id: 'sp-6', name: 'North India Vendors', type: 'Vendors', amountDue: 33000, paid: 0, pending: 33000, dueDate: daysFromNow(10), status: 'pending' },
];

export const DEMO_REFUNDS = [
  { id: 'rf-1', customer: 'Sonia Mehta', booking: 'BK-4412', reason: 'Trip cancelled by customer', amount: 15000, mode: 'UPI', status: 'requested' },
  { id: 'rf-2', customer: 'Karan Malhotra', booking: 'BK-4398', reason: 'Hotel unavailable — partial refund', amount: 8000, mode: 'Bank Transfer', status: 'approved' },
  { id: 'rf-3', customer: 'Divya Nair', booking: 'BK-4370', reason: 'Flight schedule change', amount: 12000, mode: 'Original Payment', status: 'completed' },
  { id: 'rf-4', customer: 'Rohit Das', booking: 'BK-4355', reason: 'Policy violation', amount: 5000, mode: 'UPI', status: 'rejected' },
];

export const DEMO_INVOICES = [
  { id: 'inv-1', no: 'INV-2026-101', customer: 'Rahul Sharma', gst: '29AABCU9603R1ZM', amount: 85000, status: 'open', type: 'GST Invoice' },
  { id: 'inv-2', no: 'PF-2026-044', customer: 'Vikram Singh', gst: '07AAACP1234A1Z5', amount: 145000, status: 'draft', type: 'Proforma' },
  { id: 'inv-3', no: 'RCP-2026-108', customer: 'Ananya Gupta', gst: '27AADCB2230M1Z3', amount: 62000, status: 'paid', type: 'Receipt' },
  { id: 'inv-4', no: 'CN-2026-012', customer: 'Sonia Mehta', gst: '29AABCU9603R1ZM', amount: 15000, status: 'issued', type: 'Credit Note' },
];

export const DEMO_PAYMENT_LINKS = [
  { id: 'pl-1', customer: 'Rahul Sharma', amount: 60000, gateway: 'Razorpay', expiry: daysFromNow(2), status: 'opened', url: 'https://pay.ihd.in/r/abc123' },
  { id: 'pl-2', customer: 'Arjun Patel', amount: 56000, gateway: 'Cashfree', expiry: daysFromNow(5), status: 'active', url: 'https://pay.ihd.in/c/def456' },
  { id: 'pl-3', customer: 'Neha Kapoor', amount: 68600, gateway: 'UPI QR', expiry: daysFromNow(7), status: 'copied', url: 'https://pay.ihd.in/u/ghi789' },
  { id: 'pl-4', customer: 'Vikram Singh', amount: 43500, gateway: 'Stripe', expiry: daysFromNow(-1), status: 'expired', url: 'https://pay.ihd.in/s/jkl012' },
  { id: 'pl-5', customer: 'Ananya Gupta', amount: 12400, gateway: 'Manual Bank', expiry: daysFromNow(1), status: 'paid', url: 'https://pay.ihd.in/b/mno345' },
];

export const DEMO_TRANSACTIONS = [
  { id: 'TXN-9001', date: daysFromNow(0), amount: 25000, ref: 'UPI2401', gateway: 'UPI', bank: 'HDFC', method: 'upi', status: 'success', party: 'Rahul Sharma', type: 'credit' },
  { id: 'TXN-9002', date: daysFromNow(-1), amount: 62000, ref: 'CARD8852', gateway: 'Razorpay', bank: 'ICICI', method: 'card', status: 'success', party: 'Ananya Gupta', type: 'credit' },
  { id: 'TXN-9003', date: daysFromNow(-1), amount: 42000, ref: 'NEFT8821', gateway: 'Bank', bank: 'SBI', method: 'bank_transfer', status: 'success', party: 'Himalayan Cabs', type: 'debit' },
  { id: 'TXN-9004', date: daysFromNow(-2), amount: 15000, ref: 'RFND4412', gateway: 'UPI', bank: 'Axis', method: 'upi', status: 'pending', party: 'Sonia Mehta', type: 'debit' },
  { id: 'TXN-9005', date: daysFromNow(-3), amount: 56000, ref: 'NB8878', gateway: 'Net Banking', bank: 'HDFC', method: 'net_banking', status: 'success', party: 'Arjun Patel', type: 'credit' },
  { id: 'TXN-9006', date: daysFromNow(-4), amount: 10000, ref: 'CASH991', gateway: 'Cash', bank: '—', method: 'cash', status: 'success', party: 'Adventure Trails Co.', type: 'debit' },
];

export const DEMO_ACTIVITY = [
  { id: 'a1', type: 'payment', text: 'Customer paid ₹25,000', detail: 'Rahul Sharma · INV-2026-101', time: '12 min ago', color: 'emerald' },
  { id: 'a2', type: 'refund', text: 'Refund processed', detail: 'Divya Nair · ₹12,000', time: '1 hr ago', color: 'violet' },
  { id: 'a3', type: 'supplier', text: 'Supplier paid', detail: 'Himalayan Cabs · ₹42,000', time: '2 hr ago', color: 'sky' },
  { id: 'a4', type: 'invoice', text: 'Invoice generated', detail: 'INV-2026-125 · Arjun Patel', time: '3 hr ago', color: 'amber' },
  { id: 'a5', type: 'link', text: 'Payment link opened', detail: 'Rahul Sharma · Razorpay', time: '4 hr ago', color: 'rose' },
];

export const DEMO_MONTHLY_REVENUE = [
  { month: 'Jan', revenue: 420000, received: 380000 },
  { month: 'Feb', revenue: 510000, received: 470000 },
  { month: 'Mar', revenue: 480000, received: 450000 },
  { month: 'Apr', revenue: 620000, received: 540000 },
  { month: 'May', revenue: 710000, received: 680000 },
  { month: 'Jun', revenue: 690000, received: 610000 },
  { month: 'Jul', revenue: 780000, received: 720000 },
];

export const DEMO_METHOD_SPLIT = [
  { name: 'UPI', value: 38, color: '#8B5CF6' },
  { name: 'Card', value: 22, color: '#06B6D4' },
  { name: 'Bank', value: 18, color: '#10B981' },
  { name: 'Net Banking', value: 12, color: '#F59E0B' },
  { name: 'Cash', value: 10, color: '#F43F5E' },
];

export const DEMO_COLLECTION_TREND = [
  { day: 'Mon', amount: 42000 },
  { day: 'Tue', amount: 68000 },
  { day: 'Wed', amount: 51000 },
  { day: 'Thu', amount: 89000 },
  { day: 'Fri', amount: 74000 },
  { day: 'Sat', amount: 96000 },
  { day: 'Sun', amount: 38000 },
];

export const DEMO_DUE_VS_RECEIVED = [
  { label: 'Week 1', due: 120000, received: 98000 },
  { label: 'Week 2', due: 145000, received: 132000 },
  { label: 'Week 3', due: 110000, received: 88000 },
  { label: 'Week 4', due: 160000, received: 151000 },
];

export const DEMO_DASHBOARD_KPIS = {
  todayCollection: 87000,
  monthCollection: 720000,
  outstanding: 329600,
  pendingCount: 4,
  supplierDue: 181500,
  refundPending: 23000,
  profitReceived: 184000,
  successRate: 94.2,
};

export const DEMO_SETTINGS = {
  gateways: [
    { id: 'razorpay', name: 'Razorpay', enabled: true },
    { id: 'cashfree', name: 'Cashfree', enabled: true },
    { id: 'stripe', name: 'Stripe', enabled: false },
  ],
  bankAccounts: [
    { bank: 'HDFC Bank', account: 'XXXX4521', ifsc: 'HDFC0001234', primary: true },
    { bank: 'ICICI Bank', account: 'XXXX8890', ifsc: 'ICIC0005678', primary: false },
  ],
  upiIds: ['ihd@okhdfcbank', 'payments@ihd'],
  gst: { number: '29AABCU9603R1ZM', legalName: 'India Holiday Destination Pvt Ltd', address: 'Bengaluru, Karnataka' },
  invoicePrefix: 'INV-2026-',
  receiptPrefix: 'RCP-2026-',
  autoReminder: true,
  autoInvoice: true,
  whatsappReceipts: true,
};
