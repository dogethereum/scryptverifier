// const fs = require('fs');
// const Contract = require('truffle-contract');
const Web3 = require('web3');
// const ScryptVerifierJson = require('../build/contracts/ScryptVerifier.json');
const makeScryptVerifier = require('./ScryptVerifier');
const BaseAgent = require('./BaseAgent');

const provider = new Web3.providers.HttpProvider('http://localhost:8545');
const web3 = new Web3(provider);

// const ScryptVerifier = Contract(ScryptVerifierJson);
// ScryptVerifier.setProvider(provider);
// ScryptVerifier.defaults({
//   from: web3.eth.accounts[0],
//   gas: 4700000,
// });
// ScryptTest.synchronization_timeout = 1000;

// const submitter = web3.eth.accounts[0];

// let scryptVerifier;
//
// function waitNewChallange(blockHash) {
//   return new Promise((resolve, reject) => {
//     const event = scryptVerifier.NewChallenge({ blockHash });
//     event.watch((err, result) => {
//       if (err) {
//         event.stopWatching();
//         reject(err);
//       } else {
//         event.stopWatching();
//         // console.log(`${JSON.stringify(result, null, '  ')}`);
//         resolve(result.args.challengeId);
//       }
//     });
//   });
// }
//
// function waitNewRequest(blockHash) {
//   return new Promise((resolve, reject) => {
//     const event = scryptVerifier.NewRequest({ blockHash });
//     event.watch((err, result) => {
//       if (err) {
//         event.stopWatching();
//         reject(err);
//       } else {
//         event.stopWatching();
//         // console.log(`${JSON.stringify(result, null, '  ')}`);
//         resolve(result);
//       }
//     });
//   });
// }

class SubmitAgent extends BaseAgent {
  constructor(scryptVerifier) {
    super(scryptVerifier);
    this.submitter = web3.eth.accounts[0];
    // this.loadData();
    // this.setupEvents();
  }

  // setupEvents() {
  //   this.newChallengeEvent = this.scryptVerifier.NewChallenge();
  //   this.newChallengeEvent.watch((err, result) => {
  //     if (!err) {
  //       this.newChallenge(result);
  //     }
  //   });
  //   this.NewRequestEvent = this.scryptVerifier.NewRequest();
  //   this.NewRequestEvent.watch((err, result) => {
  //     if (!err) {
  //       this.newRequest(result);
  //     }
  //   });
  // }
  //
  // loadData() {
  //   this.scryptRun = JSON.parse(fs.readFileSync('./run.json', 'utf8'));
  //   this.blockHeader = this.scryptRun[0].input;
  //   this.blockHash = this.scryptRun[2049].output;
  // }

  async run() {
    const blockData = await this.getBlock(this.blockHash);

    if (blockData[2] !== this.blockHash) {
      console.log(`Block data: ${JSON.stringify(blockData, null, '  ')}`);
      const submit = await this.submitBlock(this.blockHash, this.blockHeader, 0, { from: this.submitter });
      console.log(`Submit: ${submit.tx}`);
    } else {
      console.log(`Existing block: ${blockData[2]}`);
    }
  }

  async replyChallenge(challengeId) {
    const roundHashes = [[0, 510], [510, 1025], [1025, 1535], [1535, 2049]]
    for (let i=0; i<roundHashes.length; ++i) {
      const [start, finish] = roundHashes[i];
      const hashes = [];
      for (let j=0; start + 10*j < finish; ++j) {
        hashes.push(`0x${this.scryptRun[start + j * 10].input_hash}`);
      }
      const sendHashesTx = await this.sendHashes(challengeId, start, hashes, { from: this.submitter });
      console.log(`Send hashes: From ${start}, length: ${hashes.length}, at: ${sendHashesTx.tx}`);
    }
  }

  newChallenge(challengeData) {
    // console.log(`New challenge ${JSON.stringify(challengeData, null, '  ')}`);
    const { blockHash, challengeId } = challengeData.args;
    if (blockHash === this.blockHash) {
      console.log(`New challenge: ${challengeId} for ${blockHash}`);
      this.replyChallenge(challengeId);
    }
  }

