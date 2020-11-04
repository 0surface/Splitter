module.exports = {
  build: "./node_modules/.bin/webpack-cli --mode development",
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
    },
    net42: {
      host: "127.0.0.1",
      port: 8545,
      network_id: 42,
      gas: 500000,
    },
  },
};
