const { z } = require('zod');
const { PROJECT_MEMBER_ROLES } = require('../models/ProjectMember');
const { PROJECT_PRIORITIES, PROJECT_STATUSES } = require('../models/Project');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
const color = z.string().regex(/^#[0-9a-f]{6}$/i, 'Use a six-digit hex color');
const optionalDate = z.iso.datetime({ offset: true }).nullable().optional();

const projectIdParams = z.object({ projectId: objectId });
const projectMemberParams = z.object({ projectId: objectId, userId: objectId });

const projectFields = {
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(5000).optional().default(''),
  workspaceId: objectId,
  clientId: objectId.nullable().optional(),
  managerId: objectId,
  startDate: optionalDate,
  dueDate: optionalDate,
  priority: z.enum(PROJECT_PRIORITIES).default('medium'),
  status: z.enum(PROJECT_STATUSES).default('planning'),
  color: color.optional().default('#177245'),
  icon: z.string().trim().min(1).max(40).optional().default('folder-kanban'),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
  visibility: z.enum(['workspace', 'members']).optional().default('workspace'),
  memberIds: z.array(objectId).max(100).optional().default([]),
};

function datesAreValid(body) {
  if (!body.startDate || !body.dueDate) return true;
  return new Date(body.dueDate) >= new Date(body.startDate);
}

const createProjectBody = z
  .object(projectFields)
  .strict()
  .refine(datesAreValid, { message: 'Due date cannot be before start date', path: ['dueDate'] });

const updateProjectBody = z
  .object({
    name: projectFields.name.optional(),
    description: z.string().trim().max(5000).optional(),
    clientId: objectId.nullable().optional(),
    managerId: objectId.optional(),
    startDate: optionalDate,
    dueDate: optionalDate,
    priority: z.enum(PROJECT_PRIORITIES).optional(),
    status: z.enum(PROJECT_STATUSES).optional(),
    color: color.optional(),
    icon: z.string().trim().min(1).max(40).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
    visibility: z.enum(['workspace', 'members']).optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, 'At least one project field is required')
  .refine(datesAreValid, { message: 'Due date cannot be before start date', path: ['dueDate'] });

const listProjectsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(120).optional(),
  workspaceId: objectId.optional(),
  managerId: objectId.optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  priority: z.enum(PROJECT_PRIORITIES).optional(),
});

const addProjectMemberBody = z
  .object({
    userId: objectId,
    role: z.enum(PROJECT_MEMBER_ROLES).default('member'),
  })
  .strict();

const updateProjectMemberBody = z.object({ role: z.enum(PROJECT_MEMBER_ROLES) }).strict();

module.exports = {
  addProjectMemberBody,
  createProjectBody,
  listProjectsQuery,
  projectIdParams,
  projectMemberParams,
  updateProjectBody,
  updateProjectMemberBody,
};
