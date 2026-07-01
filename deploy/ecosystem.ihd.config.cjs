module.exports = {
  apps: [
    {
      name: 'ihd-crm-api',
      script: 'src/server.js',
      cwd: '/var/www/leadmanagement/backend',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        REDIS_URL: 'redis://127.0.0.1:6379',
      },
      error_file: '/var/www/leadmanagement/logs/pm2-error.log',
      out_file: '/var/www/leadmanagement/logs/pm2-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
