import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { User, getCurrentUser, login, register, logout, updateUser } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserData: (updatedUser: User) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    const loggedUser = await login(email, password);
    setUser(loggedUser);
  };

  const signUp = async (username: string, email: string, password: string) => {
    const newUser = await register(username, email, password);
    setUser(newUser);
  };

  const signOut = async () => {
    await logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const updateUserData = async (updatedUser: User) => {
    await updateUser(updatedUser);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, refreshUser, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
}
