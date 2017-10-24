const Web3 = require('web3');
const Contract = require('truffle-contract');
const config = require('../config');
const ScryptVerifierJson = require('../../build/contracts/ScryptVerifier.json');

const provider = new Web3.providers.HttpProvider(config.rpcpath);
const web3 = new Web3(provider);

function getHttpProvider() {
  return provider;
}

function getScryptVerifier(options) {
  const ScryptVerifier = Contract(ScryptVerifierJson);
  ScryptVerifier.setProvider(provider);
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
