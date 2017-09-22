pragma solidity ^0.4.15;

contract ScryptVerifierData {
    struct RoundData {
        bytes32 hash;
        uint[4] data;
        uint8 kind;
    }

    struct RequestData {
        address challenger;
        uint round;
        bool answered;
    }

    struct ChallengeData {
        address challenger;
        bytes32 blockHash;
    }

    struct BlockData {
        address submitter;
        bytes input;
        bytes32 hash;
        uint number;
        mapping (uint => RoundData) rounds;
        mapping (uint => RequestData) requests;
        // mapping (address => ChallengeData) challenges;
    }

    function makeBlockData(address submitter, bytes input, bytes32 hash, uint blockNumber) internal returns (BlockData) {
        return BlockData(submitter, input, hash, blockNumber);
    }

    function makeChallenge(address challenger, bytes32 blockHash) internal returns (ChallengeData) {
        return ChallengeData(challenger, blockHash);
    }

    function makeRound(bytes32 hash) internal returns (RoundData) {
        uint[4] memory data;
        return RoundData(hash, data, 1);
    }

    function makeRoundWithoutData() internal returns (RoundData) {
        uint[4] memory data;
        return RoundData(0, data, 0);
    }


    function makeRoundWithData(bytes32 hash, uint[4] data) internal returns (RoundData) {
        return RoundData(hash, data, 2);
    }

    function makeRequest(address challenger, uint round) internal returns (RequestData) {
        return RequestData(challenger, round, false);
    }
}