// src/pages/ForgotPassword.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ForgotPassword: React.FC = () => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'sent'|'error'>('idle');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await requestPasswordReset(email);
    if (error) {
      setError(error.message || 'Failed to send reset email');
      setStatus('error');
    } else {
      setStatus('sent');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full max-w-md">
        <div className="glass-effect rounded-3xl p-8 enhanced-shadow">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500 text-white mb-4">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold">Forgot your password?</h2>
            <p className="text-sm opacity-70">Enter your email to receive a reset link.</p>
          </div>

          {status === 'sent' ? (
            <div className="p-4 rounded bg-green-50 text-green-700">Reset email sent. Check your inbox.</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl glass-effect"
                />
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <button disabled={loading} type="submit" className="w-full py-3 rounded-xl bg-indigo-600 text-white">
                {loading ? <Loader className="animate-spin h-5 w-5" /> : 'Send reset link'}
              </button>
            </form>
          )}

          <div className="mt-4 text-center">
            <button className="text-sm text-indigo-600" onClick={() => navigate('/login')}>Back to login</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;

