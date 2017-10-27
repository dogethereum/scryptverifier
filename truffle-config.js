const Web3 = require('web3');
const ProviderEngine = require('web3-provider-engine');
const ethereumWallet = require('ethereumjs-wallet');
const FiltersSubprovider = require('web3-provider-engine/subproviders/filters.js');
const WalletSubprovider = require('web3-provider-engine/subproviders/wallet.js');
const Web3Subprovider = require('web3-provider-engine/subproviders/web3.js');
const config = require('./config');

const engine = new ProviderEngine();

if (config.wallet) {
  const wallet = ethereumWallet.fromV3(config.wallet, config.pass);
  engine.addProvider(new WalletSubprovider(wallet, {}));
}

engine.addProvider(new FiltersSubprovider());
engine.addProvider(new Web3Subprovider(new Web3.providers.HttpProvider(config.rpcpath)));

engine.start();

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
