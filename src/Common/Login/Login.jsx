import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate()
const handleLogin = (e) => {
  e.preventDefault();
  const data = {
    email: email,
    password: password
  };

  axios.post(`${process.env.REACT_APP_BASE_URL}auth/login/`, data)
    .then((res) => {
      localStorage.setItem('access-token', res.data?.data?.access);
      localStorage.setItem('refresh-token', res.data?.data?.refresh);
      toast.success('Login Successfully');
      navigate('/');
    })
    .catch((err) => {
      console.error(err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Login failed. Please check your credentials.";
      toast.error(errorMessage);
      setError(errorMessage); // Optional: if you want to still display it in the component
    });
};


  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white text-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200">
        <h2 className="text-3xl font-bold text-center mb-6">🔐 Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-sm mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-md bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-md bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors py-2 rounded-md font-semibold"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
