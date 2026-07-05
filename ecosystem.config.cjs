/**
 * Local PM2 config (relative paths).
 * On VPS use: deploy/ecosystem.ihd.config.cjs
 */
module.exports = {
  apps: [
    {
      name: 'ihd-crm-api',
      cwd: './backend',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
