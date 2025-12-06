// src/pages/VerifyAccount.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { postJSON } from '../services/api';
import { Loader } from 'lucide-react';

const useQuery = () => new URLSearchParams(useLocation().search);

const VerifyAccount: React.FC = () => {
  const query = useQuery();
  const token = query.get('token') || '';
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking'|'ok'|'invalid'>('checking');

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    postJSON('/api/verify-account', { token })
      .then(res => {
        if (res?.success) {
          setStatus('ok');
          setTimeout(() => navigate('/login', { state: { message: 'Email verified! Please login.' } }), 2000);
        } else setStatus('invalid');
      })
      .catch(() => setStatus('invalid'));
  }, [token]);

  if (status === 'checking') return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin" /></div>;
  if (status === 'invalid') return <div className="min-h-screen flex items-center justify-center">Invalid or expired verification link.</div>;
  return <div className="min-h-screen flex items-center justify-center">Email verified! Redirecting to login...</div>;
};

export default VerifyAccount;

