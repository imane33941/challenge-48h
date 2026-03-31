export default function QuestionPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Page Question
        </h1>

        <p className="text-gray-600 mb-6">
          Bienvenue sur la page des questions. Tu peux poser une question
          ou consulter les réponses disponibles.
        </p>

        <div className="space-y-4">
          <div className="border rounded-xl p-4 hover:shadow-md transition">
            <h2 className="text-lg font-semibold text-gray-700">
              Exemple de question 1
            </h2>
            <p className="text-gray-500 text-sm">
              Comment fonctionne React Router ?
            </p>
          </div>

          <div className="border rounded-xl p-4 hover:shadow-md transition">
            <h2 className="text-lg font-semibold text-gray-700">
              Exemple de question 2
            </h2>
            <p className="text-gray-500 text-sm">
              Comment utiliser les props en React ?
            </p>
          </div>

          <div className="border rounded-xl p-4 hover:shadow-md transition">
            <h2 className="text-lg font-semibold text-gray-700">
              Exemple de question 3
            </h2>
            <p className="text-gray-500 text-sm">
              Comment connecter une API avec fetch ?
            </p>
          </div>
        </div>

        <button className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition">
          Poser une nouvelle question
        </button>
      </div>
    </div>
  );
}