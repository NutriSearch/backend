# NutriSearch - Backend

Partie Backend du projet NutriSearch (Node.js + ontologie Protégé).

**But :** fournir une API REST qui expose des recherches sémantiques sur une ontologie RDF/OWL (nutrition), des endpoints CRUD pour les entités sémantiques, et des recommandations basées sur l'ontologie.

## Prérequis
- Node.js 18+ (ou version compatible)
- npm
- MongoDB (optionnel : pour les endpoints `semantic-foods`)

## Installation

```powershell
cd NutriSearch-Backend
npm install
```

## Lancer le serveur

```powershell
# En développement (avec nodemon si installé)
npm run dev

# En production
npm start
```

Le serveur écoute par défaut sur le port configuré dans `server.js` (souvent `5000`).

## Chargement et debug de l'ontologie

Un petit script de test est fourni pour charger l'ontologie et afficher quelques triplets :

```powershell
node scripts/test-load-ontology.js
```

Ce script instancie le loader (`ontology/protege-loader.js`), parse le fichier `data/nutrisearch-ontology.owl` et affiche des exemples de quads.

## Endpoints principaux
Base : `http://localhost:5000/api/semantic`

- `GET /search` : recherche sémantique
	- Query params : `q` (recherche textuelle), `healthGoal`, `nutrient`, `category`
	- Exemple : récupérer tous les aliments
		- Curl:
			```bash
			curl -s "http://localhost:5000/api/semantic/search"
			```
		- PowerShell:
			```powershell
			Invoke-RestMethod -Uri 'http://localhost:5000/api/semantic/search' -Method Get | ConvertTo-Json -Depth 5
			```

- `GET /food/:foodName` : détails d'un aliment (utiliser le local name, ex. `Apple`)
	- Exemple :
		```bash
		curl -s "http://localhost:5000/api/semantic/food/Apple" | jq
		```

- `POST /recommendations` : recommandations santé
	- Body JSON : `{ "goals": ["immune"], "restrictions": [], "userProfile": {} }`
	- Exemple (curl):
		```bash
		curl -s -X POST http://localhost:5000/api/semantic/recommendations \
			-H 'Content-Type: application/json' \
			-d '{"goals":["immune"],"restrictions":[],"userProfile":{}}'
		```

- `GET /stats` : statistiques de l'ontologie (nbr de triplets, entités, etc.)

- `GET /classes` : liste des classes détectées dans l'ontologie

- Endpoints pour la collection `semantic-foods` (MongoDB-backed)
	- `POST /semantic-foods` : créer un enregistrement sémantique
	- `GET /semantic-foods` : lister (avec filtres `nutrient`, `healthEffect`, `season`, `sustainability`, `goal`)
	- `GET /semantic-foods/sustainable` : aliments durables
	- `GET /semantic-foods/:id` : récupérer par id
	- `POST /recommendations/semantic` : recommandations basées sur la collection sémantique

## Exemple d'appel complet (PowerShell)

```powershell
# Requête de recherche textuelle
Invoke-RestMethod -Uri 'http://localhost:5000/api/semantic/search?q=pomme' -Method Get | ConvertTo-Json -Depth 5

# Détails d'un aliment
Invoke-RestMethod -Uri 'http://localhost:5000/api/semantic/food/Apple' -Method Get | ConvertTo-Json -Depth 5

# Recommandations
Invoke-RestMethod -Uri 'http://localhost:5000/api/semantic/recommendations' -Method Post -Body (@{goals=@('immune')} | ConvertTo-Json) -ContentType 'application/json' | ConvertTo-Json -Depth 5
```

## Fichiers importants
- `data/nutrisearch-ontology.owl` : ontologie OWL utilisée
- `ontology/protege-loader.js` : charge et parse l'ontologie (utilise `n3` et un fallback regex parser)
- `ontology/sparql-queries.js` : requêtes SPARQL utilitaires
- `controllers/semanticController.js` : logique des endpoints exposés
- `routes/semantic.js` : routes express

## Dépannage
- Si le loader n'extrait pas de triplets, exécutez `node scripts/test-load-ontology.js` pour voir les logs et exemples.
- Le projet utilise `rdf-parse` quand possible, sinon un parser simplifié basé sur des regex est utilisé en fallback.

## Contributions
N'hésitez pas à ouvrir une issue ou proposer une PR pour améliorer les requêtes SPARQL, ajouter tests ou enrichir l'ontologie.

---
Fichier minimal initial — documentation enrichie par l'équipe.