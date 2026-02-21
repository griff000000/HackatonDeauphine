# AlphTrust — Documentation des Smart Contracts

## TrustRegistry — Registre de Réputation

Contrat persistant qui stocke le score de confiance des freelancers (0-100, défaut: 50).

### Système de Trust Score

- Score sur 100, commence à **50** pour un nouveau freelancer
- Collateral effective = `baseCollateral * max(10, 100 - score) / 100`
- Score 50 (nouveau) → paie 50% de la base
- Score 90 (excellent) → paie 10% (minimum)
- Score 20 (mauvais) → paie 80% de la base
- **Minimum toujours à 10%** même si le score est à 100
- Mission réussie (`release`) → score **+5** (cap à 100)
- Litige perdu (`resolve` contre freelancer) → score **-15** (floor à 0)
- Litige gagné → score **+2**

---

### `getScore(freelancer: Address) → U256`

- **Qui peut appeler** : tout le monde (lecture seule)
- **Checks** : aucun
- **Comportement** : Retourne le score du freelancer. Si aucun score en mapping, retourne **50** (défaut).

### `calculateCollateral(baseCollateral: U256, freelancer: Address) → U256`

- **Qui peut appeler** : tout le monde (lecture seule)
- **Checks** : aucun
- **Comportement** : Calcule la caution effective avec la formule `baseCollateral * max(10, 100 - score) / 100`. Un freelancer à score 50 paie 50%, à score 90 paie 10% (minimum).

### `initScore(freelancer: Address) → ()`

- **Qui peut appeler** : n'importe qui (`checkExternalCaller = false`)
- **Checks** : Vérifie que le freelancer n'a pas déjà un score en mapping
- **Coût** : Nécessite `preapprovedAssets` — le caller paie le `MAP_ENTRY_DEPOSIT` (~1 ALPH) pour l'insertion dans le mapping
- **Comportement** : Insère le score initial de **50** dans le mapping.

### `increaseScore(freelancer: Address, amount: U256) → ()`

- **Qui peut appeler** : n'importe qui (`checkExternalCaller = false`)
- **Checks** : aucun (en pratique, appelé uniquement par le contrat Escrow)
- **Comportement** : Augmente le score de `amount`. **Cap à 100** — si `score + amount > 100`, met à 100. Emet `ScoreUpdated`.

### `decreaseScore(freelancer: Address, amount: U256) → ()`

- **Qui peut appeler** : n'importe qui (`checkExternalCaller = false`)
- **Checks** : aucun (en pratique, appelé uniquement par le contrat Escrow)
- **Comportement** : Diminue le score de `amount`. **Floor à 0** — si `score < amount`, met à 0. Emet `ScoreUpdated`.

---

## Escrow — Contrat de Mission

Contrat créé par le client pour chaque mission. Contient les fonds bloqués.

### Champs de déploiement

| Champ | Type | Description |
|---|---|---|
| `client` | Address | Adresse du client qui crée la mission |
| `freelancer` | Address | Adresse du freelancer assigné |
| `arbiter` | Address | Adresse de l'arbitre fixe |
| `amount` | U256 | Montant en ALPH payé par le client |
| `collateral` | U256 | Caution calculée via TrustRegistry |
| `deadline` | U256 | Timestamp limite (en ms) |
| `cdcHash` | ByteVec | Hash du cahier des charges |
| `trustRegistry` | TrustRegistry | Référence au contrat TrustRegistry |
| `deliverableLink` | ByteVec (mut) | Lien vers le livrable (vide au départ) |
| `status` | U256 (mut) | 0=Created, 1=Active, 2=Delivered, 3=Dispute, 4=Done |

### Codes d'erreur

| Code | Nom | Description |
|---|---|---|
| 0 | `InvalidStatus` | Le statut actuel ne permet pas cette action |
| 1 | `OnlyClient` | Seul le client peut appeler cette fonction |
| 2 | `OnlyFreelancer` | Seul le freelancer peut appeler cette fonction |
| 3 | `OnlyArbiter` | Seul l'arbitre peut appeler cette fonction |
| 4 | `OnlyClientOrFreelancer` | Seul le client ou le freelancer peut appeler |
| 5 | `AutoClaimTooEarly` | La deadline + 48h n'est pas encore passée |

---

### `acceptAndDeposit() → ()`

- **Qui peut appeler** : **freelancer uniquement**
- **Checks** :
  - `status == 0` (Created) sinon `InvalidStatus`
  - `callerAddress == freelancer` sinon `OnlyFreelancer`
- **Comportement** : Le freelancer dépose sa caution (`collateral` ALPH) dans le contrat. Status passe à **1 (Active)**. Emet `FreelancerAccepted`.
- **TxScript** : `AcceptAndDeposit(escrow, collateral)` — approuve `collateral` ALPH du caller vers le contrat.

