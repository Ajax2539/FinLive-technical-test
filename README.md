# Catalogue produits - Test technique

## Objectif

Ce projet repond au cahier des charges du test technique en proposant un catalogue de produits charge par blocs cote serveur, avec pagination, filtrage par categorie, tri par plusieurs champs, et gestion des cas limites.

L'objectif principal etait de ne plus charger tout le catalogue en une seule fois, afin de reduire le volume de donnees transferees et d'ameliorer la fluidite du rendu cote navigateur.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Base de donnees: MongoDB sans Mongoose
- Environnement local: Docker Compose

## Respect des consignes

### 1. Pagination cote serveur

Le backend expose `GET /api/products` avec les parametres suivants:

- `page`
- `limit`
- `category`
- `sort`
- `order`

Les donnees sont lues avec `skip()` et `limit()` sur MongoDB, donc le serveur renvoie uniquement le bloc demande.

### 2. Filtres et tris

Le frontend permet de filtrer le catalogue par categorie (`shoes`, `clothing`, `accessories`, `bags`) et de trier les resultats par:

- date de creation
- prix
- nom
- stock

### 3. Fiabilite

Le backend valide les parametres de tri et d'ordre. Les valeurs de pagination invalides sont normalisees pour eviter les crashes. Le frontend gere aussi les listes vides et les erreurs d'API sans casser l'interface.

### 4. Contraintes techniques

Le projet respecte les contraintes imposees:

- React pour le frontend
- Express pour le backend
- MongoDB sans Mongoose

## Architecture du projet

### Frontend

#### `frontend/src/main.jsx`

Point d'entree React. Il monte l'application dans le DOM et charge la feuille de style globale.

#### `frontend/src/App.jsx`

Composant principal de l'interface. Il gere:

- le state de pagination
- le filtre de categorie
- le tri
- le chargement des donnees
- l'affichage de la grille produits
- l'affichage de la pagination numerotee

Le composant envoie les requetes vers `/api/products` via le proxy Vite.

#### `frontend/src/index.css`

Feuille de style principale de l'interface. Elle definit:

- la grille des produits
- les boutons de tri et de pagination
- le style de la page active
- les adaptations responsives desktop/tablet/mobile

#### `frontend/vite.config.js`

Configuration Vite avec proxy `/api` vers le backend. Cela permet au frontend d'appeler une URL locale simple sans gérer le CORS cote navigateur.

### Backend

#### `backend/src/index.js`

Serveur Express principal. Il:

- se connecte a MongoDB
- expose `GET /api/products`
- valide les parametres recu
- construit la requete MongoDB
- retourne `items` et `pagination`

La route utilise un tri par defaut stable avec `_id` en second critere pour eviter les ordres non deterministes quand plusieurs produits ont la meme valeur.

#### `backend/package.json`

Declare les dependances serveur et les scripts de demarrage.

### Orchestration

#### `docker-compose.yml`

Lance les trois services:

- MongoDB
- backend
- frontend

Le backend pointe vers `mongodb://mongo:27017/shop` dans le reseau Docker interne.

#### `Makefile`

Simplifie les commandes courantes:

- `make up`
- `make down`
- `make logs`
- `make fclean`

## Communication entre les modules

### Frontend vers backend

Le frontend construit une URL du type:

```text
/api/products?page=1&limit=12&sort=price&order=desc&category=shoes
```

Le composant React recupere ensuite la reponse JSON et met a jour:

- `products`
- `pagination`

### Backend vers MongoDB

Le backend ouvre une connexion MongoDB au demarrage, puis lit la collection `products` dans la base `shop`.

La requete est construite comme suit:

1. creation du filtre `category` si besoin
2. comptage total des documents avec `countDocuments()`
3. calcul de la page courante et du nombre total de pages
4. lecture du bloc voulu avec `find().sort().skip().limit()`

### MongoDB vers backend

MongoDB renvoie uniquement le bloc de documents demande. Le backend transforme ensuite ces documents en structure JSON stable pour le frontend.

## Pourquoi ce type de pagination

Le choix s'est porte sur une pagination numerotee cote frontend avec chargement cote serveur pour plusieurs raisons:

- elle respecte la consigne de chargement par blocs
- elle reste simple a comprendre pour un test technique
- elle permet de tester rapidement les changements de page, de filtre et de tri
- elle est plus robuste qu'un scroll infini pour une demonstration fonctionnelle

Le scroll infini aurait ete plus complexe a maintenir ici car il demande une gestion plus fine des intersections, du prechargement et des requetes concurrentes. La pagination numerotee donne un comportement plus lisible et plus previsible.

## Gestion des cas limites

Le projet gere plusieurs cas limites:

- page ou limit invalides
- tri ou ordre invalides
- resultat vide apres filtrage
- erreur serveur

## Lancer le projet

```bash
make up
```

Ensuite:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- MongoDB expose sur le port `27018` en local


L'ensemble reste volontairement minimal pour garder le code facile a evaluer, tout en couvrant les besoins fonctionnels imposes.
