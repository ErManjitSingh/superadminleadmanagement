export type OpsLink = {
  id: string;
  label: string;
  icon: string;
  hint?: string;
  native?: string;
  webPath?: string;
};

export const OPS_SECTIONS: { title: string; items: OpsLink[] }[] = [
  {
    title: 'Bookings',
    items: [
      { id: 'b-pending', label: 'Pending', icon: 'time-outline', hint: 'New bookings', native: '/operations/bookings?status=pending' },
      { id: 'b-confirmed', label: 'Confirmed', icon: 'checkmark-circle-outline', native: '/operations/bookings?status=confirmed' },
      { id: 'b-active', label: 'Active trips', icon: 'airplane-outline', native: '/operations/bookings?status=active' },
      { id: 'b-done', label: 'Completed', icon: 'flag-outline', native: '/operations/bookings?status=completed' },
    ],
  },
  {
    title: 'Trip execution',
    items: [
      { id: 't-dash', label: 'Execution', icon: 'pulse-outline', webPath: '/operations-manager/trip-execution' },
      { id: 't-active', label: 'Active trips', icon: 'navigate-outline', webPath: '/operations-manager/trips/active' },
      { id: 't-up', label: 'Upcoming', icon: 'calendar-outline', webPath: '/operations-manager/trips/upcoming' },
      { id: 't-done', label: 'Completed', icon: 'checkmark-done-outline', webPath: '/operations-manager/trips/completed' },
    ],
  },
  {
    title: 'Vouchers',
    items: [
      { id: 'v-all', label: 'All vouchers', icon: 'ticket-outline', native: '/operations/vouchers' },
      { id: 'v-hotel', label: 'Hotel', icon: 'bed-outline', native: '/operations/vouchers?type=hotel' },
      { id: 'v-cab', label: 'Cab', icon: 'car-outline', native: '/operations/vouchers?type=cab' },
      { id: 'v-client', label: 'Client kit', icon: 'book-outline', native: '/operations/vouchers?type=client' },
    ],
  },
  {
    title: 'Vendors',
    items: [
      { id: 'vd-all', label: 'All vendors', icon: 'business-outline', webPath: '/operations-manager/vendors' },
      { id: 'vd-hotels', label: 'Hotels', icon: 'bed-outline', webPath: '/operations-manager/hotels' },
      { id: 'vd-cabs', label: 'Cabs', icon: 'car-sport-outline', webPath: '/operations-manager/transport' },
      { id: 'vd-act', label: 'Activities', icon: 'compass-outline', webPath: '/operations-manager/activities' },
      { id: 'vd-conf', label: 'Confirmations', icon: 'shield-checkmark-outline', webPath: '/operations-manager/vendors/confirmations' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { id: 'o-tasks', label: 'Tasks', icon: 'list-outline', native: '/operations/tasks' },
      { id: 'o-alerts', label: 'Alerts', icon: 'notifications-outline', webPath: '/operations-manager/operations/alerts' },
      { id: 'o-esc', label: 'Escalations', icon: 'warning-outline', webPath: '/operations-manager/operations/escalations' },
      { id: 'o-support', label: 'Support', icon: 'headset-outline', webPath: '/operations-manager/support' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { id: 'i-cal', label: 'Calendar', icon: 'calendar-outline', webPath: '/operations-manager/calendar' },
      { id: 'i-rep', label: 'Reports', icon: 'bar-chart-outline', webPath: '/operations-manager/reports' },
    ],
  },
];
