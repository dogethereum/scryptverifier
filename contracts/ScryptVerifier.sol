pragma solidity ^0.4.15;

import "./Salsa8.sol";
import "./KeyDeriv.sol";
import "./ScryptVerifierData.sol";

contract ScryptVerifier is ScryptVerifierData {
    uint constant ROUNDS_PER_CYCLE = 10;

    mapping (bytes32 => SubmissionData) public submissions;
    mapping (bytes32 => ChallengeData) public challenges;

    event NewSubmission(bytes32 indexed hash, bytes input);
    event ExistingSubmission(bytes32 indexed hash, bytes input);
    event NewChallenge(bytes32 indexed challengeId, bytes32 indexed hash);
    event ExistingDataHash(bytes32 indexed challengeId, bytes32 indexed hash, uint start);
    event NewDataHashes(bytes32 indexed challengeId, bytes32 indexed hash, uint start, uint length);
    event ExistingRequest(bytes32 indexed challengeId, bytes32 indexed hash, uint round);
    event NewRequest(bytes32 indexed challengeId, bytes32 indexed hash, uint round);
    event NewDataArrived(bytes32 indexed challengeId, bytes32 indexed hash, uint round);
    event RoundVerified(bytes32 indexed challengeId, bytes32 indexed hash, uint round, uint last);

    uint public uno;
    bytes32 public dos;
    bytes32 public tres;
    uint public cuatro;

    function ScryptVerifier() {
    }

    function submit(bytes32 hash, bytes input, address notify) public {
        if (submissions[hash].submitter == 0) {
          submissions[hash] = makeSubmissionData(msg.sender, input, hash, notify);
          NewSubmission(hash, input);
        } else {
          ExistingSubmission(hash, input);
        }
    }

    function challenge(bytes32 hash) public {
        require(submissions[hash].submitter != 0);
        bytes32 challengeId = sha3(msg.sender, hash);
        require(challenges[challengeId].challenger == 0);
        challenges[challengeId] = makeChallenge(msg.sender, hash);
        NewChallenge(challengeId, hash);
    }

    function sendHashes(bytes32 challengeId, uint start, bytes32[] hashes) public {
        require(challenges[challengeId].challenger != 0); // existing challenge
        bytes32 hash = challenges[challengeId].hash;
        require(submissions[hash].submitter == msg.sender); // only submitter can reply
        SubmissionData storage submissionData = submissions[hash];
        if (submissionData.rounds[start].kind != 0) {
            ExistingDataHash(challengeId, hash, start);
        } else {
            for (uint i=0; i<hashes.length; ++i) {
                submissionData.rounds[start + i * ROUNDS_PER_CYCLE] = makeRound(hashes[i]);
            }
            NewDataHashes(challengeId, hash, start, hashes.length);
        }
    }

    function request(bytes32 challengeId, uint round) public {
        require(challenges[challengeId].challenger == msg.sender); // only challenger can request
        ChallengeData storage challengeData = challenges[challengeId];
        require(submissions[challengeData.hash].submitter != 0); // existing submission
        SubmissionData storage submissionData = submissions[challengeData.hash];
        if (submissionData.requests[round].challenger == 0) {
            submissionData.requests[round] = makeRequest(msg.sender, round);
            NewRequest(challengeId, challengeData.hash, round);
        } else {
            ExistingRequest(challengeId, challengeData.hash, round);
        }
    }

    function sendData(bytes32 challengeId, uint round, uint[4] data, uint[] extra) public {
        require(challenges[challengeId].challenger != 0); // existing challenge
        bytes32 hash = challenges[challengeId].hash;
        require(submissions[hash].submitter == msg.sender); // only submitter can send data
        SubmissionData storage submissionData = submissions[hash];
        require(submissionData.requests[round].challenger != 0); // existing request
        RoundData storage roundData = submissionData.rounds[round];
        require(0 !=  roundData.kind);
        bytes32 temp;
        RoundData memory roundData2;
        if (round != 0) {
            temp = sha3(data[0], data[1], data[2], data[3]);
            require(temp ==  roundData.hash);
        } else {
          roundData2 = executeStep(hash, 0);
            if (roundData2.kind == 2) {
                assert(data[0] == roundData2.data[0]);
                assert(data[1] == roundData2.data[1]);
                assert(data[2] == roundData2.data[2]);
                assert(data[3] == roundData2.data[3]);
            }
        }
        submissionData.requests[round].answered = true;
        roundData.data = data;
        roundData.kind = 2;
        NewDataArrived(challengeId, hash, round);

        uint step = round;
        bool correct = true;
        uint numRounds;
        if (round == 1020) {
          numRounds = 4;
        } else if (round == 2044) {
          numRounds = 5;
        } else {
          numRounds = ROUNDS_PER_CYCLE;
        }
        roundData2 = roundData;
        for (uint i=0; i<numRounds && correct; ++i) {
            step += 1;
            if (step > 1024 && step <= 2048) {
                sendExtra(submissionData, roundData2.data[2], [
                    extra[4*i+0],
                    extra[4*i+1],
                    extra[4*i+2],
                    extra[4*i+3]
                ]);
            }
            roundData2 = executeStep(hash, step);
            if (roundData2.kind == 2) {
                if (submissionData.rounds[step].kind == 1) {
                    assert(submissionData.rounds[step].hash == roundData2.hash);
                }
                submissionData.rounds[step] = roundData2;
            } else {
                correct = false;
            }
        }
        assert(correct);
        RoundVerified(challengeId, hash, round, step);
    }

    function sendExtra(SubmissionData storage submissionData, uint idx, uint[4] extra) internal {
        bytes32 hash;
        idx = (idx / 256**28) % 1024;
        RoundData storage extraInput = submissionData.rounds[idx];
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
            submissions[hash].rounds[round] = roundData;
            return true;
        }
        return false;
    }

    function executeStep(bytes32 _hash, uint step) internal returns (RoundData) {
        uint[4] memory result;
        RoundData memory round;
        bytes memory temp4;

        SubmissionData storage submissionData = submissions[_hash];
        if (submissionData.hash != _hash) {
            return makeRoundWithoutData(1);
        }

        if (step == 0) {
            bytes32[4] memory temp;
            temp4 = swap4bytes(submissionData.input);
            temp = KeyDeriv.pbkdf2(temp4, temp4, 128);
            //temp = KeyDeriv.pbkdf2(submissionData.input, submissionData.input, 128);
            result = b32enc(temp);
        } else if (step <= 1024) {
            round = submissionData.rounds[step - 1];
            if (round.kind != 2) {
                return makeRoundWithoutData(2);
            }
            result = Salsa8.round(round.data);
        } else if (step <= 2048) {
            round = submissionData.rounds[step - 1];
            if (round.kind != 2) {
                return makeRoundWithoutData(3);
            }
            uint idx = round.data[2];
            idx = (idx / 256**28) % 1024;
            RoundData storage temp2 = submissionData.rounds[idx];
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
            round = submissionData.rounds[step - 1];
            if (round.kind != 2) {
                return makeRoundWithoutData(5);
            }
            bytes memory salt = concatenate(round.data);
            temp4 = swap4bytes(submissionData.input);
            bytes32[4] memory temp3 = KeyDeriv.pbkdf2(temp4, salt, 32);
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

    function getRoundData(bytes32 hash, uint step) constant public returns (uint8, uint, uint, uint, uint, bytes32) {
        RoundData storage r = submissions[hash].rounds[step];
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
