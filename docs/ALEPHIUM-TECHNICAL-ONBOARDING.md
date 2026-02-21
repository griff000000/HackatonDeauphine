# Technical Onboarding Guide

Build on **Alephium**: a scalable, secure, and energy-efficient Layer 1 blockchain with its own smart contract language, **Ralph**.

---

# What is Alephium?

Alephium is a Layer 1 blockchain combining:

- 🟠 **Bitcoin's UTXO security**
- 🔵 **Ethereum’s smart contract expressiveness**

Through its unique **stateful UTXO (sUTXO)** model.

## Key Differentiators

- **Stateful UTXO model** — UTXO security + account flexibility
- **Ralph** — purpose-built smart contract language
- **Built-in security**
    - No reentrancy (VM-level protection)
    - No unlimited token approvals
    - No flashloans
- **Sharding** — 4 groups / 16 chains
- **Proof of Less Work** — energy-efficient consensus

---

# Core Technical Concepts

## sUTXO Model

Alephium combines both models:

| Component | Model | Benefit |
| --- | --- | --- |
| Assets | UTXO | Security + Parallelization |
| Contract State | Account-based | Expressiveness |

A single transaction can:

- Transfer assets
- Execute smart contract logic

---

## Ralph Language Overview

If you know Solidity or Rust, Ralph is easy to learn.

### Key Differences from Solidity

- Variables are **immutable by default** (`mut` required)
- **No reentrancy possible**
- Explicit asset flow (Asset Permission System)
- No unlimited approvals
- Tokens are native (FT + NFT)
- `SubContracts` for dynamic patterns
- Native `Map[K, V]` storage

### Example Contract

```rust
Contract Counter(mut count: U256) {
    event Increment(by: U256)

    @using(updateFields = true)
    pub fn increment(value: U256) -> () {
        count = count + value
        emit Increment(value)
    }

    pub fn getCount() -> U256 {
        return count
    }
}
```

---

# Development Environment Setup

## Prerequisites

- Node.js >= 16
- pnpm >= 8 (or bun/bunx)
- Docker
- VS Code (Ralph LSP recommended)

---

## 1️⃣ Start Local Devnet

```bash
git clone https://github.com/alephium/alephium-stack.git
cd alephium-stack/devnet
docker-compose up -d
```

Services started:

- Full Node (22973)
- Explorer
- PostgreSQL
- pgAdmin

---

## 2️⃣ Initialize Project

```bash
npx @alephium/cli init my-hackathon-project
cd my-hackathon-project
pnpm install
```

---

## 3️⃣ Compile Contracts

```bash
npx @alephium/cli compile
```

Compiles `.ral` → generates TypeScript bindings in `artifacts/ts/`.

---

## 4️⃣ Run Tests

```bash
pnpm run test
```

---

## 5️⃣ Deploy

```bash
# Devnet
npx @alephium/cli deploy

# Testnet
npx @alephium/cli deploy --network testnet
```

---

# Project Structure

```
my-project/
├── contracts/
├── scripts/
├── test/
├── src/
├── artifacts/ts/
├── alephium.config.ts
├── package.json
└── tsconfig.json
```

---

# First Smart Contract (10 Minutes)

## Step 1 — Create Contract

`contracts/hello.ral`

```rust
Contract HelloAlephium() {
    pub fn greet() -> () {
        emit Debug(`Hello from the hackathon!`)
    }
}
```

---

## Step 2 — Compile

```bash
npx @alephium/cli compile
```

---

## Step 3 — Interaction Script

`src/test-hello.ts`

```tsx
import { web3 } from '@alephium/web3'
import { getSigner } from '@alephium/web3-test'
import { HelloAlephium } from '../artifacts/ts'

async function main() {
  web3.setCurrentNodeProvider('http://127.0.0.1:22973')
  const signer = await getSigner()
  const hello = await HelloAlephium.deploy(signer, { initialFields: {} })
  await hello.contractInstance.view.greet()
}

main()
```

---

## Step 4 — Run

```bash
npx ts-node src/test-hello.ts
```

---

# Official Templates

### Next.js (Full dApp)

```
git clone https://github.com/alephium/nextjs-app-dapp-template
```

### Node.js Template

