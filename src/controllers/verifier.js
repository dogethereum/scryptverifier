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

function getNewChallenges(NewChallenge) {
  return new Promise((resolve, reject) => {
    NewChallenge.get((err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result.map(x => ({
        name: x.event,
        hash: x.args.hash,
        challengeId: x.args.challengeId,
        txHash: x.transactionHash,
      })));
    });
  });
}

function fillTxInfo(web3, event) {
  return new Promise((resolve, reject) => {
    web3.eth.getTransaction(event.txHash, (err, tx) => {
      if (err) {
        reject(err);
        return;
      }
      web3.eth.getBlock(tx.blockHash, (err2, block) => {
        if (err2) {
          reject(err2);
          return;
        }
        resolve({ ...event, sender: tx.from, timestamp: block.timestamp });
      });
    });
  });
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

  async getSubmissionEvents(hash) {
    const verifier = await this.verifier;
    const web3 = verifier.constructor.web3;
    const NewChallenge = verifier.NewChallenge({ hash }, { fromBlock: 0, toBlock: 'latest' });
    const events = await getNewChallenges(NewChallenge);
    return Promise.all(events.map(event => fillTxInfo(web3, event)));
  }
}

module.exports = VerifierController;
