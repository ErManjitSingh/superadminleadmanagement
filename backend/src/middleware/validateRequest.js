const ApiError = require('../utils/apiError');

function formatIssues(issues) {
  return issues
    .map((issue) => {
      const field = issue.path?.length ? issue.path.join('.') : 'request';
      return `${field}: ${issue.message}`;
    })
    .join('; ');
}

function validateRequest(schemas = {}) {
  return (req, _res, next) => {
    for (const source of ['params', 'query', 'body']) {
      const schema = schemas[source];
      if (!schema) continue;
      const result = schema.safeParse(req[source]);
      if (!result.success) {
        return next(new ApiError(400, formatIssues(result.error.issues)));
      }
      req[source] = result.data;
    }
    next();
  };
}

module.exports = { validateRequest };
