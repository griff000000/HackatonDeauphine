# Guide Frontend - Comment communiquer avec les smart contracts

Guide pour quelqu'un qui connait le front/back mais pas la blockchain.

---

## Les concepts de base (en 2 minutes)

### Smart contract = API immutable sur la blockchain

Un smart contract, c'est un bout de code **déployé sur la blockchain**. Une fois déployé, il ne peut plus être modifié. Il a :
- Une **adresse** (comme une URL d'API)
- Des **fonctions** (comme des endpoints)
- Un **state** (comme une base de données)
- Des **fonds** (il peut détenir des ALPH, la crypto d'Alephium)

La grosse différence avec une API classique : **personne ne contrôle le serveur**. Le code est public, les règles sont garanties par la blockchain.

### Transaction = Requête qui coute du gas

Chaque fois que tu appelles une fonction qui **modifie** le state (écriture), ça crée une **transaction** sur la blockchain :
- L'utilisateur signe la transaction avec son wallet (comme un 2FA)
- La transaction coute un petit fee en ALPH (~0.001 ALPH)
- Elle prend quelques secondes à être confirmée

Les fonctions en **lecture seule** (getters) sont gratuites et instantanées.

### Wallet = Le "compte utilisateur"

Pas de login/password. L'utilisateur se connecte avec un **wallet** (extension navigateur Alephium). Le wallet contient :
- Son **adresse** (identité publique)
- Sa **clé privée** (pour signer les transactions)
- Ses **ALPH** (pour payer les fees et interagir)

### Deployer = Mettre en production

"Déployer un contrat" = envoyer le code compilé sur la blockchain. Le résultat est :
- Un **contract ID** (identifiant unique, en hex)
- Une **adresse** (version lisible du contract ID)

Ces infos sont sauvegardées dans `contracts/artifacts/ts/deployments.ts` après le deploy, et le frontend les récupère automatiquement.

---

## Les 3 réseaux

| Réseau | URL Node | Usage | ALPH |
|--------|----------|-------|------|
| **devnet** | `http://127.0.0.1:22973` | Dev local (Docker) | Illimités (wallet pré-rempli) |
| **testnet** | `https://node.testnet.alephium.org` | Tests publics | Gratuits via le [Faucet](https://faucet.testnet.alephium.org/) |
| **mainnet** | `https://node.mainnet.alephium.org` | Production | Vrais ALPH ($$$) |

### Changer de réseau

1. **Frontend** : Variable d'env `NEXT_PUBLIC_NETWORK` dans `.env` ou en CLI :
   ```bash
   NEXT_PUBLIC_NETWORK=testnet yarn dev
   ```

2. **Contracts** : Flag `--network` au deploy :
   ```bash
   npx @alephium/cli deploy --network testnet
   ```

3. **Wallet** : L'extension Alephium doit être configurée sur le même réseau.

**Important** : Les contrats déployés sur devnet n'existent PAS sur testnet. Il faut re-déployer sur chaque réseau.

---

## Architecture : comment le front parle aux contrats

```
┌─────────────┐     signe la tx      ┌──────────────────┐
│   Browser    │ ◄──────────────────► │  Wallet Extension │
│  (Next.js)   │                      └──────────────────┘
│              │                               │
│  useWallet() │                               │ envoie la tx signée
│  hook        │                               ▼
│              │     lit le state      ┌──────────────────┐
│              │ ◄───────────────────► │   Node Alephium   │
│              │     (gratuit)         │  (devnet/testnet)  │
└─────────────┘                       └──────────────────┘
                                               │
                                               ▼
                                      ┌──────────────────┐
                                      │  Smart Contracts   │
                                      │  (Escrow + Trust)  │
                                      └──────────────────┘
```

**Le flow** :
1. Le frontend importe les scripts TypeScript auto-générés depuis `my-contracts`
2. Le frontend appelle `MonScript.execute({ signer, initialFields: {...} })`
3. Le SDK demande au wallet de signer
4. Le wallet affiche un popup "Confirmer la transaction ?"
5. L'utilisateur confirme
6. La transaction est envoyée au node
7. Le node exécute le contrat
8. Le frontend reçoit le `txId` et peut suivre le statut

---

## Comment appeler les contrats depuis le front

### 1. Setup : le Provider

Déjà en place dans `app/src/app/layout.tsx`. Le `AlephiumWalletProvider` connecte le frontend au wallet :

```tsx
import { AlephiumWalletProvider } from '@alephium/web3-react'

<AlephiumWalletProvider theme="retro" network="devnet" addressGroup={0}>
  {children}
</AlephiumWalletProvider>
```

### 2. Le hook `useWallet()`

Donne accès au wallet connecté :

```tsx
import { useWallet } from '@alephium/web3-react'

const { connectionStatus, signer, account } = useWallet()
// connectionStatus: 'connected' | 'connecting' | 'disconnected'
// signer: pour signer les transactions
// account: { address, publicKey, group }
```

### 3. Appeler un TxScript (écriture)

Chaque TxScript est exporté depuis `my-contracts`. Voici comment appeler chacun :

```tsx
import {
  AcceptAndDeposit,
  Deliver,
  ReleasePayment,
  OpenDispute,
  ResolveDispute,
  RefundByFreelancer,
  CancelEscrow,
  ClaimAfterDeadline
} from 'my-contracts'
import { ONE_ALPH, stringToHex } from '@alephium/web3'
```

#### Créer un escrow (déployer un nouveau contrat)

C'est un cas spécial — on ne call pas un script, on **déploie** un contrat :

```tsx
import { Escrow } from 'my-contracts'
import { DUST_AMOUNT, stringToHex } from '@alephium/web3'

const createEscrow = async () => {
  const result = await Escrow.deploy(signer, {
    initialFields: {
      client: account.address,
      freelancer: '1FreelancerAddressHere...',
      arbiter: '1ArbiterAddressHere...',
      amount: 10n * ONE_ALPH,
      collateral: 5n * ONE_ALPH,             // calculé via TrustRegistry
      deadline: BigInt(Date.now()) + 86400000n, // +24h
      cdcHash: stringToHex('QmIpfsHashDuCdc'),
      trustRegistry: 'contractIdDuTrustRegistry',  // hex
      deliverableLink: stringToHex(''),
      status: 0n
    },
    initialAttoAlphAmount: 10n * ONE_ALPH + ONE_ALPH  // amount + deposit contrat
  })

  // result.contractInstance.contractId  → l'ID du contrat créé
  // result.contractInstance.address     → l'adresse du contrat
  // result.txId                         → l'ID de la transaction
}
```

#### Freelancer accepte la mission

```tsx
const acceptMission = async (escrowContractId: string, collateral: bigint) => {
  const result = await AcceptAndDeposit.execute({
    signer,
    initialFields: {
      escrow: escrowContractId,
      collateral: collateral
    },
    attoAlphAmount: collateral + DUST_AMOUNT
  })
  return result.txId
}
```

#### Freelancer livre le travail

```tsx
const deliverWork = async (escrowContractId: string, link: string) => {
  const result = await Deliver.execute({
    signer,
    initialFields: {
      escrow: escrowContractId,
      link: stringToHex(link)
    },
    attoAlphAmount: DUST_AMOUNT
  })
  return result.txId
}
```

#### Client valide et libère les fonds

```tsx
const releasePayment = async (escrowContractId: string) => {
  const result = await ReleasePayment.execute({
    signer,
    initialFields: { escrow: escrowContractId },
    attoAlphAmount: DUST_AMOUNT
  })
  return result.txId
}
```

#### Ouvrir un litige

```tsx
const openDispute = async (escrowContractId: string) => {
  const result = await OpenDispute.execute({
    signer,
    initialFields: { escrow: escrowContractId },
    attoAlphAmount: DUST_AMOUNT
  })
  return result.txId
}
```

#### Arbitre résout le litige

```tsx
const resolveDispute = async (escrowContractId: string, toFreelancer: boolean) => {
  const result = await ResolveDispute.execute({
    signer,
    initialFields: {
      escrow: escrowContractId,
      toFreelancer
    },
    attoAlphAmount: DUST_AMOUNT
  })
  return result.txId
}
```

#### Freelancer abandonne (refund)

```tsx
const refund = async (escrowContractId: string) => {
  const result = await RefundByFreelancer.execute({
    signer,
    initialFields: { escrow: escrowContractId },
    attoAlphAmount: DUST_AMOUNT
  })
  return result.txId
}
```

#### Client annule avant acceptation

```tsx
const cancelEscrow = async (escrowContractId: string) => {
  const result = await CancelEscrow.execute({
    signer,
    initialFields: { escrow: escrowContractId },
    attoAlphAmount: DUST_AMOUNT
  })
  return result.txId
}
```

#### Auto-claim après deadline

```tsx
const autoClaim = async (escrowContractId: string) => {
  const result = await ClaimAfterDeadline.execute({
    signer,
    initialFields: { escrow: escrowContractId },
    attoAlphAmount: DUST_AMOUNT
  })
  return result.txId
}
```

### 4. Lire le state d'un contrat (gratuit)

Pour lire le statut d'un escrow sans transaction :

```tsx
import { Escrow, TrustRegistry } from 'my-contracts'
import { web3 } from '@alephium/web3'

// Lire l'état complet d'un escrow
const escrowInstance = Escrow.at(escrowAddress)
const state = await escrowInstance.fetchState()
console.log(state.fields.status)          // 0n, 1n, 2n, 3n, ou 4n
console.log(state.fields.amount)          // bigint en attoALPH
console.log(state.fields.freelancer)      // adresse
console.log(state.fields.deliverableLink) // hex → décoder avec hexToString()

// Appeler un getter spécifique
const status = await escrowInstance.view.getStatus()
const link = await escrowInstance.view.getDeliverableLink()

// Lire le score d'un freelancer
const registryInstance = TrustRegistry.at(registryAddress)
const score = await registryInstance.view.getScore({
  args: { freelancer: '1FreelancerAddress...' }
})
console.log(score.returns) // 50n par défaut

// Calculer la collateral pour un freelancer
const collateral = await registryInstance.view.calculateCollateral({
  args: {
    baseCollateral: 10n * ONE_ALPH,
    freelancer: '1FreelancerAddress...'
  }
})
console.log(collateral.returns) // bigint en attoALPH
```

### 5. Suivre une transaction

```tsx
import { useTxStatus } from '@alephium/web3-react'

function TxTracker({ txId }: { txId: string }) {
  useTxStatus(txId, (status) => {
    if (status.type === 'Confirmed') {
      console.log('Transaction confirmée !')
    }
  })
  return <p>Transaction en cours : {txId}</p>
}
```

---

## Les trucs a ne pas oublier

### Avant de coder le front

1. **Le devnet doit tourner** : `cd alephium-stack/devnet && docker compose up -d`
2. **Les contrats doivent être compilés** : `yarn compile`
3. **Les contrats doivent être déployés** : `yarn deploy`
4. **Le package TS doit être buildé** : `yarn build:contracts` puis `yarn install`
5. **Le wallet doit être sur le bon réseau** (devnet = custom network `http://127.0.0.1:22973`)

### Pendant le dev

- **ALPH = attoALPH** : `1 ALPH = 10^18 attoALPH`. Utilise `ONE_ALPH` comme constante.
- **Les strings sont en hex** : Pour envoyer un texte (lien, hash), utilise `stringToHex()`. Pour lire, `hexToString()`.
- **`DUST_AMOUNT`** : Montant minimum (~0.001 ALPH) que chaque transaction doit inclure. Toujours le passer dans `attoAlphAmount`.
- **`signer` vient du hook** : C'est `useWallet()` qui te donne le signer. Sans connexion wallet, pas de transaction.
- **Les `contractId` sont en hex** : L'ID du contrat est un hex string (64 chars). L'adresse est la version base58.
- **`bigint` partout** : Les montants sont des `bigint` en TypeScript (`10n`, `BigInt()`). Pas de `number` pour les montants.

### Les erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Module not found: 'my-contracts'` | Package pas buildé | `yarn build:contracts && yarn install` |
| Wallet popup ne s'affiche pas | Wallet pas connecté | Vérifier `connectionStatus === 'connected'` |
| Transaction échoue | Pas assez d'ALPH ou mauvais status | Vérifier les ALPH du wallet et le status du contrat |
| `InvalidStatus` (error 0) | Le contrat n'est pas dans le bon état | Vérifier le status actuel avec `getStatus()` |
| `OnlyClient/OnlyFreelancer` (error 1/2) | Mauvais wallet connecté | Vérifier que l'adresse connectée correspond au rôle |

### Après un changement de contrat

Si tu modifies un fichier `.ral` :
```bash
yarn compile        # recompile les contrats
yarn deploy         # redéploie (nouveau contrat = nouvelle adresse !)
yarn build:contracts # rebuild le package TS
```

**Attention** : après un re-deploy, les anciens contrats existent toujours sur la blockchain mais le frontend pointe vers les nouveaux. Les escrows en cours sur les anciens contrats restent accessibles par leur adresse.

### InitScore : a ne pas oublier !

Quand un freelancer utilise la plateforme pour la **premiere fois**, il faut appeler `initScore` sur le TrustRegistry pour créer son score en mapping. Sinon, les modifications de score (`+5`, `-15`, etc.) seront ignorées silencieusement.

```tsx
import { TrustRegistry } from 'my-contracts'

const registryInstance = TrustRegistry.at(registryAddress)
await registryInstance.transact.initScore({
  signer,
  args: { freelancer: freelancerAddress },
  attoAlphAmount: ONE_ALPH  // paye le MAP_ENTRY_DEPOSIT
})
```

Le mieux : appeler `initScore` au moment ou le freelancer **accepte sa premiere mission** (dans le flow frontend, avant `AcceptAndDeposit`).

---

## Résumé : le flow complet coté frontend

```
1. Client crée un escrow   →  Escrow.deploy(signer, {...})
                                 ↓ sauvegarde le contractId
2. Freelancer accepte       →  initScore() si premiere fois
                                 puis AcceptAndDeposit.execute(...)
3. Freelancer livre         →  Deliver.execute(...)
4a. Client valide           →  ReleasePayment.execute(...)     → Fini, score +5
4b. Client conteste         →  OpenDispute.execute(...)
    Arbitre tranche         →  ResolveDispute.execute(...)     → Fini
4c. Freelancer abandonne    →  RefundByFreelancer.execute(...) → Fini, score -3
4d. Client ne répond pas    →  ClaimAfterDeadline.execute(...) → Fini, score +5
4e. Client annule (avant 2) →  CancelEscrow.execute(...)      → Fini

A tout moment : Escrow.at(address).fetchState() pour lire le status
```
