pragma solidity ^0.4.15;

import "./Salsa8.sol";
import "./KeyDeriv.sol";

contract ScryptVerifier {
    struct Round {
        uint[4] result;
        bytes32 hash;
        bool exists;
    }

    struct BlockData {
        bytes input;
        bytes32 hash;
        uint number;
        mapping (uint => Round) rounds;
    }

    mapping (bytes32 => BlockData) public blocks;

    struct Challenge {
        address challenger;
        bytes32 hash;
    }

    mapping (bytes32 => Challenge) public challenges;

    event NewBlock(bytes32 indexed hash, uint indexed number);
    event NewChallenge(bytes32 indexed hash);

    function ScryptVerifier() {
    }

    function submit(bytes _input, bytes32 _hash, uint _number) public {
        blocks[_hash] = BlockData(_input, _hash, _number);
        NewBlock(_hash, _number);
    }

    function challenge(bytes32 _hash) public {
        challenges[_hash] = Challenge(msg.sender, _hash);
        NewChallenge(_hash);
    }

    function sendHashes(bytes32 _hash, bytes32[] _hashes) public {
        (_hash);
        (_hashes);
    }

    function request(bytes32 _hash, uint _round) public {
        (_hash);
        (_round);
    }

    function runStep(bytes32 _hash, uint step) public returns (bool) {
        uint[4] memory result;
        Round memory round;

        BlockData storage blockData = blocks[_hash];
        if (blockData.hash != _hash) {
            return false;
        }

        if (step == 0) {
            bytes32[4] memory temp;
            temp = KeyDeriv.pbkdf2(blockData.input, blockData.input, 128);
            result = b32enc(temp);
        } else if (step <= 1024) {
            round = blockData.rounds[step - 1];
            if (!round.exists) {
                return false;
            }
            result = Salsa8.round(round.result);
        } else if (step <= 2048) {
            round = blockData.rounds[step - 1];
            if (!round.exists) {
                return false;
            }
            uint idx = round.result[2];
            idx = (idx / 0x100000000000000000000000000000000000000000000000000000000) % 1024;
            Round storage temp2 = blockData.rounds[idx];
            if (!temp2.exists) {
                return false;
            }
            result = Salsa8.round([
                round.result[0] ^ temp2.result[0],
                round.result[1] ^ temp2.result[1],
                round.result[2] ^ temp2.result[2],
                round.result[3] ^ temp2.result[3]
            ]);
        } else if (step == 2049) {
            round = blockData.rounds[step - 1];
            if (!round.exists) {
                return false;
            }
            bytes memory salt = concatenate(round.result);
            bytes32[4] memory temp3 = KeyDeriv.pbkdf2(blockData.input, salt, 32);
            bytes32 output = bytes32(reverse(uint(temp3[0])));
            result[0] = uint(output);
        } else {
            return false;
        }

        bytes32 hash;
        if (step == 2049) {
            hash = sha3(result[0]);
        } else {
            hash = sha3(result[0], result[1], result[2], result[3]);
        }
        blockData.rounds[step] = Round(result, hash, true);

        return true;
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
