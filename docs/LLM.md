# Alephium & Ralph Smart Contract Development

You are assisting with smart contract development on the **Alephium** blockchain using the **Ralph** programming language and the **TypeScript SDK**.

## Project Context

- **Blockchain**: Alephium — a sharded L1 using the stateful UTXO (sUTXO) model
- **Smart Contract Language**: Ralph (`.ral` files in `contracts/`)
- **SDK**: `@alephium/web3` (TypeScript)
- **CLI**: `@alephium/cli` (compile, deploy, init)
- **Testing**: `@alephium/web3-test` + Jest
- **Generated types**: `artifacts/ts/` (auto-generated after compile)

## Key Commands

```bash
npx @alephium/cli compile              # Compile .ral contracts → artifacts/ts/
pnpm run test                            # Run tests
npx @alephium/cli deploy               # Deploy to devnet
npx @alephium/cli deploy --network testnet  # Deploy to testnet
```

## Ralph Language Reference

### Contract Declaration

```
Contract MyContract(fieldA: U256, mut fieldB: ByteVec) {
    event MyEvent(sender: Address, value: U256)

    enum ErrorCodes {
        InvalidCaller = 0
        InsufficientFunds = 1
    }

    const VERSION = 1

    mapping[Address, U256] balances

    @using(updateFields = true, checkExternalCaller = true)
    pub fn myFunction(caller: Address, amount: U256) -> U256 {
        checkCaller!(callerAddress!() == caller, ErrorCodes.InvalidCaller)
        fieldB = toByteVec!(amount)
        emit MyEvent(caller, amount)
        return amount
    }
}
```

### Types

- **Primitives**: `Bool`, `U256`, `I256`, `ByteVec`, `Address`
- **Composite**: `[U256; 4]` (fixed array), structs, enums, `Map[K, V]`
- Variables are **immutable by default** — use `mut` for mutable
- Integer literals: `10` (U256), `10i` (I256), `1e18`, `0xff`, `1_000_000`
- ByteVec literals: `#00112233`, `b\\`hello\``
- String concatenation: `b\\`hello\ `++ `b\\` world\\`

### Function Annotations (@using)

```
@using(
    preapprovedAssets = true,      // Function receives assets from callers via braces syntax
    assetsInContract = true,       // Function uses contract's own assets
    payToContractOnly = true,      // Assets go only to contract, not intermediate addresses
    checkExternalCaller = true,    // (default true) Require checkCaller! call
    updateFields = true            // Function modifies contract fields (REQUIRED or changes are lost)
)
```

**CRITICAL**: If a function modifies contract fields (`mut` fields), you MUST add `@using(updateFields = true)` or changes will be silently ignored.

### Asset Permission System (APS)

Ralph uses explicit braces syntax for asset approval:

```
// Caller approves ALPH
contract.deposit{caller -> ALPH: 1 alph}(caller)

// Caller approves a token
contract.swap{caller -> tokenId: amount}(caller, tokenId, amount)

// Multiple callers, multiple assets
contract.exchange{
    user0 -> ALPH: amount0, tokenId: amount1;
    user1 -> ALPH: amount2
}(user0, user1, amount0, amount1, amount2)
```

### Asset Transfer Built-ins

```
transferToken!(from, to, tokenId, amount)        // Between addresses
transferTokenFromSelf!(to, tokenId, amount)       // Contract → address
transferTokenToSelf!(from, tokenId, amount)       // Address → contract
transferAlphFromSelf!(to, amount)                 // ALPH from contract
burnToken!(address, tokenId, amount)              // Burn tokens
```

### Maps

```
mapping[Address, U256] balances

// Insert (costs MAP_ENTRY_DEPOSIT in ALPH)
balances.insert!(callerAddress!(), 100)

// Read
let val = balances[key]

// Update
balances[key] = newValue

// Check existence
if (balances.contains!(key)) { ... }

// Remove (refunds deposit)
balances.remove!(key)
```

### SubContracts

Used for dynamic collections (NFTs, arrays). Each costs 0.1 ALPH minimum deposit.

```
Contract Item(value: U256) {
    pub fn getValue() -> U256 { return value }
}

Contract Collection(itemTemplateId: ByteVec) {
    @using(preapprovedAssets = true, checkExternalCaller = false)
    pub fn createItem(caller: Address, key: U256, value: U256) -> () {
        let path = toByteVec!(key)
        let (encodedImmFields, encodedMutFields) = Item.encodeFields!(value)
        copyCreateSubContract!{caller -> ALPH: minimalContractDeposit!()}(
            path, itemTemplateId, encodedImmFields, encodedMutFields
        )
    }

    pub fn getItem(key: U256) -> U256 {
        let contractId = subContractId!(toByteVec!(key))
        return Item(contractId).getValue()
    }
}
```

### TxScript (Transaction Scripts)

Entry point for transactions — like Solidity's external calls:

```
TxScript DoSomething(myContract: MyContract, amount: U256) {
    let caller = callerAddress!()
    myContract.deposit{caller -> ALPH: amount}(caller)
}
```

### Inheritance & Interfaces

```
Abstract Contract Base(owner: Address) {
    fn onlyOwner() -> () {
        checkCaller!(callerAddress!() == owner, 0)
    }
}

Interface IToken {
    pub fn getBalance(addr: Address) -> U256
    @using(assetsInContract = true)
    pub fn transfer(to: Address, amount: U256) -> ()
}

Contract MyToken(owner: Address, mut supply: U256) extends Base(owner) implements IToken {
    pub fn getBalance(addr: Address) -> U256 { ... }
    @using(assetsInContract = true)
    pub fn transfer(to: Address, amount: U256) -> () { ... }
}
```

### Structs & Enums

