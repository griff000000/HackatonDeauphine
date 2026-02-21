# AlphTrust Escrow — Plan d'implémentation

## Vue d'ensemble

Remplacer le contrat TokenFaucet par :
1. **TrustRegistry** — contrat persistant qui stocke les trust scores des freelancers
2. **Escrow** — contrat d'escrow atomique par mission, qui utilise le TrustRegistry pour calculer la collateral

ALPH natif uniquement, arbitre fixe à la création.

### Système de Trust Score
- Score sur 100, commence à 50 pour un nouveau freelancer
- La collateral effective = `baseCollateral * max(10, 100 - score) / 100`
- Score 50 (nouveau) → paie 50% de la base
- Score 90 (excellent) → paie 10% (minimum)
- Score 20 (mauvais) → paie 80% de la base
- **Minimum toujours à 10%** même si le score est à 100
- Mission réussie (`release`) → score +5 (cap à 100)
- Litige perdu (`resolve` contre freelancer) → score -15 (floor à 0)
- Litige gagné → score +2

---

## Étape 1 : Nettoyer le projet

**Supprimer :**
- `contracts/contracts/token.ral`
- `contracts/contracts/withdraw.ral`
- `contracts/scripts/0_deploy_faucet.ts`
- `contracts/test/unit/token.test.ts`
- `contracts/test/integration/token.test.ts`
- `contracts/artifacts/`, `contracts/dist/`, `contracts/.project.json`
- `contracts/deployments/.deployments.devnet.json`

---

## Étape 2 : Créer le contrat `TrustRegistry.ral`

**Fichier : `contracts/contracts/trust_registry.ral`**

### Champs :
| Champ | Type | Description |
|-------|------|-------------|
| owner | Address | Admin du registry (peut être changé plus tard) |

### Storage (mapping) :
- `mapping[Address, U256] scores` — score de chaque freelancer

### Fonctions :

1. **`getScore(freelancer: Address) -> U256`**
   - Si le freelancer existe dans le mapping → retourne son score
   - Sinon → retourne 50 (score par défaut)

2. **`calculateCollateral(baseCollateral: U256, freelancer: Address) -> U256`**
   - Lit le score du freelancer
   - Calcule `factor = max(10, 100 - score)`
   - Retourne `baseCollateral * factor / 100`

3. **`increaseScore(freelancer: Address, amount: U256)`**
   - `checkExternalCaller = false` (appelé par les contrats Escrow)
   - Augmente le score, cap à 100
   - Si le freelancer n'existe pas → l'insert avec score initial 50 + amount

4. **`decreaseScore(freelancer: Address, amount: U256)`**
   - `checkExternalCaller = false`
   - Diminue le score, floor à 0

### Note sur les maps :
- Chaque `insert` dans un mapping coûte un dépôt en ALPH (MAP_ENTRY_DEPOSIT)
- Le premier escrow d'un freelancer devra payer ce dépôt
- On gère ça dans le TxScript avec un pré-approved asset

---

## Étape 3 : Créer le contrat `Escrow.ral`

**Fichier : `contracts/contracts/escrow.ral`**

### Champs du contrat :
| Champ | Type | Mutable | Description |
|-------|------|---------|-------------|
| client | Address | non | Celui qui paie |
| freelancer | Address | non | Celui qui travaille |
| arbiter | Address | non | Le juge en cas de litige |
| amount | U256 | non | Montant en ALPH (atto) |
| collateral | U256 | non | Caution calculée via TrustRegistry |
| deadline | U256 | non | Timestamp Unix limite |
| cdcHash | ByteVec | non | Hash IPFS du cahier des charges |
| trustRegistry | TrustRegistry | non | Référence au TrustRegistry |
| mut deliverableLink | ByteVec | oui | Lien vers le travail livré |
| mut status | U256 | oui | État du contrat (0-4) |

### Status :
- 0 = Créé (client a déposé `amount`)
- 1 = Actif (freelancer a déposé `collateral`)
- 2 = Livré (freelancer a soumis son travail)
- 3 = Litige (dispute ouverte)
- 4 = Terminé (fonds distribués)

### Événements :
- `FreelancerAccepted(freelancer: Address, collateral: U256)`
- `WorkDelivered(freelancer: Address, link: ByteVec)`
- `PaymentReleased(to: Address, totalAmount: U256)`
- `DisputeOpened(opener: Address)`
- `DisputeResolved(arbiter: Address, toFreelancer: Bool)`
- `EscrowCancelled(client: Address)`

### Codes d'erreur :
```
enum ErrorCodes {
    InvalidStatus = 0
    OnlyClient = 1
    OnlyFreelancer = 2
    OnlyArbiter = 3
    OnlyClientOrFreelancer = 4
    AutoClaimTooEarly = 5
}
```

### Fonctions :

1. **`acceptAndDeposit()`**
   - `@using(preapprovedAssets = true, updateFields = true, checkExternalCaller = false)`
   - Vérifie : status == 0, caller == freelancer
   - Le freelancer envoie `collateral` ALPH au contrat
   - Status → 1

2. **`deliver(link: ByteVec)`**
   - `@using(updateFields = true)`
   - Vérifie : status == 1, caller == freelancer
   - `deliverableLink = link`, Status → 2

3. **`release()`**
   - `@using(assetsInContract = true, updateFields = true)`
   - Vérifie : status == 2, caller == client
   - Transfère `amount + collateral` au freelancer
   - **trustRegistry.increaseScore(freelancer, 5)** → +5 au trust score
   - Status → 4, `destroySelf!(client)`

