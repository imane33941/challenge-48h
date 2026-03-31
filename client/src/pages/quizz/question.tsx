import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

type Question = {
  question: string;
  reponses: string[];
  bonne_reponse: number;
};

export default function Question() {
  const [question, setQuestion] = useState<Question | null>(null); // changer ici
  const [score, setScore] = useState(0);
  const { niveau } = useParams<{ niveau: string }>();
  async function nouvelleQuestion() {
    const res = await fetch(`http://localhost:8000/question/${niveau}?score=${score}`);
    const data = await res.json();
    setQuestion(data);
  }

  useEffect(() => {
    nouvelleQuestion();
  }, []);

  if (!question) return <p>Chargement...</p>;

  return (
    <div>
      <p>{question.question}</p>
      {question.reponses.map((rep, i) => (
        <button key={i} onClick={() => {
          if (i === question.bonne_reponse) setScore(score + 1);
          nouvelleQuestion();
        }}>
          {rep}
        </button>
      ))}
    </div>
  );
}