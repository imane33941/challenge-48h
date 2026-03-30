import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div>
      <h1>Accueil</h1>

      <Link to="/question">
        Aller à la page Question
      </Link>
    </div>
  );
}