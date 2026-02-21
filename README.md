# AlphTrust - Alephium dApp

Monorepo pour le projet AlphTrust, construit sur la blockchain Alephium avec **yarn workspaces**.

| Dossier | Description |
|---------|-------------|
| `contracts/` | Smart contracts en Ralph + scripts de déploiement |
| `app/` | Frontend Next.js (React + TypeScript) |
| `alephium-stack/` | Configuration Docker pour les nodes Alephium |
| `docs/` | Documentation technique du projet |

---

## Prérequis

- [Node.js](https://nodejs.org/) >= 18
- [Yarn](https://classic.yarnpkg.com/) v1 (`npm install -g yarn`)
- [Docker](https://www.docker.com/) et Docker Compose

---

## Setup rapide (depuis zéro)

### 1. Cloner le repo

```bash
git clone <repo-url>
cd HackatonDeauphine
```

### 2. Lancer le devnet local

```bash
cd alephium-stack/devnet
docker compose up -d
```

Attendre que le node soit healthy (~30s) :

```bash
docker compose ps
```

Le node tourne sur `http://127.0.0.1:22973`. Un explorer est dispo sur `http://localhost:23000`.

### 3. Installer les dépendances

```bash
cd ../..   # retour à la racine
yarn install
```

### 4. Compiler les smart contracts

```bash
yarn compile
```

Cela génère les artifacts Ralph dans `contracts/artifacts/`.

### 5. Déployer les contracts sur le devnet

```bash
yarn deploy
```

Le contract ID et l'adresse seront affichés dans la console.

### 6. Builder le package contracts (TypeScript)

```bash
yarn build:contracts
```

Cela compile les artifacts TypeScript dans `contracts/dist/` pour que le frontend puisse les importer via le module `my-contracts`.

### 7. Lancer le frontend

```bash
yarn dev
```

L'app tourne sur `http://localhost:3000`.

---

## Commandes utiles

Toutes les commandes se lancent depuis la **racine** du projet :

| Commande | Description |
|----------|-------------|
| `yarn install` | Installer toutes les dépendances (workspaces) |
| `yarn compile` | Compiler les contracts Ralph -> artifacts |
| `yarn deploy` | Déployer les contracts sur le devnet |
| `yarn build:contracts` | Builder le package TypeScript des contracts |
| `yarn test` | Lancer les tests des contracts |
| `yarn dev` | Lancer le frontend Next.js en dev |
| `yarn build:app` | Build de production du frontend |

---

## Wallet devnet

Pour importer le wallet de dev, utiliser ce mnemonic dans l'extension Alephium :

```
vault alarm sad mass witness property virus style good flower rice alpha viable evidence run glare pretty scout evil judge enroll refuse another lava
```

Ce wallet a 4'000'000 ALPH pre-alloués sur le devnet.

---

## Troubleshooting

### `Failed to load contract artifact ... ENOENT`

Le fichier `.project.json` dans `contracts/` est désynchronisé. Supprimer et recompiler :

```bash
rm contracts/.project.json
yarn compile
```

### `Module not found: Can't resolve 'my-contracts'`

Le package TypeScript des contracts n'est pas buildé. Lancer :

```bash
yarn build:contracts
yarn install
```

### Le deploy échoue avec une erreur de connexion

Le devnet n'est pas lancé. Démarrer le node :

```bash
cd alephium-stack/devnet
docker compose up -d
```

---

## Testnet / Mainnet

Configurer les variables d'environnement avant de déployer :

```bash
export NODE_URL=https://node.testnet.alephium.org
export PRIVATE_KEYS=your_private_key_here
```

Puis déployer avec le flag réseau :

```bash
npx --yes @alephium/cli deploy --network testnet
```

Tokens testnet disponibles via le [Faucet](https://docs.alephium.org/infrastructure/public-services/#testnet-faucet).

---

## Documentation

- [docs/FRONTEND_GUIDE.md](docs/FRONTEND_GUIDE.md) - **Guide frontend** : comment communiquer avec les contrats, exemples de code, pièges à éviter
- [docs/CONTRACTS_API.md](docs/CONTRACTS_API.md) - Documentation de toutes les fonctions des contrats (params, checks, comportement)
- [docs/PROJECT.md](docs/PROJECT.md) - Roadmap backend AlphTrust
- [docs/ALEPHIUM-TECHNICAL-ONBOARDING.md](docs/ALEPHIUM-TECHNICAL-ONBOARDING.md) - Guide technique Alephium & Ralph
- [Documentation officielle Alephium](https://docs.alephium.org/dapps/)
