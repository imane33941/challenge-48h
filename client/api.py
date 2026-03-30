from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import json, random

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def load_questions(niveau_scolaire: str):
    with open(f"{niveau_scolaire}.json", encoding="utf-8") as f:
        return json.load(f)["quiz"]["series"]

def score_to_niveau(score: int) -> int:
    if score < 5:
        return 1
    elif score < 12:
        return 2
    else:
        return 3

@app.get("/question/{niveau_scolaire}")
def get_question(niveau_scolaire: str, score: int = Query(default=0)):
    if niveau_scolaire not in ["primaire", "college", "lycee"]:
        raise HTTPException(status_code=400, detail="Niveau invalide")

    try:
        series = load_questions(niveau_scolaire)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Fichier {niveau_scolaire}.json introuvable")

    niveau_difficulte = score_to_niveau(score)
    serie = next((s for s in series if s["niveau"] == niveau_difficulte), series[0])

    question = random.choice(serie["questions"])
    reponses = question["mauvaises_reponses"] + [question["bonne_reponse"]]
    random.shuffle(reponses)

    return {
        "question": question["question"],
        "reponses": reponses,
        "bonne_reponse": reponses.index(question["bonne_reponse"])
    }