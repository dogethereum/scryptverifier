const process = require('process');
const crypto = require('crypto');
const BaseAgent = require('./BaseAgent');
const config = require('../../config');
const scryptsy = require('../../scryptsy');
const ethereum = require('../controllers/ethereum');

class SubmitAgent extends BaseAgent {
  constructor(scryptVerifier, submitter) {
    super(scryptVerifier);
    this.submitter = submitter;
  }

  async run(inputs) {
    inputs.forEach(async (input) => {
      const [hash] = await scryptsy(input);
      console.log(`BlockHeader: ${input.toString('hex')}`);
      console.log(`BlockHash: ${hash.toString('hex')}`);
      await this.sendSubmission(`0x${hash.toString('hex')}`, `0x${input.toString('hex')}`, '0x0', { from: this.submitter });
    });
  }

  static async onNewSubmission(submissionData) {
    const { hash, input } = submissionData.args;
    console.log(`New submission hash: ${hash}, input: ${input}`);
    const [result] = await scryptsy(Buffer.from(input.slice(2), 'hex'));
    const resultHash = `0x${result.toString('hex')}`;
    if (resultHash !== hash) {
      console.log(`Hashes didn't match hash: ${hash}, result: ${resultHash}`);
    } else {
      console.log('Matching hashes, no need to challenge');
    }
  }

  static onNewChallenge() {
  }

  static onNewDataHashes() {
  }

  static onNewRequest() {
  }
}


async function main() {
  try {
    const scryptVerifier = await ethereum.getScryptVerifier({
      wallet: config.wallet,
    });

    const submitAgent = new SubmitAgent(scryptVerifier, config.wallet.address);

    const submissions = [];

    if (process.argv.length > 2) {
      if (process.argv[2] === '-r') {
        submissions.push(crypto.randomBytes(80));
      } else {
        for (let i = 2; i < process.argv.length; i += 1) {
          submissions.push(Buffer.from(process.argv[i], 'hex'));
        }
      }
    } else {
      console.log('Use node submitAgent.js [ input | -r ]');
      console.log('\tinput\tInput to send (in hexadecimal: f123e73b45a46bb6)');
      console.log('\t-r\tRandomly generated input');
      process.exit(-1);
    }


    submitAgent.run(submissions);

    // submitAgent.stop();
  } catch (err) {
    console.log(`Error: ${err} ${err.stack}`);
  }
}

main();
