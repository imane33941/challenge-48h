# Challenge 48h — Plateforme éducative

Plateforme de jeux éducatifs pour enfants avec système de solo ou multijoueur en temps réel.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React + TypeScript + Vite |
| Routing | React Router DOM |
| State | Zustand |
| Backend | NestJS |
| Base de données | Supabase (PostgreSQL) |
| Auth | Supabase Auth + JWT (ES256) |
| Temps réel | Socket.io |
| CI | GitHub Actions |

---

## Structure du projet

```
challenge-48h/
├── client/                  # Frontend React
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/        # LoginPage
│   │   │   ├── lobby/       # LobbyPage
│   │   │   ├── game/        # GamePage (multijoueur)
│   │   │   ├── exercises/   # CalculPage
│   │   │   └── player/        # PlayerPage
│   │   ├── store/
│   │   │   └── gameStore.ts # Zustand store global
│   │   ├── components/
│   │   │   └── exercise/    # Countdown
│   │   └── router.tsx       # Routes React Router
├── server/                  # Backend NestJS
│   ├── src/
│   │   ├── auth/            # Module auth (JWT + Supabase)
│   │   ├── users/           # Module users
│   │   ├── exercises/       # Module exercises
│   │   ├── progress/        # Module progress
│   │   ├── game/            # Module game (WebSocket)
│   │   ├── supabase/        # Client Supabase
│   │   └── config/          # Variables d'environnement
└── .github/
    └── workflows/
        └── ci.yml           # CI GitHub Actions
```

---

## Installation

### Prérequis

- Node.js 24+
- npm
- Compte Supabase

### Backend

```bash
cd server
npm install
cp .env.sample .env
# Remplir les variables dans .env
npm run start:dev
```

### Frontend

```bash
cd client
npm install
cp .env.sample .env
# Remplir les variables dans .env
npm run dev
```

---

## Variables d'environnement

### `server/.env`

```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

### `client/.env`

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_EXERCISE_ID=your_exercise_uuid
```

---

## Base de données Supabase

### Tables

```sql
-- Profils utilisateurs
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'child',
  username TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  age INT,
  school_level_id UUID REFERENCES school_levels(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Niveaux scolaires
CREATE TABLE school_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercices
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  series INT NOT NULL,
  level INT NOT NULL,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  wrong_answers JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progression
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  score INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Salles de jeu
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('waiting', 'playing', 'finished')) DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Résultats de parties
CREATE TABLE game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INT DEFAULT 0,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Trigger auto-création de profil

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, role)
  VALUES (NEW.id, SPLIT_PART(NEW.email, '@', 1), 'child');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### RLS (Row Level Security)

```sql
-- Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_profile" ON users FOR ALL USING (auth.uid() = id);

-- Exercises
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercises_read" ON exercises FOR SELECT USING (true);
CREATE POLICY "exercises_insert" ON exercises FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Progress
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_progress" ON progress FOR ALL USING (auth.uid() = user_id);

-- Game rooms
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "game_rooms_all" ON game_rooms FOR ALL USING (true) WITH CHECK (true);

-- Game results
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "game_results_all" ON game_results FOR ALL USING (true) WITH CHECK (true);

-- Invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invitations_all" ON invitations FOR ALL USING (true) WITH CHECK (true);
```

---

## API Endpoints

### Auth

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/auth/signup` | Inscription |
| POST | `/auth/signin` | Connexion |
| POST | `/auth/signout` | Déconnexion |
| GET | `/auth/user` | Profil connecté |

### Users

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/users` | ✅ | Créer profil |
| GET | `/users/me` | ✅ | Mon profil |
| PATCH | `/users/me` | ✅ | Modifier profil |
| GET | `/users/by-username/:username` | ❌ | Chercher par pseudo |

### Exercises

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/exercises` | ✅ | Créer exercice |
| POST | `/exercises/bulk` | ✅ | Créer plusieurs exercices |
| GET | `/exercises` | ✅ | Lister exercices |
| GET | `/exercises/:id` | ✅ | Un exercice |

### Progress

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/progress` | ✅ | Enregistrer progression |
| GET | `/progress` | ✅ | Ma progression |
| GET | `/progress/:exerciseId` | ✅ | Progression par exercice |

---

## WebSocket — Événements

Le serveur écoute sur le même port que HTTP (3000).

### Connexion

```javascript
const socket = io('http://localhost:3000', {
  query: { userId: 'uuid-du-user' },
  transports: ['websocket'],
})
```

### Événements émis par le client

| Événement | Payload | Description |
|-----------|---------|-------------|
| `send_invitation` | `{ hostId, guestId, exerciseId }` | Envoyer une invitation |
| `accept_invitation` | `{ invitationId, guestId }` | Accepter |
| `decline_invitation` | `{ invitationId }` | Refuser |
| `submit_answer` | `{ roomId, userId, score, finished, damage }` | Soumettre une réponse |

### Événements reçus par le client

| Événement | Description |
|-----------|-------------|
| `invitation_received` | Invitation reçue |
| `invitation_sent` | Confirmation d'envoi |
| `invitation_declined` | Invitation refusée |
| `game_started` | Partie démarrée |
| `opponent_attacked` | L'adversaire a marqué un point |
| `player_disconnected` | Adversaire déconnecté |

---

## CI/CD

### GitHub Actions

Le fichier `.github/workflows/ci.yml` lance deux jobs à chaque PR vers `main` ou `develop` :

- `build-server` — installe et build le serveur NestJS
- `build-client` — installe et build le client Vite

### Protection des branches

`main` et `develop` sont protégées :
- Merge uniquement via Pull Request
- Les deux jobs CI doivent passer
- Force push bloqué

---

## Flow utilisateur

```
/login
  ↓ (connexion Supabase)
/lobby
  ↓ (recherche ami par pseudo → invitation WebSocket)
/game
  ↓ (jeu calcul mental multijoueur en temps réel)
  ↓ (personnage grimpe selon le score)
Game Over → Rejouer
```

---

## Développement

### Branches

```
main          ← production
develop       ← intégration
feature/nom-prénom/description  ← fonctionnalités
```

### Créer une branche

```bash
git checkout develop
git pull origin develop
git checkout -b feature/prenom-nom/description
```

### Ouvrir une PR

Toujours vers `develop`, jamais directement vers `main`.

---

## Tester le multijoueur en local

1. Lance le serveur : `cd server && npm run start:dev`
2. Lance le client : `cd client && npm run dev`
3. **Chrome** → `http://localhost:5173/login` → connecte le joueur 1
4. **Firefox** → `http://localhost:5173/login` → connecte le joueur 2
5. Dans le lobby, joueur 1 tape le pseudo de joueur 2 et envoie l'invitation
6. Joueur 2 accepte → les deux sont redirigés vers `/game`