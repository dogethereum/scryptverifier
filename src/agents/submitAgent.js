const process = require('process');
const crypto = require('crypto');
const BaseAgent = require('./BaseAgent');
const config = require('../../config');
const scryptsy = require('../../scryptsy');
const Verifier = require('../controllers/verifier');

function Timeout(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

class SubmitAgent extends BaseAgent {
  constructor(scryptVerifier, submitter) {
    super(scryptVerifier);
    this.submitter = submitter;
  }

  async run(repeat) {
    try {
      while (repeat) {
        const input = crypto.randomBytes(80);
        const [hash] = await scryptsy(input);
        console.log(`BlockHeader: ${input.toString('hex')}`);
        console.log(`BlockHash: ${hash.toString('hex')}`);
        if (hash[2] % 5 === 2) {
          hash[14] = hash[14] ? 0 : 1;
        }
        await this.sendSubmission(`0x${hash.toString('hex')}`, `0x${input.toString('hex')}`, '0x0', { from: this.submitter });
        await Timeout(30000);
      }
    } catch (ex) {
      console.log(`${ex} - ${ex.stack}`);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async onNewSubmission(submissionData) {
    try {
      const { hash, input } = submissionData.args;
      console.log(`New submission hash: ${hash}, input: ${input}`);
      const [result] = await scryptsy(Buffer.from(input.slice(2), 'hex'));
      const resultHash = `0x${result.toString('hex')}`;
      if (resultHash !== hash) {
        console.log(`Hashes didn't match hash: ${hash}, result: ${resultHash}`);
      } else {
        console.log('Matching hashes, no need to challenge');
      }
    } catch (ex) {
      console.log(`${ex.stack}`);
    }
  }

  onNewChallenge() {} // eslint-disable-line class-methods-use-this

  onNewDataHashes() {} // eslint-disable-line class-methods-use-this

  onNewRequest() {} // eslint-disable-line class-methods-use-this

  onRoundVerified() {} // eslint-disable-line class-methods-use-this
}


async function main() {
  try {
    const scryptVerifier = await (new Verifier({
      wallet: config.submitter,
      defaults: {
        gas: 4000000,
      },
    })).getScryptVerifier();

    const submitAgent = new SubmitAgent(scryptVerifier, config.submitter.address);

    if (process.argv.length <= 2) {
      console.log('Use node submitAgent.js [ input | -r ]');
      console.log('\tinput\tInput to send (in hexadecimal: f123e73b45a46bb6)');
      console.log('\t-r\tRandomly generated input');
      process.exit(-1);
    }


    submitAgent.run(process.argv[2] === '-r');

    // submitAgent.stop();
  } catch (err) {
    console.log(`Error: ${err} ${err.stack}`);
  }
}

main();
