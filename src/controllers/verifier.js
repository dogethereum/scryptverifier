const Contract = require('truffle-contract');
const ethereum = require('./ethereum');
const notification = require('./notifications');
const logger = require('./logger');
const ScryptVerifierJson = require('../../build/contracts/ScryptVerifier');

function registerEvent(event, callback) {
  event.watch((err, result) => {
    try {
      if (!err) {
        callback(result);
      } else {
        logger.error(`Error: ${err} - ${err.stack}`);
      }
    } catch (ex) {
      logger.error(`Error: ${ex} - ${ex.stack}`);
    }
  });
}

function createScryptVerifier({ defaults, wallet } = {}) {
  const ScryptVerifier = Contract(ScryptVerifierJson);
  ScryptVerifier.setProvider(ethereum.createProvider({ wallet }));
  ScryptVerifier.defaults(defaults);
  return ScryptVerifier.deployed();
}

class VerifierController {
  constructor(options) {
    this.verifier = createScryptVerifier(options);
  }

  static async installEventListener(options) {
    const verifier = await createScryptVerifier(options);
    registerEvent(verifier.NewSubmission(), (result) => {
      const { hash, input } = result.args;
      notification.sendNotification('newSubmission', hash, input);
    });
  }

  async getScryptVerifier() {
    const verifier = await this.verifier;
    return verifier;
  }

  async getSubmission(hash) {
    const verifier = await this.verifier;
    return verifier.getSubmission(hash).then(result => ({
      hash: result[0],
      input: result[1],
      submitter: result[2],
      timestamp: result[3],
    }));
  }

  async getNumSubmissions() {
    const verifier = await this.verifier;
    return verifier.getNumSubmissions()
      .then(result => result.toNumber());
  }

  async getSubmissionsHashes(start, count) {
    const verifier = await this.verifier;
    return verifier.getSubmissionsHashes(start, count);
  }
}

module.exports = VerifierController;
