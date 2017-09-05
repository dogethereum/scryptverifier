pragma solidity ^0.4.15;

import "./Salsa8.sol";
import "./KeyDeriv.sol";

contract ScryptTest {
    bytes public input;

    struct Round {
        uint[4] result;
        bytes32 hash;
        bool exists;
    }

    mapping (int => Round) public rounds;

    int public lastStep = - 1;

    bytes public salt;
    bytes32[4] public pbkdf2;

    function ScryptTest() {
    }

    function start(bytes _input) public returns (bool) {
        input = _input;
    }

    function run(int step) public returns (bool) {
        bytes32[4] memory _pbkdf;
        uint[4] memory _round;
        bytes32 h;
        Round memory r;
        Round memory s;
        //uint256[4] memory res;
        uint f;
        uint idx;
        //uint256[4] memory res2;

        uint[4] memory foo;
        uint[4] memory bar;

        bytes memory _salt;

        if (step == 0) {
            _pbkdf = KeyDeriv.pbkdf2(input, input, 128);
            _round = b32enc(_pbkdf);
            //h = sha3(_round[0], _round[1], _round[2], _round[3]);
        } else if (step <= 1024) {
            r = rounds[step - 1];
            if (!r.exists) {
                return false;
            }
            _round = Salsa8.round(r.result);
            //h = sha3(_round[0], _round[1], _round[2], _round[3]);
        } else if (step <= 2048) {
            r = rounds[step - 1];
            if (!r.exists) {
                return false;
            }
            bar = r.result;
            f = r.result[2];
            idx = (f / 0x100000000000000000000000000000000000000000000000000000000) % 1024;
            s = rounds[int(idx)];
            if (!s.exists) {
                return false;
            }
            foo = s.result;
            bar[0] = bar[0] ^ foo[0];
            bar[1] = bar[1] ^ foo[1];
            bar[2] = bar[2] ^ foo[2];
            bar[3] = bar[3] ^ foo[3];
            _round = Salsa8.round(bar);
            //h = sha3(_round[0], _round[1], _round[2], _round[3]);
        } else if (step == 2049) {
            r = rounds[step - 1];
            if (!r.exists) {
                return false;
            }
            _salt = concatenate(r.result);
            salt = _salt;
            _pbkdf = KeyDeriv.pbkdf2(input, _salt, 32);
            pbkdf2 = _pbkdf;
            _round = b32enc(_pbkdf);
        } else {
            return false;
        }

        h = sha3(_round[0], _round[1], _round[2], _round[3]);
        rounds[step] = Round(_round, h, true);

        return true;
    }

    function set(int step, uint[4] round) public returns (bool) {
        //uint[4] memory _round;
        bytes32 h;
        h = sha3(round[0], round[1], round[2], round[3]);
        rounds[step] = Round(round, h, true);
    }

    function get(int step) constant public returns (bool exists, uint h1, uint h2, uint h3, uint h4, bytes32 h) {
        Round storage r = rounds[step];
        if (!r.exists) {
            return (false, 0, 0, 0, 0, 0);
        }
        return (r.exists, r.result[0], r.result[1], r.result[2], r.result[3], r.hash);
    }

    function getRequiredBlock(uint f) constant public returns (uint idx) {
        idx = (f / 0x100000000000000000000000000000000000000000000000000000000) % 1024;
    }

    function concatenate(uint[4] _input) internal returns (bytes res) {
      res = new bytes(4*32);
      for (uint i=0; i<4; ++i) {
        for (uint j=0; j<32; ++j) {
          res[i*32 + j] = byte(bytes32(_input[i])[j]);
        }
      }
    }

    function pbkdf(bytes _input) constant public returns (uint[4] output) {
         bytes32[4] memory _pbkdf = KeyDeriv.pbkdf2(_input, _input, 128);
         output = b32enc(_pbkdf);
    }

    function round(uint[4] _input) constant public returns (uint[4] output) {
        output = Salsa8.round(_input);
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
