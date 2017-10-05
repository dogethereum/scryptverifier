pragma solidity ^0.4.15;

import "./Salsa8.sol";
import "./KeyDeriv.sol";
import "./ScryptVerifierData.sol";

contract ScryptVerifier is ScryptVerifierData {
    uint constant ROUNDS_PER_CYCLE = 10;

    mapping (bytes32 => BlockData) public blocks;
    mapping (bytes32 => ChallengeData) public challenges;

    event NewBlock(bytes32 indexed blockHash);
    event NewChallenge(bytes32 indexed challengeId, bytes32 indexed blockHash);
    event ExistingDataHash(bytes32 indexed challengeId, bytes32 indexed blockHash, uint start);
    event NewDataHashes(bytes32 indexed challengeId, bytes32 indexed blockHash, uint start, uint length);
    event ExistingRequest(bytes32 indexed challengeId, bytes32 indexed blockHash, uint round);
    event NewRequest(bytes32 indexed challengeId, bytes32 indexed blockHash, uint round);
    event NewDataArrived(bytes32 indexed challengeId, bytes32 indexed blockHash, uint round);
    event RoundVerified(bytes32 indexed challengeId, bytes32 indexed blockHash, uint round, uint last);

    uint public uno;
    bytes32 public dos;
    bytes32 public tres;
    uint public cuatro;

    function ScryptVerifier() {
    }

    function submit(bytes32 hash, bytes input, uint blockNumber) public {
        require(blocks[hash].submitter == 0);
        blocks[hash] = makeBlockData(msg.sender, input, hash, blockNumber);
        NewBlock(hash);
    }

    function challenge(bytes32 blockHash) public {
        require(blocks[blockHash].submitter != 0);
        bytes32 challengeId = sha3(msg.sender, blockHash, block.number);
        require(challenges[challengeId].challenger == 0);
        challenges[challengeId] = makeChallenge(msg.sender, blockHash);
        NewChallenge(challengeId, blockHash);
    }

    function sendHashes(bytes32 challengeId, uint start, bytes32[] hashes) public {
        require(challenges[challengeId].challenger != 0); // existing challenge
        bytes32 blockHash = challenges[challengeId].blockHash;
        require(blocks[blockHash].submitter == msg.sender); // only submitter can reply
        BlockData storage blockData = blocks[blockHash];
        if (blockData.rounds[start].kind != 0) {
            ExistingDataHash(challengeId, blockHash, start);
        } else {
            for (uint i=0; i<hashes.length; ++i) {
                blockData.rounds[start + i * ROUNDS_PER_CYCLE] = makeRound(hashes[i]);
            }
            NewDataHashes(challengeId, blockHash, start, hashes.length);
        }
    }

    function request(bytes32 challengeId, uint round) public {
        require(challenges[challengeId].challenger == msg.sender); // only challenger can request
        ChallengeData storage challengeData = challenges[challengeId];
        require(blocks[challengeData.blockHash].submitter != 0); // existing block
        BlockData storage blockData = blocks[challengeData.blockHash];
        if (blockData.requests[round].challenger == 0) {
            blockData.requests[round] = makeRequest(msg.sender, round);
            NewRequest(challengeId, challengeData.blockHash, round);
        } else {
            ExistingRequest(challengeId, challengeData.blockHash, round);
        }
    }

    function sendData(bytes32 challengeId, uint round, uint[4] data, uint[] extra) public {
        require(challenges[challengeId].challenger != 0); // existing challenge
        bytes32 blockHash = challenges[challengeId].blockHash;
        require(blocks[blockHash].submitter == msg.sender); // only submitter can send data
        BlockData storage blockData = blocks[blockHash];
        require(blockData.requests[round].challenger != 0); // existing request
        RoundData storage roundData = blockData.rounds[round];
        require(0 !=  roundData.kind);
        bytes32 hash;
        RoundData memory roundData2;
        if (round != 0) {
            hash = sha3(data[0], data[1], data[2], data[3]);
            require(hash ==  roundData.hash);
        } else {
          roundData2 = executeStep(blockHash, 0);
            if (roundData2.kind == 2) {
                assert(data[0] == roundData2.data[0]);
                assert(data[1] == roundData2.data[1]);
                assert(data[2] == roundData2.data[2]);
                assert(data[3] == roundData2.data[3]);
            }
        }
        blockData.requests[round].answered = true;
        roundData.data = data;
        roundData.kind = 2;
        NewDataArrived(challengeId, blockHash, round);

        uint step = round;
        bool correct = true;
        uint numRounds = round != 1020 ? ROUNDS_PER_CYCLE : 4;
        roundData2 = roundData;
        for (uint i=0; i<numRounds && correct; ++i) {
            step += 1;
            if (step > 1024) {
                sendExtra(blockData, roundData2.data[2], [
                    extra[4*i+0],
                    extra[4*i+1],
                    extra[4*i+2],
                    extra[4*i+3]
                ]);
            }
            roundData2 = executeStep(blockHash, step);
            if (roundData2.kind == 2) {
                if (blockData.rounds[step].kind == 1) {
                    assert(blockData.rounds[step].hash == roundData2.hash);
                }
                blockData.rounds[step] = roundData2;
            } else {
                correct = false;
            }
        }
        assert(correct);
        RoundVerified(challengeId, blockHash, round, step);
    }

    function sendExtra(BlockData storage blockData, uint idx, uint[4] extra) internal {
        bytes32 hash;
        idx = (idx / 256**28) % 1024;
        RoundData storage extraInput = blockData.rounds[idx];
        hash = sha3(extra[0], extra[1], extra[2], extra[3]);
        if (extraInput.kind == 0) { // Round without info
            extraInput.hash = hash;
            extraInput.data = extra;
            extraInput.kind = 2;
        } else if (extraInput.kind == 1) { // Round with hash only
            assert(hash == extraInput.hash);
            extraInput.data = extra;
            extraInput.kind = 2;
        } else {
            assert(hash == extraInput.hash);
        }
    }

    function runStep(bytes32 hash, uint round) public returns (bool) {
        RoundData memory roundData = executeStep(hash, round);
        if (roundData.kind == 2) {
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
            return makeRoundWithoutData(1);
        }

        if (step == 0) {
            bytes32[4] memory temp;
            bytes memory temp4 = swap4bytes(blockData.input);
            temp = KeyDeriv.pbkdf2(temp4, temp4, 128);
            //temp = KeyDeriv.pbkdf2(blockData.input, blockData.input, 128);
            result = b32enc(temp);
        } else if (step <= 1024) {
            round = blockData.rounds[step - 1];
            if (round.kind != 2) {
                return makeRoundWithoutData(2);
            }
            result = Salsa8.round(round.data);
        } else if (step <= 2048) {
            round = blockData.rounds[step - 1];
            if (round.kind != 2) {
                return makeRoundWithoutData(3);
            }
            uint idx = round.data[2];
            idx = (idx / 256**28) % 1024;
            RoundData storage temp2 = blockData.rounds[idx];
            if (temp2.kind != 2) {
                return makeRoundWithoutData(4);
            }
            result = Salsa8.round([
                round.data[0] ^ temp2.data[0],
                round.data[1] ^ temp2.data[1],
                round.data[2] ^ temp2.data[2],
                round.data[3] ^ temp2.data[3]
            ]);
        } else if (step == 2049) {
            round = blockData.rounds[step - 1];
            if (round.kind != 2) {
                return makeRoundWithoutData(5);
            }
            bytes memory salt = concatenate(round.data);
            bytes32[4] memory temp3 = KeyDeriv.pbkdf2(blockData.input, salt, 32);
            bytes32 output = bytes32(reverse(uint(temp3[0])));
            result[0] = uint(output);
        } else {
            return makeRoundWithoutData(6);
        }

        bytes32 hash;
        if (step == 2049) {
            hash = sha3(result[0]);
        } else {
            hash = sha3(result[0], result[1], result[2], result[3]);
        }
        return makeRoundWithData(hash, result);
    }

    function getRoundData(bytes32 blockHash, uint step) constant public returns (uint8, uint, uint, uint, uint, bytes32) {
        RoundData storage r = blocks[blockHash].rounds[step];
        return (r.kind, r.data[0], r.data[1], r.data[2], r.data[3], r.hash);
    }

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

    function reverse(uint _input) internal returns (uint _output) {
        for (uint i=0; i<32; ++i) {
            _output |= ((_input / 0x100**(31 - i)) & 0xFF) * 0x100**i;
        }
    }

    function swap4bytes(bytes input) internal returns (bytes output) {
        output = new bytes(input.length);
        for (uint i=0; i<input.length; i+=4) {
          output[i + 0] = input[i + 3];
          output[i + 1] = input[i + 2];
          output[i + 2] = input[i + 1];
          output[i + 3] = input[i + 0];
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
