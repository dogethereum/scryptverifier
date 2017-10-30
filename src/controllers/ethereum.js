const Web3 = require('web3');
const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');
const ProviderEngine = require('web3-provider-engine');
const FiltersSubprovider = require('web3-provider-engine/subproviders/filters.js');
const WalletSubprovider = require('web3-provider-engine/subproviders/wallet.js');
const Web3Subprovider = require('web3-provider-engine/subproviders/web3.js');
const config = require('../../config');

function createWalletSubProvider({ seed }) {
  const mnemonic = seed;
  const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
  const path = "m/44'/60'/0'/0/0";
  const wallet = hdwallet.derivePath(path).getWallet();
  return new WalletSubprovider(wallet, {});
}

function createProvider({ wallet, rpcpath }) {
  const engine = new ProviderEngine();

  if (wallet) {
    engine.addProvider(createWalletSubProvider(wallet));
  }

  engine.addProvider(new FiltersSubprovider());
  engine.addProvider(
    new Web3Subprovider(new Web3.providers.HttpProvider(rpcpath || config.rpcpath)));

  engine.start();

  return engine;
}

function getWeb3({ wallet, rpcpath }) {
  const options = {
    wallet,
    rpcpath: rpcpath || config.rpcpath,
  };
  const provider = createProvider(options);
  return new Web3(provider);
}

module.exports = {
  createProvider,
  createWalletSubProvider,
  getWeb3,
};
