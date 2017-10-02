const Contract = require('truffle-contract');
const Web3 = require('web3');
const ScryptVerifierJson = require('../build/contracts/ScryptVerifier.json');


function makeScryptVerifier(provider) {
  const web3 = new Web3(provider);
  ScryptVerifier = Contract(ScryptVerifierJson);
  ScryptVerifier.setProvider(provider);
  ScryptVerifier.defaults({
    from: web3.eth.accounts[0],
    gas: 4700000,
  });
  // ScryptTest.synchronization_timeout = 1000;
  return ScryptVerifier.deployed();
}


module.exports = makeScryptVerifier;
