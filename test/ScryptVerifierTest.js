const ScryptVerifier = artifacts.require("./ScryptVerifier.sol");
const utils = require('../src/utils');


contract('ScryptVerifier1', function(accounts) {
  const submitter = accounts[0];
  const challenger = accounts[1];

  const blockHeader = "0x00000001cef715f6b8c64f3b898f1ef6081ddbae507650523b9e3a53ccbbb910279f633067a8ca9f52efe146c4b3edd3925982add09b500d9b5c60738399d5f1066b2a754ebb17b81d018ea7d4592d01";
  // const blockHeader = "0x01000000f615f7ce3b4fc6b8f61e8f89aedb1d0852507650533a9e3b10b9bbcc30639f279fcaa86746e1ef52d3edb3c4ad8259920d509bd073605c9bf1d59983752a6b06b817bb4ea78e011d012d59d4";
  const blockHash = "0x0000000110c8357966576df46f3b802ca897deb7ad18b12f1c24ecff6386ebd9";

  const intermediateHashes = [
    "0xde4e4d60bbe624a2be9c743ca7927468ef5a3e51c525b466b0a06ebd4dbd5054",  // 0
    "0x6639d785a285cdef12cc89b177182e46933ac47e9b52291dad7e80da23793ffd",  // 10
    "0x2ffcd896d200df7152b1b413e13888d97325da4b3c153f25fb646176c1c6c1eb",  // 20
  ];
  const roundInput = [
    [
      "0x01e4aba4fd406bcb53e2ce3f58e44b22c0b320ac5aa9b30c7f5366de6b17ded3",  // 0
      "0xf6c813162c0bc1e260bc01e4755c1c4df857342856b069a47b16e37e92f21053",
      "0x101695367533152c0cd57abe3cd2ac3f76c7526d4048372bfaf6f63c96a5b72c",
      "0x426ef9e541f504b1af2674540e8af4f567fe4501201939d8e5baced4524f1600",
    ],
    [
      "0x1dbca641bfaa6c21ae260e02f714356968e7a4c0a65f00dcda791480de4f506b",  // 10
      "0x583a18c6b3522de22c1ac963cce2c10aa90e5b5091d67ab6aa2cfb2a63c586ab",
      "0xf780ea5ae13599eedca68680350e4fb67367432af407e07904e81fcf546b663b",
      "0x67c4cbbd5db3c010b9eb741fe33b2683f6157c650d2f8b9e317ad8804b7eb0e5",
    ],
    [
      "0xfcfc769baffe9bf75cfcacc62865501856723408d36a0dcdcb19dfdf0b1bbbc1",  // 20
      "0xa7cb3d0d936676c2469ec2adff5191430df7563b9cdaed446aa8eccaa0b1b2c7",
      "0xd5e12cf5faf9373aa6c945430f230e85959d16c76687b16f2b681b772a779503",
      "0xb636a25ac2484e269ab24900c4f7e02f52993be3d513aa7a5255d19290003f3f",
    ],
  ];
  const intermediateHashes2 = [
    "0xee6dbefbfb8c3a184639bcce7c87a06099edb532bb9871cea00d82ebf332aa90",  // 1000
    "0x77ade81131fc7f2db6084a102256584e9e0d8c301e576a7740ced47190b17443",  // 1010
    "0xca323c6df162b63f8bfcf941ad179a3fd2d82b719024c06efad68e802449a1dc",  // 1020
  ];
  const roundInput2 = [
    [
      "0x99b8294546beb31bfe6ac02143bfe9b498a74d27b71a6d76b649f021327eede1",  // 1000
      "0xbdda1a70b4a86945d80205561884d4cf3e4f94b151d5dc5d0f9f0b0f75f8b208",
      "0x0ad0877a20d0b6cd1179417594cf6536962fa6c2319d1126c53dd132d970f763",
      "0xe4b3e0446cd275ab62bffa0d767202a7343be8b10a1a6146fde868cef6f9029f",
    ],
    [
      "0x52d003621aac63e264309f4ddbe414d74986903b2ab720460cd637d6d0823198",  // 1010
      "0xa10f6c2a66538f5b2eeee5d54e74010ad091e660acc838c6953e14527d761cd1",
      "0xa6e27211d35d42235df862c731c334ba8a273545aa2f80b158384b9f17ace18d",
      "0x4876599dbf0271fac31230ebbc31f14cf8000503fd6587244c571ca37bff6bee",
    ],
    [
      "0x8b0685ec73d72f4b8a534a3abfcea4a52736181bc56dac4beb112f914d05b626",  // 1020
      "0xd1ed8dcb85c02fac13c58dc873e3ce30152aff7f60eb477659eda82138949d1d",
      "0xdca35cafaac8249ee6f464826a593d2c277452e4a6cc79753b15f6d4421c3a1a",
      "0xbc091906f6a772d38648fb3301d9d7eab6d0e1ae705c89a0a43cf45e8cc3fb81",
    ],
  ];
  const intermediateHashes3 = [
    "0xd042ad6882ceb163d869ddab4314651f0fe6a4e2b0764e9e699af4aab12651b8",  // 1024
  ];
  const roundInput3 = [
    [
      "0x1fd55e6555bb6a129d4490853f67911279f20c40f8511564d8478d3ae7b9b472",
      "0xd8d548b28a7bae1356e0b04f5c5813d40783f6dfd617a5df517bc87b5cd5dfd5",
      "0xd38a75e26e781cf30ae92f426f100ddd53ef58e98fc29e1fc2eb443c15a8bd53",
      "0xcfac1be2fb6b65083fd69734fd0fb9f07365a7eba948befdd469a5c996b7dc75"
    ]
  ];

  let scryptVerifier;
  let challengeId;

  describe.only('Round 0 - 1024', function () {

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
    const { challengeId: thisChallengeId } = utils.parseNewChallenge(challengeTx);
    challengeId = thisChallengeId;
    assert.isOk(challengeId, 'New challenge created');
    const challengeData = await scryptVerifier.challenges.call(challengeId);
    assert.equal(challengeData[1], blockHash, 'Block hash should match');
  });
  it("Publish hashes", async function() {
    const sendHashesTx = await scryptVerifier.sendHashes(challengeId, 0, intermediateHashes, { from: submitter });
    const { challengeId: thisChallengeId } = utils.parseNewDataHashes(sendHashesTx);
    assert.equal(thisChallengeId, challengeId, 'Challenge ids should match');
    for (let i=0; i<intermediateHashes.length; ++i) {
      const roundData = await scryptVerifier.getRoundData.call(blockHash, 10 * i);
      assert.equal(intermediateHashes[i], roundData[5], 'Hashes set correctly');
    }
  });
  [0, 10, 20].forEach((round, idx) => {
    it(`Request & Send round ${round}`, async function() {
      const requestTx = await scryptVerifier.request(challengeId, round, { from: challenger });
      let { challengeId: thisChallengeId, round: thisRound } = utils.parseNewRequest(requestTx);
      assert.equal(thisChallengeId, challengeId, 'Challenges id sould match');
      assert.equal(parseInt(thisRound), round, 'Required round should match');

      const sendDataTx = await scryptVerifier.sendData(challengeId, round, roundInput[idx], [], { from: submitter });
      // console.log(`Send data: ${JSON.stringify(sendDataTx, null, '  ')}`);

      ({ challengeId: thisChallengeId, round: thisRound } = utils.parseNewDataArrived(sendDataTx));
      assert.equal(thisChallengeId, challengeId, 'Challenges id sould match');
      assert.equal(parseInt(thisRound), round, 'Required round should match');
      const roundData = await scryptVerifier.getRoundData.call(blockHash, round);

      for (let i=0; i<4; ++i) {
        assert.equal(web3.toHex(roundData[1+i]), web3.toHex(new web3.BigNumber(roundInput[idx][i])), `Round ${round} set correctly`);
      }
    });
  });
  it("Publish hashes 2", async function() {
    const sendHashesTx = await scryptVerifier.sendHashes(challengeId, 1000, intermediateHashes2, { from: submitter });
    const { challengeId: thisChallengeId } = utils.parseNewDataHashes(sendHashesTx);
    assert.equal(thisChallengeId, challengeId, 'Challenge ids should match');
    for (let i=0; i<intermediateHashes2.length; ++i) {
      const roundData = await scryptVerifier.getRoundData.call(blockHash, 1000 + 10 * i);
      assert.equal(intermediateHashes2[i], roundData[5], 'Hashes set correctly');
    }
  });
  it("Publish hashes 3", async function() {
    const sendHashesTx = await scryptVerifier.sendHashes(challengeId, 1024, intermediateHashes3, { from: submitter });
    const { challengeId: thisChallengeId } = utils.parseNewDataHashes(sendHashesTx);
    assert.equal(thisChallengeId, challengeId, 'Challenge ids should match');
    const roundData = await scryptVerifier.getRoundData.call(blockHash, 1024);
    assert.equal(intermediateHashes3[0], roundData[5], 'Hashes set correctly');
  });
  [1000, 1010, 1020].forEach((round, idx) => {
    it(`Request & Send ${round}`, async function() {
      const requestTx = await scryptVerifier.request(challengeId, round, { from: challenger });
      let { challengeId: thisChallengeId, round: thisRound } = utils.parseNewRequest(requestTx);
      assert.equal(thisChallengeId, challengeId, 'Challenges id sould match');
      assert.equal(parseInt(thisRound), round, 'Required round should match');

      const sendDataTx = await scryptVerifier.sendData(challengeId, round, roundInput2[idx], [], { from: submitter });

      ({ challengeId: thisChallengeId, round: thisRound } = utils.parseNewDataArrived(sendDataTx));
      assert.equal(thisChallengeId, challengeId, 'Challenges id sould match');
      assert.equal(parseInt(thisRound), round, 'Required round should match');
      const roundData = await scryptVerifier.getRoundData.call(blockHash, round);

      for (let i=0; i<4; ++i) {
        assert.equal(web3.toHex(roundData[1+i]), web3.toHex(new web3.BigNumber(roundInput2[idx][i])), 'Round input set correctly');
      }
    });
  })
  });

});

