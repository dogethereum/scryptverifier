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

  describe('Round 0 - 1024', function () {

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
  [[0, 0], [10, 1], [20, 2]].forEach(([round, idx]) => {
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
  [[1000, 0], [1010, 1], [1020, 2]].forEach(([round, idx]) => {
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
    "0xd042ad6882ceb163d869ddab4314651f0fe6a4e2b0764e9e699af4aab12651b8",  // 1024
    "0x888e3cb1be7fd36c5200442cbe71a053e4d13acc7dae95c4bfe1aba05e98ff3d",  // 1034
    "0x1cb59ce3553315fc49d0bbe260c8eb6916ca20959660691aa94bf30d3d347362",  // 1044
  ];
  const roundInput = [
    [
      "0x1fd55e6555bb6a129d4490853f67911279f20c40f8511564d8478d3ae7b9b472",  // 1024
      "0xd8d548b28a7bae1356e0b04f5c5813d40783f6dfd617a5df517bc87b5cd5dfd5",
      "0xd38a75e26e781cf30ae92f426f100ddd53ef58e98fc29e1fc2eb443c15a8bd53",
      "0xcfac1be2fb6b65083fd69734fd0fb9f07365a7eba948befdd469a5c996b7dc75"
    ],
    [
      "0xc166bea45d1d52113c4fe75aef99ef2b161d092683be079d1533b7b0a84ec496",  // 1034
      "0x2d8be071f289f4352bd17ce681969a2877f5941172630ffcc0891102ef6c9080",
      "0xab3505cc4be89f4c0ab7b06090198f9305be83b551710d38e27d7dfbd90cd171",
      "0x3f169a5d83f696fb1d2a36ac228b0e6fab18bd5fcf241186c9d3eb46b1cca2ad"
    ],
    [
      "0x477c202a7252a6cf3aecf2f77a6335a50abc18d24b05ee3a6107ce577b2b77bb",  // 1044
      "0xcfb07ab51ffa498cf1f3d1380458e70a199ca1edc1ea26c996ad32d762762f0e",
      "0x855af78ed5fea14a735be367ec033069e65b5aefd4163a6c644aee6d5a6abf22",
      "0xfa0d0f91d51b541c3f62a5f64cde598eeff8de03ca33c51306653550ca300a38"
    ],
  ];
  const extraInputs = [
    [ // 1024
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
    [ // 1034
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
    ],
    [
      // 1044
      // 910
      "0x911dd4274354d798d4ae81115ccab8cf9272699055b3b2ceaa3b11c77a1ae877",
      "0x074b822ca17e118fc89fe065414ff1dfe29b8a6886cfb1b4067467169ed05c15",
      "0x116fb3cc6d8a77658b860980f20e1f26f47161560911b94150be46b9e2692c3f",
      "0x0b7b57f63012c3e040676327d2138336f9c4d5b1165b76f7155c159f94d901cb",
      // 187
      "0x2d4a9fa56c746404468227a3ca42e002f7f58108ab1b778fc1fec7d159e46fa2",
      "0x7202a39c7cbbe341beb322f15fd00b262cf09b14e52e5f77423d0dfd733f47b9",
      "0x8078dc5b2da661491cb5c48a0dec8587eeea443304abcfab2e75bd40b5831296",
      "0x8ca3c47490e28d90a46f1c1657f66909175b73ebd181d66534cb851926f51357",
      // 800
      "0x27f0d601909d05b4c37149dcc65afd301d612a089fd84367caa85e242dc33ae4",
      "0xf2869e61c8a2d0614c852a5dddfb9f0cc248c3bb1e1b4fb6c544f767572caf3f",
      "0x44402cb2b3610d0075fd6b0d177d2818f1b8c428c2b079d128048cfc3a2315d1",
      "0x24bdd903aea1504cbdec9f7a92ecc7c692cb6f19ed9ac5e6890b16b428ce7848",
      // 921
      "0x5736b17d198c74b71bd2ee04ee8bf43fa9d3c0d70da8582a778bbbe89b29bed5",
      "0x6d90272dbf9e9417d2a360462dc3c42fedf2cb08390de94cb5bf9c0ea42fca41",
      "0x9f1aef6eebb833a12db7e71e862f67a4edd2fc05c891f7b638c79075d9de5a40",
      "0x2e15e0ccf89cf974cb6213f32a5f77f53500c47e1a58c9a93131c1ee5136c887",
      // 727
      "0xd0f9ad7854b1c918dec8df09d19ac0e49813ded9adcb34170f01d65cba314451",
      "0x55d83c3120489d8bff03b7de4fee0b9ab3a8ebc38c44cc70860888b51c0f865d",
      "0x14bff08f918d7a7ebfb6cade9d01b2e0180b828fff7937fd659e03df78a92584",
      "0x734a8e6205e0ddc056ae2a770d100395ac71a85897b54dc77953af53b933ebac",
      // 126
      "0x728bf17c8849b23da41a4be8e899cff9f3d945d86d74dfc11a2c545dcbb32c93",
      "0x277521fc6f994cbb6fc6dfaf64d9714a4ad4ce7c43fe6db66afe6b66df62fbbc",
      "0x66b4022448d73c8ff7291a7b77f7a5f4b39f693c6e790e5acbd5003e1e1c1164",
      "0x38e8a76fa2f7a4a0d18aa0c88fe0d791c165d0e052c1bdd2f77c62d314a9a234",
      // 270
      "0x07eeb35bd86ae2823afed4ee10b0aea5e9774c825b84e1cf8175773ebe0dd9bc",
      "0xcf518c318150f4ae83731c10d375fd7efeb3fdc9a3ed702ca01b8e604e36b35a",
      "0x2e00eb37584291c78a67cd7cdda5508bfa2598aefe069d8616297896b0c572e4",
      "0x6c6efc53eca49cf9db232ac691a29e23777434de108c4c052deaa75cac97f0e9",
      // 772
      "0x45a5c1210a8ca99b1db49842722e0fbcce3fb785a1b2d32a47f1586ae990be7f",
      "0x356d446cc319721454dc43670cb142d46413956e96bf2f7eb5be017c55d7f918",
      "0x4f6dc94c69fac701f67d95870e8b33e05bb4752db3efc8305c3fff2daf118b54",
      "0xae346d7c89e6f4e1852cb1508e5081719394d5f9f693d2aec7723ce8c515ec71",
      // 747
      "0xb1297257c21fba6f1c323c6b27d6cc80d2b4f686f1204129bcbfd6285de75237",
      "0x35bd37891bd2d3b6f7b44d68a34a5e325c4f5833446c4193ffff3713badd59ca",
      "0x3e526cd8d76783bf3d4d8fd80603668e8fb2d583b9665bc317b92131b4e39f11",
      "0x5567f0a65e2e50d4664c6b63eb6f26d964ac08e0b13ba35081366aeaa7247909",
      // 538
      "0x19069f1d33c3c0626757871dfbf6d5c9a2282925f933c28bc6030ad095d394ce",
      "0x19584119ea6aedda44ac156805023ebe2947f05d9029ec8430f15d2d9a5f8bc0",
      "0x16937c34bf005e3dcb17b584debd6b833fefbe595609eb31aa4faa2c1f3c75ff",
      "0x149c1de4d52f0d6720d8a1b2c4777c79457888a2896008275ce7ca2109920497",
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
    const sendHashesTx = await scryptVerifier.sendHashes(challengeId, 1024, intermediateHashes, { from: submitter });
    const { challengeId: thisChallengeId } = utils.parseNewDataHashes(sendHashesTx);
    assert.equal(thisChallengeId, challengeId, 'Challenge ids should match');
    for (let i=0; i<intermediateHashes.length; ++i) {
      const roundData = await scryptVerifier.getRoundData.call(blockHash, 1024 + 10 * i);
      assert.equal(intermediateHashes[i], roundData[5], 'Hashes set correctly');
    }
  });
  [[1024, 0], [1034, 1], [1044, 2]].forEach(([round, idx]) => {
    it(`Request input ${round}`, async function() {
      const requestTx = await scryptVerifier.request(challengeId, round, { from: challenger });
      const { challengeId: thisChallengeId, round: thisRound } = utils.parseNewRequest(requestTx);
      assert.equal(thisChallengeId, challengeId, 'Challenges id sould match');
      assert.equal(parseInt(thisRound), round, 'Required round should match');
    });
    it(`Send input ${round}`, async function() {
      const sendDataTx = await scryptVerifier.sendData(challengeId, round, roundInput[idx], extraInputs[idx], { from: submitter });
      const { challengeId: thisChallengeId, round: thisRound } = utils.parseNewDataArrived(sendDataTx);
      assert.equal(thisChallengeId, challengeId, 'Challenges id sould match');
      assert.equal(parseInt(thisRound), round, 'Required round should match');
      const roundData = await scryptVerifier.getRoundData.call(blockHash, round);
      for (let i=0; i<4; ++i) {
        assert.equal(web3.toHex(roundData[1+i]), web3.toHex(new web3.BigNumber(roundInput[idx][i])), `Round ${round} set correctly`);
      }
    });
  });
  const intermediateHashes2 = [
    "0x3962d8675f2e000fe12dcf2f94d57c6780c0016920d1f5fd2a024f15ad8aa27c", // 2024
    "0xb493b7cb1c16c599fbaf01aa5e7b1d523cbc50eadb401a78e6940c7ad1641fef", // 2034
    "0xe633df71d6bcdc56bbf94c767bc800e927dd4cb1ab0910f36bb72bffcc1e16dc", // 2044
  ];
  const intermediateHashes3 = [
    "0x8c5a6aba1f4b92725d792cd4d109e60095855ee44776c1ae187ba2be63b76406", // 2049
  ];
  const roundInput2 = [
    [ // 2024
      "0x9a274bd7c6f179dd37b228328f73ee6edb882ca07b671fe359030c3872bb670d",
      "0x56885b4a4c16d57851fd06811ef55f5c8a8392da16c8a4e1640f4fdcbc73d7ae",
      "0x4837cf82244db84c99474a02d6320d948a47914d25c8f31a30c47b3d21d67840",
      "0xf9ea131bc14bdef013a943115aa1e52384ea43466449eaa28c99720be93a1ee2",
    ],
    [ // 2034
      "0x3bee547d2176f13e3f16eee68cca3bef5f1f32f5b9dd08ab39f3b882518bec78",
      "0x9ee52c76792b8e0148af5167d43ac98423e6147468a911319caf7293c1c47155",
      "0xa3044a7d915a2060eaa9e33616550620b09a80fff99796aa9c0df03766feff51",
      "0x8d21c2ab79f3d4e78a5e4c21e7fe6596650ef014d46c5b76c420c50a205bff56"
    ],
    [ // 2044
      "0x4b29029f27036e7f9d6783644126aba1ca03ce0f03bb13da1d1a14c96c64379d",
      "0x401572c108f9b69f0217cd1adf0e1b3acede24b75877ca4a7aaa849aa6d1115f",
      "0x3a3d25fa05d675864b76f9feeb45d4be725a7ef6553584f948999788d0a8ae29",
      "0xb304d486b67e2ea263c690d10755588d6b72c2029c2b54b50e767a86be6025a8"
    ]
  ];
  const extraInputs2 = [
    [ // 2024
      // 898
      "0x893929b4df133787ed23c659d1bcc00caf4a99eb33e2fc4756d03e1412aa8d01",
      "0x5357490353b2a75e6657716a1fe3ba9f070c1a7b195659b167c70a8cc82e3ef2",
      "0x1fbea8e9f8f926105dfcce1289cde802225ce2312e316cad43585f8963a191e4",
      "0x972275ffab323c230fa72f6015b8aed2e69e271d2b863d4f44376654fca16d9b",
      // 614
      "0xee48ba9010ed856ea6ed0485ca27020fb063a459d6f3b0ad11ab6c46023013ce",
      "0x1bfc01bf6bbc17960ba0dfd4db3b830959ac90d6458f8b9d01c43c69b54d4da6",
      "0x685d33bfe55e617d27fecece811ea97f6b7f686bd8c93ee652efab258f0f6f0d",
      "0x9d9e02bd367bfc6205ceb45082a5f62205f0f225945386a969a423433a53ebbc",
      // 1013
      "0x7d1bc1059aaba3549bd315d7f321e5968f101a929541fec23f833f32ff35d771",
      "0x1b42caa1d8ad165ecf12b34a03b32b9672c78707e571f7e5c4e4402c7e5969a7",
      "0x21048340b982bee89461378c89667b6d70bbe93dee27e7dbf3e1fe9192d3afa2",
      "0x6c2db517e8d7ff4f45c9116f844ce00ecb906db632dee7663cd217349c633d0a",
      // 475
      "0x5ab4ee37908f60b25642eefa25dfa16b14392db41692b4cbf9c90ac0f4b9aac3",
      "0xe899f5f7f8a307a2aa4cc0f07df9a720e6e5beca4af76fa00c9797d0ac274e53",
      "0x8e5a0385d0b69635b62b744184256dfaf40b1b48173583c1d8342eb4d0a9964e",
      "0xdcc75a0fdb12d8b9c9e3cbae49102fa83313c01942fe197f06ecce6e4a4daf25",
      // 915
      "0x65b06cdbc829c8944d5dae520556879e6ef4ac292f52d87540e35ab9783ec020",
      "0x8368ec11d01cccd819957b22606ad0a8e90e80cf063a856aeb021d9232cc4886",
      "0x670f0e71a763cda204a18fce4fc70245a90e5c4afa1586a2318751c0c740a7a4",
      "0x93b29beedbb45cd9f1d8d376321d9be729d6fa4ed051c578ab072c0149e8001d",
      // 853
      "0x3cf780f5abd0180272b3c0623422bfb44b516933bd1a453a40d2034d217bbd01",
      "0xbc980bcb3605c9e38701d093ff189cd192b65bfe7d30954ba73d4fb4b777da14",
      "0x97ce35234f75c7d52ba9b4dccf5be51d27bb9c989f14c995a6756d757d432ecb",
      "0xa5be702ed54850e7488779a848fd58e6ad3dd26d32a7d79c3bdb295097504471",
      // 171,
      "0x6ed95914c326cc916805a66ca5a739194b710509e1a49d9a7f5e76f7bd40796e",
      "0x27778741134863bd0d269dd75def6a52e2dddf08204ea73a8ea8ae148a957297",
      "0xa66885a620090d345ef6bb4bfb3daca0c5c29443115691f4d8761f68703e9e0f",
      "0x69e0a513ab79354225b01a2a11077b080b5915b66adf4fea22b88f1a8dfcd72d",
      // 162
      "0x1e777fe7327f5e84814bfef7aeccdba2d8eedd12040c94614387e1c07f7d7442",
      "0x36c72f9235e1bebe0312d0f3179ef061ee116e8b1800dd6dc4c88f390af54038",
      "0xdb2b6bdf4be41f5d5ebcd148203b30bdd827d029f2074e11d7e4f74dffd0d6d5",
      "0xda62404fda0fba42365ab95eefca62962c01da65d90b15a3d2b2cc00401c2478",
      // 318
      "0x3dbdd750e62ce0803005de68e1517ead219dce54bcfe95d708757251dc78e7b1",
      "0xa4e595c0d7ee030704f97d1492ba183f46b5b1a5ecfbb187655f0c5b7bd970e3",
      "0x4ed7927aacbca87efe3440a5214c31576112c72708c7d8eb2bdf33e9d9e104e8",
      "0x30325a9ec5dea421ee456815a46a793659986fc736a4a336eccf4dfd57388cbb",
      // 465
      "0x08c4c67f29a553676040d2336d938114f01bb21df344fafdc687f0ffbab2fb83",
      "0xfcc99b0fc5c8e68241118ed6cb43c95034ab04b9c51b43eb0dc4c7c207ec2aaa",
      "0xac17461d9a8c911ee181517db4eb9a05fa601099499ae51813ffb297cbf89f36",
      "0xa9ffd906ef47d4e590ef3a5315aeb7f474878e201b3f6903e9f90ad9bc5bd84c",
    ],
    [ // 2034
      // 637
      "0x8da22a37eb8937642a2fd68f98beb1b5e9381c40427030cb6a26c877245cc0bd",
      "0x1aab333bb0c26c5f8b2782ec2dca3a42a0dfc10a634489ca8dd579192878b101",
      "0xaf541555a0b9b73b1dff2e942e2072ce745689fccd6fba641049e42c6a178786",
      "0x237f0335cefae9d4a5ef81be6c8ec2ce75272f5ffba0328488e1ed5bc85d19be",
      // 418
      "0x0c0c66915c19a1dba19c731aa6e217c6b0e5768ec534967ad042736a67f29de3",
      "0x874274c61f2044ce3bd3e9d5d76d37e40cdcbbe5cc7c95d52ac3c232bd50aed4",
      "0x686c16496c2dbf06db9a18b6abc99e33fabb3c124e4c6d18e25765c407bebed9",
      "0xc4159922bdfbfd91b282419a6960ed77b16bcffb96cd409733b0b6b30de1bc49",
      // 731
      "0x8cb26f2ef566201e55d496108da8c8c653f1ec32ea0a5c3b1002090637d63acb",
      "0x2b20c52c72400ee0ec9d5ae6220e0edf09e2c72aea95ee665c79a4956f08db3a",
      "0x9e060645ea7310ba139ad7629239d4b0e81d1184a13471f0f1245ec5102923cc",
      "0xdc9b35e6ff441ad9cafdd4748f2faac4057678185efb0f510b9d7466439906d1",
      // 113
      "0x08b9f1d52444534a676f4c4acc471b2f6b0d59d81e2e8963247c7bfb601258c4",
      "0x2ff3f948b0176437264ad0f60e11ddd621217e05be51f01e74f0f5856abf8a2f",
      "0xad6f89c8948ad3b9480a44e0ee9fdb42c405b08ce96ffbef9e631643a96a8954",
      "0x86f628f26549e7011647a4d35d9615b7190a462a00604a549e02a457d9c8f72b",
      // 251
      "0x141016b5b5382d52e634c3b85232fb6e6b7bfa3bdc2fb980101b2b58488b0eb7",
      "0xe7a633facaf5f6a78064fbb2abf1e50c8897ffb2439996d217523b9a92ee6e14",
      "0x9402061cb3636b669ce373241d4bef62feb153eeda2b378749154cfcfde54c2d",
      "0xf38c1a4d0e8bad4b42ea35aa7759dfdc9be008ce705192b5aeb19b4a3af24b2e",
      // 1018
      "0xdb7fa92e9a205a7fca3e83c7ba9cb612d6558e9624bfd62c83081cfe9bd4be5e",
      "0xb8eac82945ca705b5a7d8e92c6dcf1c8c383f70cf75c4f1fe2fadbefdf8b8b8d",
      "0x885a9e2b99870e8002971a8497ba328ae9cdc6ac645ab6002963504ac8973163",
      "0xcababf2c6672827e320b698e2e71793a861ac00cdc961cb13680d0aed3a05564",
      // 282
      "0xf5bce70271e011e00a6c11d26837ce8a3f666800997c5b6c0fcd623e8cf55056",
      "0x63e54a5b918bce750f488ae4a38003f2a9fc55475def097b9611c7f7f6c000ba",
      "0x77eebce797e9c3ebaa3060ae199fab4902b5c9c4a2ad208d11b85ee843e8e869",
      "0xed6dffbea090c4aa29373e75368b9535be88aef6f4ac60db2c966f9da55b97c2",
      // 225
      "0x437709477e2c999cd03e2f061e8c335e1bec9c14917494955554996cf79efbb8",
      "0x8216e7924a4ff303f48e009b6ba31b3836b90c15936f269517fcd22aeee497fc",
      "0x2c79e74667548b0b2394a41e879a261deda27564ea4f2dd2dbf33f2091c2762c",
      "0x4b7261a87a124cd0e87942cdcbd94013c2c85b7993acd6d4933952bc9a4b7f02",
      // 144
      "0x87ab14fdd37dc51c6aaa1d05693e7db366874ba96f39511a3fe8b1829028db2a",
      "0x2dff1d201ee76dbc7f8aa3f37d37694c07328dac05745fdc127cd9b1c770723d",
      "0x950944091fdfcb5f7dc685f1958e907bd8e7e356d500ef63026f97688f4099a2",
      "0x1a320738d7519d0749e3923a5dca45e04c1e533c224a91ed7ff5a0a7aaffa070",
      // 54
      "0x6896dc2b64f25b8c93fced2e77c2bdc375c8d1937b9bf27d7d288debb242a6f4",
      "0x94f1a63f01ef8a66b98d1454f1cdc8e4216791ee491b217e3fe853c898735da4",
      "0x1ce9d4ac7f33ac049a07be1dc2009aef6258739734c564c74f201d08c50420a0",
      "0x232c7c929351257d1e63f3ecce5657af892b1f2751a273c8fce2eecfebbaa27f",
    ],
    [
      // 2044
      // 506
      "0xb2e4d627283030650935daa9afff6e202f7db80efe62cd9e0ead1bf3cb26cd48",
      "0x40ea06b6370f85ca61bd4e511be256524bc06aa84334ee99ffda5938faee184f",
      "0x2208e8942c71ee570f3ebaa9aef012e45d6ed48cab36b42562fba22b46ceed51",
      "0xa18da88111ccf63f329ffee11d1b55f556af63caae4b54064937cc898815d378",
      // 666
      "0x36b9bce657fade7d344f01bc464978523fa7742017ca06c3de6c5cdc9c251c56",
      "0x447326897a095977dc3afb9aaf8efd47377f982b1b55afcd0ebc7f9417e3b182",
      "0x11155c070ed47ee86977b7f20c37b8a036d17a8b3ddf72afddaae07104fd5685",
      "0x6eebda7d0decbad78be0b50de998651be8fc6ef16fb916aa53fe0b79ae95947a",
      // 898
      "0x893929b4df133787ed23c659d1bcc00caf4a99eb33e2fc4756d03e1412aa8d01",
      "0x5357490353b2a75e6657716a1fe3ba9f070c1a7b195659b167c70a8cc82e3ef2",
      "0x1fbea8e9f8f926105dfcce1289cde802225ce2312e316cad43585f8963a191e4",
      "0x972275ffab323c230fa72f6015b8aed2e69e271d2b863d4f44376654fca16d9b",
      // 664
      "0x67ab2b314790d5f600804994afa3faa3d804d6c12e9d75504f1646c8aec04613",
      "0x38bc9f4a7b48b50bc323c0f89eeb50f2655ab176babf31ff9f74abe633bfd7ab",
      "0xd10b652652a5730ce5d1f2b48664caaaf24159277d5a73f11cc90e363655d61d",
      "0x327af59c0c1bde4a8c25e5079942daa167d246a7a4a5af125931872a825727b4",
    ]
  ];
  it("Publish hashes 2", async function() {
    const sendHashesTx = await scryptVerifier.sendHashes(challengeId, 2024, intermediateHashes2, { from: submitter });
    const { challengeId: thisChallengeId } = utils.parseNewDataHashes(sendHashesTx);
    assert.equal(thisChallengeId, challengeId, 'Challenge ids should match');
    for (let i=0; i<intermediateHashes.length; ++i) {
      const roundData = await scryptVerifier.getRoundData.call(blockHash, 2024 + 10 * i);
      assert.equal(intermediateHashes2[i], roundData[5], 'Hashes set correctly');
    }
  });
  it("Publish hashes 3", async function() {
    const sendHashesTx = await scryptVerifier.sendHashes(challengeId, 2049, intermediateHashes3, { from: submitter });
    const { challengeId: thisChallengeId } = utils.parseNewDataHashes(sendHashesTx);
    assert.equal(thisChallengeId, challengeId, 'Challenge ids should match');
    const roundData = await scryptVerifier.getRoundData.call(blockHash, 2049);
    assert.equal(intermediateHashes3[0], roundData[5], 'Hashes set correctly');
  });
  [[2024, 0], [2034, 1], [2044, 2]].forEach(([round, idx]) => {
    it(`Request input ${round}`, async function() {
      const requestTx = await scryptVerifier.request(challengeId, round, { from: challenger });
      const { challengeId: thisChallengeId, round: thisRound } = utils.parseNewRequest(requestTx);
      assert.equal(thisChallengeId, challengeId, 'Challenges id sould match');
      assert.equal(parseInt(thisRound), round, 'Required round should match');
    });
    it(`Send input ${round}`, async function() {
      const sendDataTx = await scryptVerifier.sendData(challengeId, round, roundInput2[idx], extraInputs2[idx], { from: submitter });
      const { challengeId: thisChallengeId, round: thisRound } = utils.parseNewDataArrived(sendDataTx);
      assert.equal(thisChallengeId, challengeId, 'Challenges id sould match');
      assert.equal(parseInt(thisRound), round, 'Required round should match');
      const roundData = await scryptVerifier.getRoundData.call(blockHash, round);
      for (let i=0; i<4; ++i) {
        assert.equal(web3.toHex(roundData[1+i]), web3.toHex(new web3.BigNumber(roundInput2[idx][i])), `Round ${round} set correctly`);
      }
    });
  });
  });
});
