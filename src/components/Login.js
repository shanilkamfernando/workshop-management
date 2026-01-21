import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(null); // for success/error notification
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3001/login", {
        username: form.username,
        password: form.password,
      });

      console.log("Login response:", res.data);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("id", res.data.user.id);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("username", res.data.user.username);

      console.log("saved to localstorage:", {
        token: localStorage.getItem("token"),
        role: localStorage.getItem("role"),
        username: localStorage.getItem("username"),
      });

      // show success message
      setMessage("Login Successful!");
      setError(false);

      // automatically hide the message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
      setTimeout(() => navigate("/partners"), 1000);
    } catch (err) {
      console.error("Login error:", err);
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
            name="username"
            type="text"
            placeholder="Enter Username"
            onChange={handleChange}
            required
            value={form.username}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter Password"
            onChange={handleChange}
            value={form.password}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                  clipRule="evenodd"
                />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Login
          </button>
        </form>
        {/* <p className="text-center mt-4 text-gray-600">
          Don’t have an account?{" "}
          <span
            className="text-blue-500 hover:underline cursor-pointer"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </span>
        </p> */}
      </div>
    </div>
  );
}

export default Login;