  newRequest(requestData) {
    console.log(`New request: ${JSON.stringify(requestData, null, '  ')}`);
  }

  newDataHashes(dataHashes) {
  }
}


async function main() {
  try {
    const scryptVerifier = await makeScryptVerifier(provider);

    const submitAgent = new SubmitAgent(scryptVerifier);

    submitAgent.run();

    // return;
    //
    // const executionData = require('./run.json');
    //
    // const blockHeader = `0x${executionData[0].input}`;
    // const blockHash = `0x${executionData[2049].output}`;
    //
    // const blockData = await scryptVerifier.blocks.call(blockHash);
    //
    // if (blockData[2] != blockHash) {
    //   console.log(`Block data: ${blockData[2]}`);
    //   const submit = await scryptVerifier.submit(blockHash, blockHeader, 0, { from: submitter });
    //   console.log(`Submit: ${submit.tx}`);
    // } else {
    //   console.log(`Existing block: ${blockData[2]}`);
    // }
    //
    // const challengeId = await waitNewChallange(blockHash);
    //
    // console.log(`ChallengeId: ${JSON.stringify(challengeId, null, '  ')}`);
    //
    // const roundHashes = [[0, 510], [510, 1025], [1025, 1535], [1535, 2049]]
    // for (let i=0; i<roundHashes.length; ++i) {
    //   const [start, finish] = roundHashes[i];
    //   const hashes = [];
    //   for (let j=0; start + 10*j < finish; ++j) {
    //     hashes.push(`0x${executionData[start + j * 10].input_hash}`);
    //   }
    //   //const gasEstimate = await scryptVerifier.sendHashes.estimateGas(challengeId, start, hashes, { from: submitter });
    //   //console.log(`About to send hashes: From ${start}, length: ${hashes.length}, gas: ${gasEstimate.valueOf()}`);
    //   const sendHashes = await scryptVerifier.sendHashes(challengeId, start, hashes, { from: submitter });
    //   console.log(`Send hashes: From ${start}, length: ${hashes.length}, at: ${sendHashes.tx}`);
    // }
    //
    // while (true) {
    //   const requestTx = await waitNewRequest(blockHash);
    //   //console.log(`New request: ${JSON.stringify(requestTx, null, '  ')}`);
    //   const round = parseInt(requestTx.args.round, 10);
    //   console.log(`New request: blockHash: ${blockHash}, round ${round}`);
    //   //console.log(`----New request: blockHash: ${blockHash}, round ${typeof round}`);
    //   if (round < 1024) {
    //     const data = [];
    //     if (round !== 0) {
    //       for (let i=0; i<4; ++i) {
    //         data.push(`0x${executionData[round].input.slice(i*64, i*64+64)}`);
    //       }
    //     } else {
    //       data.push('0x0');
    //       data.push('0x0');
    //       data.push('0x0');
    //       data.push('0x0');
    //     }
    //     console.log(`Data: ${JSON.stringify(data, null, '  ')}`);
    //     const sendData = await scryptVerifier.sendData(challengeId, round, data, [], { from: submitter });
    //     console.log(`Send data: ${sendData.tx}`);
    //   } else {
    //     break;
    //   }
    // }

    // const requestBlock = 110;
    // const request = await scryptVerifier.request(challengeId, requestBlock, { from: challenger });
    // console.log(`Send request: ${request.tx}`);
    //
    // const data = [];
    // for (let i=0; i<4; ++i) {
    //   data.push(`0x${executionData[requestBlock].input.slice(i*64, i*64+64)}`);
    // }
    //
    // const sendData = await scryptVerifier.sendData(challengeId, requestBlock, data, { from: submitter });
    // console.log(`Send data: ${sendData.tx}`);
    //
    // const verifyTx = await scryptVerifier.verify(challengeId, requestBlock, { from: challenger });
    // const success = verifyTx.logs.filter(lg => lg.event === 'RoundVerified')[0].args.success;
    // // console.log(`Verify: ${JSON.stringify(verifyTx, null, '  ')}`);
    // console.log(`Verify: ${verifyTx.tx}`);

  } catch (err) {
    console.log(`Error: ${err} ${err.stack}`);
  }
}

main();