```
npx @alephium/cli init
```

Includes:

- TokenFaucet contract
- Deployment scripts
- Wallet integration

---

# Essential Resources

## Documentation

- Official Docs — [https://docs.alephium.org](https://docs.alephium.org/)
- Ralph Reference — https://docs.alephium.org/ralph
- Ralph In-Depth — [https://ralph.alephium.org](https://ralph.alephium.org/)
- SDK Guide — https://docs.alephium.org/sdk/getting-started
- dApp Guide — https://docs.alephium.org/dapps
- Quick Start — https://docs.alephium.org/dapps/tutorials/quick-start
- Deep Dive — https://docs.alephium.org/dapps/tutorials/deep-dive

---

## Public Infrastructure

### Mainnet

- Node API — [https://node.mainnet.alephium.org](https://node.mainnet.alephium.org/)
- Explorer — [https://explorer.alephium.org](https://explorer.alephium.org/)

### Testnet

- Node API — [https://node.testnet.alephium.org](https://node.testnet.alephium.org/)
- Explorer — [https://testnet.alephium.org](https://testnet.alephium.org/)
- Faucet — [https://faucet.testnet.alephium.org](https://faucet.testnet.alephium.org/)

### Local

- [http://127.0.0.1:22973](http://127.0.0.1:22973/)

---

# What To Read First

### Must Read

1. Quick Start Tutorial
2. Ralph Language Overview
3. Asset Permission System
4. TypeScript SDK Guide

### Recommended

- Deep Dive Tutorial
- Built-in Functions
- Fungible Token Standard
- NFT Standard

---

# Common Pitfalls

## Ralph Gotchas

- ❗ Missing `@using(updateFields = true)`
- ❗ Must use `mut` for mutable variables
- ❗ SubContract requires 0.1 ALPH deposit
- ❗ Every UTXO needs 0.001 ALPH (DUST_AMOUNT)
- ❗ Map entry requires deposit
- ❗ No inheritance override

---

## Dev Workflow Tips

- Use `getSigner()` for testing
- Use `mintToken()` for quick test tokens
- Use `view` for read-only calls
- Use `transact` for state changes
- Develop locally before testnet

---

# Solidity → Ralph Cheat Sheet

| Solidity | Ralph |
| --- | --- |
| mapping(address => uint) | mapping[Address, U256] |
| require() | assert!() |
| msg.sender | callerAddress!() |
| address(this) | selfAddress!() |
| block.timestamp | blockTimeStamp!() |
| modifier | use built-in checks |
| ERC-20 | IFungibleToken |
| ERC-721 | INonFungibleToken |

---

# HenryCoder — EVM to Ralph Translator

AI tool for Solidity → Ralph migration.

- [https://henrycoder.com](https://henrycoder.com/)
- https://github.com/BlockchainCollab/HenryCoder

### Supports

- Single contracts
- Inheritance
- Events, mappings, structs

### Needs Manual Review

- Modifiers
- Multi-dimensional mappings
- Dynamic arrays

### Not Supported

- Inline assembly
- Transient storage
- In-memory dynamic arrays

---

# Hackathon Submission Requirements

## Required

- Public GitHub repo
- README with:
    - Project explanation
    - Setup instructions
    - Contract overview
    - Demo / screenshots
- Testnet deployment (if applicable)
- Working frontend or CLI

---

## Evaluation Criteria

- Technical quality
- Innovation
- Completeness
- Documentation

---

# Quick Reference

```bash
# Setup
git clone https://github.com/alephium/alephium-stack.git
cd alephium-stack/devnet
docker-compose up -d

npx @alephium/cli init my-project
cd my-project
pnpm install

# Dev Loop
npx @alephium/cli compile
pnpm run test
npx @alephium/cli deploy
```

---

## Constants

```
ONE_ALPH = 10^18 atto
DUST_AMOUNT = 0.001 ALPH
MIN_CONTRACT_DEPOSIT = 0.1 ALPH
```

---

## Useful Imports

```tsx
import { web3 } from '@alephium/web3'
import { getSigner, mintToken } from '@alephium/web3-test'
import { PrivateKeyWallet } from '@alephium/web3-wallet'
```

---

# 🚀 Good luck and happy building on Alephium!
