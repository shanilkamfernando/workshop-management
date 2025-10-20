import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Signup() {
  const [form, setform] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });
  const navigate = useNavigate();
  const [message, setMessage] = useState(null); // for notification
  const [error, setError] = useState(false); // success or error
  const handleChange = (e) => {
    setform({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3001/signup", form);

      setMessage("Signup successful! Please login.");
      setError(false);
      setTimeout(() => setMessage(null), 3000);

      // redirect to login after short delay
      setTimeout(() => navigate("/login"), 1000);

      //   await axios.post("http://localhost:3001/signup", form);
      //   alert("Signup successful! Please Login.");
      //   navigate("/login");
    } catch (err) {
      setMessage(err.response?.data?.error || "Signup failed");
      setError(true);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 relative">
        <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>

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
            placeholder="Username"
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <br />
          <input
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <br />
          <input
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <br />
          <select
            name="role"
            onChange={handleChange}
            value={form.role}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          >
            <option value={"user"}>User</option>
            <option value={"office"}>Office</option>
            <option value={"admin"}>Admin</option>
          </select>
          <br />

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Signup
          </button>
        </form>
        <p className="text-center mt-4 text-gray-600">
          Already have an account?{" "}
          <span
            className="text-blue-500 hover:underline cursor-pointer"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default Signup;
