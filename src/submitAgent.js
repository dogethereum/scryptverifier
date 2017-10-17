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

  async replyChallenge(challengeId) {
    const roundHashes = [[0, 510], [510, 1025], [1025, 1535], [1535, 2049]]
    for (let i=0; i<roundHashes.length; ++i) {
      const [start, finish] = roundHashes[i];
      const hashes = [];
      for (let j=0; start + 10*j < finish; ++j) {
        hashes.push(`0x${this.scryptRun[start + j * 10].input_hash}`);
      }
      const sendHashesTx = await this.sendHashes(challengeId, start, hashes, { from: this.submitter });
      console.log(`Send hashes: From ${start}, length: ${hashes.length}, at: ${sendHashesTx.tx}`);
    }
  }

  async replyRequest(challengeId, round) {
    if (round < 1024) {
      const data = [];
      if (round !== 0) {
        for (let i=0; i<4; ++i) {
          data.push(`0x${this.scryptRun[round].input.slice(i*64, i*64+64)}`);
        }
      } else {
        data.push('0x0');
        data.push('0x0');
        data.push('0x0');
        data.push('0x0');
      }
      console.log(`Data: ${JSON.stringify(data, null, '  ')}`);
      const sendRoundTx = await this.sendRound(challengeId, round, data, [], { from: this.submitter });
      console.log(`Result: ${JSON.stringify(sendRoundTx, null, '  ')}`);
    } else {
      console.log(`Cannot send reply to ${round} yet`)
    }
  }

  onNewSubmission(submissionData) {
  }

  onNewChallenge(challengeData) {
    // console.log(`New challenge ${JSON.stringify(challengeData, null, '  ')}`);
    const { hash, challengeId } = challengeData.args;
    if (hash === this.blockHash) {
      console.log(`New challenge: ${challengeId} for ${blockHash}`);
      this.replyChallenge(challengeId);
    }
  }

  onNewDataHashes(dataHashes) {
  }

  onNewRequest(requestData) {
    console.log(`Got request: ${JSON.stringify(requestData, null, '  ')}`);
    const blockHash = requestData.args.blockHash;
    const challengeId = requestData.args.challengeId;
    const round = parseInt(requestData.args.round);
    if (blockHash === this.blockHash) {
      console.log(`New request: ${challengeId} for round ${round}`);
      this.replyRequest(challengeId, round);
    }
  }
}


async function main() {
  try {
    const provider = new Web3.providers.HttpProvider(config.web3Url);
    const web3 = new Web3(provider);

    const submitter = config.submitter || web3.eth.accounts[0];

    const scryptVerifier = await makeScryptVerifier(provider, { from: submitter, gas: 4700000 });

    const submitAgent = new SubmitAgent(scryptVerifier, submitter);

    // console.log(process.argv[2] ? process.argv[2] : '--none-');
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
