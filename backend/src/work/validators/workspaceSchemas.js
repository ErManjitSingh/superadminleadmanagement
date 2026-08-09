const { z } = require('zod');
const { WORKSPACE_MEMBER_ROLES } = require('../models/WorkspaceMember');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
const color = z.string().regex(/^#[0-9a-f]{6}$/i, 'Use a six-digit hex color');

const workspaceIdParams = z.object({ workspaceId: objectId });
const workspaceMemberParams = z.object({ workspaceId: objectId, userId: objectId });

const createWorkspaceBody = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).optional().default(''),
    color: color.optional().default('#177245'),
    icon: z.string().trim().min(1).max(40).optional().default('briefcase'),
    memberIds: z.array(objectId).max(100).optional().default([]),
  })
  .strict();

const updateWorkspaceBody = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().max(1000).optional(),
    color: color.optional(),
    icon: z.string().trim().min(1).max(40).optional(),
    status: z.enum(['active', 'archived']).optional(),
    settings: z
      .object({
        allowMemberTaskCreation: z.boolean().optional(),
        requireTaskApproval: z.boolean().optional(),
        defaultProjectVisibility: z.enum(['workspace', 'members']).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, 'At least one workspace field is required');

const listWorkspacesQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(120).optional(),
  status: z.enum(['active', 'archived']).optional(),
});

const addWorkspaceMemberBody = z
  .object({
    userId: objectId,
    role: z.enum(WORKSPACE_MEMBER_ROLES).default('member'),
  })
  .strict();

const updateWorkspaceMemberBody = z
  .object({ role: z.enum(WORKSPACE_MEMBER_ROLES) })
  .strict();

module.exports = {
  addWorkspaceMemberBody,
  createWorkspaceBody,
  listWorkspacesQuery,
  updateWorkspaceBody,
  updateWorkspaceMemberBody,
  workspaceIdParams,
  workspaceMemberParams,
};
