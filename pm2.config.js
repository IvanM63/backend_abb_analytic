module.exports = {
  apps: [
    {
      name: 'baseline-app',
      script: 'dist/app.js',
      node_args: '-r dotenv/config',
    },
  ],
};
