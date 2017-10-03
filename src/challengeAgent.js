const Web3 = require('web3');
const makeScryptVerifier = require('./ScryptVerifier');
const BaseAgent = require('./BaseAgent');

const provider = new Web3.providers.HttpProvider('http://localhost:8545');
const web3 = new Web3(provider);

// const ScryptVerifier = makeScryptVerifier(provider);

// const challenger = web3.eth.accounts[1];

// let scryptVerifier;
//
// async function waitNewBlock(blockHash) {
//   return new Promise((resolve, reject) => {
//     const event = scryptVerifier.NewBlock();
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
//
// async function waitNewDataHashes(challengeId) {
//   return new Promise((resolve, reject) => {
//     const event = scryptVerifier.NewDataHashes({ challengeId });
//     event.watch((err, result) => {
//       if (err) {
//         event.stopWatching();
//         reject(err);
//       } else {
//         event.stopWatching();
//         //console.log(`Result: ${JSON.stringify(result, null, '  ')}`);
//         resolve(result);
//       }
//     });
//   });
// }
//
// async function waitVerifyData(challengeId, round) {
//   return new Promise((resolve, reject) => {
//     const event = scryptVerifier.RoundVerified({ challengeId });
//     event.watch((err, result) => {
//       if (err) {
//         event.stopWatching();
//         reject(err);
//       } else {
//         event.stopWatching();
//         //console.log(`Result: ${JSON.stringify(result, null, '  ')}`);
//         resolve(result);
//       }
//     });
//   });
// }
//
// async function Sleep(timeout) {
//   return new Promise((resolve) => {
//     setTimeout(resolve, timeout)
//   });
// }

class ChallengeAgent extends BaseAgent {
  constructor(scryptVerifier) {
    super(scryptVerifier);
    this.challenger = web3.eth.accounts[1];
    this.numHashes = 0;
    // this.scryptVerifier = scryptVerifier;
    // this.setupEvents();
    // console.log(`Waiting for block ${this.blockHash}`);
  }

  // setupEvents() {
  //   this.newBlockEvent = this.scryptVerifier.NewBlock();
  //   this.newBlockEvent.watch((err, result) => {
  //     if (!err) {
  //       this.newBlock(result);
  //     }
  //   });
  //   this.newDataHashesEvent = this.scryptVerifier.NewDataHashes();
  //   this.newDataHashesEvent.watch((err, result) => {
  //     if (!err) {
  //       this.newDataHashes(result);
  //     }
  //   });
  // }

  async run() {
    const blockData = await this.getBlock(this.blockHash);

    if (blockData[2] !== this.blockHash) {
      console.log(`Waiting for block ${this.blockHash}`);
      // const blockWait = await waitNewBlock(blockHash);
      // console.log(`Got block: ${blockWait.args.blockHash}`);
    } else {
      console.log(`Got block ${this.blockHash}`);
      this.makeChallenge();
    }
  }

  async makeChallenge() {
    if (!this.challengeId) {
      console.log(`Making challenge..`);
      const { challengeId } = await this.sendChallenge(this.blockHash, { from: this.challenger });
      this.challengeId = challengeId;
      console.log(`Got new challenge id ${this.challengeId}`);
    } else {
      console.log(`Challenge already in progress ${this.challengeId}`);
    }
  }

  async makeRequest(round) {
    const requestTx = await this.sendRequest(this.challengeId, round, { from: this.challenger });
    console.log(`Send request ${JSON.stringify(requestTx, null, '  ')}`);
  }

  onNewBlock(blockData) {
    const blockHash = blockData.args.blockHash;
    console.log(`New block: ${JSON.stringify(blockHash, null, '  ')}`);

    if (blockHash === this.blockHash) {
      this.makeChallenge();
    }
  }

  onNewChallenge(challengeData) {
  }

