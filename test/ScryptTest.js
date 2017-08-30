var ScryptTest = artifacts.require("./ScryptTest.sol");

contract('ScryptTest', function(accounts) {
    it("Salsa round", async function() {
        const scryptTest = await ScryptTest.deployed();
        const input = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        //const input = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        //const num = "0x4141414141414141414141414141414141414141414141414141414141414141";
        //const output = await scryptTest.round.call([num, num, num, num]);
        const output = await scryptTest.pbkdf(input);
        console.log(`- ${output[0].toString(16)}`);
        console.log(`- ${output[1].toString(16)}`);
        console.log(`- ${output[2].toString(16)}`);
        console.log(`- ${output[3].toString(16)}`);
        const output0 = await scryptTest.round.call(output);
        console.log(`- ${output0[0].toString(16)}`);
        console.log(`- ${output0[1].toString(16)}`);
        console.log(`- ${output0[2].toString(16)}`);
        console.log(`- ${output0[3].toString(16)}`);
        const output1 = await scryptTest.round.call(output0);
        console.log(`- ${output1[0].toString(16)}`);
        console.log(`- ${output1[1].toString(16)}`);
        console.log(`- ${output1[2].toString(16)}`);
        console.log(`- ${output1[3].toString(16)}`);
    });
    it.only("Scrypt gas", async function() {
        const scryptTest = await ScryptTest.deployed();
        //const input = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        //const input = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        //const num = "0x4141414141414141414141414141414141414141414141414141414141414141";
        //const output = await scryptTest.round.call([num, num, num, num]);

        const input = web3.toAscii("0x01000000f615f7ce3b4fc6b8f61e8f89aedb1d0852507650533a9e3b10b9bbcc30639f279fcaa86746e1ef52d3edb3c4ad8259920d509bd073605c9bf1d59983752a6b06b817bb4ea78e011d012d59d4");
        //const input = "BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        assert.equal(input.length, 80, "Input is 80 bytes");
        
        console.log('-------------------');
        
        const sh = await scryptTest.start(input);
        console.log(`start: ${sh.tx}`);

        const _input = web3.toAscii(await scryptTest.input.call());
        console.log(`start: [${_input.length}] ${Buffer.from(_input).toString('hex')}`);
        assert.equal(_input.length, 80, "_Input is 80 bytes");

        const sr0 = await scryptTest.run(0);
        console.log(`run 0: ${sr0.tx}`);
        const r0 = await scryptTest.rounds.call(0, 0);
        console.log(`round 0: ${r0.toString(16)}`);
        const sr1 = await scryptTest.run(1);
        console.log(`run 1: ${sr1.tx}`);
        const r1 = await scryptTest.rounds.call(1, 0);
        console.log(`round 1: ${r1.toString(16)}`);
        const sr2 = await scryptTest.run(2);
        console.log(`run 2: ${sr2.tx}`);
        const r2 = await scryptTest.rounds.call(2, 0);
        console.log(`round 2: ${r2.toString(16)}`);

        /* console.log('-------------------');
        
        const bsr0 = await scryptTest.run(0);
        console.log(`run 0: ${JSON.stringify(bsr0, null, '  ')}`);
        const br0 = await scryptTest.rounds.call(0, 0);
        console.log(`round 0: ${br0.toString(16)}`);
        const bsr1 = await scryptTest.run(1);
        console.log(`run 1: ${JSON.stringify(bsr1, null, '  ')}`);
        const br1 = await scryptTest.rounds.call(1, 0);
        console.log(`round 1: ${br1.toString(16)}`);
        const bsr2 = await scryptTest.run(2);
        console.log(`run 2: ${JSON.stringify(bsr2, null, '  ')}`);
        const br2 = await scryptTest.rounds.call(2, 0);
        console.log(`round 2: ${br2.toString(16)}`); */
    });

});
