const crypto = require('crypto');
const BaseAgent = require('./BaseAgent');
const config = require('../../config');
const scryptsy = require('../../scryptsy');
const Verifier = require('../controllers/verifier');


const hashRanges = [[0, 520], [520, 1024], [1024, 1544], [1544, 2048]];


class ResponseAgent extends BaseAgent {
  constructor(scryptVerifier, responder) {
    super(scryptVerifier);
    this.responder = responder;
    this.challenges = {};
    this.submissions = {};
    this.submitNew = this.submitNew.bind(this);
  }

  async submitNew() {
    try {
      const input = crypto.randomBytes(80);
      const [hash] = await scryptsy(input);
      console.log(`BlockHeader: ${input.toString('hex')}`);
      console.log(`BlockHash: ${hash.toString('hex')}`);
      if (hash[2] % 5 === 2) {
        hash[14] = hash[14] ? 0 : 1;
      }
      await this.sendSubmission(`0x${hash.toString('hex')}`, `0x${input.toString('hex')}`, '0x0', { from: this.responder });
    } catch (ex) {
      console.log(`${ex.stack}`);
    }
  }

  run() {
    this.timer = setInterval(this.submitNew, 30 * 1000);
  }

  async processChallenge(hash, challengeId) {
    try {
      const [, input] = await this.getSubmission(hash);
      console.log(`Challenge input: ${input}`);
      const [result, intermediate] = await scryptsy(Buffer.from(input.slice(2), 'hex'));
      const resultHash = `0x${result.toString('hex')}`;
      if (resultHash === hash) {
        const now = Date.now();
        this.submissions[hash] = {
          input,
          intermediate,
          timestamp: now,
        };
        const toRemove = Object.keys(this.submissions)
          .find(h => now - this.submissions[h].timestamp >= 60 * 60 * 1000) || [];
        toRemove.forEach(h => delete this.submissions[h]);
        this.challenges[challengeId] = {
          hash,
          timestamp: now,
        };
        const toRemove2 = Object.keys(this.challenges)
          .find(h => now - this.challenges[h].timestamp >= 60 * 60 * 1000) || [];
        toRemove2.forEach(h => delete this.challenges[h]);
        this.replyChallenge(challengeId);
      } else {
        console.log(`Result didn't match ${hash} != ${resultHash}`);
      }
    } catch (ex) {
      console.log(`${ex.stack}`);
    }
  }

  async replyChallenge(challengeId) {
    try {
      const hash = this.challenges[challengeId] ? this.challenges[challengeId].hash : undefined;
      if (hash && this.submissions[hash].intermediate) {
        const intermediate = this.submissions[hash].intermediate;
        console.log(`Sending hashes for ${challengeId}`);
        await hashRanges.reduce((cur, [startRound, endRound]) => cur.then(async () => {
          const hashes = [];
          for (let round = startRound; round < endRound; round += 10) {
            hashes.push(`0x${intermediate[round].output_hash}`);
          }
          const sendHashesTx = await this.sendHashes(challengeId, startRound, hashes,
            { from: this.responder });
          console.log(`Send hashes: From ${startRound}, length: ${hashes.length}, at: ${sendHashesTx.tx}`);
        }), Promise.resolve());
        console.log('Sending hashes completed');
      } else {
        console.log(`Reply challenge: not valid ${challengeId}`);
      }
    } catch (ex) {
      console.log(`${ex.stack}`);
    }
  }

  async replyRequest(hash, challengeId, round) {
    try {
      const submission = this.submissions[hash];
      if (!submission || !submission.intermediate) {
        console.log(`Not valid hash ${hash}`);
        return;
      }
      const intermediate = submission.intermediate;
      const roundInput = [];
      for (let i = 0; i < 4; i += 1) {
        roundInput.push(`0x${intermediate[round].output.slice(64 * i, (64 * i) + 64)}`);
      }
      const extraInputs = [];
      if (round >= 1024) {
        for (let j = 0; j < 10; j += 1) {
          if (round + j + 1 < intermediate.length && intermediate[round + j + 1].input2) {
            const input2 = intermediate[round + j + 1].input2;
            for (let i = 0; i < 4; i += 1) {
              extraInputs.push(`0x${input2.slice(64 * i, (64 * i) + 64)}`);
            }
          }
        }
      }
      const sendRoundTx = await this.sendRound(challengeId, round, roundInput, extraInputs,
        { from: this.responder });
      console.log(`Send data id: ${challengeId}, round: ${round}, tx: ${sendRoundTx.tx}`);
    } catch (ex) {
      console.log(`${ex.stack}`);
    }
  }

  async onNewSubmission(submissionData) { // eslint-disable-line class-methods-use-this
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

  onNewChallenge(challengeData) {
    const { hash, challengeId } = challengeData.args;
    console.log(`New challenge hash: ${hash}, id: ${challengeId}`);
    this.processChallenge(hash, challengeId);
  }

  onNewDataHashes() {} // eslint-disable-line class-methods-use-this

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

    const responseAgent = new ResponseAgent(scryptVerifier, config.submitter.address);

    responseAgent.run();
  } catch (err) {
    console.log(`Error: ${err} ${err.stack}`);
  }
}

main();
