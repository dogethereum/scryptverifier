const SUBMISSION_GAS = 250000;
const CHALLENGE_GAS = 70000;
const SENDHASHES_GAS = 3400000;
const SENDREQUEST_GAS = 80000;
const SENDDATA_GAS = 3400000;

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

  termEvents() {} // eslint-disable-line class-methods-use-this

  sendSubmission(hash, data, address, userOptions) {
    const options = Object.assign({ gas: SUBMISSION_GAS }, userOptions);
    return this.scryptVerifier.submit(hash, data, address, options);
  }

  sendChallenge(hash, userOptions) {
    const options = Object.assign({ gas: CHALLENGE_GAS }, userOptions);
    return this.scryptVerifier.challenge(hash, options);
  }

  sendHashes(challengeId, start, hashes, userOptions) {
    const options = Object.assign({ gas: SENDHASHES_GAS }, userOptions);
    return this.scryptVerifier.sendHashes(challengeId, start, hashes, options);
  }

  sendRequest(challengeId, round, userOptions) {
    const options = Object.assign({ gas: SENDREQUEST_GAS }, userOptions);
    return this.scryptVerifier.request(challengeId, round, options);
  }

  sendRound(challengeId, round, data, extraData, userOptions) {
    const options = Object.assign({ gas: SENDDATA_GAS }, userOptions);
    return this.scryptVerifier.sendData(challengeId, round, data, extraData, options);
  }


  getSubmission(hash) {
    return this.scryptVerifier.submissions.call(hash);
  }

  getHashes(hash, start, length) {
    return this.scryptVerifier.getHashes.call(hash, start, length, 10);
  }


  onNewSubmission(submissionData) { // eslint-disable-line class-methods-use-this
    console.log(`BA: New submission: ${JSON.stringify(submissionData, null, '  ')}`);
  }

  onNewChallenge(challengeData) { // eslint-disable-line class-methods-use-this
    console.log(`BA: New challenge: ${JSON.stringify(challengeData, null, '  ')}`);
  }

  onNewRequest(requestData) { // eslint-disable-line class-methods-use-this
    console.log(`BA: New request: ${JSON.stringify(requestData, null, '  ')}`);
  }

  onNewDataHashes(dataHashes) { // eslint-disable-line class-methods-use-this
    console.log(`BA: New data hashes: ${JSON.stringify(dataHashes, null, '  ')}`);
  }

  onRoundVerified(roundResult) { // eslint-disable-line class-methods-use-this
    console.log(`BA: Round verified: ${JSON.stringify(roundResult, null, '  ')}`);
  }
}


module.exports = BaseAgent;
