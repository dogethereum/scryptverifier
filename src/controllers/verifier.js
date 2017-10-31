const Contract = require('truffle-contract');
const _ = require('lodash');
const Promise = require('bluebird');
const ethereum = require('./ethereum');
const notification = require('./notifications');
const logger = require('./logger');
const ScryptVerifierJson = require('../../build/contracts/ScryptVerifier');

const WEB3_CONCURRENCY = 50;

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

function getEvents(EventSource) {
  return new Promise((resolve, reject) => {
    EventSource.get((err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

function formatSubmission(logSubmission) {
  return {
    name: logSubmission.event,
    hash: logSubmission.args.hash,
    txHash: logSubmission.transactionHash,
    blockHash: logSubmission.blockHash,
  };
}

function formatChallenge(logChallenge) {
  return {
    name: logChallenge.event,
    hash: logChallenge.args.hash,
    challengeId: logChallenge.args.challengeId,
    txHash: logChallenge.transactionHash,
    blockHash: logChallenge.blockHash,
  };
}

function fillTxInfo(web3, event) {
  return new Promise((resolve, reject) => {
    web3.eth.getTransaction(event.txHash, (err, tx) => {
      if (err) {
        reject(err);
        return;
      }
      web3.eth.getBlock(event.blockHash, (err2, block) => {
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

  async getNewChallenges(hash, fromBlock, toBlock) {
    const verifier = await this.verifier;
    const NewChallenge = verifier.NewChallenge({ hash }, { fromBlock, toBlock });
    return getEvents(NewChallenge)
      .then(challenges => challenges.map(formatChallenge));
  }

  async getNewSubmission(hash, fromBlock, toBlock) {
    const verifier = await this.verifier;
    const NewSubmission = verifier.NewSubmission({ hash }, { fromBlock, toBlock });
    return getEvents(NewSubmission)
      .then(submissions => submissions.map(formatSubmission));
  }

  async getSubmissionEvents(hash) {
    const verifier = await this.verifier;
    const web3 = verifier.constructor.web3;
    const events = await Promise.all([
      this.getNewSubmission(hash, 0, 'latest'),
      this.getNewChallenges(hash, 0, 'latest'),
    ]);
    return Promise.map(_.flatten(events),
      event => fillTxInfo(web3, event),
      { concurrency: WEB3_CONCURRENCY });
  }
}

module.exports = VerifierController;
