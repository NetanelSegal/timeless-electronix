/** @type {import('pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: 'timeless-api',
      cwd: './server',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      // Back off instead of burning through max_restarts during a dependency
      // outage, which would otherwise leave the app stopped for good.
      exp_backoff_restart_delay: 1000,
      max_restarts: 50,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
