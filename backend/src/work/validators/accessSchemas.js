const { z } = require('zod');
const { WORK_DISCIPLINES, WORK_ROLES } = require('../config/access');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');

const userIdParams = z.object({
  userId: objectId,
});

const listUsersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(120).optional(),
  role: z.enum(WORK_ROLES).optional(),
  discipline: z.enum(WORK_DISCIPLINES).optional(),
  status: z.enum(['active', 'disabled', 'invited']).optional(),
  enabled: z.enum(['true', 'false']).optional(),
});

const updateAccessBody = z
  .object({
    enabled: z.boolean().optional(),
    role: z.enum(WORK_ROLES).optional(),
    disciplines: z.array(z.enum(WORK_DISCIPLINES)).max(WORK_DISCIPLINES.length).optional(),
    jobTitle: z.string().trim().max(100).optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, 'At least one access field is required');

const createWorkUserBody = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().max(254),
    phone: z.string().trim().max(30).optional().default(''),
    role: z.enum(WORK_ROLES).default('member'),
    disciplines: z.array(z.enum(WORK_DISCIPLINES)).max(WORK_DISCIPLINES.length).default([]),
    jobTitle: z.string().trim().max(100).optional().default(''),
  })
  .strict();

module.exports = {
  createWorkUserBody,
  userIdParams,
  listUsersQuery,
  updateAccessBody,
};
