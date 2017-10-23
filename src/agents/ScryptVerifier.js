const Contract = require('truffle-contract');
const ScryptVerifierJson = require('../build/contracts/ScryptVerifier.json');


function makeScryptVerifier(provider, options) {
  ScryptVerifier = Contract(ScryptVerifierJson);
  ScryptVerifier.setProvider(provider);
  ScryptVerifier.defaults(options || {});
  // ScryptTest.synchronization_timeout = 1000;
  return ScryptVerifier.deployed();
}


module.exports = makeScryptVerifier;
