# Backend and Agents

Backend is a simple expressjs application that answer queries from the frontend
to the contract so it doesn't need direct access to a geth node.

Agents automate interaction with a contract. Sending submissions and making
challenges.

## Organization

*   agents/  Agents
*   controllers/  Backend's controllers
*   routes/  Backend's routes
*   tools/  Shared tools between Agents and Backend

## Agents

We have two agents

*   responseAgent.js Generate random hashes and send them to the verifier contract.
    It has a testing mode that generates some invalid hashes.
    Answer to challenges when they are valid.

*   challengeAgent.js Verify hashes are correct, if they fail to verify it will
    make a challenge, and follow responses.
