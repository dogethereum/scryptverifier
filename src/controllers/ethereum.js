const Web3 = require('web3');
const Contract = require('truffle-contract');
const ProviderEngine = require('web3-provider-engine');
const FiltersSubprovider = require('web3-provider-engine/subproviders/filters.js');
const Web3Subprovider = require('web3-provider-engine/subproviders/web3.js');
const config = require('../../config');
const ScryptVerifierJson = require('../../build/contracts/ScryptVerifier.json');

const engine = new ProviderEngine();

engine.addProvider(new FiltersSubprovider());
engine.addProvider(new Web3Subprovider(new Web3.providers.HttpProvider(config.rpcpath)));

engine.start();

const web3 = new Web3(engine);

function getHttpProvider() {
  return engine;
}

function getScryptVerifier(options) {
  const ScryptVerifier = Contract(ScryptVerifierJson);
  ScryptVerifier.setProvider(engine);
  ScryptVerifier.defaults(options || {});
  return ScryptVerifier.deployed();
}

function getWeb3() {
  return web3;
}

module.exports = {
  getHttpProvider,
  getScryptVerifier,
  getWeb3,
};
