# Stop Galère — API Backend

> **stopgalere-api v4.0.5** — API REST + temps réel pour la plateforme Stop Galère (offres d'emploi, lettres de motivation, assistance client avec chat et appel vidéo).

---

## Table des matières

1. [Stack technique](#stack-technique)
2. [Architecture](#architecture)
3. [Fonctionnalités](#fonctionnalités)
4. [Structure du projet](#structure-du-projet)
5. [Modèles de données](#modèles-de-données)
6. [API REST — Référence](#api-rest--référence)
7. [Temps réel — Socket.io](#temps-réel--socketio)
8. [Appel vidéo — Signalisation WebRTC](#appel-vidéo--signalisation-webrtc)
9. [Authentification](#authentification)
10. [Fonctionnalités IA](#fonctionnalités-ia)
11. [Upload de fichiers](#upload-de-fichiers)
12. [Variables d'environnement](#variables-denvironnement)
13. [Tests](#tests)
14. [Lancer le projet](#lancer-le-projet)
15. [CI/CD](#cicd)

---

## Stack technique

| Couche | Technologie |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express 4 |
| Base de données | MongoDB (Mongoose ODM) |
| Temps réel | Socket.io 4 |
| Signalisation vidéo | WebRTC (via Socket.io) |
| Authentification | JWT (jsonwebtoken, 210 jours) + Firebase Admin SDK |
| Validation | express-validator |
| Upload | Multer |
| Sécurité | Helmet, bcryptjs, CORS |
| Logs | Winston |
| Tests | Jest + Supertest + socket.io-client + MongoMemoryServer |
| Planification | node-cron |
| Push notifications | OneSignal |
| IA texte | OpenAI GPT-4o / Google Gemini 1.5 Flash / DeepSeek |
| IA image | OpenAI DALL·E 3 |
| Email | Nodemailer (SMTP) |

---

## Architecture

```
MVC classique — séparation stricte Routeur → Contrôleur → Service → Modèle
```

```
src/
├── app.js              # Factory Express (createApp)
├── server.js           # Point d'entrée — crée le serveur HTTP et attache Socket.io
├── config/
│   ├── index.js        # Variables d'env + validation au démarrage
│   └── logger.js       # Winston (fichiers + console)
├── middlewares/
│   ├── auth.middleware.js        # JWT — optional / required / requireAdmin
│   ├── validation.middleware.js  # Gestion express-validator
│   └── error.middleware.js       # Handler global d'erreur
├── models/             # Schémas Mongoose
├── controllers/        # Logique métier HTTP
├── routes/             # Déclaration des routes Express
├── services/           # Services transverses (Socket.io, Firebase, fichiers)
└── jobs/               # Tâches cron (node-cron)
```

---

## Fonctionnalités

### Authentification & Profil utilisateur
- Inscription locale (email + mot de passe + prénom/nom/âge/téléphone/photo)
- Connexion locale avec vérification bcrypt en temps constant
- OAuth via token Firebase ID (Google Sign-In **et** Apple ID)
- Gestion du profil : consultation, mise à jour, upload de photo
- JWT signé (210 jours), injecté automatiquement côté client

### Offres d'emploi
- Listing paginé avec recherche full-text
- Détail d'une offre
- Synchronisation via tâches cron (`add-job.job`, `delete-job.job`)

### Lettres de motivation
- CRUD complet (création, listing paginé, détail, suppression)
- Upload de document (Word, HTML, PDF ≤ 5 Mo) via Multer
- Conversion HTML via `mammoth` / `word-extractor`

### Chat Assistance Client
- Une room Socket.io par utilisateur (`support-{userId}`)
- Agents support rejoignent automatiquement `support-agents`
- Historique paginé via API REST
- Partage de fichiers : images + documents ≤ 5 Mo
- Indicateur de frappe en temps réel
- Marquage des messages lus
- Compteurs non-lus côté user et côté support

### Appel Vidéo *(nouveau)*
- Signalisation WebRTC pure via Socket.io (pas de SDK tiers)
- Relais SDP offer/answer entre pairs
- Échange ICE candidates pour traversée NAT (STUN)
- Rejet et fin d'appel propagés à toute la room
- Authentification JWT vérifiée sur chaque connexion socket

### Notifications Push
- Envoi OneSignal via API REST interne

---

## Structure du projet

```
stg_api/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── index.js
│   │   └── logger.js
│   ├── controllers/
│   │   ├── ai.controller.js          # ← nouveau
│   │   ├── auth.controller.js
│   │   ├── chat.controller.js
│   │   ├── common.controller.js
│   │   ├── cover-letter.controller.js
│   │   ├── job.controller.js
│   │   └── resume.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── validation.middleware.js
│   ├── models/
│   │   ├── index.js
│   │   ├── cover-letter.model.js
│   │   ├── job.model.js
│   │   ├── message.model.js
│   │   ├── resume.model.js
│   │   ├── room.model.js
│   │   └── user.model.js
│   ├── routes/
│   │   ├── ai.routes.js              # ← nouveau
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   ├── chat.routes.js
│   │   ├── cover-letters.routes.js
│   │   ├── health.routes.js
│   │   ├── jobs.routes.js
│   │   └── push.routes.js
│   ├── services/
│   │   ├── ai.service.js             # multi-provider IA ← nouveau
│   │   ├── file.service.js       # Multer — résumés, photos, fichiers chat
│   │   ├── firebase.service.js   # Firebase Admin (OAuth)
│   │   ├── mail.service.js           # SMTP ← nouveau
│   │   └── socket.service.js     # Socket.io — chat + signalisation WebRTC
│   └── jobs/
│       ├── add-job.job.js
│       └── delete-job.job.js
└── tests/
    ├── controllers/
    │   ├── auth.controller.test.js
    │   ├── chat.controller.test.js
    │   └── ...
    ├── middlewares/
    ├── models/
    ├── routes/
    │   ├── auth.e2e.test.js
    │   ├── chat.e2e.test.js
    │   └── ...
    ├── controllers/
    │   └── ai.controller.test.js     # 10 tests ← nouveau
    ├── routes/
    │   └── ai.e2e.test.js            # 8 tests ← nouveau
    └── socket/
        └── signaling.test.js      # Tests signalisation WebRTC
```

---

## Modèles de données

### User
```js
{ firstName, lastName, age, email (unique), phone, photoUrl,
  password (hashed, optionnel pour OAuth), authProvider ('local'|'google'|'apple'),
  firebaseUid (sparse), role ('user'|'admin') }
```

### Job
```js
{ title, company, location, sector, description, url, publishedAt }
```

### Resume
```js
{ userId, filename, fileUrl, originalName, createdAt }
```

### CoverLetter
```js
{ userId, title, content (HTML), fileUrl, createdAt }
```

### Room *(chat)*
```js
{ userId (unique), roomId ("support-{userId}"), status ('open'|'closed'),
  lastMessage, lastMessageAt, unreadBySupport, unreadByUser }
```

### Message *(chat)*
```js
{ roomId (indexé), senderId, senderType ('user'|'support'),
  content, fileUrl, fileName, fileSize, fileType ('image'|'document'|null), readAt }
```

---

## API REST — Référence

Base URL : `https://stopgalere.rolandassoh.com/api`

### Auth — `/api/auth`

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | — | Inscription locale |
| `POST` | `/login` | — | Connexion locale |
| `POST` | `/oauth` | — | OAuth Google / Apple (Firebase ID token) |
| `GET` | `/me` | ✅ Bearer | Profil courant |
| `PUT` | `/profile` | ✅ Bearer | Mise à jour du profil |
| `POST` | `/photo` | ✅ Bearer | Upload photo de profil (multipart, champ `photo`) |

### Offres d'emploi — `/api/jobs`

| Méthode | Chemin | Description |
|---|---|---|
| `GET` | `/jobs?page=1&query=...` | Liste paginée |
| `GET` | `/jobs/:id` | Détail |
| `DELETE` | `/jobs/:id` | Suppression |

### Lettres de motivation — `/api/cover-letters`

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| `GET` | `/cover-letters?page=1` | ✅ | Liste paginée |
| `GET` | `/cover-letters/:id` | ✅ | Détail |
| `DELETE` | `/cover-letters/:id` | ✅ | Suppression |

### Chat Assistance — `/api/chat`

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| `GET` | `/chat/rooms` | ✅ Bearer | Sa propre room (user) ou toutes (admin) |
| `GET` | `/chat/rooms/:roomId/messages` | ✅ Bearer | Historique paginé (`?limit=30&before=<ISO>`) |
| `POST` | `/chat/rooms/:roomId/files` | ✅ Bearer | Upload pièce jointe (multipart, champ `file`) |

### IA — `/api/ai`

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| `POST` | `/ai/cover-letter` | ✅ Bearer | Génère une lettre de motivation IA |
| `POST` | `/ai/professional-photo` | ✅ Bearer | Génère une photo pro via DALL·E 3 |

#### `POST /api/ai/cover-letter`
Body JSON :
```json
{
  "jobTitle": "Développeur Backend Node.js",
  "jobDescription": "...",
  "jobCompany": "Acme Corp",
  "ocrTexts": ["Diplôme Master Informatique...", "Certificat AWS..."],
  "voiceTranscript": "Je suis motivé par les défis techniques",
  "provider": "openai",
  "sendToEmail": "candidat@email.com"
}
```
Réponse : `{ "success": true, "coverLetter": "Madame, Monsieur, ..." }`

Providers supportés : `openai` (GPT-4o), `gemini` (Gemini 1.5 Flash), `deepseek` (DeepSeek Chat)

#### `POST /api/ai/professional-photo`
Body multipart/form-data :
- `photo` (fichier, optionnel) — photo de l'utilisateur
- `style` — style de fond (ex: "professional office blur")
- `withSuit` — `"true"` / `"false"`
- `voiceDescription` — description vocale transcrite
- `provider` — provider IA (ignoré pour image, toujours DALL·E)
- `sendToEmail` — email destinataire (optionnel)
- `jobTitle` — titre du poste (optionnel)

Réponse : `{ "success": true, "photoUrl": "/uploads/ai-photos/ai-photo-1234567890.jpg" }`

### Santé

| Méthode | Chemin | Description |
|---|---|---|
| `GET` | `/health` | `{ status: 'ok' }` |

---

## Temps réel — Socket.io

### Connexion

```js
const socket = io(SERVER_URL, {
  auth: { token: 'Bearer <jwt>' }
});
```

### Rooms

| Room | Membres |
|---|---|
| `support-{userId}` | L'utilisateur concerné + tous les admins |
| `support-agents` | Tous les admins (auto-jointure à la connexion) |

### Événements Chat — client → serveur

| Événement | Payload | Description |
|---|---|---|
| `join_room` | `{ roomId }` | Rejoindre / créer une room |
| `send_message` | `{ roomId, content }` | Envoyer un message texte |
| `mark_read` | `{ roomId }` | Marquer les messages reçus comme lus |
| `typing` | `{ roomId, isTyping }` | Indicateur de frappe |

### Événements Chat — serveur → client

| Événement | Payload | Description |
|---|---|---|
| `room_joined` | `{ room }` | Confirmation + métadonnées de la room |
| `new_message` | `{ message }` | Nouveau message (texte ou fichier) |
| `messages_read` | `{ roomId, readAt }` | Accusé de lecture |
| `user_typing` | `{ roomId, isTyping, sender }` | Indicateur de frappe de l'autre partie |
| `error` | `{ message }` | Erreur métier |

---

## Appel vidéo — Signalisation WebRTC

Le serveur agit comme **relais de signalisation pur** : il transmet les messages WebRTC entre les pairs sans accéder au contenu média. La connexion P2P est établie directement entre les appareils via STUN.

### Protocole de négociation

```
Appelant                  Serveur (Socket.io)            Appelé
   │                             │                          │
   ├── call_offer {roomId,sdp} ─▶│                          │
   │                             ├── call_incoming ────────▶│
   │                             │      {roomId,fromUserId, │
   │                             │       sdp}               │
   │                             │◀─ call_answer {roomId,sdp}│
   │◀──────── call_answered ─────┤                          │
   │          {roomId,sdp}       │                          │
   │                             │                          │
   ├─ ice_candidate ────────────▶│── ice_candidate ────────▶│
   │◀──────── ice_candidate ─────┤◀─ ice_candidate ─────────│
   │                      Connexion P2P établie             │
   │                             │                          │
   ├─ call_end {roomId} ────────▶│── call_ended ───────────▶│
```

### Événements Appel vidéo — client → serveur

| Événement | Payload | Action serveur |
|---|---|---|
| `call_offer` | `{ roomId, sdp }` | Relais `call_incoming` aux autres de la room (exclut l'émetteur) |
| `call_answer` | `{ roomId, sdp }` | Relais `call_answered` aux autres de la room |
| `call_reject` | `{ roomId }` | Relais `call_rejected` aux autres de la room |
| `call_end` | `{ roomId }` | Broadcast `call_ended` à **tous** dans la room |
| `ice_candidate` | `{ roomId, candidate }` | Relais `ice_candidate` aux autres de la room (exclut l'émetteur) |

### Événements Appel vidéo — serveur → client

| Événement | Payload | Description |
|---|---|---|
| `call_incoming` | `{ roomId, fromUserId, sdp }` | Appel entrant — SDP offer de l'appelant |
| `call_answered` | `{ roomId, sdp }` | L'appelé a accepté — SDP answer |
| `call_rejected` | `{ roomId }` | L'appelé a refusé |
| `call_ended` | `{ roomId }` | L'un des pairs a raccroché |
| `ice_candidate` | `{ roomId, candidate }` | Candidat ICE à ajouter à la PeerConnection |

> **Sécurité** : tous les événements de signalisation nécessitent un JWT valide (vérifié au handshake). Un `roomId` manquant ou un SDP absent retourne un événement `error` à l'émetteur.

---

## Authentification

### JWT
- Algorithme HS256, expiration 210 jours
- Payload : `{ sub: userId, email, role }`
- Middleware `auth.required` → injecte `req.userId` et `req.user`
- Middleware `auth.requireAdmin` → vérifie `role === 'admin'`

### OAuth (Google / Apple)
1. Le client obtient un **Firebase ID Token** côté mobile
2. Il l'envoie à `POST /api/auth/oauth` `{ idToken }`
3. Le serveur vérifie le token via **Firebase Admin SDK**
4. Upsert de l'utilisateur, retourne un JWT applicatif

### Sécurité
- Mots de passe hashés avec `bcryptjs` (salt 12)
- Comparaison en temps constant
- Messages d'erreur 401 génériques (pas de fuite d'info)
- Aucun credential loggé

---

## Fonctionnalités IA

### Architecture multi-provider

Le service `ai.service.js` abstrait 3 providers IA pour la génération de texte :

| Provider | Modèle | Clé env |
|---|---|---|
| OpenAI (ChatGPT) | `gpt-4o` | `OPENAI_API_KEY` |
| Google Gemini | `gemini-1.5-flash` | `GEMINI_API_KEY` |
| DeepSeek | `deepseek-chat` (API OpenAI-compat) | `DEEPSEEK_API_KEY` |

La génération d'image utilise **toujours DALL·E 3** (OpenAI), indépendamment du provider sélectionné.

### Flux Lettre de Motivation
```
POST /api/ai/cover-letter
  ├── Validation (jobTitle requis, provider valide, email valide)
  ├── Construction du prompt (job info + OCR texts + voice transcript)
  ├── aiService.generateText(prompt, provider)
  ├── [optionnel] mailService.sendCoverLetterEmail(to, jobTitle, coverLetter)
  └── { success: true, coverLetter }
```

### Flux Photo Professionnelle
```
POST /api/ai/professional-photo (multipart)
  ├── Multer upload photo → uploads/ai-photos/
  ├── Construction prompt DALL·E (style + withSuit + voiceDescription)
  ├── aiService.generateImage(prompt) → URL DALL·E
  ├── axios.get(url) → fs.writeFileSync(uploads/ai-photos/ai-photo-xxx.jpg)
  ├── [optionnel] mailService.sendPhotoEmail(to, jobTitle, photoUrl)
  └── { success: true, photoUrl: '/uploads/ai-photos/...' }
```

### Upload IA

| Type | Champ Multer | Destination | Extensions | Taille max | Nb max |
|---|---|---|---|---|---|
| Documents IA | `documents` | `uploads/ai-docs/` | images + pdf/doc/docx | 5 Mo | 5 |
| Photo IA | `photo` | `uploads/ai-photos/` | images (jpg/png/gif/webp) | 5 Mo | 1 |

### Variables d'environnement IA

```env
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
DEEPSEEK_API_KEY=sk-...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ton@email.com
SMTP_PASS=mot_de_passe_application
SMTP_FROM=noreply@stopgalere.com
AI_DEFAULT_PROVIDER=openai
```

> Les clés manquantes déclenchent un `console.warn` au démarrage — le serveur démarre quand même, mais les endpoints IA retourneront une erreur si la clé du provider demandé est absente.

---

## Upload de fichiers

| Type | Champ Multer | Destination | Extensions | Taille max |
|---|---|---|---|---|
| Photo de profil | `photo` | `uploads/photos/` | jpg, jpeg, png, webp, gif | 5 Mo |
| CV / Résumé | `resumeFile` | `uploads/resumes/` | doc, docx, html, pdf | 5 Mo |
| Chat — pièce jointe | `file` | `uploads/chat/` | images + doc, docx, xls, xlsx, pdf, txt | 5 Mo |

Les fichiers sont servis statiquement sous `/uploads`.

---

## Variables d'environnement

```env
# Obligatoires
PORT=3000
JWT_SECRET=<64 caractères minimum>
DB_URI=mongodb://localhost:27017/stopgalere
ONESIGNAL_APP_ID=<id>
ONESIGNAL_API_KEY=<clé>

# Optionnels
FIREBASE_PROJECT_ID=<project-id>   # Requis pour OAuth Google/Apple
UPLOAD_DIR=uploads/                # Répertoire racine des fichiers
NODE_ENV=production

# IA & Email
OPENAI_API_KEY=sk-...              # OpenAI GPT-4o + DALL·E 3
GEMINI_API_KEY=AIza...             # Google Gemini 1.5 Flash
DEEPSEEK_API_KEY=sk-...            # DeepSeek Chat
SMTP_HOST=smtp.gmail.com           # Serveur SMTP sortant
SMTP_PORT=587                      # Port SMTP (défaut 587)
SMTP_USER=ton@email.com            # Identifiant SMTP
SMTP_PASS=mot_de_passe_application # Mot de passe SMTP
AI_DEFAULT_PROVIDER=openai         # Provider par défaut (défaut: openai)
```

---

## Tests

```bash
# Tous les tests
npm test

# Par suite
npx jest tests/controllers/chat.controller.test.js
npx jest tests/socket/signaling.test.js
npx jest tests/routes/chat.e2e.test.js

# Mode watch
npx jest --watch

# Avec couverture
npx jest --coverage
```

### Couverture des tests

| Suite | Type | Tests |
|---|---|---|
| `ai.controller.test.js` | Unitaire | ✅ 10 |
| `auth.controller.test.js` | Unitaire | ✅ 22 |
| `chat.controller.test.js` | Unitaire | ✅ 15 |
| `common/cover-letter/job/resume.controller.test.js` | Unitaire | ✅ |
| `auth.middleware.test.js` | Unitaire | ✅ |
| `error/validation.middleware.test.js` | Unitaire | ✅ |
| `*.model.test.js` | Unitaire | ✅ |
| `ai.e2e.test.js` | E2E (MongoMemoryServer) | ✅ 8 |
| `auth.e2e.test.js` | E2E (MongoMemoryServer) | ✅ 19 |
| `chat.e2e.test.js` | E2E (MongoMemoryServer) | ✅ 16 |
| `signaling.test.js` | Intégration Socket.io | ✅ **11** |
| `*.routes.test.js` | Intégration HTTP | ✅ |

> Les tests E2E et de signalisation utilisent `mongodb-memory-server` + `socket.io-client` — aucune base de données ni serveur réel requis.

---

## Lancer le projet

```bash
# Installation
npm install

# Développement (avec rechargement)
npm run dev

# Production
npm start
```

> **Note** : remplacer `app/google-services.json` par le vrai fichier Firebase avant toute utilisation des endpoints OAuth.

---

## CI/CD

### Lancer les tests

```bash
# Tous les tests
npm test

# Par suite
npx jest tests/controllers/ai.controller.test.js
npx jest tests/routes/ai.e2e.test.js
npx jest tests/socket/signaling.test.js

# Couverture complète
npx jest --coverage

# Mode watch
npx jest --watch
```

### Variables d'environnement complètes

```env
# Obligatoires
PORT=3000
JWT_SECRET=<64 caractères minimum>
DB_URI=mongodb://localhost:27017/stopgalere

# Push notifications
ONESIGNAL_APP_ID=<id>
ONESIGNAL_API_KEY=<clé>

# OAuth Firebase
FIREBASE_PROJECT_ID=<project-id>

# IA — Génération de texte et d'image
OPENAI_API_KEY=sk-...           # ChatGPT GPT-4o + DALL·E 3
GEMINI_API_KEY=AIza...          # Google Gemini 1.5 Flash
DEEPSEEK_API_KEY=sk-...         # DeepSeek Chat (API OpenAI-compat)
AI_DEFAULT_PROVIDER=openai      # provider par défaut

# Email SMTP (pour envoi lettres et photos)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ton@email.com
SMTP_PASS=mot_de_passe_application
SMTP_FROM=noreply@stopgalere.com

# Optionnels
UPLOAD_DIR=uploads/
NODE_ENV=production
BASE_URL=https://stopgalere.rolandassoh.com
```

### Pipeline de déploiement

```
git push origin main
       ↓
  npm test (CI)
       ↓
  npm start (PM2 / Docker)
```

### Démarrage rapide

```bash
# Développement
npm install
cp .env.example .env   # remplir les valeurs
npm run dev

# Production
npm start

# Tests complets avec couverture
npx jest --coverage --forceExit
```
