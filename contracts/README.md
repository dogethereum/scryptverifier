# Scrypt Verifier

## Description

ScryptVerifier can execute the full verification of scrypt to an input.

Additionally it implements a challenge/response on top of the 2048 rounds of salsa.

## Files

Contract are based from <https://github.com/chriseth/scrypt-interactive>

They were split into several files to make easier to work with Truffle framework.

*   KeyDeriv.sol: pbkdf2 used by scrypt
*   Salsa8.sol: salsa8 used by scrypt
*   ScryptVerifier.sol: Scrypt checker with challenge/response support
*   ScryptVerifierData.sol: Data structures used by scrypt checker

*   Migrations.sol: Used by Truffle deploy system


## Scrypt

The scrypt algorithm involves calculating 2048 rounds of salsa8.

For the first 1024 rounds each has 128 bytes of input and 128 bytes of output.

The rounds between 1024 and 2048 each require an extra input of 128 bytes.
This extra data refers to an output from the first 1024 rounds.

## Challenge-Response

### Details

In total the calculation of scrypt will have 2050 steps, 2048 rounds of scrypt
plus round 0 to calculate the input to scrypt from the submission, and
the last round to calculate the final hash from the output of scrypt.

For each round we calculate the hash of the round's input. To minimize
the amount of data the submitter only send hashes every 10 steps.
We used keccak256 as hash so we have 32 bytes per round.

Each challenge involves sending 32 x 205 = 6560 bytes. (There is the option
to use a shorter hash like ripem160 to have 4100 bytes instead).

Note: To avoid a complexity when switching from the first 1024 rounds to the
second half we used a short round of 4, this caused to send 206 intermediate hashes.

### Implementation

*   Submitter: Send input and hash result

*   Challenger: Verifies hash and it didn't match its results makes a challenge

*   Submitter: Send intermeditate hashes

*   Challenger: Verifies intermediate hashes matches its owns data.
    Since final result didn't match at least one hash should not match.
    Request data for invalid hash.

*   Submitter: send data for the requested round. Contract verifies data matches
    intermediate hash and calculates to the next intermediate hash.