4. **`dispute()`**
   - `@using(updateFields = true)`
   - Vérifie : status == 1 ou 2, caller == client ou freelancer
   - Status → 3

5. **`resolve(toFreelancer: Bool)`**
   - `@using(assetsInContract = true, updateFields = true)`
   - Vérifie : status == 3, caller == arbiter
   - Si `toFreelancer` :
     - Envoie `amount + collateral` au freelancer
     - **trustRegistry.increaseScore(freelancer, 2)** → +2
   - Sinon :
     - Envoie `amount` au client, `collateral` au freelancer
     - **trustRegistry.decreaseScore(freelancer, 15)** → -15
   - Status → 4, `destroySelf!(client)`

6. **`cancelByClient()`**
   - `@using(assetsInContract = true, updateFields = true)`
   - Vérifie : status == 0, caller == client
   - Renvoie `amount` au client
   - Status → 4, `destroySelf!(client)`

7. **`autoClaim()`**
   - `@using(assetsInContract = true, updateFields = true, checkExternalCaller = false)`
   - Vérifie : status == 2, `blockTimeStamp!() > deadline + 172800000` (48h en ms)
   - Transfère `amount + collateral` au freelancer
   - **trustRegistry.increaseScore(freelancer, 5)**
   - Status → 4, `destroySelf!(client)`

---

## Étape 4 : Créer les TxScripts

**Fichier : `contracts/contracts/escrow_scripts.ral`**

```ralph
TxScript AcceptAndDeposit(escrow: Escrow, collateral: U256) {
    escrow.acceptAndDeposit{callerAddress!() -> ALPH: collateral}()
}

TxScript Deliver(escrow: Escrow, link: ByteVec) {
    escrow.deliver(link)
}

TxScript Release(escrow: Escrow) {
    escrow.release()
}

TxScript Dispute(escrow: Escrow) {
    escrow.dispute()
}

TxScript Resolve(escrow: Escrow, toFreelancer: Bool) {
    escrow.resolve(toFreelancer)
}

TxScript CancelEscrow(escrow: Escrow) {
    escrow.cancelByClient()
}

TxScript AutoClaim(escrow: Escrow) {
    escrow.autoClaim()
}
```

---

## Étape 5 : Scripts de déploiement

**Fichier : `contracts/scripts/0_deploy_trust_registry.ts`**
- Déploie le TrustRegistry (une seule fois, persistant)
- Stocke l'adresse du registry

**Fichier : `contracts/scripts/1_deploy_escrow.ts`**
- Déploie un Escrow de test avec des valeurs de dev
- Le client envoie `amount` ALPH au contrat via `initialAttoAlphAmount`
- Référence le TrustRegistry déployé à l'étape 0

**Mise à jour de `contracts/alephium.config.ts`** :
- Type Settings adapté pour escrow

---

## Étape 6 : Tests unitaires

**Fichier : `contracts/test/unit/escrow.test.ts`**

Tests :
1. `acceptAndDeposit` → status = 1, ALPH transféré au contrat
2. `deliver` → status = 2, lien stocké
3. `release` → freelancer reçoit amount + collateral, trust score +5
4. `dispute` → status = 3
5. `resolve(true)` → freelancer reçoit tout, score +2
6. `resolve(false)` → client remboursé, freelancer récupère collateral, score -15
7. `cancelByClient` → client remboursé, status = 4
8. `autoClaim` → après deadline + 48h, freelancer reçoit tout
9. Échecs : mauvais caller, mauvais status, trop tôt pour autoClaim
10. `calculateCollateral` → vérifier la formule avec différents scores

---

## Étape 7 : Build et vérification

1. `yarn compile`
2. `yarn test`
3. `yarn deploy`
4. `yarn build:contracts`

---

## Fichiers créés/modifiés

| Action | Fichier |
|--------|---------|
| Supprimer | `contracts/contracts/token.ral` |
| Supprimer | `contracts/contracts/withdraw.ral` |
| Supprimer | `contracts/scripts/0_deploy_faucet.ts` |
| Supprimer | `contracts/test/unit/token.test.ts` |
| Supprimer | `contracts/test/integration/token.test.ts` |
| Créer | `contracts/contracts/trust_registry.ral` |
| Créer | `contracts/contracts/escrow.ral` |
| Créer | `contracts/contracts/escrow_scripts.ral` |
| Créer | `contracts/scripts/0_deploy_trust_registry.ts` |
| Créer | `contracts/scripts/1_deploy_escrow.ts` |
| Créer | `contracts/test/unit/escrow.test.ts` |
| Modifier | `contracts/alephium.config.ts` |

---

## Architecture finale

```
Client                    Freelancer                  Arbiter
  |                          |                          |
  |-- deploy Escrow -------->|                          |
  |   (envoie amount ALPH)   |                          |
  |                          |                          |
  |                          |-- acceptAndDeposit() --->|
  |                          |   (envoie collateral)    |
  |                          |                          |
  |                          |-- deliver(link) -------->|
  |                          |                          |
  |-- release() ------------>|                          |
  |   (amount+collat → free) |                          |
  |                          |                          |
  |   OU                     |                          |
  |                          |                          |
  |-- dispute() ------------>|                          |
  |                          |                          |
  |                          |       resolve(bool) ---->|
  |                          |       (arbiter tranche)  |
  |                          |                          |
  TrustRegistry              TrustRegistry              |
  (score mis à jour automatiquement après chaque résolution)
```
