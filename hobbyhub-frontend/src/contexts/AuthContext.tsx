import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  bio?: string;
  location?: string;
  hobbyInterests: string[];
  subscriptionTier: string;
  achievements: any[];
  createdAt: string;
  isEmailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  // Check if user is authenticated on mount
  const { data: currentUser, isLoading } = useQuery(
    'currentUser',
    async () => {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data.user;
    },
    {
      onSuccess: (data) => {
        setUser(data);
      },
      onError: () => {
        localStorage.removeItem('token');
        setUser(null);
      }
    }
  );

  // Login mutation
  const loginMutation = useMutation(
    async ({ email, password }: { email: string; password: string }) => {
      const response = await axios.post('/api/auth/login', { email, password });
      return response.data;
    },
    {
      onSuccess: (data) => {
        const { user, token } = data.data;
        localStorage.setItem('token', token);
        setUser(user);
        queryClient.invalidateQueries('currentUser');
        toast.success('Login successful!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Login failed');
      }
    }
  );

  // Register mutation
  const registerMutation = useMutation(
    async (userData: RegisterData) => {
      const response = await axios.post('/api/auth/register', userData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        const { user, token } = data.data;
        localStorage.setItem('token', token);
        setUser(user);
        queryClient.invalidateQueries('currentUser');
        toast.success('Registration successful! Please check your email to verify your account.');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Registration failed');
      }
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    async (profileData: Partial<User>) => {
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        setUser(data.data.user);
        queryClient.invalidateQueries('currentUser');
        toast.success('Profile updated successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Profile update failed');
      }
    }
  );

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (userData: RegisterData) => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    queryClient.clear();
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData: Partial<User>) => {
    await updateProfileMutation.mutateAsync(profileData);
  };

  const value: AuthContextType = {
    user: user || currentUser || null,
    isLoading,
    isAuthenticated: !!user || !!currentUser,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
