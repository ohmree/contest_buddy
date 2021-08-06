module.exports = {
  apps: [
    {
      name: "Bot",
      script: "src/index.ts",
      interpreter: "node",
      interpreter_args: "--loader=ts-node/esm --experimental-specifier-resolution=node",
      watch: ".",
      source_map_support: true,
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      }
    }
  ],
  deploy: {
    production: {
      "user": "SSH_USERNAME",
      "host": "SSH_HOSTMACHINE",
      "ref": "origin/master",
      "repo": "GIT_REPOSITORY",
      "path": "DESTINATION_PATH",
      "pre-deploy-local": "",
      "post-deploy": "pnpm install && pm2 reload ecosystem.config.json --env production",
      "pre-setup": ""
    }
  }
}
