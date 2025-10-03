import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-gray-500">
    <h1 className="text-7xl font-extrabold text-gray-700 mb-4">404</h1>
    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Страница не найдена</h2>
    <p className="text-gray-600 mb-8 text-center max-w-md">
      Извините, страница, которую вы ищете, не существует или была перемещена.
    </p>
    <Link
      to="/home"
      className="px-6 py-3 bg-black text-white rounded-lg shadow hover:bg-gray-400 transition"
    >
      На главную
    </Link>
  </div>
);

export default NotFoundPage;