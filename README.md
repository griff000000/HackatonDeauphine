# AlphTrust - Escrow Decentralisé sur Alephium

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

Si le devnet tourne déjà :

```bash
yarn go
```

Cette commande exécute dans l'ordre : `compile` → `deploy` → `build:contracts` → `dev`

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
cd alephium-stack && make start-devnet && cd ..
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

Depuis le dossier `alephium-stack/` :

| Commande | Description |
|----------|-------------|
| `make start-devnet` | Démarre le devnet (node + explorer + PostgreSQL + pgAdmin) |
| `make stop-devnet` | Arrête le devnet |
| `make restart-devnet` | Redémarre le devnet |

Ou directement depuis `alephium-stack/devnet/` :

```bash
docker compose up -d       # démarrer
docker compose down         # arrêter
docker compose ps           # voir le statut des services
docker compose logs -f      # voir les logs en temps réel
```

### Tout-en-un

| Commande | Description |
|----------|-------------|
| `yarn go` | Compile + déploie + build TS + lance le frontend |

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
cd alephium-stack && make start-devnet && cd ..
```

### Le frontend affiche des adresses vides

Les contracts n'ont pas été déployés. Le fichier `contracts/deployments/.deployments.devnet.json` est lu par `app/next.config.js` au démarrage. Relancer :

```bash
yarn setup
yarn dev
```

### Docker : port already in use

Un autre service utilise les ports requis. Arrêter les containers existants :

```bash
cd alephium-stack && make stop-devnet && cd ..
```

---

## Déploiement Testnet / Mainnet

### 1. Configurer les variables d'environnement

```bash
export NODE_URL=https://node.testnet.alephium.org
export PRIVATE_KEYS=your_private_key_here
```

### 2. Déployer

```bash
npx --yes @alephium/cli deploy --network testnet
```

### 3. Obtenir des ALPH de test

Tokens testnet disponibles via le [Faucet Alephium](https://faucet.testnet.alephium.org/).

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
