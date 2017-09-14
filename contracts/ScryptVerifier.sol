pragma solidity ^0.4.15;

import "./Salsa8.sol";
import "./KeyDeriv.sol";
import "./ScryptVerifierData.sol";

contract ScryptVerifier is ScryptVerifierData {

    mapping (bytes32 => BlockData) public blocks;
    mapping (bytes32 => ChallengeData) public challenges;

    event NewBlock(bytes32 indexed hash, uint indexed number, address indexed submitter);
    event NewChallenge(bytes32 indexed hash, address indexed challenger);
    event NewRequest(bytes32 indexed hash, address indexed challenger, uint round);

    function ScryptVerifier() {
    }

    function submit(bytes32 hash, bytes input, uint blockNumber) public {
        require(blocks[hash].submitter == 0);
        blocks[hash] = makeBlockData(msg.sender, input, hash, blockNumber);
        NewBlock(hash, blockNumber, msg.sender);
    }

    function challenge(bytes32 blockHash) public {
        require(blocks[hash].submitter != 0);
        BlockData storage blockData = blocks[hash];
        bytes32 hash = sha3(msg.sender, blockHash, block.number);
        require(challenges[hash].challenger == 0);
        challenges[hash] = makeChallenge(msg.sender, hash, blockHash);
        NewChallenge(hash, msg.sender);
    }

    function sendHashes(bytes32 hash, uint start, bytes32[] hashes) public {
        require(blocks[hash].submitter == msg.sender); // only submitter can reply
        BlockData storage blockData = blocks[hash];
        for (uint i=0; i<hashes.length; ++i) {
            blockData.rounds[start+i] = makeRound(hashes[i]);
        }
    }

    function request(bytes32 hash, uint round) public {
        require(challenges[hash].challenger == msg.sender); // only challenger can request
        ChallengeData storage challengeData = challenges[hash];
        require(blocks[challengeData.blockHash].submitter != 0); // existing block
        BlockData storage blockData = blocks[challengeData.blockHash];
        //require(blockData.requests[round].challenger == 0); // no previous request
        //ChallengeData storage challengeData = blockData.challenges[msg.sender];
        challengeData.requests.push(round);
        blockData.requests[round] = makeRequest(msg.sender, round);
        NewRequest(hash, msg.sender, round);
    }

    function sendData(bytes32 hash, uint round, uint[4] data) public {
        require(blocks[hash].submitter == msg.sender);
        BlockData storage blockData = blocks[hash];
        require(blockData.requests[round].challenger != 0); // existing request
        // address challenger = blockData.requests[round].challenger;
        require(blockData.requests[round].answered != true);
        blockData.requests[round].answered = true;
        RoundData storage roundData = blockData.rounds[round];
        roundData.data = data;
        roundData.exists = true;
    }

    function verify(bytes32 hash, uint round) public {
        require(blocks[hash].submitter != 0);
        BlockData storage blockData = blocks[hash];
        RoundData storage roundData = blockData.rounds[round];

        bytes32 res = sha3(roundData.data[0], roundData.data[1], roundData.data[2], roundData.data[3]);
        assert(res == roundData.hash);

        return;

        RoundData memory roundData2 = executeStep(hash, round);
        assert(roundData2.hash == blockData.rounds[round+1].hash);
    }

    function runStep(bytes32 hash, uint round) public returns (bool) {
        RoundData memory roundData = executeStep(hash, round);
        if (roundData.exists) {
            blocks[hash].rounds[round] = roundData;
            return true;
        }
        return false;
    }

    function executeStep(bytes32 _hash, uint step) internal returns (RoundData) {
        uint[4] memory result;
        RoundData memory round;

        BlockData storage blockData = blocks[_hash];
        if (blockData.hash != _hash) {
            return makeRoundWithoutData();
        }

        if (step == 0) {
            bytes32[4] memory temp;
            temp = KeyDeriv.pbkdf2(blockData.input, blockData.input, 128);
            result = b32enc(temp);
        } else if (step <= 1024) {
            round = blockData.rounds[step - 1];
            if (!round.exists) {
                return makeRoundWithoutData();
            }
            result = Salsa8.round(round.data);
        } else if (step <= 2048) {
            round = blockData.rounds[step - 1];
            if (!round.exists) {
                return makeRoundWithoutData();
            }
            uint idx = round.data[2];
            idx = (idx / 0x100000000000000000000000000000000000000000000000000000000) % 1024;
            RoundData storage temp2 = blockData.rounds[idx];
            if (!temp2.exists) {
                return makeRoundWithoutData();
            }
            result = Salsa8.round([
                round.data[0] ^ temp2.data[0],
                round.data[1] ^ temp2.data[1],
                round.data[2] ^ temp2.data[2],
                round.data[3] ^ temp2.data[3]
            ]);
        } else if (step == 2049) {
            round = blockData.rounds[step - 1];
            if (!round.exists) {
                return makeRoundWithoutData();
            }
            bytes memory salt = concatenate(round.data);
            bytes32[4] memory temp3 = KeyDeriv.pbkdf2(blockData.input, salt, 32);
            bytes32 output = bytes32(reverse(uint(temp3[0])));
            result[0] = uint(output);
        } else {
            return makeRoundWithoutData();
        }

        bytes32 hash;
        if (step == 2049) {
            hash = sha3(result[0]);
        } else {
            hash = sha3(result[0], result[1], result[2], result[3]);
        }
        return makeRoundWithData(hash, result);
    }

    /*function set(int step, uint[4] round) public returns (bool) {
        bytes32 h;
        h = sha3(round[0], round[1], round[2], round[3]);
        rounds[step] = Round(round, h, true);
    }*/

    /*function get(int step) constant public returns (bool exists, uint h1, uint h2, uint h3, uint h4, bytes32 h) {
        Round storage r = rounds[step];
        if (!r.exists) {
            return (false, 0, 0, 0, 0, 0);
        }
        return (r.exists, r.result[0], r.result[1], r.result[2], r.result[3], r.hash);
    }*/

    /*function getRequiredBlock(uint f) constant public returns (uint idx) {
        idx = (f / 0x100000000000000000000000000000000000000000000000000000000) % 1024;
    }*/

    function concatenate(uint[4] _input) internal returns (bytes res) {
      res = new bytes(4*32);
      for (uint i=0; i<4; ++i) {
        for (uint j=0; j<32; j+=4) {
          res[i*32 + j + 0] = byte(bytes32(_input[i])[j + 3]);
          res[i*32 + j + 1] = byte(bytes32(_input[i])[j + 2]);
          res[i*32 + j + 2] = byte(bytes32(_input[i])[j + 1]);
          res[i*32 + j + 3] = byte(bytes32(_input[i])[j + 0]);
        }
      }
    }

    /*function pbkdf(bytes _input) constant public returns (uint[4] _output) {
        bytes32[4] memory _pbkdf = KeyDeriv.pbkdf2(_input, _input, 128);
        _output = b32enc(_pbkdf);
    }*/

    /*function round(uint[4] _input) constant public returns (uint[4] _output) {
        _output = Salsa8.round(_input);
    }*/

    function reverse(uint _input) constant public returns (uint _output) {
        for (uint i=0; i<32; ++i) {
          _output |= ((_input / 0x100**(31 - i)) & 0xFF) * 0x100**i;
        }
    }

    function b32enc32(uint32 a) internal returns (uint32 b) {
        uint32 c;
        for (uint i=0; i<4; ++i) {
            c = uint32((a / 0x100**i) & 0xFF);
            b += c * uint32(0x100**(3-i));
        }
    }

    function b32enc256(uint a) internal returns (uint b) {
        for (uint i=0; i<8; ++i) {
            uint32 c = uint32((a / 0x100000000**i) & 0xFFFFFFFF);
            b += b32enc32(c) * 0x100000000**i;
        }
    }

    function b32enc(bytes32[4] abraka) internal returns (uint[4] dabra) {
        for (uint i=0; i<4; ++i) {
            dabra[i] = b32enc256(uint(abraka[i]));
        }
    }

}
