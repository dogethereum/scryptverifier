# ScryptVerifier

## Setup

### Global dependencies

*   Truffle framework for deploying interacting with contracts
*   Ethereumjs-Testrpc Ethereum testing node

```
$ npm install -g truffle ethereumjs-testrpc
```

### Local dependencies

In same the directory with package.json install project dependencies

```
$ npm install
```

### Edit configuration

There two configuration files

*   config.js: Contains general configuration parameters like ethereum node, port

*   local_config.json: Used to store values that cannot be commited
    like seeds. It needs two wallet: submitter and challenger:

    For each one two parameters: `seed`, and `address`.

    ```json
    {
      "submitter": {
        "seed": "...",
        "address": "..."
      }
    }
    ```    

### Deploy contracts

Before running testing script contracts should be deployed

```
$ truffle migrate
```

If this fails you can try adding `--reset`.

## Run application

```
$ npm run start
```

## Development

### Contracts Compilation

To check contracts compilation before deployment

```
$ truffle compile
```

## Workarounds

Common issues and solutions

### Reset contracts deployment

```
$ truffle migrate --reset
```
