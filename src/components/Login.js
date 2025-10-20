import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState(null); // for success/error notification
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3001/login", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("id", res.data.user.id);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("username", res.data.user.username);

      // show success message
      setMessage("Login Successful!");
      setError(false);

      // automatically hide the message after 3 seconds
      setTimeout(() => setMessage(null), 3000);

      // navigate to dashboard after short delay
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      setMessage(err.response?.data?.error || "Login Failed");
      setError(true);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 relative">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

        {/* Notification Box */}
        {message && (
          <div
            className={`absolute top-4 left-1/2 transform -translate-x-1/2 w-11/12 p-3 rounded-lg text-center font-medium ${
              error ? "bg-red-500 text-white" : "bg-green-500 text-white"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Login
          </button>
        </form>
        <p className="text-center mt-4 text-gray-600">
          Don’t have an account?{" "}
          <span
            className="text-blue-500 hover:underline cursor-pointer"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
