const helmet = require('helmet');
const compression = require('compression');

function applySecurityMiddleware(app) {
  app.use(compression());
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );
}

module.exports = { applySecurityMiddleware };
