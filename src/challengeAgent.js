const Web3 = require('web3');
const makeScryptVerifier = require('./ScryptVerifier');
const BaseAgent = require('./BaseAgent');
const scryptsy = require('../scryptsy');
const config = require('./config');


class ChallengeAgent extends BaseAgent {
  constructor(scryptVerifier, challenger) {
    super(scryptVerifier);
    this.challenger = challenger;
  }

  async run() {
  }

  async makeChallenge() {
    if (!this.challengeId) {
      console.log(`Making challenge..`);
      const { challengeId } = await this.sendChallenge(this.blockHash, { from: this.challenger });
      this.challengeId = challengeId;
      console.log(`Got new challenge id ${this.challengeId}`);
    } else {
      console.log(`Challenge already in progress ${this.challengeId}`);
    }
  }

  async makeRequest(round) {
    const requestTx = await this.sendRequest(this.challengeId, round, { from: this.challenger });
    console.log(`Send request ${JSON.stringify(requestTx, null, '  ')}`);
  }

  async onNewSubmission(submissionData) {
    const { hash, input } = submissionData.args;
    console.log(JSON.stringify(submissionData.args, null, '  '));
    let [ result, ] = await scryptsy(Buffer.from(input.slice(2), 'hex'));
    result = result.reverse();
    console.log(result.toString('hex'));
    // console.log(`New block: ${JSON.stringify(blockHash, null, '  ')}`);
    //
    // if (blockHash === this.blockHash) {
    //   this.makeChallenge();
    // }
    if (`0x${result.toString('hex')}` != hash) {
      console.log("Hashes didn't match. Will challenge");
    } else {
      console.log("Matching hashes. No need to challenge");
    }
  }

  onNewChallenge(challengeData) {
  }

  onNewDataHashes(dataHashes) {
    // console.log(`New data hashes: ${JSON.stringify(dataHashes, null, '  ')}`);
    const blockHash = dataHashes.args.blockHash;
    const challengeId = dataHashes.args.challengeId;
    if (blockHash === this.blockHash && challengeId === this.challengeId) {
      const start = parseInt(dataHashes.args.start);
      const length = parseInt(dataHashes.args.length);
      this.numHashes += length;
      if (this.numHashes > 200) {
        console.log(`Got hashes ${this.numHashes}`);
        this.makeRequest(10);
      }
    }
  }

  onNewRequest(requestData) {
  }

  onRoundVerified(roundResult) {
    console.log(`RoundVerified ${JSON.stringify(roundResult, null, '  ')}`);
  }
}


async function main() {
  try {
    const provider = new Web3.providers.HttpProvider(config.web3Url);
    const web3 = new Web3(provider);

    const challenger = config.challenger || web3.eth.accounts[1];
    const scryptVerifier = await makeScryptVerifier(provider, { from: challenger });

    const challengeAgent = new ChallengeAgent(scryptVerifier, challenger);

    challengeAgent.run();

  } catch (err) {
    console.log(`Error: ${err} ${err.stack}`);
  }
}

main();
