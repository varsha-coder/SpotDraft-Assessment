import React, { useState } from 'react';
import { auth } from '../../firebase/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setError('Wrong password. Please try again.');
      } else if (err.code === 'auth/user-not-found') {
        setError(
          <>
            No user found with this email.&nbsp;
            <button
              className="text-blue-200 underline"
              onClick={() => navigate('/signup')}
            >
              Sign up?
            </button>
          </>
        );
      } else {
        setError('Login failed. Please check your credentials.');
      }
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-sm flex flex-col gap-5">
        <h2 className="text-2xl font-bold text-center text-white mb-2">Login</h2>
        {error && (
          <div className="bg-red-500 text-white rounded p-2 text-center mb-2">
            {error}
          </div>
        )}
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          className="p-3 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="p-3 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleLogin}
          className="p-3 rounded-md bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:from-blue-600 hover:to-cyan-600 transition"
        >
          Log In
        </button>
        <p className="text-center text-gray-400">
          Don't have an account?{' '}
          <button
            className="text-blue-400 underline"
            onClick={() => navigate('/signup')}
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}