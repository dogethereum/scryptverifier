const fs = require('fs');

const utils = require('./utils');

// const Contract = require('truffle-contract');
// const Web3 = require('web3');
// const makeScryptVerifier = require('./ScryptVerifier');

// const ScryptVerifierJson = require('../build/contracts/ScryptVerifier.json');
//
// const provider = new Web3.providers.HttpProvider('http://localhost:8545');
// const web3 = new Web3(provider);
//
// const ScryptVerifier = Contract(ScryptVerifierJson);
// ScryptVerifier.setProvider(provider);
// ScryptVerifier.defaults({
//   from: web3.eth.accounts[0],
//   gas: 4700000,
// });
// // ScryptTest.synchronization_timeout = 1000;
//
// let scryptVerifier;
//
// this.submitter = web3.eth.accounts[0];
// this.challenger = web3.eth.accounts[1];
// this.scryptVerifier = await ScryptVerifier.deployed();

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
    this.newBlockEvent = this.scryptVerifier.NewBlock();
    this.newBlockEvent.watch((err, result) => {
      try {
        if (!err) {
          this.onNewBlock(result);
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
    if (this.newBlockEvent) this.newBlockEvent.stopWatching();
    if (this.newDataHashesEvent) this.newDataHashesEvent.stopWatching();
  }

  async sendChallenge(blockHash, options) {
    const challengeTx = await this.scryptVerifier.challenge(blockHash, options);
    return utils.parseNewChallenge(challengeTx);
  }

  getBlock(blockHash) {
    return this.scryptVerifier.blocks.call(blockHash);
  }

  submitBlock(blockHash, blockHeader, address, options) {
    return this.scryptVerifier.submit(blockHash, blockHeader, address, options);
  }

  sendHashes(challengeId, start, hashes, options) {
    return this.scryptVerifier.sendHashes(challengeId, start, hashes, options);
  }

  async sendRequest(challengeId, round, options) {
    const requestTx = await this.scryptVerifier.request(challengeId, round, options);
    console.log(`SendRequest: ${JSON.stringify(requestTx, null, '  ')}`);
    return utils.parseNewRequest(requestTx);
  }

  sendRound(challengeId, round, data, extraData, options) {
    console.log(`${challengeId}, ${JSON.stringify(data, null, '  ')}`);
    return this.scryptVerifier.sendData(challengeId, 10, data, [], options);
  }

  onNewChallenge(challengeData) {
    console.log(`BA: New challenge: ${JSON.stringify(challengeData, null, '  ')}`);
  }

  onNewRequest(requestData) {
    console.log(`BA: New request: ${JSON.stringify(requestData, null, '  ')}`);
  }

  onNewBlock(blockData) {
    console.log(`BA: New block: ${JSON.stringify(blockData, null, '  ')}`);
  }

  onNewDataHashes(dataHashes) {
    console.log(`BA: New data hashes: ${JSON.stringify(dataHashes, null, '  ')}`);
  }

  onRoundVerified(roundResult) {
    console.log(`BA: New data hashes: ${JSON.stringify(roundResult, null, '  ')}`);
  }
}


module.exports = BaseAgent;
