pragma solidity ^0.4.15;

import "./Salsa8.sol";
import "./KeyDeriv.sol";
import "./ScryptVerifierData.sol";

contract ScryptVerifier is ScryptVerifierData {

    mapping (bytes32 => BlockData) public blocks;
    mapping (bytes32 => ChallengeData) public challenges;

    event NewBlock(bytes32 indexed blockHash);
    event NewChallenge(bytes32 indexed challengeId, bytes32 indexed blockHash);
    event NewDataHashes(bytes32 indexed challengeId, bytes32 indexed blockHash, uint start, uint step, uint length);
    event NewRequest(bytes32 indexed challengeId, bytes32 indexed blockHash, uint round);
    event NewDataArrived(bytes32 indexed challengeId, bytes32 indexed blockHash, uint round);
    event RoundVerified(bytes32 indexed challengeId, bytes32 indexed blockHash, uint round);

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

    function sendHashes(bytes32 challengeId, uint start, uint step, bytes32[] hashes) public {
        require(challenges[challengeId].challenger != 0); // existing challenge
        bytes32 blockHash = challenges[challengeId].blockHash;
        require(blocks[blockHash].submitter == msg.sender); // only submitter can reply
        BlockData storage blockData = blocks[blockHash];
        for (uint i=0; i<hashes.length; ++i) {
            blockData.rounds[start+i*step] = makeRound(hashes[i]);
        }
        NewDataHashes(challengeId, blockHash, start, step, hashes.length);
    }

    function request(bytes32 challengeId, uint round) public {
        require(challenges[challengeId].challenger == msg.sender); // only challenger can request
        ChallengeData storage challengeData = challenges[challengeId];
        require(blocks[challengeData.blockHash].submitter != 0); // existing block
        BlockData storage blockData = blocks[challengeData.blockHash];
        if (blockData.requests[round].challenger == 0) {
            blockData.requests[round] = makeRequest(msg.sender, round);
            NewRequest(challengeId, challengeData.blockHash, round);
        }
    }

    function sendData(bytes32 challengeId, uint round, uint[4] data) public {
        require(challenges[challengeId].challenger != 0); // existing challenge
        bytes32 blockHash = challenges[challengeId].blockHash;
        require(blocks[blockHash].submitter == msg.sender); // only submitter can send data
        BlockData storage blockData = blocks[blockHash];
        require(blockData.requests[round].challenger != 0); // existing request
        RoundData storage roundData = blockData.rounds[round];
        bytes32 hash = sha3(data[0], data[1], data[2], data[3]);
        require(hash ==  roundData.hash);
        blockData.requests[round].answered = true;
        roundData.data = data;
        roundData.kind = 2;
        NewDataArrived(challengeId, blockHash, round);
    }

    function verify(bytes32 challengeId, uint round) public {
        require(challenges[challengeId].challenger != 0); // existing challenge
        bytes32 blockHash = challenges[challengeId].blockHash;
        require(blocks[blockHash].submitter != 0);
        BlockData storage blockData = blocks[blockHash];

        bool correct = true;
        uint step = round;
        RoundData memory roundData;
        for (uint i=0; i<10 && correct; ++i) {
          step += 1;
          roundData = executeStep(blockHash, step);
          if (roundData.kind == 2) {
            if (blockData.rounds[step].kind != 0) {
              assert(blockData.rounds[step].hash == roundData.hash);
            }
            blockData.rounds[step] = roundData;
          } else {
            correct = false;
          }
        }
        assert(correct && roundData.hash == blockData.rounds[step].hash);
        RoundVerified(challengeId, blockHash, round);
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
            return makeRoundWithoutData();
        }

        if (step == 0) {
            bytes32[4] memory temp;
            temp = KeyDeriv.pbkdf2(blockData.input, blockData.input, 128);
            result = b32enc(temp);
        } else if (step <= 1024) {
            round = blockData.rounds[step - 1];
            if (round.kind != 2) {
                return makeRoundWithoutData();
            }
            result = Salsa8.round(round.data);
        } else if (step <= 2048) {
            round = blockData.rounds[step - 1];
            if (round.kind != 2) {
                return makeRoundWithoutData();
            }
            uint idx = round.data[2];
            idx = (idx / 0x100000000000000000000000000000000000000000000000000000000) % 1024;
            RoundData storage temp2 = blockData.rounds[idx];
            if (temp2.kind != 2) {
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
            if (round.kind != 2) {
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
