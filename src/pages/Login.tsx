// src/pages/Login.tsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Show message if redirected from verify/reset
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const { error } = await signIn(email, password);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Login successful → redirect to Dashboard/Home
    navigate('/profile');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-md"
      >
        <div className="glass-effect rounded-3xl p-8 enhanced-shadow">

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500 text-white mb-3">
              <LogIn className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="text-sm opacity-70">Login to continue your journey.</p>
          </div>

          {message && (
            <div className="p-3 mb-3 rounded bg-green-50 text-green-700 text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="p-3 mb-3 rounded bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm mb-1 font-medium">Email</label>
              <div className="relative">
                <Mail className="h-5 w-5 absolute left-3 top-3 opacity-60" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-effect"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm mb-1 font-medium">Password</label>
              <div className="relative">
                <Lock className="h-5 w-5 absolute left-3 top-3 opacity-60" />

                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 rounded-xl glass-effect"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="animate-spin h-5 w-5" /> : 'Login'}
            </button>

            <div className="flex justify-between text-sm mt-1">
              <Link to="/forgot-password" className="text-indigo-600 hover:underline">
                Forgot Password?
              </Link>
            </div>
          </form>

          {/* Register Link */}
          <p className="text-center mt-6 text-sm">
            Don’t have an account?{' '}
            <Link to="/register" className="text-indigo-600 hover:underline font-medium">
              Create Account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

