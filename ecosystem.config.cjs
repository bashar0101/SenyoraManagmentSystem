module.exports = {
  apps: [
    {
      name: 'senyora-backend',
      script: 'src/index.js',
      cwd: '/var/www/senyora/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