contract('ScryptVerifier2', function(accounts) {
  const submitter = accounts[0];
  const challenger = accounts[1];

  const blockHeader = "0x00000001cef715f6b8c64f3b898f1ef6081ddbae507650523b9e3a53ccbbb910279f633067a8ca9f52efe146c4b3edd3925982add09b500d9b5c60738399d5f1066b2a754ebb17b81d018ea7d4592d01";
  const blockHash = "0x0000000110c8357966576df46f3b802ca897deb7ad18b12f1c24ecff6386ebd9";

  const intermediateHashes = [
    "0xd042ad6882ceb163d869ddab4314651f0fe6a4e2b0764e9e699af4aab12651b8",  // 1025
    "0x888e3cb1be7fd36c5200442cbe71a053e4d13acc7dae95c4bfe1aba05e98ff3d",  // 1035
    "0x1cb59ce3553315fc49d0bbe260c8eb6916ca20959660691aa94bf30d3d347362",  // 1045
  ];
  const roundInput = [
    [
      "0x1fd55e6555bb6a129d4490853f67911279f20c40f8511564d8478d3ae7b9b472",  // 1025
      "0xd8d548b28a7bae1356e0b04f5c5813d40783f6dfd617a5df517bc87b5cd5dfd5",
      "0xd38a75e26e781cf30ae92f426f100ddd53ef58e98fc29e1fc2eb443c15a8bd53",
      "0xcfac1be2fb6b65083fd69734fd0fb9f07365a7eba948befdd469a5c996b7dc75"
    ],
    [
      "0xc166bea45d1d52113c4fe75aef99ef2b161d092683be079d1533b7b0a84ec496",  // 1035
      "0x2d8be071f289f4352bd17ce681969a2877f5941172630ffcc0891102ef6c9080",
      "0xab3505cc4be89f4c0ab7b06090198f9305be83b551710d38e27d7dfbd90cd171",
      "0x3f169a5d83f696fb1d2a36ac228b0e6fab18bd5fcf241186c9d3eb46b1cca2ad"
    ],
    [
      "0x477c202a7252a6cf3aecf2f77a6335a50abc18d24b05ee3a6107ce577b2b77bb",  // 1045
      "0xcfb07ab51ffa498cf1f3d1380458e70a199ca1edc1ea26c996ad32d762762f0e",
      "0x855af78ed5fea14a735be367ec033069e65b5aefd4163a6c644aee6d5a6abf22",
      "0xfa0d0f91d51b541c3f62a5f64cde598eeff8de03ca33c51306653550ca300a38"
    ],
  ];
  const extraInputs = [
    [ // 1025
      // 482
      "0x58d595ecbe8a23d6fa19f2e190a4f28cab9d3f122a4d5fcd00d0707ad9ba0821",
      "0xed6ddce2d42d8c62150c81a5d45a6a66994e538f2652e199346d34e792572722",
      "0x6692b9e608bf2b80424db2ce5cbd448d0edb8b2f2f0206a0d57f80ebc79aefb0",
      "0x956d28dbb5c4e4bbeada25a0643cac353ff4b2c4e69956e0ad12bd566b6132b7",
      // 276
      "0x7d1a5b702c15bc7de9066d90acf9f160b4242e09daeec481552c6e965a98ebc3",
      "0x7ec9ec0d374b6a90fd2d72019c9225627abbcd61cd0f2174d96a7941994e44dc",
      "0x3540888750cf1f5e25a53860e20f994607104e57f7f8f1d85a860367f1f504cd",
      "0xb15c38b6be011e912951fec54ce272a075eba3230f93b312e08c8194196a694e",
      // 977
      "0xe30a4a6ef95c29cd391033203fd6bccdcd7250a0a95b61c01029cb6bd3205ff2",
      "0x6c0afb9740195976da1cfe7c3da9e16a90337b1061a1ee3673d8e92df1a83b44",
      "0xe99c838875d3b2302c2e2266d04407223323d2fb2490bd4546c6e8f6372ba050",
      "0x711658e69d57a46211d14e361c14787b531dcf3aec504d59581c4aacf08fb3b6",
      // 907
      "0xc1e558e68105501a842ef72b404b6b130fe84232bff6077f8c53746250f524e9",
      "0x1c1e7df5e448b6639848298e2daa4c9bd4f275888168008bc2fcd0a1a0c28fb0",
      "0xb3e0a1607b83d8a08c24fa4d17a888b9a46923051a4f31e21c4e62d9fc36f3f1",
      "0x05877fdf47d34b153fb70b1fa43b2c4cac9521a5c6372364d2c20412547bde0e",
      // 714
      "0x1e9f5d35fac61ef8593e92925179f6fbbfa6106c2bf3499dee1cafd957042610",
      "0x636b9e3a558f1f897148bbfb315863163dd89b34b610b48be423b068e927805e",
      "0x71b966d1a3d6ef24e805192120b53a6acc6b96bc36d462c9ef91afb5c246ea3f",
      "0xf971dceedda5a74e1e58542122526a08b009c0f59778b3d8dfd4563389f0bf55",
      // 242
      "0x4f9bea6b88ccdd894103db5c634ceee2a9ba25e5e9cbef701bec8f90204773cd",
      "0x8ce74f6618dcb682f8455fef7ef84651bb4a9cddff87712d416c56c3b3641b8c",
      "0xd3e4ffb90a260081566a5bbe5db6a6d88f594d145a0eb1ba38227e0ff9b91899",
      "0x765e8eb76cdebb51d4fd9f095e10750b14a987ce5125e1e43647419e946761cf",
      // 542
      "0xa00840b66ef83aaa6cee70787a784106109be5ab22fa6dcbf100ccbb95bb8d29",
      "0x1df937c5b354c31cc4c0036fb8cb70cf4e4e861fab913ab9ef7c7a3ebb9c9915",
      "0x81d59b13103484de0adb5e72ece1f799c22191fddc05b61673580db00518fb7f",
      "0xebe22d555e018d6122f203155ed4c2ccc041f33b59d51b7b22e4e4e1364c5f08",
      // 609
      "0x83ba58089dee1f7b235f5d39c1e2c40f5605b862e2fcc1185205e2c5f8ff56f3",
      "0x7ae7f0682ec09a9b7573cc7013812538b73161b8653faad3b962283756e4f989",
      "0x7587102be0db4638c2f8427134972449e12fc7a70fd8e48fb40ad84e74f0a249",
      "0xa71172563f683179fa3bc488ae06bfd388b79992492f55c4c3aff1b88b0d88de",
      // 533
      "0x6074eeeca0485140f90c1d88f13919a6b31bab067727c6354e35e782224b75c2",
      "0xda827d960173523739ec14c5ecf24a14e625e6bcfecdae6f1aad79c1d1b93bcf",
      "0xe5a335f442ab19132ae88a02d94d353ea7e0d6214c114d08fd9010b789041b0d",
      "0xa392c91f6f1de5525cf068f72996290f13655eb19b9594a2b5314c1cb71357c4",
      // 993
      "0x6fb087c64b53b6b38c5cd9d3f9322a10bd39202bc7f3196123ce0ca66ba6ca20",
      "0xd3d3a1ae6fcd2eba46a74f9ebbd6f361066bc2a8eea2e2d4e119c286d584a46b",
      "0x84545c77cc0a9dc23e114dbcb6c423c2e9860cb710f9a2ddce1f4ea581193e86",
      "0x2393fc5642750227cc758c74eceb004799cf7d1121ac8c9548a7ab061337d642",
    ],
    [ // 1035
      // 460
      "0xbba42e21bb56f18f7a5422d9f824adaf5867db65c857b6d5298700f16ca83401",
      "0x69bcb3ac17cadeaa5d6d46cedd62f316a4bc039cf0a79f47aa4e1ec2add66ed4",
      "0x63f489ffca21dedfc52cd50a714fe9e1cdb03989497ab6e772abed209531d917",
      "0x672e5fa12abd300497dc39e0d10b4be7feac462c880988d1f682d9329ccb8f6e",
      // 1019
      "0xbd009a919ebb845338020fefa500261749635ba6a3a8774fa7defd1f206defcb",
      "0xef7c263cae1ecb2cfd1ef9f2905299c278c7c05b6c3e1d1f5796319541fe9742",
      "0xcbb87cbc6e4c03aa9630bbc334ea6d8bf6ae5c3f5e17d38fc9df25d7d50d0001",
      "0x1e708eb93fc4c1ae2b87bad3615d06985296e6899bc308159c45518adbd3836d",
      // 589
      "0x503ce82c5578378a136fb40026df5c2367d1b35912f0677f02b987d2e44687ea",
      "0xd4e3e41309b4fa023de906f821dad13e0721aeba69215f535f6c6b562ea33d20",
      "0x2121831c8b2b8ac87f1dda1b5ac615e239e5b94c747627f78594c2a66409e751",
      "0x8b139098d68c230e42747f030cdfa44231443afe65bf33b8f06120aa10bb44e1",
      // 914
      "0xaea71d0a92b36c2fb02f5a870ef80c32bd435b1f97f0021b7008395457041dbc",
      "0x0374de5aa1e998a77392b3439785fbe11dd3d3e37e762ea741607094fba610e1",
      "0xb23cbba5a99d274951c5f08dae3d2d07509855fc8c3826d622b5fb0abf9281fb",
      "0xa9150f681b232cbdc362fb9be83106ce4f0a083c6a1dd4ec65187b809f90c6ae",
      // 617
      "0x18cfebaeadd0d2feb9efb2b521b597ea2777eba2bb7bade27ad3726ba47a4685",
      "0x3ba91526cfc573084706556b5cd91637683a9d3e37477dc21f40a2c1742d7007",
      "0x27a6d67eb3ed348f7ee66a7e8cf80e45d9def2c22e46b4a8fae68ed85d1d4b95",
      "0xd184f4e1d7147a4e72942b9c187bef306e2a5155ba5dc04dde41defad91cf939",
      // 361
      "0x44294e4bc00390f56f46f31e581f90b1294fd5c75629d9e40398c3964f563251",
      "0x4dbf70482414f000707f1860688f99a4157063b6069373cd2216c8be9ba2f7f7",
      "0x41601571411fa6124ce739ba4f529210a2c215bd64335b3ed6c555943d6f897c",
      "0x8a2f64e13cfb94a7e18b163333b09fc29bf80362ba1ae79840e8386cd76b25dd",
      // 369
      "0xe0fe23fa8442aab1adc9825db20673881eb0b3a0b76db498ecef58625dd13e17",
      "0x20d820ebbfff6ad256eb03ba088445869e42531bb143e076c049df64c182b5c3",
      "0xfff5b2e3945fd23c20ce0258cddec81246a48232dcb7a56b1cb6f316015a02d3",
      "0x2720f2c28e2cc36ef0dfb175eca97e2bb8186821c3eb5c36158feec04f5da355",
      // 932
      "0x36f5e4cfbd2d7cc622ed4e27a1258247965f3b72320fafc14725c61ad2f8bc62",
      "0xaacb2507b103336ce5273f562d85740518f1b946c1c7a41644da38e92f3b389f",
      "0xf221b7d203902609dbbcd04ccd5f922118ce0aba43b92449c8498af6938be5eb",
      "0xc392d4233a24fa26bab1ab0a143febb1fcd3d31196cac617562885cdcec16219",
      // 801
      "0xdf07dbbfcdc6bce20106f3bf920e57172e69e0e75398feb329284f20ab99cb86",
      "0xd2c1e9b28dc3d3f0f7b926a81749029f43197c26844f4bcbaa27fe14fc3398ee",
      "0x864d560a9d553eb483e958d515b35d882125d4f58d215463f9a0e49220e85a41",
      "0x804662a6eabcf31335642ddd5dd51ff96d56ac022be1cebeb482d847625a2a0d",
      // 819
      "0xd2aac1fe3166b80f8b967e02a0a6d6c6031c3d3829aa7fd8c0253b0f0b8c2906",
      "0xf76e36b45f8cea470bd87a5174009b93ae96b0c33fbd82531646d03e79ef9c96",
      "0x4f19fcd6959747a6426136e6b023cd7e1957a9c59079f6176cc06fe05ba73152",
      "0xdbe0de6fc4ed488fddb33ba841a09910f45e4695bf07da7296eb039f7c9703fb"
    ]
  ]

  let scryptVerifier;
  let challengeId;

  describe('Rounds 1024 - 2048', function () {

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
    const { challengeId: thisChallengeId } = utils.parseNewChallenge(challengeTx);
    challengeId = thisChallengeId;
    assert.isOk(challengeId, 'New challenge created');
    const challengeData = await scryptVerifier.challenges.call(challengeId);
    assert.equal(challengeData[1], blockHash, 'Block hash should match');
  });
  it("Publish hashes", async function() {
    const sendHashesTx = await scryptVerifier.sendHashes(challengeId, 1025, intermediateHashes, { from: submitter });
    const { challengeId: thisChallengeId } = utils.parseNewDataHashes(sendHashesTx);
    assert.equal(thisChallengeId, challengeId, 'Challenge ids should match');
    for (let i=0; i<intermediateHashes.length; ++i) {
      const roundData = await scryptVerifier.getRoundData.call(blockHash, 1025 + 10 * i);
      assert.equal(intermediateHashes[i], roundData[5], 'Hashes set correctly');
    }
  });
  it("Request input", async function() {
    const requestTx = await scryptVerifier.request(challengeId, 1035, { from: challenger });
    const { challengeId: thisChallengeId, round } = utils.parseNewRequest(requestTx);
    assert.equal(thisChallengeId, challengeId, 'Challenges id sould match');
    assert.equal(round, 1035, 'Required round should match');
  });
  it("Send input", async function() {
    const sendDataTx = await scryptVerifier.sendData(challengeId, 1035, roundInput[1], extraInputs[1], { from: submitter });
    const { challengeId: thisChallengeId, round } = utils.parseNewDataArrived(sendDataTx);
    assert.equal(thisChallengeId, challengeId, 'Challenges id sould match');
    assert.equal(round, 1035, 'Required round should match');
    const roundData = await scryptVerifier.getRoundData.call(blockHash, 1035);
    for (let i=0; i<4; ++i) {
      assert.equal(`0x${roundData[1+i].toString(16)}`, roundInput[1][i], 'Round input set correctly');
    }
  });
  });
});