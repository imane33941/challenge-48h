# Configuration de déploiement sur Render

## 🚀 Backend - challenge-48h-api

Créer un service **Web Service** sur Render avec:

### Build & Start Commands
```
Build: cd server && npm install && npm run build
Start: cd server && node dist/main
```

### Environment Variables
| Variable | Valeur | Source |
|----------|--------|--------|
| `NODE_ENV` | `production` | Manuel |
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Copier de Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJxx...` | Settings → API Keys → Service Role Secret |
| `PORT` | `3000` | (optionnel, défaut 3000) |

### Obtenir les variables Supabase
1. Aller sur https://app.supabase.com
2. Sélectionner le projet
3. Settings → API
4. Copier `Project URL` → `SUPABASE_URL`
5. Copier `Service Role Secret` (danger zone) → `SUPABASE_SERVICE_ROLE_KEY`

---

## 🎨 Frontend - challenge-48h-web

Créer un service **Static Site** sur Render avec:

### Build Command
```
cd client && npm install && npm run build
```

### Publish Directory
```
client/dist
```

### Environment Variables
| Variable | Valeur | 
|----------|--------|
| `VITE_API_URL` | `https://challenge-48h-api.onrender.com` |
| `VITE_WS_URL` | `https://challenge-48h-api.onrender.com` |
| `VITE_SUPABASE_URL` | Même que backend |
| `VITE_SUPABASE_ANON_KEY` | Clé publique Supabase (Settings → API → anon public) |
| `VITE_EXERCISE_ID` | `1` |

---

## ✅ Vérification

Après déploiement:
1. Tester: `https://challenge-48h-web.onrender.com/`
2. Console (F12) → Network → vérifier que requêtes vont vers l'API
3. Essayer login avec test@test.com / password123

---

## 🐛 Si ça marche pas

### Page blanche / 404 sur frontend
→ Attendre 5 min que Render finisse le build

### "NetworkError when attempting to fetch resource"
→ Vérifier console (F12) et voir l'URL détectée
→ Vérifier `VITE_API_URL` = `https://challenge-48h-api.onrender.com`

### Backend retourne 500
→ Vérifier `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`
→ Render logs → voir le stack trace
