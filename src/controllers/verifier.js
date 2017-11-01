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

function formatDataHashes(logDataHash) {
  return {
    name: logDataHash.event,
    hash: logDataHash.args.hash,
    challengeId: logDataHash.args.challengeId,
    start: logDataHash.args.start,
    length: logDataHash.args.length,
    txHash: logDataHash.transactionHash,
    blockHash: logDataHash.blockHash,
  };
}

function formatRequest(logRequest) {
  return {
    name: logRequest.event,
    hash: logRequest.args.hash,
    challengeId: logRequest.args.challengeId,
    round: logRequest.args.round,
    txHash: logRequest.transactionHash,
    blockHash: logRequest.blockHash,
  };
}

function formatRoundVerified(logRoundVerified) {
  return {
    name: logRoundVerified.event,
    hash: logRoundVerified.args.hash,
    challengeId: logRoundVerified.args.challengeId,
    round: logRoundVerified.args.round,
    txHash: logRoundVerified.transactionHash,
    blockHash: logRoundVerified.blockHash,
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
    try {
      const verifier = await createScryptVerifier(options);
      registerEvent(verifier.NewSubmission(), (result) => {
        const { hash, input } = result.args;
        notification.sendNotification('newSubmission', hash, input);
      });
      registerEvent(verifier.NewChallenge(), (result) => {
        const { hash, challengeId } = result.args;
        notification.sendNotification('newChallenge', hash, challengeId);
      });
      registerEvent(verifier.NewDataHashes(), (result) => {
        const { hash, challengeId } = result.args;
        notification.sendNotification('newDataHashes', hash, challengeId);
      });
      registerEvent(verifier.NewRequest(), (result) => {
        const { hash, challengeId, round } = result.args;
        notification.sendNotification('newRequest', hash, challengeId, round);
      });
      registerEvent(verifier.RoundVerified(), (result) => {
        const { hash, challengeId, round } = result.args;
        notification.sendNotification('roundVerified', hash, challengeId, round);
      });
    } catch (ex) {
      logger.error(`${ex.stack}`);
    }
  }

  async getScryptVerifier() {
    try {
      const verifier = await this.verifier;
      return verifier;
    } catch (ex) {
      logger.error(`${ex.stack}`);
    }
    return null;
  }

  async getSubmission(hash) {
    try {
      const verifier = await this.verifier;
      return verifier.getSubmission(hash).then(result => ({
        hash: result[0],
        input: result[1],
        submitter: result[2],
        timestamp: result[3],
      }));
    } catch (ex) {
      logger.error(`${ex.stack}`);
      return {};
    }
  }

  async getNumSubmissions() {
    try {
      const verifier = await this.verifier;
      return verifier.getNumSubmissions()
        .then(result => result.toNumber());
    } catch (ex) {
      logger.error(`${ex.stack}`);
      return 0;
    }
  }

  async getSubmissionsHashes(start, count) {
    try {
      const verifier = await this.verifier;
      return verifier.getSubmissionsHashes(start, count);
    } catch (ex) {
      logger.error(`${ex.stack}`);
      return [];
    }
  }

  async getNewChallenges(hash, fromBlock, toBlock) {
    try {
      const verifier = await this.verifier;
      const NewChallenge = verifier.NewChallenge({ hash }, { fromBlock, toBlock });
      return getEvents(NewChallenge)
        .then(challenges => challenges.map(formatChallenge));
    } catch (ex) {
      logger.error(`${ex.stack}`);
      return [];
    }
  }

  async getNewSubmission(hash, fromBlock, toBlock) {
    try {
      const verifier = await this.verifier;
      const NewSubmission = verifier.NewSubmission({ hash }, { fromBlock, toBlock });
      return getEvents(NewSubmission)
        .then(submissions => submissions.map(formatSubmission));
    } catch (ex) {
      logger.error(`${ex.stack}`);
      return [];
    }
  }

  async getNewDataHashes(hash, fromBlock, toBlock) {
    try {
      const verifier = await this.verifier;
      const NewDataHashes = verifier.NewDataHashes({ hash }, { fromBlock, toBlock });
      return getEvents(NewDataHashes)
        .then(dataHashes => dataHashes.map(formatDataHashes));
    } catch (ex) {
      logger.error(`${ex.stack}`);
      return [];
    }
  }

  async getNewRequest(hash, fromBlock, toBlock) {
    try {
      const verifier = await this.verifier;
      const NewRequest = verifier.NewRequest({ hash }, { fromBlock, toBlock });
      return getEvents(NewRequest)
        .then(requests => requests.map(formatRequest));
    } catch (ex) {
      logger.error(`${ex.stack}`);
      return [];
    }
  }

  async getRoundVerified(hash, fromBlock, toBlock) {
    try {
      const verifier = await this.verifier;
      const RoundVerified = verifier.RoundVerified({ hash }, { fromBlock, toBlock });
      return getEvents(RoundVerified)
        .then(verifications => verifications.map(formatRoundVerified));
    } catch (ex) {
      logger.error(`${ex.stack}`);
      return [];
    }
  }

  async getSubmissionEvents(hash) {
    try {
      const verifier = await this.verifier;
      const web3 = verifier.constructor.web3;
      const events = await Promise.all([
        this.getNewSubmission(hash, 0, 'latest'),
        this.getNewChallenges(hash, 0, 'latest'),
        this.getNewDataHashes(hash, 0, 'latest'),
        this.getNewRequest(hash, 0, 'latest'),
        this.getRoundVerified(hash, 0, 'latest'),
      ]);
      return Promise.map(_.flatten(events),
        event => fillTxInfo(web3, event),
        { concurrency: WEB3_CONCURRENCY });
    } catch (ex) {
      logger.error(`${ex.stack}`);
      return [];
    }
  }
}

module.exports = VerifierController;
