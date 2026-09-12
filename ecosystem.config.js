module.exports = {
  apps: [
    {
      name: "site-herve-api",
      script: "./dist/index.js",
      instances: 2,
      exec_mode: "cluster",
      env_production: {
        NODE_ENV: "production",
      },
      error_file: "/var/log/site-herve/pm2-error.log",
      out_file: "/var/log/site-herve/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      max_memory_restart: "500M",
      autorestart: true,
      watch: false,
    },
  ],
};
