const WORK_ROLES = [
  'admin',
  'project_manager',
  'team_leader',
  'member',
  'client_viewer',
];

const WORK_DISCIPLINES = [
  'development',
  'design',
  'seo',
  'content',
  'marketing',
  'it',
  'project_management',
  'other',
];

const WORK_ROLE_LABELS = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  team_leader: 'Team Leader',
  member: 'Team Member',
  client_viewer: 'Client / Viewer',
};

const WORK_DISCIPLINE_LABELS = {
  development: 'Developer',
  design: 'Designer',
  seo: 'SEO Executive',
  content: 'Content Writer',
  marketing: 'Marketing Executive',
  it: 'IT',
  project_management: 'Project Management',
  other: 'Other',
};

const WORK_PERMISSIONS = {
  admin: {
    access: true,
    viewUsers: true,
    manageUsers: true,
    manageRoles: true,
    createWorkspaces: true,
    manageProjects: true,
    createTasks: true,
    assignTasks: true,
    updateOwnTasks: true,
    approveTasks: true,
    viewReports: true,
    manageSettings: true,
    viewAudit: true,
  },
  project_manager: {
    access: true,
    viewUsers: true,
    manageUsers: false,
    manageRoles: false,
    createWorkspaces: false,
    manageProjects: true,
    createTasks: true,
    assignTasks: true,
    updateOwnTasks: true,
    approveTasks: true,
    viewReports: true,
    manageSettings: false,
    viewAudit: false,
  },
  team_leader: {
    access: true,
    viewUsers: true,
    manageUsers: false,
    manageRoles: false,
    createWorkspaces: false,
    manageProjects: false,
    createTasks: true,
    assignTasks: true,
    updateOwnTasks: true,
    approveTasks: false,
    viewReports: true,
    manageSettings: false,
    viewAudit: false,
  },
  member: {
    access: true,
    viewUsers: true,
    manageUsers: false,
    manageRoles: false,
    createWorkspaces: false,
    manageProjects: false,
    createTasks: false,
    assignTasks: false,
    updateOwnTasks: true,
    approveTasks: false,
    viewReports: false,
    manageSettings: false,
    viewAudit: false,
  },
  client_viewer: {
    access: true,
    viewUsers: false,
    manageUsers: false,
    manageRoles: false,
    createWorkspaces: false,
    manageProjects: false,
    createTasks: false,
    assignTasks: false,
    updateOwnTasks: false,
    approveTasks: false,
    viewReports: false,
    manageSettings: false,
    viewAudit: false,
  },
};

const CRM_ROLE_TO_WORK_ROLE = {
  admin: 'admin',
  sales_manager: 'project_manager',
  team_leader: 'team_leader',
  sales_executive: 'member',
  accountant: 'member',
  operations_manager: 'project_manager',
  work_user: 'member',
};

function resolveWorkRole(user) {
  return user?.workAccess?.role || CRM_ROLE_TO_WORK_ROLE[user?.role] || 'member';
}

function resolveWorkAccess(user) {
  const role = resolveWorkRole(user);
  const explicitlyDisabled = user?.workAccess?.enabled === false;
  return {
    enabled: !explicitlyDisabled,
    role,
    roleLabel: WORK_ROLE_LABELS[role],
    disciplines: user?.workAccess?.disciplines || [],
    jobTitle: user?.workAccess?.jobTitle || '',
    permissions: explicitlyDisabled
      ? Object.fromEntries(Object.keys(WORK_PERMISSIONS.member).map((key) => [key, false]))
      : WORK_PERMISSIONS[role],
  };
}

module.exports = {
  WORK_ROLES,
  WORK_DISCIPLINES,
  WORK_ROLE_LABELS,
  WORK_DISCIPLINE_LABELS,
  WORK_PERMISSIONS,
  CRM_ROLE_TO_WORK_ROLE,
  resolveWorkRole,
  resolveWorkAccess,
};
