var ScryptVerifier = artifacts.require("./ScryptVerifier.sol");


function findLogs(receipt, logName) {
  const logs = receipt.logs.filter(lg => lg.event === logName);
  return logs.length > 0 ? logs[0] : {};
}

function getLogArgs(receipt, logName) {
  const { args } = findLogs(receipt, logName);
  return args;
}

const getChallengeIdArgs = receipt => getLogArgs(receipt, 'NewChallenge');
const getNewDataHashesArgs = receipt => getLogArgs(receipt, 'NewDataHashes');
const getNewRequestArgs = receipt => getLogArgs(receipt, 'NewRequest');
const getNewDataArrivedArgs = receipt => getLogArgs(receipt, 'NewDataArrived');
const getRoundVerifiedArgs = receipt => getLogArgs(receipt, 'RoundVerified');

contract('ScryptVerifier', function(accounts) {
  const submitter = accounts[0];
  const challenger = accounts[1];

  const blockHeader = "0x00000001cef715f6b8c64f3b898f1ef6081ddbae507650523b9e3a53ccbbb910279f633067a8ca9f52efe146c4b3edd3925982add09b500d9b5c60738399d5f1066b2a754ebb17b81d018ea7d4592d01";
  const blockHash = "0x0000000110c8357966576df46f3b802ca897deb7ad18b12f1c24ecff6386ebd9";

  const intermediateHashes = [
    "0x9591614bf3a7831c516cf24935e4774231d981c0332ba1409acbf87cc5206f15",
    "0xebb0cff5aec1bfd5dc5212cfd7e21a44e7b865a111116158d97834737fc20558",
    "0x1276aa8e3c44f8c0ab4db6467b022fcb838d48463ebce5e33ca99de001a1bcd9",
    "0x0cb62e6b9a88c155d9a5a3cb045ead9c815f748057bf8da9fbb30622ca3bdc76",
    "0x3d09eaef10e443a18143d6fc14578859def2b3420926fd9173ca91e736f85a10",
  ];
  const roundInput = [
    [
    ],
    [
      "0x3bf83d92c6c8fe77dd7e99775c80f175af6835e0504763cd6133c013074bbae3",
      "0xe9fae41e8dc77d1a868c3d4aa7462c75420500869a87d1c27f3cf458ba8d7cb6",
      "0x150eba87e5cee4b485c24a008720a7f5abbf66649c0c260488728570f3cacd67",
      "0x8f139f97850d101c52c67dae482c6af8cf5b4d650f4f5b26e551d4a1365b5ce5",
    ],
    [
      "0x57346c5d1b6fdb78f69a49fa3fd7c59d9b4a10e1d18e1b7e33563e10e5c8a5a7",
      "0x92c915f2b81f5a66e69837b7ab95f47880e9a4bbed3fb960d98e1b6c4172057c",
      "0xa94f89248e2b51daadda1b1120032830a9f06d0a56716e8bf0ab2bbf5e6a695f",
      "0x5043ff86d1a725b59697d61aa260eaffd48b9607425acd13dfe2722e72b4dc6d",
    ],
    [
      "0xb0f881157cec55f9ce37ba9395f88804616322f33b31aaaa2da136d9420732b4",
      "0x0542e63aab40efd5e574e862ceb6a9f52e57181a442342515dbf9ca0411e0c43",
      "0xaecd350a14c2dd173ce6dcb957cc6c76795321ddc85e921751ab7da7d42c5fad",
      "0x99c6dcd050a1fd4e313fb394d1f12d25d2c92cdf3372cd1911fab17462c466c6",
    ],
    [
      "0xce1df727ce4558962243963b8108efca29423251e1a5f91840ede735909836ea",
      "0xa965b4cb4f9f9d19bad93682bbfe9070b586d7e1c5781ebac0c66da44f7efdcf",
      "0x350d6352f2159e6f48d749bf8be679ce4eaaabe893be77a8e59e3ff3cf5bd508",
      "0x96e433e2de8f9ab753efed72b4fa5ea7dea3910c0ae3802dfa9b71656b28fae6",
    ]
  ];

  let scryptVerifier;
  let challengeId;

  before(async function () {
    scryptVerifier = await ScryptVerifier.deployed();
  })

  it("Initialize block data", async function() {
    const submit = await scryptVerifier.submit(blockHash, blockHeader, 0, { from: submitter });
    const blockData = await scryptVerifier.blocks.call(blockHash);
    assert.equal(blockData[1], blockHeader, 'Block header should match');
    assert.equal(blockData[2], blockHash, 'Block hash should match');
  });
  it("Make a challenge", async function() {
    const challengeTx = await scryptVerifier.challenge(blockHash, { from: challenger });
    const { challengeId: thisChallengeId } = getChallengeIdArgs(challengeTx);
    challengeId = thisChallengeId;
    assert.isOk(challengeId, 'New challenge created');
    const challengeData = await scryptVerifier.challenges.call(challengeId);
    assert.equal(challengeData[1], blockHash, 'Block hash should match');
  });
  it("Publish hashes", async function() {
    const sendHashesTx = await scryptVerifier.sendHashes(challengeId, 0, 10, intermediateHashes, { from: submitter });
    const { challengeId: thisChallengeId } = getNewDataHashesArgs(sendHashesTx);
    assert.equal(thisChallengeId, challengeId, 'Challenge ids should match');
    for (let i=0; i<intermediateHashes.length; ++i) {
      const roundData = await scryptVerifier.getRoundData.call(blockHash, 10 * i);
      assert.equal(intermediateHashes[i], roundData[5], 'Hashes set correctly');
    }
  });
  it("Request input", async function() {
    const requestTx = await scryptVerifier.request(challengeId, 10, { from: challenger });
    const { challengeId: thisChallengeId, round } = getNewRequestArgs(requestTx);
    assert.equal(thisChallengeId, challengeId, 'Challenges id sould match');
    assert.equal(round, 10, 'Required round should match');
  });
  it("Send input", async function() {
    const sendDataTx = await scryptVerifier.sendData(challengeId, 10, roundInput[1], { from: submitter });
    const { challengeId: thisChallengeId, round } = getNewDataArrivedArgs(sendDataTx);
    assert.equal(thisChallengeId, challengeId, 'Challenges id sould match');
    assert.equal(round, 10, 'Required round should match');
    const roundData = await scryptVerifier.getRoundData.call(blockHash, 10);
    for (let i=0; i<4; ++i) {
      assert.equal(`0x${roundData[1+i].toString(16)}`, roundInput[1][i], 'Round input set correctly');
    }
  });
  it("Verify input", async function() {
    const verifyTx = await scryptVerifier.verify(challengeId, 10, { from: challenger });
    const { challengeId: thisChallengeId, round } = getRoundVerifiedArgs(verifyTx);
    assert.equal(thisChallengeId, challengeId, 'Challenges id sould match');
    const roundData = await scryptVerifier.getRoundData.call(blockHash, 20);
    // console.log(`Round 20: ${JSON.stringify(roundData, null, '  ')}`);
    // console.log(`Round 20: ${JSON.stringify(verifyTx, null, '  ')}`);
    assert.equal(intermediateHashes[2], roundData[5], 'Resulting hashes should match');
  });
});
