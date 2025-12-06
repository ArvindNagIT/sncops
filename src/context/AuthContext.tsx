// src/context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, Profile } from '../lib/supabaseClient';
import { User, Session } from '@supabase/supabase-js';
import { postJSON } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null, data?: any }>;
  signOut: () => Promise<void>;
  updateProfile: (fullName: string) => Promise<{ error: Error | null }>;
  updateEmail: (newEmail: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.email_confirmed_at === null) {
        supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
        return;
      }

      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                email: data.user.email!,
                full_name: fullName,
              },
            ]);

          if (profileError) {
            if (profileError.message.includes('duplicate key') || profileError.message.includes('profiles_email_key')) {
              throw new Error('This email is already registered. Please use a different email or try logging in.');
            }
            throw profileError;
          }
        }

        try {
          await postJSON('/api/send-welcome', { email: data.user.email, fullName });
        } catch { }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

const signIn = async (email: string, password: string) => {
  try {
    const res = await postJSON('/api/login', { email, password });

    if (!res.success) {
      return { error: new Error(res.message || 'Login failed') };
    }

    const access_token = res.access_token;
    const refresh_token = res.refresh_token;

    if (!access_token) {
      return { error: new Error('No access token returned from server') };
    }

    // =========================
    // ⭐ SAFE SESSION HANDLING
    // =========================
    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token: refresh_token ?? null
    });

    // If refresh token missing, force a refresh
    if (!refresh_token) {
      console.warn("⚠ No refresh_token received. Forcing Supabase session refresh…");

      await supabase.auth.refreshSession().catch((err) =>
        console.error("Refresh session failed:", err)
      );
    }

    if (sessionError) {
      console.error("supabase setSession error:", sessionError);
      return { error: sessionError };
    }

    // Get latest session and user
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData?.session?.user ?? null;

    setUser(currentUser);
    if (currentUser) {
      fetchProfile(currentUser.id);
    }

    return { error: null, data: currentUser };
  } catch (e: any) {
    return { error: new Error(e.message || 'Login failed') };
  }
};



const signOut = async () => {
  try {
    // Get current session before attempting logout
    const { data: sessionData, error: getSessionError } = await supabase.auth.getSession();

    if (getSessionError) {
      console.warn('Error checking session before logout:', getSessionError);
    }

    if (sessionData?.session) {
      // 🔐 Safe Supabase logout — catches 403 automatically
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        const status =
          (signOutError as any)?.status ||
          (signOutError as any)?.statusCode ||
          (signOutError as any)?.response?.status;

        if (status === 403) {
          console.warn('Supabase logout returned 403 — ignored (session already expired)');
        } else {
          console.warn('Supabase logout returned an error:', signOutError);
        }
      }
    }

    // Clear your frontend session regardless of Supabase's response
    setUser(null);
    setProfile(null);
    setSession(null);

    // Clean local storage fallback (prevents stale sessions)
    localStorage.removeItem("sncop_token");
    localStorage.removeItem("sncop_user");

  } catch (err) {
    console.error("Logout error caught safely:", err);
  }
};



  const updateProfile = async (fullName: string) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, full_name: fullName } : null);

      try {
        await postJSON('/api/profile-updated', {
          email: user.email,
          fullName,
          changedFields: ['full_name']
        });
      } catch { }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updateEmail = async (newEmail: string) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ email: newEmail })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setProfile(prev => prev ? { ...prev, email: newEmail } : null);

      try {
        await postJSON('/api/profile-updated', {
          email: newEmail,
          fullName: profile?.full_name || '',
          changedFields: ['email']
        });
      } catch { }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        updateEmail,
        updatePassword,
        requestPasswordReset
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

