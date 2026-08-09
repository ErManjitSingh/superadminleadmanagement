const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
const taskIdParams = z.object({ taskId: objectId });
const approvalIdParams = z.object({ approvalId: objectId });
const commentParams = z.object({ taskId: objectId, commentId: objectId });
const attachmentParams = z.object({ taskId: objectId, attachmentId: objectId });

const submitApprovalBody = z.object({
  note: z.string().trim().max(5000).optional().default(''),
}).strict();

const reviewApprovalBody = z.object({
  decision: z.enum(['approved', 'rejected']),
  note: z.string().trim().max(5000).optional().default(''),
}).strict().superRefine((body, context) => {
  if (body.decision === 'rejected' && body.note.length < 2) {
    context.addIssue({
      code: 'custom',
      path: ['note'],
      message: 'A rejection reason is required',
    });
  }
});

const listApprovalsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
  projectId: objectId.optional(),
  submittedBy: objectId.optional(),
  search: z.string().trim().max(200).optional(),
});

const commentBody = z.object({
  body: z.string().trim().min(1).max(10000),
  parentCommentId: objectId.nullable().optional(),
  mentionIds: z.array(objectId).max(50).optional().default([]),
}).strict();

const updateCommentBody = z.object({
  body: z.string().trim().min(1).max(10000),
  mentionIds: z.array(objectId).max(50).optional().default([]),
}).strict();

const listCommentsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(100),
});

const listActivityQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

module.exports = {
  approvalIdParams,
  attachmentParams,
  commentBody,
  commentParams,
  listActivityQuery,
  listApprovalsQuery,
  listCommentsQuery,
  reviewApprovalBody,
  submitApprovalBody,
  taskIdParams,
  updateCommentBody,
};
