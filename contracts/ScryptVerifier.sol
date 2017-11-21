pragma solidity ^0.4.15;

import "./Salsa8.sol";
import "./KeyDeriv.sol";
import "./ScryptVerifierData.sol";

contract ScryptVerifier is ScryptVerifierData {
    // How many rounds are included in a step
    uint constant ROUNDS_PER_CYCLE = 10;

    // Submissions and challenges
    mapping (bytes32 => SubmissionData) public submissions;
    mapping (bytes32 => ChallengeData) public challenges;
    mapping (uint => bytes32) public indexSubmissions;
    uint public numSubmissions;

    // New submission has been received
    event NewSubmission(bytes32 indexed hash, bytes input, uint index);

    // An existing submission was received
    event ExistingSubmission(bytes32 indexed hash, bytes input);

    // A new challenge has been received
    event NewChallenge(bytes32 indexed challengeId, bytes32 indexed hash);

    // Intermediate hashes has been received
    event NewDataHashes(bytes32 indexed challengeId, bytes32 indexed hash, uint start, uint length);

    // Existing intermediate hashes has been received
    event ExistingDataHash(bytes32 indexed challengeId, bytes32 indexed hash, uint start);

    // A request for data has been received
    event NewRequest(bytes32 indexed challengeId, bytes32 indexed hash, uint round);

    // An existing request has arrived
    event ExistingRequest(bytes32 indexed challengeId, bytes32 indexed hash, uint round);

    // Data for a request has arrived
    event NewDataArrived(bytes32 indexed challengeId, bytes32 indexed hash, uint round);

    // A Round has been verified
    event RoundVerified(bytes32 indexed challengeId, bytes32 indexed hash, uint round, uint last);

    function ScryptVerifier() {
    }

    // Accept a submission of an input and the result of applying scrypt to it
    //
    // @param hash Result of applying scrypt to the input
    // @param input Input array to apply scrypt
    // @param notify Address to notify when the submission is confirmed
    function submit(bytes32 hash, bytes input, address notify) public {
        if (submissions[hash].submitter == 0) {
          submissions[hash] = makeSubmissionData(msg.sender, input, hash, notify, numSubmissions);
          indexSubmissions[numSubmissions] = hash;
          NewSubmission(hash, input, numSubmissions);
          ++numSubmissions;
        } else {
          ExistingSubmission(hash, input);
        }
    }

    // Make a challenge to an accepted hash
    //
    // An event NewChallenge(challengeId, hash) is generated with the  challenge id
    //
    // @param hash submission to challenge
    function challenge(bytes32 hash) public {
        require(submissions[hash].submitter != 0);
        bytes32 challengeId = sha3(msg.sender, hash);
        require(challenges[challengeId].challenger == 0);
        challenges[challengeId] = makeChallenge(msg.sender, hash);
        NewChallenge(challengeId, hash);
    }

    // Reply to a challenge contains array with intermediate hashes
    //
    // @param challengeId Id of the challenge to reply
    // @param start Round of the first hash
    // @param hashes Array with hashes from the intermediate steps
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

    // Make a request for data to evaluate a round
    //
    // @param challengeId Id of the challenge
    // @param round Round of data to request
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

    // Send data to fulfill a pending request
    //
    // @param challengeId Id of the challenge
    // @param round Round of the data
    // @param data Input data for the round
    // @param extra Extra input data for the rounds
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
        // Check input data matches intermediate hash
        if (round != 0) {
            temp = sha3(data[0], data[1], data[2], data[3]);
            require(temp ==  roundData.hash);
        } else {
          // Round 0 input is submission data
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

        // Eval up to ROUNDS_PER_CYCLE steps
        // and verify the output matches next intermediate hashes
        uint step = round;
        uint numRounds;
        if (round == 1020) {
          numRounds = 4;
        } else if (round == 2044) {
          numRounds = 5;
        } else {
          numRounds = ROUNDS_PER_CYCLE;
        }
        roundData2 = roundData;
        for (uint i=0; i<numRounds; ++i) {
            step += 1;
            // Each round above 1024 needs as input a round in the 0..1024
            if (step > 1024 && step <= 2048) {
                sendExtra(submissionData, roundData2.data[2], [
                    extra[4*i+0],
                    extra[4*i+1],
                    extra[4*i+2],
                    extra[4*i+3]
                ]);
            }
            roundData2 = executeStep(hash, step);
            // Verify result
            assert(roundData2.kind == 2);
            if (submissionData.rounds[step].kind == 1) {
                assert(submissionData.rounds[step].hash == roundData2.hash);
            }
            if (step == 2049) {
                assert(bytes32(roundData2.data[0]) == hash);
            }
            submissionData.rounds[step] = roundData2;
        }
        RoundVerified(challengeId, hash, round, step);
    }

    // Stores extra inputs for rounds in 1024..2048
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

    // Perform a step of scrypt and stores the result in the submission data
    function runStep(bytes32 hash, uint round) public returns (bool) {
        RoundData memory roundData = executeStep(hash, round);
        if (roundData.kind == 2) {
            submissions[hash].rounds[round] = roundData;
            return true;
        }
        return false;
    }

    // Performs a step of scrypt and returns the result in memory
    function executeStep(bytes32 hash, uint step) internal returns (RoundData) {
        uint[4] memory result;

        SubmissionData storage submissionData = submissions[hash];
        if (submissionData.hash != hash) {
            return makeRoundWithoutData(1);
        }

        if (step == 0) {
            result = fixEndianness(KeyDeriv.pbkdf2(submissionData.input, submissionData.input, 128));
        } else if (step <= 1024) {
            RoundData storage round = submissionData.rounds[step - 1];
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
            RoundData storage extraRound = submissionData.rounds[idx];
            if (extraRound.kind != 2) {
                return makeRoundWithoutData(4);
            }
            result = Salsa8.round([
                round.data[0] ^ extraRound.data[0],
                round.data[1] ^ extraRound.data[1],
                round.data[2] ^ extraRound.data[2],
                round.data[3] ^ extraRound.data[3]
            ]);
        } else if (step == 2049) {
            round = submissionData.rounds[step - 1];
            if (round.kind != 2) {
                return makeRoundWithoutData(5);
            }
            bytes memory salt = makeSalt(round.data);
            bytes32[4] memory output = KeyDeriv.pbkdf2(submissionData.input, salt, 32);
            result[0] = uint(output[0]);
        } else {
            return makeRoundWithoutData(6);
        }

        bytes32 newHash;
        if (step == 2049) {
            newHash = sha3(result[0]);
        } else {
            newHash = sha3(result[0], result[1], result[2], result[3]);
        }
        return makeRoundWithData(newHash, result);
    }

    // Request submissions
    //
    // @return Number of submissions
    function getNumSubmissions() constant public returns (uint) {
      return numSubmissions;
    }

    // Request submission data
    //
    // @param hash Hash of the submission
    function getSubmission(bytes32 hash) constant public returns (bytes32 _hash, bytes input, address submitter, uint timestamp) {
      SubmissionData storage submission = submissions[hash];
      if (submission.submitter != 0x0) {
        return (submission.hash, submission.input, submission.submitter, submission.submitTime);
      }
    }

    // Return an array of submissions' hashes
    //
    // @param start start position of the array of submissions' hashes
    // @param count number of submissions' hashes to return;
    function getSubmissionsHashes(uint start, uint count) constant public returns (bytes32[] result) {
      result = new bytes32[](count);
      for (uint i=0; i<count; ++i) {
        result[i] = indexSubmissions[start+i];
      }
    }

    // Request round's data
    //
    // @param hash Submission hash
    // @param step Number of step
    function getRoundData(bytes32 hash, uint step) constant public returns (uint8, uint, uint, uint, uint, bytes32) {
        RoundData storage r = submissions[hash].rounds[step];
        return (r.kind, r.data[0], r.data[1], r.data[2], r.data[3], r.hash);
    }

    // Retrieve round intermediate hashes
    //
    // @param hash Submission's hash
    // @param start Round to start
    // @param length Amount of hashes to return
    // @param step Rounds to skip between hashes
    function getHashes(bytes32 hash, uint start, uint length, uint step) constant public returns (bytes32[] hashes) {
      hashes = new bytes32[](length);
      for (uint i=0; i<length; ++i) {
        hashes[i] = submissions[hash].rounds[start + i * step].hash;
      }
      return hashes;
    }

    // Creates salt for the last round to feed to pbkdf2
    function makeSalt(uint[4] _input) internal returns (bytes res) {
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

    // Swap endianess to uint32
    // AABBCCDD -> DDCCBBAA
    function fixEndianness32(uint32 a) internal returns (uint32 b) {
        for (uint i=0; i<4; ++i) {
            b = 0x100 * b + (a & 0xFF);
            a /= 0x100;
        }
    }

    // Apply swap endianess to each of uint32 components of uint256
    // 11223344AABBCCDD -> 44332211DDCCBBAA
    function fixEndianness256(uint a) internal returns (uint b) {
        for (uint i=0; i<8; ++i) {
            b += fixEndianness32(uint32(a & 0xFFFFFFFF)) * 0x100000000**i;
            a /= 0x100000000;
        }
    }

    // Apply fix endianess 256 to each element of a bytes32[4] array
    function fixEndianness(bytes32[4] a) internal returns (uint[4] b) {
        for (uint i=0; i<4; ++i) {
            b[i] = fixEndianness256(uint(a[i]));
        }
    }
}
