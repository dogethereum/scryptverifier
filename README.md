# ScryptVerifier

## Documentation

[Description of the ScryptVerifier contracts](contracts/README.md)

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
    like wallet seeds.

    For each one two parameters: `seed`, and `address`.

    ```json
    {
      "submitter": {
        "seed": "...",
        "address": "..."
      }
    }
    ```

    There's a local_config.json.example that can be used as template.

    New wallet seeds can be generated with `node src/tools/manageAccounts.js generate`.

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
