import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { getApiUrl } from "@/config/apiConfig";
import "./question.css";

type Question = {
  question: string;
  reponses: string[];
  bonne_reponse: number;
};

type RawQuestion = {
  question: string;
  bonne_reponse: string;
  mauvaises_reponses: string[];
};

type QuizSeries = {
  niveau: number;
  questions: RawQuestion[];
};

type QuizFile = {
  quiz: {
    series: QuizSeries[];
  };
};

function scoreToNiveau(score: number) {
  if (score < 5) return 1;
  if (score < 12) return 2;
  return 3;
}

function shuffle<T>(items: T[]) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export default function Question() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string>("");
  const [loadError, setLoadError] = useState<string>("");
  const [locked, setLocked] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { niveau } = useParams<{ niveau: string }>();

  async function nouvelleQuestion(nextScore: number) {
    if (!niveau) {
      setLoadError("Niveau manquant.");
      return;
    }

    setLoadError("");

    try {
      const apiRes = await fetch(`${getApiUrl()}/question/${niveau}?score=${nextScore}`);
      if (apiRes.ok) {
        const data = (await apiRes.json()) as Question;
        setQuestion(data);
        return;
      }
    } catch {
      // Fallback below to local JSON files.
    }

    try {
      const localRes = await fetch(`/${niveau}.json`);
      if (!localRes.ok) throw new Error("local json missing");

      const localData = (await localRes.json()) as QuizFile;
      const niveauDifficulte = scoreToNiveau(nextScore);
      const serie =
        localData.quiz.series.find((item) => item.niveau === niveauDifficulte) ??
        localData.quiz.series[0];
      if (!serie || serie.questions.length === 0) throw new Error("no local question");

      const picked = serie.questions[Math.floor(Math.random() * serie.questions.length)];
      const reponses = shuffle([...picked.mauvaises_reponses, picked.bonne_reponse]);
      setQuestion({
        question: picked.question,
        reponses,
        bonne_reponse: reponses.indexOf(picked.bonne_reponse),
      });
    } catch {
      setQuestion(null);
      setLoadError("Impossible de charger les questions.");
    }
  }

  useEffect(() => {
    void nouvelleQuestion(score);
  }, [niveau]);

  if (!question) {
    return (
      <div className="quiz-page">
        <div className="quiz-card">
          <p className="quiz-loading">{loadError || "Chargement..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-page">
      <div className="quiz-card">
        <button className="back-btn" type="button" onClick={() => navigate('/menu')}>
          ← Menu
        </button>
        <p className="quiz-score">Score: {score}</p>
        <h1 className="quiz-question">{question.question}</h1>

        <div className="quiz-answers">
          {question.reponses.map((rep, i) => {
            const isCorrect = i === question.bonne_reponse;
            const isSelected = i === selectedIndex;
            const shouldHighlight = selectedIndex !== null;

            let stateClass = "";
            if (shouldHighlight && isCorrect) stateClass = "correct";
            if (shouldHighlight && isSelected && !isCorrect) stateClass = "wrong";

            return (
              <button
                key={i}
                type="button"
                disabled={locked}
                className={`quiz-answer ${stateClass}`.trim()}
                onClick={() => {
                  if (locked) return;

                  setLocked(true);
                  setSelectedIndex(i);

                  const nextScore = isCorrect ? score + 1 : score;
                  if (isCorrect) {
                    setScore(nextScore);
                    setFeedback("Bonne reponse !");
                  } else {
                    setFeedback(
                      `Mauvaise reponse. La bonne etait: ${question.reponses[question.bonne_reponse]}`
                    );
                  }

                  setTimeout(() => {
                    setFeedback("");
                    setSelectedIndex(null);
                    setLocked(false);
                    void nouvelleQuestion(nextScore);
                  }, 900);
                }}
              >
                {rep}
              </button>
            );
          })}
        </div>

        {feedback && (
          <p className={`quiz-feedback ${feedback.startsWith("Bonne") ? "ok" : "ko"}`}>{feedback}</p>
        )}
      </div>
    </div>
  );
}