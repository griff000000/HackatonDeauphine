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
- Abandon volontaire (`refundByFreelancer`) → score **-3**

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
- **Comportement** : Augmente le score de `amount`. **Cap à 100** — si `score + amount > 100`, met à 100. Emet `ScoreUpdated`. No-op si le score n'est pas initialisé.

### `decreaseScore(freelancer: Address, amount: U256) → ()`

- **Qui peut appeler** : n'importe qui (`checkExternalCaller = false`)
- **Checks** : aucun (en pratique, appelé uniquement par le contrat Escrow)
- **Comportement** : Diminue le score de `amount`. **Floor à 0** — si `score < amount`, met à 0. Emet `ScoreUpdated`. No-op si le score n'est pas initialisé.

---

## Escrow — Contrat de Mission

Contrat créé par le client pour chaque mission. Contient les fonds bloqués et l'historique complet du litige on-chain.

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
| `disputeReason` | ByteVec (mut) | Raison du litige soumise par l'initiateur |
| `disputeEvidence` | ByteVec (mut) | Preuve/réponse soumise par l'autre partie |
| `disputeJustification` | ByteVec (mut) | Justification de la décision de l'arbitre |

### Codes d'erreur

| Code | Nom | Description |
|---|---|---|
| 0 | `InvalidStatus` | Le statut actuel ne permet pas cette action |
| 1 | `OnlyClient` | Seul le client peut appeler cette fonction |
| 2 | `OnlyFreelancer` | Seul le freelancer peut appeler cette fonction |
| 3 | `OnlyArbiter` | Seul l'arbitre peut appeler cette fonction |
| 4 | `OnlyClientOrFreelancer` | Seul le client ou le freelancer peut appeler |
| 5 | `AutoClaimTooEarly` | La deadline + 48h n'est pas encore passée |
| 6 | `EvidenceAlreadySubmitted` | Une preuve a déjà été soumise pour ce litige |

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

### `dispute(reason: ByteVec) → ()`

- **Qui peut appeler** : **client ou freelancer**
- **Checks** :
  - `status == 1 || status == 2` (Active ou Delivered) sinon `InvalidStatus`
  - `callerAddress == client || callerAddress == freelancer` sinon `OnlyClientOrFreelancer`
- **Comportement** : Ouvre un litige avec une **justification** stockée on-chain. Status passe à **3 (Dispute)**. Emet `DisputeOpened`.
- **TxScript** : `OpenDispute(escrow, reason)`

### `submitEvidence(evidence: ByteVec) → ()`

- **Qui peut appeler** : **client ou freelancer**
- **Checks** :
  - `status == 3` (Dispute) sinon `InvalidStatus`
  - `callerAddress == client || callerAddress == freelancer` sinon `OnlyClientOrFreelancer`
  - `disputeEvidence` doit être vide sinon `EvidenceAlreadySubmitted`
- **Comportement** : L'autre partie soumet sa **preuve / version des faits** on-chain. Une seule soumission autorisée par litige. Emet `EvidenceSubmitted`.
- **TxScript** : `SubmitEvidence(escrow, evidence)`

### `resolve(toFreelancer: Bool, justification: ByteVec) → ()`

- **Qui peut appeler** : **arbitre uniquement**
- **Checks** :
  - `status == 3` (Dispute) sinon `InvalidStatus`
  - `callerAddress == arbiter` sinon `OnlyArbiter`
- **Comportement** :
  - L'arbitre stocke sa **justification** on-chain
  - Si `toFreelancer == true` : envoie `amount + collateral` au freelancer, score **+2**
  - Si `toFreelancer == false` : rembourse `amount` au client + `collateral` au freelancer, score **-15**
  - Status passe à **4 (Done)**. Le contrat se **détruit**. Emet `DisputeResolved`.
- **TxScript** : `ResolveDispute(escrow, toFreelancer, justification)`

### `refundByFreelancer() → ()`

- **Qui peut appeler** : **freelancer uniquement**
- **Checks** :
  - `status == 1` (Active) sinon `InvalidStatus`
  - `callerAddress == freelancer` sinon `OnlyFreelancer`
- **Comportement** : Le freelancer abandonne la mission. `amount` renvoyé au client, `collateral` rendu au freelancer. Score **-3** (pénalité légère — honnête mais n'a pas fini). Le contrat se **détruit**. Emet `FreelancerRefunded`.
- **TxScript** : `RefundByFreelancer(escrow)`

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
| `getDisputeReason()` | ByteVec | Raison du litige |
| `getDisputeEvidence()` | ByteVec | Preuve soumise par l'autre partie |
| `getDisputeJustification()` | ByteVec | Justification de l'arbitre |

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
| `DisputeOpened` | `opener: Address, reason: ByteVec` | `dispute` |
| `EvidenceSubmitted` | `submitter: Address, evidence: ByteVec` | `submitEvidence` |
| `DisputeResolved` | `arbiter: Address, toFreelancer: Bool, justification: ByteVec` | `resolve` |
| `FreelancerRefunded` | `freelancer: Address` | `refundByFreelancer` |
| `EscrowCancelled` | `client: Address` | `cancelByClient` |

---

## Flow de dispute

```
1. Client/Freelancer ouvre le litige
   → dispute(reason) → stocke la raison on-chain

2. L'autre partie répond
   → submitEvidence(evidence) → stocke sa version on-chain

3. L'arbitre consulte : reason + evidence + deliverableLink + cdcHash

4. L'arbitre tranche
   → resolve(toFreelancer, justification) → stocke sa décision on-chain
```

Tout est transparent et vérifiable. Personne ne peut modifier les preuves après coup.

---

## Flux de statuts

```
0 Created  ──→  1 Active  ──→  2 Delivered  ──→  4 Done (release/autoClaim)
    │                │  │            │
    │                │  │            └───→ 3 Dispute
    │                │  │                   │ submitEvidence
    │                │  │                   └──→ 4 Done (resolve)
    │                │  │
    │                │  └──→ 4 Done (refundByFreelancer)
    │                │
    │                └───→ 3 Dispute ──→ 4 Done (resolve)
    │
    └──→ 4 Done (cancelByClient)
```
