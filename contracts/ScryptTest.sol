pragma solidity ^0.4.13;

import "./Salsa8.sol";
import "./KeyDeriv.sol";

contract ScryptTest {
    bytes public input;
    //bytes32[4] public pbkdf;
    uint256[4][] public rounds;

    function ScryptTest() {
    }

    function start(bytes _input) public returns (bool) {
        input = _input;
    }

    function run(uint step) public returns (bool) {
        bytes32[4] memory _pbkdf;
        uint[4] memory _round;
        if (step == 0) {
            _pbkdf = KeyDeriv.pbkdf2(input, input, 128);
            //pbkdf = _pbkdf;

            _round = b32enc(_pbkdf);
            if (rounds.length == 0) {
                rounds.push(_round);
            } else {
                rounds[0] = _round;
            }
        } else if (step <= rounds.length) {
           _round = Salsa8.round(rounds[step - 1]);
           if (step == rounds.length) {
                rounds.push(_round);
           } else {
               rounds[step] = _round;
           }
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

