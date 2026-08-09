const { z } = require('zod');
const {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
} = require('../models/Task');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
const optionalDate = z.iso.datetime({ offset: true }).nullable().optional();
const tags = z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]);
const assigneeIds = z.array(objectId).max(20).optional().default([]);

function datesAreValid(body) {
  if (!body.startDate || !body.dueDate) return true;
  return new Date(body.dueDate) >= new Date(body.startDate);
}

const issueDetails = z.object({
  stepsToReproduce: z.string().trim().max(10000).optional().default(''),
  expectedResult: z.string().trim().max(5000).optional().default(''),
  actualResult: z.string().trim().max(5000).optional().default(''),
  environment: z.string().trim().max(500).optional().default(''),
}).strict();

const createTaskBody = z.object({
  projectId: objectId,
  type: z.enum(TASK_TYPES).optional().default('task'),
  title: z.string().trim().min(2).max(300),
  description: z.string().trim().max(20000).optional().default(''),
  assigneeIds,
  priority: z.enum(TASK_PRIORITIES).optional().default('medium'),
  status: z.enum(TASK_STATUSES).optional().default('backlog'),
  startDate: optionalDate,
  dueDate: optionalDate,
  estimatedHours: z.coerce.number().min(0).max(100000).optional().default(0),
  paymentAmount: z.coerce.number().min(0).max(100000000).optional().default(0),
  tags,
  issueDetails: issueDetails.optional(),
}).strict().refine(datesAreValid, {
  message: 'Due date cannot be before start date',
  path: ['dueDate'],
});

const updateTaskBody = z.object({
  type: z.enum(TASK_TYPES).optional(),
  title: z.string().trim().min(2).max(300).optional(),
  description: z.string().trim().max(20000).optional(),
  assigneeIds: z.array(objectId).max(20).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  startDate: optionalDate,
  dueDate: optionalDate,
  estimatedHours: z.coerce.number().min(0).max(100000).optional(),
  actualHours: z.coerce.number().min(0).max(100000).optional(),
  paymentAmount: z.coerce.number().min(0).max(100000000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  issueDetails: issueDetails.partial().optional(),
}).strict()
  .refine((body) => Object.keys(body).length > 0, 'At least one task field is required')
  .refine(datesAreValid, {
    message: 'Due date cannot be before start date',
    path: ['dueDate'],
  });

const listTasksQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().max(200).optional(),
  projectId: objectId.optional(),
  workspaceId: objectId.optional(),
  assigneeId: objectId.optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  type: z.enum(TASK_TYPES).optional(),
  due: z.enum(['overdue', 'today', 'tomorrow', 'week']).optional(),
  mine: z.enum(['true', 'false']).optional(),
});

const boardQuery = z.object({ projectId: objectId });
const taskIdParams = z.object({ taskId: objectId });
const subTaskParams = z.object({ taskId: objectId, subTaskId: objectId });

const moveTaskBody = z.object({
  status: z.enum(TASK_STATUSES),
  order: z.coerce.number().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
}).strict();

const createSubTaskBody = z.object({
  title: z.string().trim().min(1).max(300),
  assigneeId: objectId.nullable().optional(),
  dueDate: optionalDate,
}).strict();

const updateSubTaskBody = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  completed: z.boolean().optional(),
  assigneeId: objectId.nullable().optional(),
  dueDate: optionalDate,
  order: z.coerce.number().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
}).strict().refine((body) => Object.keys(body).length > 0, 'At least one subtask field is required');

module.exports = {
  boardQuery,
  createSubTaskBody,
  createTaskBody,
  listTasksQuery,
  moveTaskBody,
  subTaskParams,
  taskIdParams,
  updateSubTaskBody,
  updateTaskBody,
};
