pragma solidity ^0.4.15;

contract ScryptVerifierData {
    struct RoundData {
        bytes32 hash;
        uint[4] data;   // round input data
        uint8 kind;     // type of round: 0: unused, 1: hash only, 2: data and hash
    }

    struct RequestData {
        address challenger;
        uint round;
        bool answered;
    }

    struct ChallengeData {
        address challenger;
        bytes32 hash;
    }

    struct SubmissionData {
        address submitter;
        bytes input;
        bytes32 hash;
        address notify;
        uint index;
        uint lastUpdateTime;
        uint submitTime;
        mapping (uint => RoundData) rounds;
        mapping (uint => RequestData) requests;
    }

    function makeSubmissionData(address submitter, bytes input, bytes32 hash, address notify, uint index) internal returns (SubmissionData) {
        return SubmissionData(submitter, input, hash, notify, index, now, now);
    }

    function makeChallenge(address challenger, bytes32 hash) internal returns (ChallengeData) {
        return ChallengeData(challenger, hash);
    }

    function makeRound(bytes32 hash) internal returns (RoundData) {
        uint[4] memory data;
        return RoundData(hash, data, 1);
    }

    function makeRoundWithoutData(uint h) internal returns (RoundData) {
        uint[4] memory data;
        return RoundData(bytes32(h), data, 0);
    }


    function makeRoundWithData(bytes32 hash, uint[4] data) internal returns (RoundData) {
        return RoundData(hash, data, 2);
    }

    function makeRequest(address challenger, uint round) internal returns (RequestData) {
        return RequestData(challenger, round, false);
    }
}
