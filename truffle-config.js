const HDWalletProvider = require('truffle-hdwallet-provider');
const config = require('./config');

const engine = (config.wallet) ?
  new HDWalletProvider(config.wallet.seed, config.rpcpath) : undefined;

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // Match any network id
    },
    ropsten: {
      provider: engine,
      network_id: 3,
      gas: 4600000,
      gasPrice: 20000000000,
    },
    rinkeby: {
      provider: engine,
      network_id: 4,
      gas: 6100000,
      gasPrice: 20000000000,
    },
  },
};
