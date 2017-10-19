const process = require('process');
const Web3 = require('web3');
const makeScryptVerifier = require('./ScryptVerifier');
const BaseAgent = require('./BaseAgent');
const config = require('./config');
const scryptsy = require('../scryptsy');


const hashRanges = [[0, 520], [520, 1024], [1024, 1544], [1544, 2048]];


class ResponseAgent extends BaseAgent {
  constructor(scryptVerifier, responder) {
    super(scryptVerifier);
    this.responder = responder;
    this.challenges = {};
    this.submissions = {};
  }

  async run() {
  }

  async processChallenge(hash, challengeId) {
    const [, input, ] = await this.getSubmission(hash);
    console.log(`Challenge input: ${input}`);
    const [ result, intermediate ] = await scryptsy(Buffer.from(input.slice(2), 'hex'));
    const resultHash = `0x${result.reverse().toString('hex')}`;
    if (resultHash === hash) {
      this.submissions[hash] = {
        input,
        intermediate
      }
      this.challenges[challengeId] = hash;
      this.replyChallenge(challengeId);
    } else {
      console.log(`Result didn't match ${hash} != ${hashResult}`);
    }
  }

  async replyChallenge(challengeId) {
    const hash = this.challenges[challengeId];
    if (hash && this.submissions[hash].intermediate) {
      const intermediate = this.submissions[hash].intermediate;
      console.log(`Sending hashes for ${challengeId}`);
      await hashRanges.reduce((cur, [startRound, endRound]) => {
        return cur.then(async () => {
          const hashes = [];
          for (let round=startRound; round<endRound; round+=10) {
            hashes.push(`0x${intermediate[round].output_hash}`);
          }
          const sendHashesTx = await this.sendHashes(challengeId, startRound, hashes, { from: this.responder });
          console.log(`Send hashes: From ${startRound}, length: ${hashes.length}, at: ${sendHashesTx.tx}`);
        });
      }, Promise.resolve());
      console.log('Sending hashes completed');
    } else {
      console.log(`Reply challenge: not valid ${challengeId}`);
    }
  }

  async replyRequest(hash, challengeId, round) {
    const submission = this.submissions[hash];
    if (!submission || !submission.intermediate) {
      console.log(`Not valid hash ${hash}`);
      return;
    }
    const intermediate = submission.intermediate;
    const roundInput = [];
    for (let i=0; i<4; ++i) {
      roundInput.push(`0x${intermediate[round].output.slice(64*i, 64*i+64)}`);
    }
    const extraInputs = [];
    if (round >= 1024) {
      for (let j=0; j<10; ++j) {
        if (round + j + 1 < intermediate.length && intermediate[round + j + 1].input2) {
          const input2 = intermediate[round + j + 1].input2;
          for (let i=0; i<4; ++i) {
            extraInputs.push(`0x${input2.slice(64*i, 64*i+64)}`);
          }
        }
      }
    }
    const sendRoundTx = await this.sendRound(challengeId, round, roundInput, extraInputs, { from: this.responder });
  }

  onNewSubmission(submissionData) {
  }

  onNewChallenge(challengeData) {
    const { hash, challengeId } = challengeData.args;
    console.log(`New challenge hash: ${hash}, id: ${challengeId}`);
    this.processChallenge(hash, challengeId);
  }

  onNewDataHashes(dataHashes) {
  }

  onNewRequest(requestData) {
    const { hash, challengeId, round: strRound } = requestData.args;
    const round = parseInt(strRound, 10);
    console.log(`New request: hash: ${hash}, id: ${challengeId}, round: ${round}`);
    if (this.submissions[hash]) {
      this.replyRequest(hash, challengeId, round);
    } else {
      console.log(`Not valid hash ${hash}`);
    }
  }

  onRoundVerified(roundResult) {
  }
}


async function main() {
  try {
    const provider = new Web3.providers.HttpProvider(config.web3Url);
    const web3 = new Web3(provider);

    const responder = config.responder || web3.eth.accounts[0];

    const scryptVerifier = await makeScryptVerifier(provider, { from: responder, gas: 4700000 });

    const responseAgent = new ResponseAgent(scryptVerifier, responder);

    responseAgent.run();

  } catch (err) {
    console.log(`Error: ${err} ${err.stack}`);
  }
}

main();
