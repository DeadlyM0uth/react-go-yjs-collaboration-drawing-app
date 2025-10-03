// import React, { useEffect } from "react";

import { useNavigate } from "react-router-dom";



const Home: React.FC = () => {

  const navigate = useNavigate();

  const handleGetStarted = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/validate", {
        method: "GET",
        credentials: "include"
      });
      if (res.ok) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch {
        navigate("/login");
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-400 flex flex-col items-center justify-center">
      <h1 className="text-gray-900 text-5xl font-bold mb-6">Добро пожаловать</h1>
      <p className="text-gray-900 text-lg mb-8">
        Проектируйте, сотрудничайте и воплощайте свои идеи в жизнь.
      </p>
      <button className="px-6 py-3 bg-white text-black font-semibold rounded shadow hover:bg-gray-200 transition"
        onClick={handleGetStarted}
      >
        Начать работу
      </button>
    </div>
  );
};

export default Home;