// PM2 process config — keeps the Next.js server alive & restarts on reboot.
// Usage on the VPS:
//   pm2 start ecosystem.config.js
//   pm2 save && pm2 startup
module.exports = {
  apps: [
    {
      name: "favicon-generator",
      cwd: "/var/www/favicon-generator",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      autorestart: true,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        // Prisma reads DATABASE_URL relative to prisma/schema.prisma → prisma/factory.db
        DATABASE_URL: "file:./factory.db",
      },
    },
  ],
};
