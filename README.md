# My Next.js dApp with app router

This template monorepo was designed to provide a developer-friendly experience to Alephium ecosystem newcomers. It is split into 2 parts:

- app: contains the Next.js frontend part of the dApp
- contracts: contains the dApp contracts

It uses **npm workspaces** to manage both app and contract projects from the monorepo root.

## Local development

To get started quickly, follow these steps:

### Set up a devnet

Start a local devnet for testing and development. Please refer to the [Getting Started documentation](https://docs.alephium.org/full-node/getting-started#devnet).

### Install dependencies

```
npm install
```

### Compile the contracts

```
npm compile
```

### Deploy the contracts

```
npm deploy
```

### Build the contracts package

```
npm build:contracts
```

### Run the app

```
npm dev
```

### Install an Alephium wallet

Download an [Alephium wallet](https://alephium.org/#wallets), and connect it to your devnet dApp.

## Testnet, Mainnet, and More

You could use npm workspace to run commands in the contracts or app directory.

```
npm <my-contracts|my-dapp> <command>
```

You could also get some testnet tokens from the [Faucet](https://docs.alephium.org/infrastructure/public-services/#testnet-faucet).

To learn more about smart contract development on Alephium, take a look at the [documentation](https://docs.alephium.org/dapps/).
