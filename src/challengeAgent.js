const Contract = require('truffle-contract');
const Web3 = require('web3');
const ScryptVerifierJson = require('../build/contracts/ScryptVerifier.json');

const provider = new Web3.providers.HttpProvider('http://localhost:8545');
const web3 = new Web3(provider);

const ScryptVerifier = Contract(ScryptVerifierJson);
ScryptVerifier.setProvider(provider);
ScryptVerifier.defaults({
  from: web3.eth.accounts[0],
  gas: 4700000,
});
// ScryptTest.synchronization_timeout = 1000;

const challenger = web3.eth.accounts[1];

let scryptVerifier;

async function waitNewBlock(blockHash) {
  return new Promise((resolve, reject) => {
    const event = scryptVerifier.NewBlock();
    event.watch((err, result) => {
      if (err) {
        event.stopWatching();
        reject(err);
      } else {
        event.stopWatching();
        // console.log(`${JSON.stringify(result, null, '  ')}`);
        resolve(result);
      }
    });
  });
}

async function waitNewDataHashes(challengeId) {
  return new Promise((resolve, reject) => {
    const event = scryptVerifier.NewDataHashes({ challengeId });
    event.watch((err, result) => {
      if (err) {
        event.stopWatching();
        reject(err);
      } else {
        event.stopWatching();
        //console.log(`Result: ${JSON.stringify(result, null, '  ')}`);
        resolve(result);
      }
    });
  });
}

async function waitVerifyData(challengeId, round) {
  return new Promise((resolve, reject) => {
    const event = scryptVerifier.RoundVerified({ challengeId });
    event.watch((err, result) => {
      if (err) {
        event.stopWatching();
        reject(err);
      } else {
        event.stopWatching();
        //console.log(`Result: ${JSON.stringify(result, null, '  ')}`);
        resolve(result);
      }
    });
  });
}

async function Sleep(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout)
  });
}

async function main() {
  try {
    scryptVerifier = await ScryptVerifier.deployed();

    const executionData = require('./run.json');

    const blockHeader = `0x${executionData[0].input}`;
    const blockHash = `0x${executionData[2049].output}`;

    let blockData = await scryptVerifier.blocks.call(blockHash);

    if (blockData[2] !== blockHash) {
      console.log(`Waiting for block ${blockHash}`);
      const blockWait = await waitNewBlock(blockHash);
      console.log(`Got block: ${blockWait.args.blockHash}`);
    }

    const challengeTx = await scryptVerifier.challenge(blockHash, { from: challenger });

    const challengeId = challengeTx.logs.filter(lg => lg.event === 'NewChallenge')[0].args.challengeId;
    console.log(`Challenge id: ${JSON.stringify(challengeId, null, '  ')}`);

    // FIXME: This should listen for the final event only
    await Sleep(15000);

    const dataHashes = await waitNewDataHashes(challengeId);
    //console.log(`New data hashes: ${JSON.stringify(dataHashes, null, '  ')}`);

    const { start, length } = dataHashes.args;
    console.log(`New data hashes: start: ${start}, length: ${length}`);

    for (let k=0; k<length; ++k) {
      const request = await scryptVerifier.request(challengeId, k * 10, { from: challenger });
      //console.log(`Send request: ${JSON.stringify(request, null, '  ')}`);
      console.log(`Send request: ${request.tx}, waiting verification`);
      const result = await waitVerifyData(challengeId, k * 10);
      console.log(`Round verified: ${JSON.stringify(result, null, '  ')}`);
    }

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
