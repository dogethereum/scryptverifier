const Contract = require('truffle-contract');
const Web3 = require('web3');
const ScryptTestJson = require('../build/contracts/ScryptTest.json');

async function main() {
  try {
    const ScryptTest = Contract(ScryptTestJson);
    ScryptTest.setProvider(new Web3.providers.HttpProvider('http://localhost:8545'));
    const scryptTest = await ScryptTest.deployed();
    const input = await scryptTest.input.call();
    console.log(`Input: ${input.toString(16)}`);
  } catch (err) {
    console.log(`Error: ${err} ${err.stack}`);
  }
}

main();
