"use strict";
module.exports = {
  apps: [
    {
      name: "sms-service",
      script: "./index.js",
      instances: 2,
      env: {
        NODE_ENV: "test",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
