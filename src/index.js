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

async function main() {
  try {
    const scryptVerifier = await ScryptVerifier.deployed();

    const input = require('./run.json');

    const blockHeader = web3.toAscii(`0x${input[0].input}`)
    const blockHash = `0x${input[2049].output}`;

    const result = await scryptVerifier.submit(blockHeader, blockHash, 0);
    console.log(`Submit: ${result.tx}`);

    const blockData = await scryptVerifier.blocks.call(blockHash);
    console.log(`Result: ${blockData}`);

  } catch (err) {
    console.log(`Error: ${err} ${err.stack}`);
  }
}

main();
