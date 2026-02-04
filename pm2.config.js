module.exports = {
  apps: [
    {
      name: 'abb-app',
      script: 'dist/app.js',
      node_args: '-r dotenv/config',
    },
  ],
};
