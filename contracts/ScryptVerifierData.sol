pragma solidity ^0.4.15;

contract ScryptVerifierData {
    struct RoundData {
        bytes32 hash;
        uint[4] data;
        bool exists;
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

    function makeChallenge(address challenger, bytes32 hash) internal returns (ChallengeData) {
        return ChallengeData(challenger, hash);
    }

    function makeRound(bytes32 hash) internal returns (RoundData) {
        uint[4] memory data;
        return RoundData(hash, data, true);
    }

    function makeRoundWithoutData() internal returns (RoundData) {
        uint[4] memory data;
        return RoundData(0, data, false);
    }


    function makeRoundWithData(bytes32 hash, uint[4] data) internal returns (RoundData) {
        return RoundData(hash, data, true);
    }

    function makeRequest(address challenger, uint round) internal returns (RequestData) {
        return RequestData(challenger, round, false);
    }
}
