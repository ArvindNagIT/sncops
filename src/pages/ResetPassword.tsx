// src/pages/ResetPassword.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { postJSON } from '../services/api';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword: React.FC = () => {
  const query = useQuery();
  const token = query.get('token') || '';
  const navigate = useNavigate();

  const [status, setStatus] = useState<'checking'|'ok'|'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }
    // Validate token
    postJSON('/api/reset-password', { token, validateOnly: true })
      .then((res) => {
        if (res && res.success) setStatus('ok');
        else setStatus('invalid');
      })
      .catch(() => setStatus('invalid'));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be 6+ characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await postJSON('/api/reset-password', { token, password, validateOnly: false });
      if (res && res.success) {
        navigate('/login', { state: { message: 'Password reset successful. Please login.' } });
      } else {
        setError(res?.message || 'Reset failed');
      }
    } catch (err) {
      setError('Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'checking') {
    return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin" /></div>;
  }
  if (status === 'invalid') {
    return <div className="min-h-screen flex items-center justify-center">Invalid or expired token.</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full max-w-md">
        <div className="glass-effect rounded-3xl p-8 enhanced-shadow">
          <h2 className="text-2xl font-bold mb-4">Set a new password</h2>

          <form onSubmit={submit} className="space-y-4">
            <input type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl" />
            <input type="password" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full px-4 py-3 rounded-xl" />
            {error && <div className="text-sm text-red-600">{error}</div>}
            <button className="w-full py-3 rounded-xl bg-indigo-600 text-white" disabled={loading}>
              {loading ? <Loader className="animate-spin h-5 w-5" /> : 'Reset password'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;