### `deliver(link: ByteVec) → ()`

- **Qui peut appeler** : **freelancer uniquement**
- **Checks** :
  - `status == 1` (Active) sinon `InvalidStatus`
  - `callerAddress == freelancer` sinon `OnlyFreelancer`
- **Comportement** : Enregistre le lien du livrable. Status passe à **2 (Delivered)**. Emet `WorkDelivered`.
- **TxScript** : `Deliver(escrow, link)`

### `release() → ()`

- **Qui peut appeler** : **client uniquement**
- **Checks** :
  - `status == 2` (Delivered) sinon `InvalidStatus`
  - `callerAddress == client` sinon `OnlyClient`
- **Comportement** : Envoie `amount + collateral` au freelancer. Score **+5**. Status passe à **4 (Done)**. Le contrat se **détruit** et rembourse le storage au client. Emet `PaymentReleased`.
- **TxScript** : `ReleasePayment(escrow)`

### `dispute() → ()`

- **Qui peut appeler** : **client ou freelancer**
- **Checks** :
  - `status == 1 || status == 2` (Active ou Delivered) sinon `InvalidStatus`
  - `callerAddress == client || callerAddress == freelancer` sinon `OnlyClientOrFreelancer`
- **Comportement** : Ouvre un litige. Status passe à **3 (Dispute)**. Emet `DisputeOpened`.
- **TxScript** : `OpenDispute(escrow)`

### `resolve(toFreelancer: Bool) → ()`

- **Qui peut appeler** : **arbitre uniquement**
- **Checks** :
  - `status == 3` (Dispute) sinon `InvalidStatus`
  - `callerAddress == arbiter` sinon `OnlyArbiter`
- **Comportement** :
  - Si `toFreelancer == true` : envoie `amount + collateral` au freelancer, score **+2**
  - Si `toFreelancer == false` : rembourse `amount` au client + `collateral` au freelancer, score **-15**
  - Status passe à **4 (Done)**. Le contrat se **détruit**. Emet `DisputeResolved`.
- **TxScript** : `ResolveDispute(escrow, toFreelancer)`

### `cancelByClient() → ()`

- **Qui peut appeler** : **client uniquement**
- **Checks** :
  - `status == 0` (Created, avant que le freelancer accepte) sinon `InvalidStatus`
  - `callerAddress == client` sinon `OnlyClient`
- **Comportement** : Rembourse `amount` au client. Status passe à **4 (Done)**. Le contrat se **détruit**. Emet `EscrowCancelled`.
- **TxScript** : `CancelEscrow(escrow)`

### `autoClaim() → ()`

- **Qui peut appeler** : **n'importe qui** (`checkExternalCaller = false`)
- **Checks** :
  - `status == 2` (Delivered) sinon `InvalidStatus`
  - `blockTimeStamp > deadline + 172800000` (48h en ms) sinon `AutoClaimTooEarly`
- **Comportement** : Si le client ne répond pas 48h après la deadline, le freelancer récupère `amount + collateral`. Score **+5**. Le contrat se **détruit**. Emet `PaymentReleased`.
- **TxScript** : `ClaimAfterDeadline(escrow)`

---

### Getters (lecture seule, tout le monde)

| Fonction | Retour | Description |
|---|---|---|
| `getStatus()` | U256 | Status actuel (0-4) |
| `getDeliverableLink()` | ByteVec | Lien du livrable soumis |
| `getCdcHash()` | ByteVec | Hash du cahier des charges |

---

## Events

### TrustRegistry

| Event | Champs | Emis par |
|---|---|---|
| `ScoreUpdated` | `freelancer: Address, oldScore: U256, newScore: U256` | `increaseScore`, `decreaseScore` |

### Escrow

| Event | Champs | Emis par |
|---|---|---|
| `FreelancerAccepted` | `freelancer: Address, collateral: U256` | `acceptAndDeposit` |
| `WorkDelivered` | `freelancer: Address, link: ByteVec` | `deliver` |
| `PaymentReleased` | `to: Address, totalAmount: U256` | `release`, `autoClaim` |
| `DisputeOpened` | `opener: Address` | `dispute` |
| `DisputeResolved` | `arbiter: Address, toFreelancer: Bool` | `resolve` |
| `EscrowCancelled` | `client: Address` | `cancelByClient` |

---

## Flux de statuts

```
0 Created  ──→  1 Active  ──→  2 Delivered  ──→  4 Done (release/autoClaim)
    │                │               │
    │                └───→ 3 Dispute ←┘
    │                          │
    │                          └──→ 4 Done (resolve)
    └──→ 4 Done (cancelByClient)
```
