🏗️ BACKEND ROADMAP : AlphTrust (From Scratch)
Phase 1 : Définition du Contrat (escrow.ral)
C'est ici qu'on définit la "mémoire" du projet.

Les champs (Fields) à demander à Claude :

client : L'adresse de celui qui paie.

freelancer : L'adresse du travailleur.

arbiter : L'adresse du juge.

amount : Le prix en ALPH.

collateral : La caution demandée au freelance.

deadline : Temps limite (Unix timestamp).

cdcHash : L'empreinte (CID IPFS) du cahier des charges initial.

mut deliverableLink : (Ton oubli) Le lien vers le travail fini (ex: Drive/GitHub).

mut status : L'état du contrat (0=Créé, 1=Actif, 2=Livré, 3=Litige, 4=Terminé).

Phase 2 : Les 5 Fonctions Vitales
Voici l'ordre logique que Claude doit coder :

create() : Le client dépose l'argent et fixe le cdcHash.

acceptAndDeposit() : Le freelance dépose sa caution. C'est ici qu'on utilise le modèle sUTXO : le contrat fusionne les fonds du client et du freelance.

deliver(link) : Le freelance enregistre l'URL de son travail dans deliverableLink et passe le statut à "Livré".

release() : Le client valide. Action Atomique : Le contrat envoie d'un coup amount + collateral au freelance.

dispute() & resolve() : Pour bloquer les fonds et laisser l'arbitre trancher.

Phase 3 : Les "Fail-safes" (Sécurité)
C'est ce qui fait la différence entre un projet d'étudiant et un projet de gagnant :

cancelByClient() : Si le freelance n'a pas encore accepté (déposé sa caution), le client peut récupérer son argent.

autoClaim() : Si le freelance a livré et que le client fait le mort après la deadline + 48h, le freelance récupère tout automatiquement.

Phase 4 : Les Transaction Scripts (TxScripts)
Sur Alephium, on ne parle pas au contrat directement, on utilise des petits scripts de transition. Claude Code doit en générer un pour chaque action (Create, Accept, Deliver, Release).

🤖 PROMPT À COPIER POUR CLAUDE CODE
Copie ce pavé pour lancer Claude Code sur le projet :

"Claude, nous développons AlphTrust sur Alephium (langage Ralph). C'est un protocole d'escrow atomique.

Crée un contrat Escrow.ral avec les champs : client, freelancer, arbiter (Addresses), amount, collateral, deadline (U256), cdcHash, deliverableLink (ByteVec) et status (U256).

Implémente la fonction acceptAndDeposit où le freelance dépose sa caution en utilisant l'Asset Permission System (@using(preapprovedAssets = true)).

Implémente deliver(link: ByteVec) qui met à jour le lien du livrable.

Implémente release() qui réalise l'échange atomique sUTXO : envoie amount + collateral au freelance.

Précise bien les annotations @using(updateFields = true) pour que les changements de statut soient enregistrés.

Génère les TxScripts correspondants pour que je puisse les appeler via le SDK TypeScript."
