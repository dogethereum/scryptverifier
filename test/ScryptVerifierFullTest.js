const crypto = require('crypto');
const ScryptVerifier = artifacts.require("./ScryptVerifier.sol");
const utils = require('../src/agents/utils');
const scryptsy = require('../scryptsy');

contract('ScryptVerifier Full Rounds', function(accounts) {
  const submitter = accounts[0];
  const challenger = accounts[1];
  let scryptVerifier;
  let runData;
  let blockHeader;
  let blockHash;
  let challengeId;

  describe('...', () => {
    before(async function () {
      scryptVerifier = await ScryptVerifier.deployed();
      const input = crypto.randomBytes(80);
      const [ output, intermediate ] = await scryptsy(input);
      runData = intermediate;
      blockHeader = `0x${input.toString('hex')}`;
      blockHash = `0x${output.toString('hex')}`;
    })
    it("Initialize block data", async function() {
      const submit = await scryptVerifier.submit(blockHash, blockHeader, 0, { from: submitter });
      const blockData = await scryptVerifier.submissions.call(blockHash);
      assert.equal(blockData[1], blockHeader, 'Block header should match');
      assert.equal(blockData[2], blockHash, 'Block hash should match');
    });
    it("Make a challenge", async function() {
      const challengeTx = await scryptVerifier.challenge(blockHash, { from: challenger });
      const { challengeId: thisChallengeId } = utils.parseNewChallenge(challengeTx);
      challengeId = thisChallengeId;
      assert.isOk(challengeId, 'New challenge created');
      const challengeData = await scryptVerifier.challenges.call(challengeId);
      assert.equal(challengeData[1], blockHash, 'Block hash should match');
    });
    const hashRanges = [[0, 520], [520, 1024], [1024, 1544], [1544, 2048]];
    hashRanges.forEach(([startRound, endRound]) => {
      it(`Publish hashes ${startRound} - ${endRound}`, async function() {
        const hashes = [];
        for (let round=startRound; round<endRound; round+=10) {
          hashes.push(`0x${runData[round].output_hash}`);
        }
        const sendHashesTx = await scryptVerifier.sendHashes(challengeId, startRound, hashes, { from: submitter });
        const { challengeId: thisChallengeId } = utils.parseNewDataHashes(sendHashesTx);
        assert.equal(thisChallengeId, challengeId, 'Challenge ids should match');
        for (let round=startRound, idx=0; round<endRound; round+=10, ++idx) {
          const data = await scryptVerifier.getRoundData.call(blockHash, round);
          assert.equal(hashes[idx], data[5], `Hashes set correctly for round ${round}`);
        }
      });
    });
    [
      [2044, 1844, -10],
      [1844, 1644, -10],
      [1644, 1444, -10],
      [1444, 1244, -10],
      [1244, 1014, -10],
      [1020, 800, -10],
      [800, 600, -10],
      [600, 400, -10],
      [400, 200, -10],
      [200, -10, -10],
    ].forEach(([roundStart, roundEnd, roundStep]) => {
      it(`Request & send for ${roundStart} to ${roundEnd}`, async function() {
        for (let round=roundStart; round!=roundEnd; round+=roundStep) {
          const requestTx = await scryptVerifier.request(challengeId, round, { from: challenger });
          let { challengeId: thisChallengeId, round: thisRound } = utils.parseNewRequest(requestTx);
          assert.equal(thisChallengeId, challengeId, 'Challenges id sould match');
          assert.equal(parseInt(thisRound), round, 'Required round should match');
          const roundInput = [];
          for (let i=0; i<4; ++i) {
            roundInput.push(`0x${runData[round].output.slice(64*i, 64*(i+1))}`);
          }
          const extraInputs = [];
          if (round >= 1024) {
            for (let j=0; j<10; ++j) {
              if (round + j + 1 < runData.length && runData[round + j + 1].input2) {
                const input2 = runData[round + j + 1].input2;
                for (let i=0; i<4; ++i) {
                  extraInputs.push(`0x${input2.slice(64*i, 64*(i+1))}`);
                }
              }
            }
          }
          const sendDataTx = await scryptVerifier.sendData(challengeId, round, roundInput, extraInputs, { from: submitter });
          ({ challengeId: thisChallengeId, round: thisRound } = utils.parseNewDataArrived(sendDataTx));
          assert.equal(thisChallengeId, challengeId, 'Challenges id sould match');
          assert.equal(parseInt(thisRound), round, 'Required round should match');
          const roundData = await scryptVerifier.getRoundData.call(blockHash, round);
          for (let i=0; i<4; ++i) {
            assert.equal(web3.toHex(roundData[1+i]), web3.toHex(new web3.BigNumber(roundInput[i])), `Round ${round} set correctly`);
          }
        }
      });
    });
  });
});
