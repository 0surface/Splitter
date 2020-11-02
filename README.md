# Splitter

## What

An Ethereum smart Contract that splits ether sent to it into two and
makes funds available for withdrawal by receipients.

## How

Built using

- Truffle v5.1.50 (core: 5.1.50)
- Solidity v0.5.16 (solc-js)
- Node v12.19.0
- Web3.js v1.2.9

local Test RPC = gnache-cli

### Run Commands (dev)

- ganache-cli
- truffle migrate
- truffle build
- npx http-server ./build/app/ -a 0.0.0.0 -p 8082 -c-1
