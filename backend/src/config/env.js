const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DEFAULT_MONGO_URI = 'mongodb://127.0.0.1:27017/testing_unotrips_crm';

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || DEFAULT_MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  superAdminJwtSecret: process.env.SUPERADMIN_JWT_SECRET || process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,https://indiaholidaydestination.com,https://www.indiaholidaydestination.com,https://admin.indiaholidaydestination.com')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};
