module.exports = {
  apps: [
    {
      name: 'testing-unotrips-api',
      script: 'src/server.js',
      cwd: '/var/www/testing-unotrips-crm/backend',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: '/var/www/testing-unotrips-crm/logs/pm2-error.log',
      out_file: '/var/www/testing-unotrips-crm/logs/pm2-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
