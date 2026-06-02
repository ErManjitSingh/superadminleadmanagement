/**
 * Local / generic PM2 config (relative paths).
 * On VPS use: deploy/ecosystem.config.cjs (absolute paths).
 */
module.exports = {
  apps: [
    {
      name: 'testing-unotrips-api',
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
