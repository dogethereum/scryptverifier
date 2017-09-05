var ScryptTest = artifacts.require("./ScryptTest.sol");

contract('ScryptTest', function(accounts) {
    it.skip("Salsa round", async function() {
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
    it.skip("Scrypt gas", async function() {
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

    it("Hashes", async function() {
        //this.timeout(400000);
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
        console.log(`----step 0: ${sr0.tx}`);
        const [, r0, , , , h0] = await scryptTest.get.call(0);
        console.log(`resl 0: ${r0.toString(16)}`);
        console.log(`hash 0: ${h0.toString(16)}`);

        const sr1 = await scryptTest.run(1);
        console.log(`----step 1: ${sr1.tx}`);
        const [, r1, , , , h1] = await scryptTest.get.call(1);
        console.log(`resl 1: ${r1.toString(16)}`);
        console.log(`hash 1: ${h1.toString(16)}`);

        const sr2 = await scryptTest.run(2);
        console.log(`----step 2: ${sr2.tx}`);
        const [, r2, , , , h2] = await scryptTest.get.call(2);
        console.log(`resl 2: ${r2.toString(16)}`);
        console.log(`hash 2: ${h2.toString(16)}`);

        let i;
        for (i = 3; i<= 1024; ++i) {
            const sr = await scryptTest.run(i);
            console.log(`----step ${i}: ${sr.tx}`);
            const [, r, , , , h] = await scryptTest.get.call(i);
            console.log(`resl ${i}: ${r.toString(16)}`);
            console.log(`hash ${i}: ${h.toString(16)}`);
        }

        i = 1025;
        while (i <= 2048) {
            const sr4 = await scryptTest.run(i);
            console.log(`----step ${i}: ${sr4.tx}`);
            const [, r4, , , , h4] = await scryptTest.get.call(i);
            console.log(`resl ${i}: ${r4.toString(16)}`);
            console.log(`hash ${i}: ${h4.toString(16)}`);
            ++i;
        }

        // const [f, idx, foo, bar] = await Promise.all([
        //     scryptTest.f.call(),
        //     scryptTest.idx.call(),
        //     scryptTest.foo.call(0),
        //     scryptTest.bar.call(0)
        // ]);
        // console.log(`   f ${i}: ${f.toString(16)}`);
        // console.log(`   i ${i}: ${idx.valueOf()}`);
        // console.log(` foo ${i}: ${foo.toString(16)}`);
        // console.log(` bar ${i}: ${bar.toString(16)}`);

        //done();
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
    }).timeout(800000);

    it.only("Final", async function() {
        const scryptTest = await ScryptTest.deployed();
        const prev = [
            {
                step: 2045,
                result: [
                    "0x1e7c9256d3798e3f0f02661c81ac5a094313c94ed83168403bbacdd25bc6bc05",
                    "0x7b7709991e1d6d6d7d6decd20c0b2e50ec1506f730f6bfbb58834282e8bb6173",
                    "0xbe7b269af324920e301579e645168bc20745e87428f2973d05fcf0b914fc74b1",
                    "0x12c3bcb83b82c9093f8030ea9fa76083fea4299fc34c1313407b0e099d455536"
                ]
            },
            {
                step: 666,
                result: [
                    "0x36b9bce657fade7d344f01bc464978523fa7742017ca06c3de6c5cdc9c251c56",
                    "0x447326897a095977dc3afb9aaf8efd47377f982b1b55afcd0ebc7f9417e3b182",
                    "0x11155c070ed47ee86977b7f20c37b8a036d17a8b3ddf72afddaae07104fd5685",
                    "0x6eebda7d0decbad78be0b50de998651be8fc6ef16fb916aa53fe0b79ae95947a"
                ]
            },
            {
                step: 898,
                result: [
                    "0x893929b4df133787ed23c659d1bcc00caf4a99eb33e2fc4756d03e1412aa8d01",
                    "0x5357490353b2a75e6657716a1fe3ba9f070c1a7b195659b167c70a8cc82e3ef2",
                    "0x1fbea8e9f8f926105dfcce1289cde802225ce2312e316cad43585f8963a191e4",
                    "0x972275ffab323c230fa72f6015b8aed2e69e271d2b863d4f44376654fca16d9b"
                ]
            },
            {
                step: 664,
                result: [
                    "0x67ab2b314790d5f600804994afa3faa3d804d6c12e9d75504f1646c8aec04613",
                    "0x38bc9f4a7b48b50bc323c0f89eeb50f2655ab176babf31ff9f74abe633bfd7ab",
                    "0xd10b652652a5730ce5d1f2b48664caaaf24159277d5a73f11cc90e363655d61d",
                    "0x327af59c0c1bde4a8c25e5079942daa167d246a7a4a5af125931872a825727b4"
                ]
            }
        ]

        const input = web3.toAscii("0x01000000f615f7ce3b4fc6b8f61e8f89aedb1d0852507650533a9e3b10b9bbcc30639f279fcaa86746e1ef52d3edb3c4ad8259920d509bd073605c9bf1d59983752a6b06b817bb4ea78e011d012d59d4");
        const sh = await scryptTest.start(input);
        console.log(`start: ${sh.tx}`);

        //const blk = await scryptTest.getRequiredBlock(prev[2]);
        //console.log(`Block: ${blk.toNumber()}`)

        await Promise.all(prev.map(p => scryptTest.set(p.step, p.result)));

        let i = 2046;
        let sr = await scryptTest.run(i);

        console.log(`----step ${i}: ${sr.tx}`);
        let [, r, , r2, , h] = await scryptTest.get.call(i);
        console.log(`resl ${i}: ${r.toString(16)}`);
        console.log(`hash ${i}: ${h.toString(16)}`);

        i++;
        sr = await scryptTest.run(i);

        console.log(`----step ${i}: ${sr.tx}`);
        [, r, , r2, , h] = await scryptTest.get.call(i);
        console.log(`resl ${i}: ${r.toString(16)}`);
        console.log(`hash ${i}: ${h.toString(16)}`);

        i++;
        sr = await scryptTest.run(i);

        console.log(`----step ${i}: ${sr.tx}`);
        [, r, , r2, , h] = await scryptTest.get.call(i);
        console.log(`resl ${i}: ${r.toString(16)}`);
        console.log(`hash ${i}: ${h.toString(16)}`);

        i++;
        sr = await scryptTest.run(i);

        console.log(`----step ${i}: ${sr.tx}`); // 2049
        [, r, , r2, , h] = await scryptTest.get.call(i);
        const [input2, salt, pbkdf2] = await Promise.all([
          scryptTest.input.call(),
          scryptTest.salt.call(),
          scryptTest.pbkdf2.call(0)
        ]);
        console.log(`resl ${i}: ${r.toString(16)}`);
        console.log(`hash ${i}: ${h.toString(16)}`);
        console.log(`inpt ${i}: ${input2.toString(16)}`);
        console.log(`salt ${i}: ${salt.toString(16)}`);
        console.log(`pbkd ${i}: ${pbkdf2.toString(16)}`);

        //const blk = await scryptTest.getRequiredBlock(r2);
        //console.log(`Block: ${blk.toNumber()}`)

    });

});
