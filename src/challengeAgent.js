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
  const blockData = await scryptVerifier.blocks.call(blockHash);

  if (blockData[2] === blockHash) {
    return blockData;
  }

  return new Promise((resolve, reject) => {
    const event = scryptVerifier.NewBlock();
    event.watch((err, result) => {
      if (err) {
        event.stopWatching();
        reject(err);
      } else {
        event.stopWatching();
        console.log(`${JSON.stringify(result, null, '  ')}`);
        resolve(result);
      }
    });
  });
}

async function main() {
  try {
    scryptVerifier = await ScryptVerifier.deployed();

    const executionData = require('./run.json');

    const blockHeader = `0x${executionData[0].input}`;
    const blockHash = `0x${executionData[2049].output}`;

    await waitNewBlock(blockHash);
    const blockData = await scryptVerifier.blocks.call(blockHash);

    const challengeTx = await scryptVerifier.challenge(blockHash, { from: challenger });

    // const challengeId = challengeTx.logs.filter(lg => lg.event === 'NewChallenge')[0].args.challengeId;
    // console.log(`ChallengeId: ${JSON.stringify(challengeId, null, '  ')}`);
    //
    // const k = 100;
    // const len = 5;
    // const hashes = [];
    // for (let j=0; j<len; ++j) {
    //   if (executionData[k + j * 10].step != k + j * 10) {
    //     throw new Error('Not valid round');
    //   }
    //   hashes.push(`0x${executionData[k + j * 10].input_hash}`);
    // }
    // const sendHashes = await scryptVerifier.sendHashes(challengeId, k, 10, hashes, { from: submitter });
    // console.log(`Send hashes: From ${k}, length: ${len} - ${sendHashes.tx}`);
    //
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
