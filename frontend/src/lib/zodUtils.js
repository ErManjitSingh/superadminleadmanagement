/** Zod v4 uses `issues`; v3 used `errors` on ZodError */
export function getZodIssues(zodError) {
  if (!zodError) return [];
  return zodError.issues ?? zodError.errors ?? [];
}

/** User-friendly message (Zod v4 default "Invalid input: ..." is too vague) */
export function formatZodIssueMessage(issue) {
  if (!issue) return 'Please check this field';
  const msg = issue.message || '';

  if (msg && !msg.startsWith('Invalid input')) return msg;

  if (issue.code === 'invalid_type' && issue.expected === 'number') {
    return 'Please enter a valid number';
  }
  if (issue.code === 'invalid_format' && issue.format === 'email') {
    return 'Invalid email address';
  }
  if (issue.code === 'too_small' && typeof issue.minimum === 'number') {
    return msg || `Minimum value is ${issue.minimum}`;
  }

  return msg.replace(/^Invalid input:\s*/i, '') || 'Please check this field';
}

export function pickFields(values, fields) {
  return Object.fromEntries(fields.map((f) => [f, values[f]]));
}
