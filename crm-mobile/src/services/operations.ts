import { apiClient, unwrapPagination } from '@/src/lib/apiClient';

const BASE = '/operations-manager';

export type OpsKpis = {
  todaysArrivals?: number;
  todaysDepartures?: number;
  pendingBookings?: number;
  hotelPending?: number;
  cabPending?: number;
  activeTrips?: number;
  completedTrips?: number;
  openTickets?: number;
  totalBookings?: number;
  confirmedBookings?: number;
  totalRevenue?: number;
  pendingTasks?: number;
  voucherPending?: number;
  guestsOnTrip?: number;
};

export type OpsBooking = {
  _id: string;
  bookingNumber?: string;
  customerName?: string;
  customerPhone?: string;
  destination?: string;
  packageName?: string;
  travelDate?: string;
  returnDate?: string;
  status?: string;
  totalAmount?: number;
  advanceReceived?: number;
  remainingBalance?: number;
  hotelConfirmation?: string;
  cabConfirmation?: string;
  hotels?: Array<{ hotelName?: string; name?: string; roomType?: string; destination?: string }>;
  transport?: Array<{ vehicleType?: string; driverName?: string; pickupLocation?: string; dropLocation?: string }>;
  adults?: number;
  children?: number;
  tasks?: Array<{ _id?: string; title?: string; status?: string; dueDate?: string }>;
};

export type OpsVoucher = {
  _id: string;
  voucherNumber?: string;
  type?: string;
  status?: string;
  createdAt?: string;
  booking?: { _id?: string; bookingNumber?: string; customerName?: string; destination?: string } | string;
};

export type OpsTask = {
  _id: string;
  title?: string;
  status?: string;
  dueDate?: string;
  priority?: string;
  notes?: string;
};

export type OpsAlert = {
  id?: string;
  title?: string;
  timeAgo?: string;
  href?: string;
  tone?: string;
};

export type OpsSchedule = {
  id?: string;
  time?: string;
  title?: string;
  subtitle?: string;
};

export type OpsDashboard = {
  kpis?: OpsKpis;
  newBookings?: OpsBooking[];
  recentBookings?: OpsBooking[];
  upcomingTrips?: OpsBooking[];
  alerts?: OpsAlert[];
  scheduleEvents?: OpsSchedule[];
};

export async function fetchOpsDashboard(): Promise<OpsDashboard> {
  const { data } = await apiClient.get(`${BASE}/dashboard`);
  return data as OpsDashboard;
}

export async function fetchOpsBookings(params: { page?: number; limit?: number; status?: string; search?: string } = {}) {
  const { data } = await apiClient.get(`${BASE}/bookings`, {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      status: params.status || undefined,
      search: params.search || undefined,
    },
  });
  const page = unwrapPagination<OpsBooking>(data);
  const pagination = (data as { pagination?: { page?: number; limit?: number; total?: number } })?.pagination;
  if (!pagination) return page;
  return {
    items: page.items,
    total: Number(pagination.total ?? page.items.length),
    page: Number(pagination.page ?? 1),
    limit: Number(pagination.limit ?? 20),
  };
}

export async function fetchOpsBooking(id: string): Promise<OpsBooking> {
  const { data } = await apiClient.get(`${BASE}/bookings/${id}`);
  return (data?.booking || data) as OpsBooking;
}

export async function fetchOpsVouchers(type?: string): Promise<OpsVoucher[]> {
  const { data } = await apiClient.get(`${BASE}/vouchers`, {
    params: type && type !== 'all' ? { type } : undefined,
  });
  if (Array.isArray(data)) return data as OpsVoucher[];
  return (data?.vouchers || data?.items || data?.data || []) as OpsVoucher[];
}

export async function fetchOpsTasks(): Promise<OpsTask[]> {
  const { data } = await apiClient.get(`${BASE}/tasks`);
  if (Array.isArray(data)) return data as OpsTask[];
  return (data?.tasks || data?.items || data?.data || []) as OpsTask[];
}
