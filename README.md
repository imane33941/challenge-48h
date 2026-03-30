# challenge-48h
# Comment appeler l'API

## 1. S'assurer que l'API tourne
```
pip install fastapi uvicorn
```
```bash
uvicorn api:app --reload
```

## 2. Appeler une question

```javascript
let score = 0; // nombre de bonnes réponses du joueur

const res = await fetch(`http://localhost:8000/question/college?score=${score}`);
const question = await res.json();
```

Remplacer `college` par `primaire` ou `lycee` selon le niveau voulu.

## 3. Ce que vous recevez

```json
{
  "question": "Quelle est la capitale de l'Allemagne ?",
  "reponses": ["Berlin", "Munich", "Hambourg", "Francfort"],
  "bonne_reponse": 1
}
```

- `reponses` → les 4 choix à afficher
- `bonne_reponse` → index de la bonne réponse (0 à 3)
- Incrémentez `score` à chaque bonne réponse, la difficulté monte automatiquement