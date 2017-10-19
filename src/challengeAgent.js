const Web3 = require('web3');
const makeScryptVerifier = require('./ScryptVerifier');
const BaseAgent = require('./BaseAgent');
const scryptsy = require('../scryptsy');
const config = require('./config');


class ChallengeAgent extends BaseAgent {
  constructor(scryptVerifier, challenger) {
    super(scryptVerifier);
    this.challenger = challenger;
    this.submissions = {};
    this.challenges = {};
  }

  async run() {
  }

  async makeChallenge(hash) {
    console.log(`Making challenge.. ${hash}`);
    const { challengeId } = await this.sendChallenge(hash, { from: this.challenger });
    this.challenges[challengeId] = {
      hash,
      intermediateHashes: [],
      replies: [],
      requests: {},
    };
    console.log(`Got challenge id ${challengeId}`);
  }

  async makeRequest(challengeId, round) {
    console.log(`About to send request ${challengeId} for ${round}`);
    this.challenges[challengeId].requests[round] = { pending: true };
    const requestTx = await this.sendRequest(challengeId, round, { from: this.challenger });
    console.log(`Send request ${requestTx.tx}`);
  }

  async processSubmission(hash, input) {
    const [ result, intermediate ] = await scryptsy(Buffer.from(input.slice(2), 'hex'));
    const resultHash = `0x${result.reverse().toString('hex')}`;
    this.submissions[hash] = {
      input,
      resultHash,
      intermediate,
    }
    if (resultHash !== hash) {
      console.log(`Hashes didn't match hash: ${hash}, result: ${resultHash}`);
      this.makeChallenge(hash);
    } else {
      console.log('Matching hashes, no need to challenge');
      if (config.testMode) {
        this.makeChallenge(hash);
      }
    }
  }

  async verifyHashes(hash, challengeId, start, length) {
    const challenge = this.challenges[challengeId];
    const hashes = await this.getHashes(hash, start, length);
    const submission = this.submissions[hash];
    let i=0;
    for (i=0; i<length; ++i) {
      if (`0x${submission.intermediate[start + 10*i].output_hash}` !== hashes[i]) {
        break;
      }
    }
    if (i < length) {
      console.log(`Match failed at ${start + 10*i}, got: ${hashes[i]}, expected: 0x${submission.intermediate[start + 10*i].output_hash}`);
    }
    challenge.replies.push({
      start,
      length,
      hashes,
      verified: i >= length,
      firstFailure: i < length ? i : undefined,
    });
    if (challenge.replies.length >= 4) {
      const [ verified, firstFailure ] = challenge.replies.reduce(([verified, firstFailure], reply) => {
        return [ verified && reply.verified, firstFailure === undefined ? reply.firstFailure : firstFailure ];
      }, [ true, undefined ]);
      if (!verified) {
        console.log("Hashes received didn't match calculated from data, will request data at ${firstFailure}");
        this.makeRequest(challengeId, firstFailure);
      } else {
        console.log('Hashes received match calculated from data, no need to request data');
        if (config.testMode) {
          this.makeRequest(challengeId, 0);
        }
      }
    }
  }

  onNewSubmission(submissionData) {
    const { hash, input } = submissionData.args;
    console.log(`New submission hash: ${hash}, input: ${input}`);
    this.processSubmission(hash, input);
  }

  onNewChallenge(challengeData) {
  }

  onNewDataHashes(dataHashes) {
    const { hash, challengeId } = dataHashes.args;
    const challenge = this.challenges[challengeId];
    if (challenge && challenge.hash === hash) {
      const start = parseInt(dataHashes.args.start);
      const length = parseInt(dataHashes.args.length);
      this.verifyHashes(hash, challengeId, start, length)
    } else {
      console.log(`Not valid challenge hash: ${hash}, id: ${challengeId}`);
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
