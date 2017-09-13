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

    // const submit = await scryptVerifier.submit(blockHeader, blockHash, 0, { from: submitter });
    // console.log(`Submit: ${submit.tx}`);
    //
    // const challenge = await scryptVerifier.challenge(blockHash, { from: challenger });
    // console.log(`Challenge: ${challenge.tx}`);
    //
    // for (let k=0; k<=2049; k += 20) {
    //   const len = (k + 20<=2049) ? 20 : 2049 - k + 1;
    //   const hashes = [];
    //   for (let j=0; j<len; ++j) {
    //     hashes.push(execution[k + j].input_hash);
    //   }
    //   const { tx }= await scryptVerifier.sendHashes(blockHash, k, hashes, { from: submitter });
    //   console.log(`Send hashes: From ${k}, length: ${len} - ${tx}`);
    // }

    const challenge = await scryptVerifier.request(blockHash, { from: challenger });

  } catch (err) {
    console.log(`Error: ${err} ${err.stack}`);
  }
}

main();
