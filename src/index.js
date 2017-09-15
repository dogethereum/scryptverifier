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

const submitter = web3.eth.accounts[0];
const challenger = web3.eth.accounts[1];

async function main() {
  try {
    const scryptVerifier = await ScryptVerifier.deployed();

    const execution = require('./run.json');

    const blockHeader = web3.toAscii(`0x${execution[0].input}`)
    const blockHash = `0x${execution[2049].output}`;

    const blockData = await scryptVerifier.blocks.call(blockHash);

    if (blockData[2] != blockHash) {
      console.log(`Block data: ${blockData[2]}`);
      const submit = await scryptVerifier.submit(blockHash, blockHeader, 0, { from: submitter });
      console.log(`Submit: ${submit.tx}`);
    } else {
      console.log(`Existing block: ${blockData[2]}`);
    }

    const challengeTx = await scryptVerifier.challenge(blockHash, { from: challenger });
    //console.log(`Challenge: ${JSON.stringify(challengeTx, null, '  ')}`);

    // Find created challengeId in tx logs
    const challengeId = challengeTx.logs.filter(lg => lg.event === 'NewChallenge')[0].args.challengeId;
    console.log(`ChallengeId: ${JSON.stringify(challengeId, null, '  ')}`);

    // const challenge = await scryptVerifier.challenges.call(challengeId);
    // console.log(`Challenge: ${JSON.stringify(challenge, null, '  ')}`);

    for (let k=100; k<=120; k += 20) {
      const len = (k + 20<=2049) ? 20 : 2049 - k + 1;
      const hashes = [];
      for (let j=0; j<len; ++j) {
        hashes.push(`0x${execution[k + j].input_hash}`);
      }
      const { tx } = await scryptVerifier.sendHashes(challengeId, k, hashes, { from: submitter });
      console.log(`Send hashes: From ${k}, length: ${len} - ${tx}`);
    }

    const requestBlock = 109;

    const request = await scryptVerifier.request(challengeId, requestBlock, { from: challenger });
    console.log(`Send request: ${request.tx}`);

    const data = [];
    for (let i=0; i<4; ++i) {
      data.push(`0x${execution[requestBlock].input.slice(i*64, i*64+64)}`);
    }
    // console.log(`Data: ${JSON.stringify(data, null, '  ')}`);

    const reply = await scryptVerifier.sendData(challengeId, requestBlock, data, { from: submitter });
    console.log(`Send data: ${reply.tx}`);

    const verifyTx = await scryptVerifier.verify(challengeId, requestBlock, { from: challenger });
    const success = verifyTx.logs.filter(lg => lg.event === 'RoundVerified')[0].args.success;
    console.log(`Verify: ${verifyTx.tx}, success: ${success && 'yes' || 'no'}`);

    // const data2 = (await Promise.all([
    //   scryptVerifier.uno.call(),
    //   scryptVerifier.dos.call(),
    //   scryptVerifier.tres.call(0),
    //   scryptVerifier.tres.call(1),
    //   scryptVerifier.tres.call(2),
    //   scryptVerifier.tres.call(3),
    // ])).map(x => x.toString(16));
    //
    // console.log(`Data: ${JSON.stringify(data2, null, '  ')}`);

  } catch (err) {
    console.log(`Error: ${err} ${err.stack}`);
  }
}

main();
