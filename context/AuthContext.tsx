import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../firebase'; // Only import auth, not db
import { UserRole, UserProfile } from '../types'; 

interface AuthContextType {
  user: User | null;
  currentUser: any;
  idToken: string | null;
  loading: boolean;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_BASE_URL = 'http://localhost:3000';

const initiateUserProfile = async (firebase_uid: string, email: string, username: string, idToken: string) => {
  const response = await fetch(`${BACKEND_BASE_URL}/api/users/initiate-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ firebase_uid, email, username }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to initiate user profile on backend');
  }

  const data = await response.json();
  return data.user;
};


export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          setIdToken(token);
          const profileFromBackend = await initiateUserProfile(
            currentUser.uid,
            currentUser.email || '',
            currentUser.displayName || 'Unknown',
            token
          );
          setCurrentUser(profileFromBackend);
        } catch (error) {
          console.error("Error initiating user profile with backend:", error);
          // Fallback to a basic profile if backend initiation fails
          setCurrentUser({
            uid: currentUser.uid,
            username: currentUser.displayName || 'Unknown',
            email: currentUser.email || '',
            role: UserRole.USER, // Default role
            reputation: 0,
            warnings: 0,
            is_banned: false,
            banned_until: null,
          });
        } finally {
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const getIdToken = async (): Promise<string | null> => {
    return (await user?.getIdToken()) || null;
  };

  return (
    <AuthContext.Provider value={{ user, currentUser, idToken, loading, logout, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};