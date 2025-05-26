import React, { useState } from "react";
import { auth } from "../../firebase/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const navigate = useNavigate();

const handleSignup = async () => {
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setMessageType("error");
    setMessage("Please enter a valid email address.");
    setTimeout(() => setMessage(""), 2000);
    return;
  }
  // Password validation: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  if (!passwordRegex.test(password)) {
    setMessageType("error");
    setMessage(
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
    );
    setTimeout(() => setMessage(""), 3000);
    return;
  }
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    setMessageType("success");
    setMessage("Signed up successfully!");
    setTimeout(() => {
      setMessage("");
      navigate("/login");
    }, 1500);
  } catch (err) {
    console.error(err);
    setMessageType("error");
    setMessage("Signup failed!");
    setTimeout(() => setMessage(""), 2000);
  }
};
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-sm flex flex-col gap-5">
        <h2 className="text-2xl font-bold text-center text-white mb-2">
          Sign Up
        </h2>
        {message && (
          <div
            className={`mb-2 px-4 py-2 rounded text-center font-semibold ${
              messageType === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {message}
          </div>
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="p-3 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="p-3 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSignup}
          className="p-3 rounded-md bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:from-blue-600 hover:to-cyan-600 transition"
        >
          Sign Up
        </button>
        <p className="text-center text-gray-400">
          Already have an account?{" "}
          <button
            className="text-blue-400 underline"
            onClick={() => navigate("/login")}
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  );
}