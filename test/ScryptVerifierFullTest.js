const fs = require('fs');
const ScryptVerifier = artifacts.require("./ScryptVerifier.sol");
const utils = require('../src/utils');

contract('ScryptVerifier Full Rounds', function(accounts) {
  const submitter = accounts[0];
  const challenger = accounts[1];
  let scryptVerifier;
  let runData;
  let blockHeader;
  let blockHash;
  let challengeId;

  describe.only('...', () => {
    before(async function () {
      scryptVerifier = await ScryptVerifier.deployed();
      runData = JSON.parse(fs.readFileSync('./src/run.json', 'utf8'));
      blockHeader = `0x${runData[0].input}`;
      blockHash = `0x${runData[2049].output}`;
    })
    it("Initialize block data", async function() {
      const submit = await scryptVerifier.submit(blockHash, blockHeader, 0, { from: submitter });
      const blockData = await scryptVerifier.blocks.call(blockHash);
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
    const hashRanges = [[0, 510], [520, 1020], [1024, 1534], [1544, 2044]];
    hashRanges.forEach(([startRound, endRound]) => {
      it(`Publish hashes ${startRound} - ${endRound}`, async function() {
        const hashes = [];
        for (let round=startRound; round<=endRound; round+=10) {
          hashes.push(`0x${runData[round].output_hash}`);
        }
        const sendHashesTx = await scryptVerifier.sendHashes(challengeId, startRound, hashes, { from: submitter });
        const { challengeId: thisChallengeId } = utils.parseNewDataHashes(sendHashesTx);
        assert.equal(thisChallengeId, challengeId, 'Challenge ids should match');
        for (let round=startRound, idx=0; round<=endRound; round+=10, ++idx) {
          const data = await scryptVerifier.getRoundData.call(blockHash, round);
          assert.equal(hashes[idx], data[5], `Hashes set correctly for round ${round}`);
        }
      });
    });
    // [[2024, 0], [2034, 1], [2044, 2]].forEach(([round, idx]) => {
    //   it(`Request input ${round}`, async function() {
    //     const requestTx = await scryptVerifier.request(challengeId, round, { from: challenger });
    //     const { challengeId: thisChallengeId, round: thisRound } = utils.parseNewRequest(requestTx);
    //     assert.equal(thisChallengeId, challengeId, 'Challenges id sould match');
    //     assert.equal(parseInt(thisRound), round, 'Required round should match');
    //   });
    //   it(`Send input ${round}`, async function() {
    //     const sendDataTx = await scryptVerifier.sendData(challengeId, round, roundInput2[idx], extraInputs2[idx], { from: submitter });
    //     const { challengeId: thisChallengeId, round: thisRound } = utils.parseNewDataArrived(sendDataTx);
    //     assert.equal(thisChallengeId, challengeId, 'Challenges id sould match');
    //     assert.equal(parseInt(thisRound), round, 'Required round should match');
    //     const roundData = await scryptVerifier.getRoundData.call(blockHash, round);
    //     for (let i=0; i<4; ++i) {
    //       assert.equal(web3.toHex(roundData[1+i]), web3.toHex(new web3.BigNumber(roundInput2[idx][i])), `Round ${round} set correctly`);
    //     }
    //   });
  });
});
