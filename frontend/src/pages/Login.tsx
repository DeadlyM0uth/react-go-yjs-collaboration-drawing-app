import { Link } from "react-router-dom";
import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
      } else {
        const data = await res.json();
        localStorage.setItem('user', JSON.stringify({ id:data.user.id, name: data.user.username, email: data.user.email }));
        navigate("/");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white to-gray-400 px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center text-2xl font-semibold text-gray-900">Вход</h1>
        <form className="space-y-4" onSubmit={submit}>
          <div className="relative h-fit">
            <input
              className="rounded-md w-full bg-white  border border-gray-300 text-sm px-3 pb-1 pt-7 focus:border-black focus:outline-none" 
              type="email"
              name="email"
              required
              onChange={e => setEmail(e.target.value)}
            />
            <label className="absolute left-3 top-2 text-sm">Почта</label>
          </div>
          <div className="relative h-fit">
            <input
              className="rounded-md w-full bg-white  border border-gray-300 text-sm px-3 pb-1 pt-7 focus:border-black focus:outline-none" 
              type="password"
              name="password"
              required
              onChange={e => setPassword(e.target.value)}
            />
            <label className="absolute left-3 top-2 text-sm">Пароль</label>
          </div>
          {error && <div className="text-red-500 text-xs">{error}</div>}
          <button 
            className="w-full rounded-md text-white bg-black py-2 font-medium hover:bg-gray-900 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-300"
            disabled={loading}
            type="submit"
          >
            Войти
          </button>

          <p className="text-center text-xs text-gray-600">
            Нет аккаунта?{" "}
            <Link to="/signup" className="text-blue-500 hover:text-black">Зарегистрироваться</Link>
          </p>
        </form>
      </div>
    </div>
  )
}