```
struct Pair { tokenA: Address, mut amountA: U256 }

let p = Pair { tokenA: addr, amountA: 100 }
let mut mp = Pair { tokenA: addr, amountA: 100 }
mp.amountA = 200   // Only works if both variable and field are mut

enum ErrorCodes {
    Unauthorized = 0
    InsufficientBalance = 1
}
assert!(balance >= amount, ErrorCodes.InsufficientBalance)
```

### Unit Tests (in .ral files)

```
Contract Calculator() {
    pub fn add(a: U256, b: U256) -> U256 { return a + b }

    test "addition works" {
        testEqual!(add(2, 3), 5)
    }
}

// State testing
Contract Counter(mut count: U256) {
    @using(updateFields = true)
    pub fn increment() -> () { count = count + 1 }

    test "increments"
    before Self(5)
    after  Self(6)
    { increment() }
}

// Asset testing
Contract Vault() {
    @using(preapprovedAssets = true, assetsInContract = true, checkExternalCaller = false)
    pub fn deposit() -> () {
        transferTokenToSelf!(externalCallerAddress!(), ALPH, 1 alph)
    }

    test "deposit adds ALPH"
    before Self{ALPH: 0 alph}()
    after  Self{ALPH: 1 alph}()
    approve{address -> ALPH: 1 alph}
    { deposit{callerAddress!() -> ALPH: 1 alph}() }
}
```

### TypeScript Integration Tests

```tsx
import { web3 } from '@alephium/web3'
import { getSigner, mintToken } from '@alephium/web3-test'
import { MyContract } from '../artifacts/ts'

web3.setCurrentNodeProvider('<http://127.0.0.1:22973>')
const signer = await getSigner()  // Pre-funded devnet account

// Deploy
const result = await MyContract.deploy(signer, {
    initialFields: { fieldA: 100n, fieldB: '' }
})
const contract = result.contractInstance

// Read-only call (free, no gas)
const value = await contract.view.myFunction({ args: { caller: signer.address, amount: 50n } })

// State-changing call (transaction)
await contract.transact.myFunction({ args: { caller: signer.address, amount: 50n } })

// Fetch contract state
const state = await contract.fetchState()
console.log(state.fields.fieldA)
```

## Key Built-in Functions

### Caller & Identity

`callerAddress!()`, `callerContractId!()`, `selfAddress!()`, `selfContractId!()`, `selfTokenId!()`, `checkCaller!(condition, errorCode)`

### Chain Info

`blockTimeStamp!()`, `networkId!()`, `txId!()`, `txGasFee!()`, `txGasPrice!()`

### Crypto

`blake2b!(data)`, `keccak256!(data)`, `sha256!(data)`, `sha3!(data)`, `verifyTxSignature!(pubKey)`, `verifySecP256K1!(data, pubKey, sig)`, `verifyED25519!(data, pubKey, sig)`, `ethEcRecover!(data, sig)`

### Conversion

`toByteVec!(value)`, `toU256!(value)`, `toI256!(value)`, `contractIdToAddress!(id)`, `addressToContractId!(addr)`, `u256ToString!(n)`, `size!(byteVec)`, `byteVecSlice!(bv, from, to)`, `encodeToByteVec!(...values)`

### Contract Lifecycle

`createContract!(...)`, `copyCreateContract!(...)`, `createSubContract!(...)`, `copyCreateSubContract!(...)`, `subContractId!(path)`, `destroySelf!(refundAddress)`, `migrate!(newCode)`, `contractExists!(contractId)`

### Constants

`minimalContractDeposit!()` (0.1 ALPH), `mapEntryDeposit!()`, `ALPH` (token ID for native ALPH)

## Solidity → Ralph Quick Mapping

| Solidity | Ralph |
| --- | --- |
| `mapping(address => uint)` | `mapping[Address, U256] name` |
| `require(cond, "msg")` | `assert!(cond, ErrorCode)` |
| `msg.sender` | `callerAddress!()` |
| `address(this)` | `selfAddress!()` |
| `block.timestamp` | `blockTimeStamp!()` |
| `modifier onlyOwner` | `checkCaller!(callerAddress!() == owner, ErrorCode)` |
| `emit Event(...)` | `emit EventName(...)` |
| ERC-20 | `IFungibleToken` interface |
| ERC-721 | `INonFungibleToken` interface |
| `payable` | `@using(preapprovedAssets = true)` |

## Common Pitfalls

1. **Forgot `@using(updateFields = true)`** → field changes silently ignored
2. **Forgot `@using(preapprovedAssets = true)`** → cannot receive assets
3. **Forgot `@using(assetsInContract = true)`** → cannot send contract's assets
4. **DUST_AMOUNT**: every UTXO needs minimum 0.001 ALPH
5. **SubContract deposit**: each costs 0.1 ALPH minimum
6. **Map entry deposit**: inserting into a map costs ALPH (refunded on remove)
7. **No method override**: child contracts cannot override parent methods
8. **Immutable by default**: use `mut` on both the variable and the struct field

## Important Links

- Docs: [https://docs.alephium.org](https://docs.alephium.org/)
- Ralph Reference: https://docs.alephium.org/ralph
- Ralph In-Depth: [https://ralph.alephium.org](https://ralph.alephium.org/)
- SDK: https://docs.alephium.org/sdk/getting-started
- GitHub: https://github.com/alephium
- Web3 SDK repo: https://github.com/alephium/alephium-web3
- Devnet stack: https://github.com/alephium/alephium-stack
- Node API docs: https://node.testnet.alephium.org/docs
- Testnet faucet: [https://faucet.testnet.alephium.org](https://faucet.testnet.alephium.org/)
- Explorer: [https://explorer.alephium.org](https://explorer.alephium.org/)
- HenryCoder (Solidity→Ralph): [https://henrycoder.com](https://henrycoder.com/)
