const fs = require('fs');

const utils = require('./utils');


class BaseAgent {
  constructor(scryptVerifier) {
    this.scryptVerifier = scryptVerifier;
    this.initEvents();
  }

  stop() {
    this.termEvents();
  }

  initEvents() {
    this.newChallengeEvent = this.scryptVerifier.NewChallenge();
    this.newChallengeEvent.watch((err, result) => {
      try {
        if (!err) {
          this.onNewChallenge(result);
        } else {
          console.log(`Error: ${err} ${err.stack}`);
        }
      } catch (ex) {
        console.log(`Error: ${ex} ${ex.stack}`);
      }
    });
    this.newRequestEvent = this.scryptVerifier.NewRequest();
    this.newRequestEvent.watch((err, result) => {
      try {
        if (!err) {
          this.onNewRequest(result);
        } else {
          console.log(`Error: ${err} ${err.stack}`);
        }
      } catch (ex) {
        console.log(`Error: ${ex} ${ex.stack}`);
      }
    });
    this.newSubmissionEvent = this.scryptVerifier.NewSubmission();
    this.newSubmissionEvent.watch((err, result) => {
      try {
        if (!err) {
          this.onNewSubmission(result);
        } else {
          console.log(`Error: ${err} ${err.stack}`);
        }
      } catch (ex) {
        console.log(`Error: ${ex} ${ex.stack}`);
      }
    });
    this.newDataHashesEvent = this.scryptVerifier.NewDataHashes();
    this.newDataHashesEvent.watch((err, result) => {
      try {
        if (!err) {
          this.onNewDataHashes(result);
        } else {
          console.log(`Error: ${err} ${err.stack}`);
        }
      } catch (ex) {
        console.log(`Error: ${ex} ${ex.stack}`);
      }
    });
    this.roundVerifiedEvent = this.scryptVerifier.RoundVerified();
    this.roundVerifiedEvent.watch((err, result) => {
      try {
        if (!err) {
          this.onRoundVerified(result);
        } else {
          console.log(`Error: ${err} ${err.stack}`);
        }
      } catch (ex) {
        console.log(`Error: ${ex} ${ex.stack}`);
      }
    });
  }

  termEvents() {
    if (this.newChallengeEvent) this.newChallengeEvent.stopWatching();
    if (this.newRequestEvent) this.newRequestEvent.stopWatching();
    if (this.newSubmissionEvent) this.newSubmissionEvent.stopWatching();
    if (this.newDataHashesEvent) this.newDataHashesEvent.stopWatching();
  }

  async sendChallenge(hash, options) {
    const challengeTx = await this.scryptVerifier.challenge(hash, options);
    return utils.parseNewChallenge(challengeTx);
  }

  getSubmission(hash) {
    return this.scryptVerifier.submissions.call(hash);
  }

  sendSubmission(hash, data, address, options) {
    return this.scryptVerifier.submit(hash, data, address, options);
  }

  sendHashes(challengeId, start, hashes, options) {
    return this.scryptVerifier.sendHashes(challengeId, start, hashes, options);
  }

  getHashes(hash, start, length) {
    return this.scryptVerifier.getHashes.call(hash, start, length, 10);
  }

  sendRequest(challengeId, round, options) {
    return this.scryptVerifier.request(challengeId, round, options);
  }

  sendRound(challengeId, round, data, extraData, options) {
    return this.scryptVerifier.sendData(challengeId, round, data, extraData, options);
  }

  onNewSubmission(submissionData) {
    console.log(`BA: New submission: ${JSON.stringify(submissionData, null, '  ')}`);
  }

  onNewChallenge(challengeData) {
    console.log(`BA: New challenge: ${JSON.stringify(challengeData, null, '  ')}`);
  }

  onNewRequest(requestData) {
    console.log(`BA: New request: ${JSON.stringify(requestData, null, '  ')}`);
  }

  onNewDataHashes(dataHashes) {
    console.log(`BA: New data hashes: ${JSON.stringify(dataHashes, null, '  ')}`);
  }

  onRoundVerified(roundResult) {
    console.log(`BA: Round verified: ${JSON.stringify(roundResult, null, '  ')}`);
  }
}


module.exports = BaseAgent;
