const fs = require('fs');
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
    this.loadData();
    this.initEvents();
  }

  initEvents() {
    this.newChallengeEvent = this.scryptVerifier.NewChallenge();
    this.newChallengeEvent.watch((err, result) => {
      try {
        if (!err) {
          this.newChallenge(result);
        }
      } catch (ex) {
        console.log(`${ex}`);
      }
    });
    this.newRequestEvent = this.scryptVerifier.NewRequest();
    this.newRequestEvent.watch((err, result) => {
      try {
        if (!err) {
          this.newRequest(result);
        }
      } catch (ex) {
        console.log(`${ex}`);
      }
    });
    this.newBlockEvent = this.scryptVerifier.NewBlock();
    this.newBlockEvent.watch((err, result) => {
      try {
        if (!err) {
          this.newBlock(result);
        }
      } catch (ex) {
        console.log(`${ex}`);
      }
    });
    this.newDataHashesEvent = this.scryptVerifier.NewDataHashes();
    this.newDataHashesEvent.watch((err, result) => {
      try {
        if (!err) {
          this.newDataHashes(result);
        }
      } catch (ex) {
        console.log(`${ex}`);
      }
    });
  }

  termEvents() {
    this.newChallengeEvent.stopWatching();
    this.newRequestEvent.stopWatching();
    this.newBlockEvent.stopWatching();
    this.newDataHashesEvent.stopWatching();
  }

  loadData() {
    this.scryptRun = JSON.parse(fs.readFileSync('./run.json', 'utf8'));
    this.blockHeader = `0x${this.scryptRun[0].input}`;
    this.blockHash = `0x${this.scryptRun[2049].output}`;
  }

  async challenge(blockHash, options) {
    const challengeTx = await this.scryptVerifier.challenge(blockHash, options);
    const challengeId = challengeTx.logs.filter(lg => lg.event === 'NewChallenge')[0].args.challengeId;
    return challengeId;
  }

  getBlock(blockHash) {
    return this.scryptVerifier.blocks.call(blockHash);
  }

  submitBlock(blockHash, blockHeader, blockNumber, options) {
    return this.scryptVerifier.submit(blockHash, blockHeader, blockNumber, options);
  }

  sendHashes(challengeId, start, hashes, options) {
    return this.scryptVerifier.sendHashes(challengeId, start, hashes, options);
  }

  requestInput(challengeId, round, options) {
    return this.scryptVerifier.request(challengeId, round, options);
  }

  sendRound(challengeId, round, data, extraData, options) {
    console.log(`${challengeId}, ${JSON.stringify(data, null, '  ')}`);
    return this.scryptVerifier.sendData(challengeId, 10, data, [], options);
  }

  newChallenge(challengeData) {
    console.log(`BA: New challenge: ${JSON.stringify(challengeData, null, '  ')}`);
  }

  newRequest(requestData) {
    console.log(`BA: New request: ${JSON.stringify(requestData, null, '  ')}`);
  }

  newBlock(blockData) {
    console.log(`BA: New block: ${JSON.stringify(blockData, null, '  ')}`);
  }

  newDataHashes(dataHashes) {
    console.log(`BA: New data hashes: ${JSON.stringify(dataHashes, null, '  ')}`);
  }
}


module.exports = BaseAgent;
