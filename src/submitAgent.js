const process = require('process');
const Web3 = require('web3');
const makeScryptVerifier = require('./ScryptVerifier');
const BaseAgent = require('./BaseAgent');
const config = require('./config');
const scryptsy = require('../scryptsy');


class SubmitAgent extends BaseAgent {
  constructor(scryptVerifier, submitter) {
    super(scryptVerifier);
    this.submitter = submitter;
  }

  async run(inputs) {
    inputs.forEach(async (input) => {
      let [ hash, ] = await scryptsy(input);
      hash = hash.reverse();
      console.log(`BlockHeader: ${input.toString('hex')}`);
      console.log(`BlockHash: ${hash.toString('hex')}`);
      await this.sendSubmission(`0x${hash.toString('hex')}`, `0x${input.toString('hex')}`, '0x0', { from: this.submitter });
    })
  }

  async onNewSubmission(submissionData) {
    const { hash, input } = submissionData.args;
    console.log(`New submission hash: ${hash}, input: ${input}`);
    const [ result, intermediate ] = await scryptsy(Buffer.from(input.slice(2), 'hex'));
    const resultHash = `0x${result.reverse().toString('hex')}`;
    if (resultHash !== hash) {
      console.log(`Hashes didn't match hash: ${hash}, result: ${resultHash}`);
    } else {
      console.log('Matching hashes, no need to challenge');
    }
  }

  onNewChallenge(challengeData) {
  }

  onNewDataHashes(dataHashes) {
  }

  onNewRequest(requestData) {
  }
}


async function main() {
  try {
    const provider = new Web3.providers.HttpProvider(config.web3Url);
    const web3 = new Web3(provider);

    const submitter = config.submitter || web3.eth.accounts[0];

    const scryptVerifier = await makeScryptVerifier(provider, { from: submitter, gas: 4700000 });

    const submitAgent = new SubmitAgent(scryptVerifier, submitter);

    const submissions = [];
    for (let i=2; i<process.argv.length; ++i) {
      submissions.push(Buffer.from(process.argv[i], 'hex'));
    }

    submitAgent.run(submissions);

    submitAgent.stop();

  } catch (err) {
    console.log(`Error: ${err} ${err.stack}`);
  }
}

main();
