const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  if (err.code === 11000 || err.code === 11001) {
    statusCode = 409;
  }
  const duplicateLeadId = (err.code === 11000 || err.code === 11001)
    && /leadId/i.test(err.message || '');
  res.status(statusCode).json({
    message: duplicateLeadId
      ? 'Could not create lead because the next lead ID was already used. Please try again.'
      : (err.message || 'Server Error'),
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = errorHandler;