  onNewDataHashes(dataHashes) {
    // console.log(`New data hashes: ${JSON.stringify(dataHashes, null, '  ')}`);
    const blockHash = dataHashes.args.blockHash;
    const challengeId = dataHashes.args.challengeId;
    if (blockHash === this.blockHash && challengeId === this.challengeId) {
      const start = parseInt(dataHashes.args.start);
      const length = parseInt(dataHashes.args.length);
      this.numHashes += length;
      if (this.numHashes > 200) {
        console.log(`Got hashes ${this.numHashes}`);
        this.makeRequest(10);
      }
    }
  }

  onNewRequest(requestData) {
  }

  onRoundVerified(roundResult) {
    console.log(`RoundVerified ${JSON.stringify(roundResult, null, '  ')}`);
  }
}


async function main() {
  try {
    const scryptVerifier = await makeScryptVerifier(provider);

    const challengeAgent = new ChallengeAgent(scryptVerifier);

    challengeAgent.run();

    //
    // return;
    //
    // const executionData = require('./run.json');
    //
    // const blockHeader = `0x${executionData[0].input}`;
    // const blockHash = `0x${executionData[2049].output}`;
    //
    // let blockData = await scryptVerifier.blocks.call(blockHash);
    //
    // if (blockData[2] !== blockHash) {
    //   console.log(`Waiting for block ${blockHash}`);
    //   const blockWait = await waitNewBlock(blockHash);
    //   console.log(`Got block: ${blockWait.args.blockHash}`);
    // }
    //
    // const challengeTx = await scryptVerifier.challenge(blockHash, { from: challenger });
    //
    // const challengeId = challengeTx.logs.filter(lg => lg.event === 'NewChallenge')[0].args.challengeId;
    // console.log(`Challenge id: ${JSON.stringify(challengeId, null, '  ')}`);
    //
    // let hashes = 0;
    // while (hashes < 200) {
    //   const dataHashes = await waitNewDataHashes(challengeId);
    //   //console.log(`New data hashes: ${JSON.stringify(dataHashes, null, '  ')}`);
    //   const { start, length } = dataHashes.args;
    //   console.log(`New data hashes: start: ${start}, length: ${length}, tx: ${dataHashes.transactionHash}`);
    //   hashes += parseInt(length, 10);
    // }
    //
    // //const { start, length } = dataHashes.args;
    // //console.log(`New data hashes: start: ${start}, length: ${length}`);
    //
    // await Sleep(2000);
    //
    // for (let k=0; k<hashes; ++k) {
    //   const request = await scryptVerifier.request(challengeId, k * 10, { from: challenger });
    //   //console.log(`Send request: ${JSON.stringify(request, null, '  ')}`);
    //   console.log(`Send request: ${request.tx}, waiting verification`);
    //   const result = await waitVerifyData(challengeId, k * 10);
    //   console.log(`Round verified: ${JSON.stringify(result, null, '  ')}`);
    // }
    //
    // // const requestBlock = 110;
    // // const request = await scryptVerifier.request(challengeId, requestBlock, { from: challenger });
    // // console.log(`Send request: ${request.tx}`);
    // //
    // // const data = [];
    // // for (let i=0; i<4; ++i) {
    // //   data.push(`0x${executionData[requestBlock].input.slice(i*64, i*64+64)}`);
    // // }
    // //
    // // const sendData = await scryptVerifier.sendData(challengeId, requestBlock, data, { from: submitter });
    // // console.log(`Send data: ${sendData.tx}`);
    // //
    // // const verifyTx = await scryptVerifier.verify(challengeId, requestBlock, { from: challenger });
    // // const success = verifyTx.logs.filter(lg => lg.event === 'RoundVerified')[0].args.success;
    // // // console.log(`Verify: ${JSON.stringify(verifyTx, null, '  ')}`);
    // // console.log(`Verify: ${verifyTx.tx}`);

  } catch (err) {
    console.log(`Error: ${err} ${err.stack}`);
  }
}

main();
