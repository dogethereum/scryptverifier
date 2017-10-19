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
      hashes: {},
      pending: [],
    };
    console.log(`Got challenge id ${challengeId}`);
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

  async processHashes(hash, challengeId, start, length) {
    const challenge = this.challenges[challengeId];
    if (!challenge) {
      console.log(`Not valid challenge id ${challengeId}`);
      return;
    }
    const hashes = await this.getHashes(hash, start, length);
    const submission = this.submissions[hash];
    for (let i=0; i<hashes.length; ++i) {
      challenge.hashes[start + 10*i] = hashes[i];
    }
    challenge.replies.push({
      start,
      length,
    });
    if (challenge.replies.length >= 4) {
      this.verifyHashes(hash, challengeId);
    }
  }

  async makeRequest(challengeId, round) {
    const challenge = this.challenges[challengeId];
    console.log(`About to send request ${challengeId} for ${round}`);
    challenge.requests[round] = { pending: true };
    challenge.pending.push(round);
    const requestTx = await this.sendRequest(challengeId, round, { from: this.challenger });
    console.log(`Send request ${requestTx.tx}`);
  }

  verifyHashes(hash, challengeId) {
    const challenge = this.challenges[challengeId];
    if (!challenge) {
      console.log(`Not valid challenge id ${challengeId}`);
      return;
    }
    const submission = this.submissions[hash];
    if (!submission) {
      console.log(`Not valid hash ${hash}`);
      return;
    }

    if (!challenge.invalidHashes) {
      const rounds = Object.keys(challenge.hashes);
      const invalidHashes = rounds.filter(round => `0x${submission.intermediate[round].output_hash}` !== challenge.hashes[round]);

      challenge.invalidHashes = invalidHashes;
      if (invalidHashes.length > 0) {
        console.log(`Some hashes didn't match ${invalidHashes.length}`);
      } else {
        console.log(`Hashes match precalculated ${rounds.length}`);
        if (config.testMode) {
          challenge.invalidHashes = rounds;
        }
      }
    }

    if (challenge.invalidHashes.length > 0) {
      const count = challenge.pending.length;
      if (count === challenge.invalidHashes.length) {
        console.log(`All challenges completed ${challenge.invalidHashes.length}`);
      } else {
        //const nextRequest = challenge.invalidHashes[challenge.invalidHashes.length - 1 - count];
        const nextRequest = challenge.invalidHashes[count];
        this.makeRequest(challengeId, nextRequest);
      }
    } else {
      console.log('All hashes found were valid');
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
      this.processHashes(hash, challengeId, start, length)
    } else {
      console.log(`Not valid challenge hash: ${hash}, id: ${challengeId}`);
    }
  }

  onNewRequest(requestData) {
  }

  onRoundVerified(roundResult) {
    const { challengeId, hash, round: strRound } = roundResult.args;
    const round = parseInt(strRound, 10);
    console.log(`RoundVerified hash: ${hash}, round: ${round}`);
    this.verifyHashes(hash, challengeId);
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
