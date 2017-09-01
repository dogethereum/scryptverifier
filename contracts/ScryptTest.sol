pragma solidity ^0.4.13;

import "./Salsa8.sol";
import "./KeyDeriv.sol";

contract ScryptTest {
    bytes public input;
    //bytes32[4] public pbkdf;
    uint256[4][] public rounds;
    bytes32[] public hashes;

    //bytes32 public mu;

    uint public f;
    uint public idx;
    uint256[4] public foo;
    uint256[4] public bar;

    function ScryptTest() {
    }

    function start(bytes _input) public returns (bool) {
        input = _input;
    }

    function run(uint step) public returns (bool) {
        bytes32[4] memory _pbkdf;
        uint[4] memory _round;
        bytes32 h;
        uint256[4] memory res;
        //uint f;
        //uint idx;
        uint256[4] memory res2;

        if (step == 0) {
            _pbkdf = KeyDeriv.pbkdf2(input, input, 128);
            _round = b32enc(_pbkdf);
            h = sha3(_round[0], _round[1], _round[2], _round[3]); 
        } else if (step <= rounds.length) {
            if (step <= 1024) {
                _round = Salsa8.round(rounds[step - 1]);
                h = sha3(_round[0], _round[1], _round[2], _round[3]); 
            } else {
                bar = rounds[step - 1];
                f = bar[2];
                idx = (f / 0x100000000000000000000000000000000000000000000000000000000) % 1024;
                foo = rounds[idx];
                bar[0] = bar[0] ^ foo[0];
                bar[1] = bar[1] ^ foo[1];
                bar[2] = bar[2] ^ foo[2];
                bar[3] = bar[3] ^ foo[3];
                _round = Salsa8.round(bar);
                h = sha3(_round[0], _round[1], _round[2], _round[3]); 
            }
        } else {
            return false;
        }
        if (rounds.length == step) {
            rounds.push(_round);
            hashes.push(h);
        } else {
            rounds[step] = _round;
            hashes[step] = h;
        }

        return true;
    }

    function pbkdf(bytes _input) constant public returns (uint[4] output) {
         bytes32[4] memory pbkdf = KeyDeriv.pbkdf2(_input, _input, 128);
         output = b32enc(pbkdf);
    }

    function round(uint[4] input) constant public returns (uint[4] output) {
        output = Salsa8.round(input);
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

