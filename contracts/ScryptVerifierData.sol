pragma solidity ^0.4.15;

contract ScryptVerifierData {
    struct RoundData {
        bytes32 hash;
        uint[4] result;
        bool exists;
    }

    struct ChallengeData {
        address challenger;
    }

    struct BlockData {
        address submitter;
        bytes input;
        bytes32 hash;
        uint number;
        mapping (address => ChallengeData) challenges;
        mapping (uint => RoundData) rounds;
    }

    function makeBlockData(address submitter, bytes input, bytes32 hash, uint blockNumber) internal returns (BlockData) {
        return BlockData(submitter, input, hash, blockNumber);
    }

    function makeChallenge(address challenger) internal returns (ChallengeData) {
        return ChallengeData(challenger);
    }

    function makeRound(bytes32 hash) internal returns (RoundData) {
        return RoundData(hash, [uint(0), uint(0), uint(0), uint(0)], true);
    }

    function makeRoundWithData(bytes32 hash, uint[4] data) internal returns (RoundData) {
        return RoundData(hash, data, true);
    }
}
