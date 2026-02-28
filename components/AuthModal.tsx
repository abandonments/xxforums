import React, { useState } from 'react';
import { useUI } from '../context/UIContext';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase'; // Only import auth
import { Button } from './UI';
// UserRole and UserProfile imports are not directly used in AuthModal after refactoring
// import { UserRole } from '../types';

export const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal } = useUI();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // Still needed for updateProfile
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    closeAuthModal();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Perform Firebase client-side registration
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name in Firebase Auth profile
      await updateProfile(cred.user, { displayName: username });

      // AuthContext will now automatically call the backend's initiate-profile endpoint
      // No direct Firestore interaction needed from here for user profile creation

      handleClose();
    } catch (err: any) {
      // Firebase errors will be caught here, e.g., email already in use
      // For username uniqueness, it should be handled by the backend when initiate-profile is called from AuthContext
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-panel border border-accent w-full max-w-md shadow-2xl relative">
        <button onClick={handleClose} className="absolute top-2 right-2 text-textMuted hover:text-white">✕</button>
        
        <div className="flex border-b border-border">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-3 text-sm font-bold ${mode === 'login' ? 'bg-gradient-to-b from-[#252f3d] to-[#1a222d] text-accent' : 'text-textMuted hover:bg-white/5'}`}
          >
            LOGIN
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-3 text-sm font-bold ${mode === 'signup' ? 'bg-gradient-to-b from-[#252f3d] to-[#1a222d] text-accent' : 'text-textMuted hover:bg-white/5'}`}
          >
            REGISTER
          </button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="p-6 flex flex-col gap-4">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Username"
              className="w-full bg-background border border-border p-2 text-sm text-textMain focus:border-accent outline-none"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            className="w-full bg-background border border-border p-2 text-sm text-textMain focus:border-accent outline-none"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full bg-background border border-border p-2 text-sm text-textMain focus:border-accent outline-none"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="text-red-500 text-xs text-center font-bold bg-red-500/10 p-2 border border-red-500/20">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full py-2" disabled={loading}>
            {loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Create Account')}
          </Button>
        </form>
      </div>
    </div>
  );
};