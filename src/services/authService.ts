import { supabase } from '../lib/supabase';

export const signInWithGoogle = async () => {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
};

export const sendOtp = async (email: string) => {
  return await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    }
  });
};

export const verifyOtp = async (email: string, token: string) => {
  return await supabase.auth.verifyOtp({
    email,
    token,
    type: 'magiclink'
  });
};

export const updatePassword = async (password: string) => {
  return await supabase.auth.updateUser({ password });
};

export const signInWithPassword = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const isAdmin = (email: string | undefined) => {
  return true; // Allow all authenticated users as requested
};
