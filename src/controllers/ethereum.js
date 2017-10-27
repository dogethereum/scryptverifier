const Web3 = require('web3');
const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');
const Contract = require('truffle-contract');
const ProviderEngine = require('web3-provider-engine');
const FiltersSubprovider = require('web3-provider-engine/subproviders/filters.js');
const WalletSubprovider = require('web3-provider-engine/subproviders/wallet.js');
const Web3Subprovider = require('web3-provider-engine/subproviders/web3.js');
const config = require('../../config');
const ScryptVerifierJson = require('../../build/contracts/ScryptVerifier.json');

let defaultProvider;

function createProvider(options = {}) {
  const engine = new ProviderEngine();

  if (options.wallet) {
    const mnemonic = options.wallet.seed;
    const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
    const path = "m/44'/60'/0'/0/0";
    const wallet = hdwallet.derivePath(path).getWallet();
    engine.addProvider(new WalletSubprovider(wallet, {}));
  }

  engine.addProvider(new FiltersSubprovider());
  engine.addProvider(new Web3Subprovider(
    new Web3.providers.HttpProvider(options.rpcpath || config.rpcpath)));

  return engine;
}

function setDefaultProvider(provider) {
  defaultProvider = provider;
}

function getDefaultProvider() {
  return defaultProvider;
}

function getScryptVerifier(options = {}) {
  const ScryptVerifier = Contract(ScryptVerifierJson);
  if (options.provider) {
    ScryptVerifier.setProvider(options.provider);
  } else if (options.wallet) {
    const provider = createProvider(options);
    ScryptVerifier.setProvider(provider);
    provider.start();
  } else if (defaultProvider) {
    ScryptVerifier.setProvider(defaultProvider);
  } else {
    setDefaultProvider(createProvider());
    ScryptVerifier.setProvider(defaultProvider);
    defaultProvider.start();
  }
  ScryptVerifier.defaults(options || {});
  return ScryptVerifier.deployed();
}

module.exports = {
  createProvider,
  getDefaultProvider,
  setDefaultProvider,
  getScryptVerifier,
};
