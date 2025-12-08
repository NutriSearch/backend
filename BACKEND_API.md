# NutriSearch Backend API - Version 1.1.0

Backend Node.js pour la plateforme nutritionnelle sémantique NutriSearch.

## 🚀 Installation & Setup

### Prérequis
- Node.js 18.0+
- MongoDB 6.0+ (local ou Atlas)
- npm/yarn

### Installation

```bash
npm install
```

### Variables d'environnement (.env)

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# MongoDB
MONGODB_URI=mongodb://localhost:27017/nutrisearch

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

### Démarrage

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

## 📡 API Endpoints

### Authentication (`/api/auth`)
- **POST** `/register` - Créer un nouveau compte
- **POST** `/login` - Se connecter
- **POST** `/logout` - Se déconnecter
- **GET** `/me` - Récupérer profil (protégé)
- **PATCH** `/update-me` - Mettre à jour profil (protégé)
- **PATCH** `/update-password` - Modifier mot de passe (protégé)
- **POST** `/forgot-password` - Demander réinitialisation
- **POST** `/reset-password/:token` - Réinitialiser mot de passe

### Users (`/api/users`) - Admin only
- **GET** `/` - Lister tous les utilisateurs
- **GET** `/:id` - Récupérer un utilisateur
- **PATCH** `/:id` - Mettre à jour un utilisateur
- **DELETE** `/:id` - Désactiver un utilisateur

### Semantic (`/api/semantic`)
- **GET** `/search` - Recherche sémantique
- **GET** `/food/:foodName` - Détails d'un aliment
- **POST** `/recommendations` - Recommandations personnalisées
- **GET** `/stats` - Statistiques ontologie

## 🔐 Authentification

Tokens JWT en Header Authorization:
```
Authorization: Bearer <token>
```

Ou en Cookie (automatique):
```
Cookie: token=<token>
```

### Rôles disponibles
- `user` - Utilisateur standard
- `nutritionist` - Nutritionniste
- `admin` - Administrateur

## 📊 Structure de base de données

### User Schema
```javascript
{
  fullName: String (requis),
  email: String (unique, requis),
  password: String (hashé, 8+ chars avec majuscule/minuscule/chiffre),
  role: String (user|nutritionist|admin),
  avatar: String,
  profile: {
    age: Number,
    weight: Number,
    height: Number,
    goals: [String],
    allergies: [String],
    dietaryRestrictions: [String]
  },
  preferences: {
    theme: String,
    language: String,
    notifications: Boolean
  },
  isActive: Boolean,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

## 🧪 Test des Endpoints

### Exemple 1 : Enregistrement

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jean Dupont",
    "email": "jean@example.com",
    "password": "SecurePass123!"
  }'
```

### Exemple 2 : Connexion

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jean@example.com",
    "password": "SecurePass123!",
    "rememberMe": true
  }'
```

### Exemple 3 : Récupérer profil (avec token)

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

## 🛠️ Architecture

```
backend/
├── controllers/
│   ├── authController.js      # Authentification
│   ├── userController.js      # Gestion utilisateurs
│   └── semanticController.js  # Requêtes sémantiques
├── middleware/
│   └── auth.js                # JWT + protection
├── models/
│   ├── User.js                # Schéma utilisateur
│   └── SemanticFood.js        # Données nutritionnelles
├── routes/
│   ├── auth.js                # Routes auth
│   ├── users.js               # Routes utilisateurs
│   └── semantic.js            # Routes ontologie
├── ontology/
│   ├── protege-loader.js      # Chargement OWL
│   ├── reasoner.js            # Inférence
│   └── sparql-queries.js      # Requêtes SPARQL
└── server.js                  # Point d'entrée
```

## 🔑 Sécurité

- Passwords: hashés avec bcrypt (salage 12)
- Tokens JWT: expiration 7j
- CORS: configuré pour frontend à localhost:5173
- Rate limiting: 100 req/heure par IP
- Cookie httpOnly: protection XSS
- SameSite=lax: protection CSRF

## 📈 Roadmap

- [ ] Refresh tokens automatiques
- [ ] Email notifications
- [ ] 2FA / Google Sign-in
- [ ] Food image scanning
- [ ] Webhook events pour frontend
- [ ] GraphQL API alternative

## 🐛 Dépannage

### MongoDB non connectée
```bash
# Vérifier connexion
mongosh
# ou
mongo
```

### Token expiré
Renvoyer un nouveau token via login

### CORS error
Vérifier CLIENT_URL dans .env

## 📞 Support
- Email: support@nutrisearch.fr
- Issues: GitHub Issues
- Docs: /README.md

---

**NutriSearch Backend** - Version 1.1.0
Fait avec ❤️ pour une nutrition intelligente
