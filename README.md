# Trove - Escrow Decentralisé sur Alephium

Plateforme d'escrow trustless avec système de réputation on-chain, construite sur la blockchain Alephium.

Un client dépose des fonds, un freelancer dépose une caution proportionnelle à son score de confiance, et un arbitre tranche en cas de litige. Tout est transparent et vérifiable on-chain.

---

## Architecture du projet

Monorepo **yarn workspaces** avec 3 modules :

| Dossier | Description |
|---------|-------------|
| `contracts/` | Smart contracts en Ralph + scripts de déploiement + tests |
| `app/` | Frontend Next.js (React + TypeScript) |
| `alephium-stack/` | Docker Compose pour le node Alephium local (devnet) |
| `docs/` | Documentation technique complète |

---

## Prérequis

| Outil | Version minimum | Installation |
|-------|----------------|--------------|
| Node.js | >= 18 | [nodejs.org](https://nodejs.org/) |
| Yarn | v1 | `npm install -g yarn` |
| Docker | récent | [docker.com](https://www.docker.com/) |
| Docker Compose | inclus avec Docker Desktop | - |

---

## Lancement rapide (une seule commande)

### Devnet (local)

```bash
yarn go
```

Lance le devnet Docker + compile + déploie + build + lance l'app. Tout-en-un.

### Testnet

```bash
export PRIVATE_KEYS="ta_clé_privée"
yarn go:testnet
```

Ou si les contrats sont déjà déployés :

```bash
yarn dev:testnet
```

Le frontend sera disponible sur **http://localhost:3000**.

---

## Lancement complet depuis zéro

### Étape 1 — Cloner et installer

```bash
git clone <repo-url>
cd HackatonDeauphine
yarn install
```

### Étape 2 — Lancer le devnet local

```bash
yarn devnet:start
```

Attendre que le node soit healthy (~30 secondes). Vérifier avec :

```bash
curl -s http://127.0.0.1:22973/infos/self-clique | head -c 50
```

Si ça retourne du JSON, le node est prêt.

**Services disponibles :**

| Service | URL |
|---------|-----|
| Node Alephium (API) | http://127.0.0.1:22973 |
| Node Swagger (docs API) | http://127.0.0.1:22973/docs |
| Explorer Frontend | http://localhost:23000 |
| Explorer Backend API | http://127.0.0.1:9090 |
| Explorer Swagger | http://127.0.0.1:9090/docs |
| pgAdmin | http://localhost:5050 |

### Étape 3 — Compiler, déployer, lancer

```bash
yarn go
```

C'est tout. L'app tourne sur **http://localhost:3000**.

---

## Commandes détaillées

Toutes les commandes se lancent depuis la **racine** du projet :

### Smart contracts

| Commande | Description |
|----------|-------------|
| `yarn compile` | Compile les contracts Ralph → génère les artifacts dans `contracts/artifacts/` |
| `yarn deploy` | Déploie les contracts sur le devnet (node doit tourner) |
| `yarn build:contracts` | Compile les artifacts TypeScript dans `contracts/dist/` |
| `yarn test` | Lance les tests unitaires des contracts (Jest) |
| `yarn setup` | Compile + déploie + build TypeScript (sans lancer le frontend) |

### Frontend

| Commande | Description |
|----------|-------------|
| `yarn dev` | Lance le frontend Next.js en mode développement (port 3000) |
| `yarn build:app` | Build de production du frontend |

### Devnet (Docker)

| Commande | Description |
|----------|-------------|
| `yarn devnet:start` | Démarre le devnet (node + explorer + PostgreSQL + pgAdmin) |
| `yarn devnet:stop` | Arrête le devnet |

### Tout-en-un

| Commande | Description |
|----------|-------------|
| `yarn go` | Devnet + compile + déploie + build TS + lance le frontend |
| `yarn go:testnet` | Compile + déploie testnet + build TS + lance le frontend |
| `yarn dev:testnet` | Lance le frontend sur testnet (sans redéployer) |

---

## Wallet devnet

Pour interagir avec l'app en local, importer ce wallet dans l'[extension Alephium](https://alephium.org/#wallets) :

**Mnemonic :**
```
vault alarm sad mass witness property virus style good flower rice alpha viable evidence run glare pretty scout evil judge enroll refuse another lava
```

Ce wallet a **4'000'000 ALPH** pre-alloués sur le devnet (4 adresses).

Configurer l'extension sur le réseau **custom** avec l'URL du node : `http://127.0.0.1:22973`

---

## Troubleshooting

### `Failed to load contract artifact ... ENOENT`

Le fichier `.project.json` est désynchronisé :

```bash
rm contracts/.project.json
yarn compile
```

### `Module not found: Can't resolve 'my-contracts'`

Le package TypeScript des contracts n'est pas buildé :

```bash
yarn build:contracts
yarn install
```

### Le deploy échoue avec une erreur de connexion

Le devnet n'est pas lancé :

```bash
yarn devnet:start
```

### Le frontend affiche des adresses vides

Les contracts n'ont pas été déployés. Les adresses sont lues dynamiquement depuis `contracts/deployments/.deployments.{network}.json` via `loadDeployments()`. Relancer :

```bash
yarn setup
yarn dev
```

### Docker : port already in use

Un autre service utilise les ports requis. Arrêter les containers existants :

```bash
yarn devnet:stop
```

---

## Déploiement Testnet

### 1. Obtenir des ALPH de test

Tokens testnet disponibles via le [Faucet Alephium](https://faucet.testnet.alephium.org/).

### 2. Déployer et lancer

```bash
export PRIVATE_KEYS="ta_clé_privée"
yarn go:testnet
```

Les adresses des contrats sont automatiquement lues depuis les fichiers de déploiement (`contracts/deployments/.deployments.testnet.json`) via `loadDeployments()`. Pas besoin de les hardcoder.

### 3. Relancer sans redéployer

```bash
yarn dev:testnet
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/FRONTEND_GUIDE.md](docs/FRONTEND_GUIDE.md) | Comment communiquer avec les contracts depuis le frontend, exemples de code |
| [docs/CONTRACTS_API.md](docs/CONTRACTS_API.md) | API complète des contracts : fonctions, paramètres, comportement |
| [docs/PROJECT.md](docs/PROJECT.md) | Roadmap du projet |
| [docs/ALEPHIUM-TECHNICAL-ONBOARDING.md](docs/ALEPHIUM-TECHNICAL-ONBOARDING.md) | Guide technique Alephium & Ralph pour débutants |
| [PLAN.md](PLAN.md) | Plan d'implémentation détaillé des contracts Escrow + TrustRegistry |
| [Documentation officielle Alephium](https://docs.alephium.org/dapps/) | Docs officielles |
