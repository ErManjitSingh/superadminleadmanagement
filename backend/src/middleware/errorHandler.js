const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  if (err.code === 11000 || err.code === 11001) {
    statusCode = 409;
  }
  res.status(statusCode).json({
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = errorHandler;
