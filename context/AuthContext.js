'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
  onAuthStateChange,
  signIn,
  signUp,
  signInWithGoogle,
  signOutUser,
} from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Create the authentication context
const AuthContext = createContext({});

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component that wraps the app and makes auth object available to any child component that calls useAuth()
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile data
  const fetchUserProfile = async (userId, userData) => {
    try {
      console.log(
        'Fetching user profile for:',
        userId,
        'with userData:',
        userData
      );
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const profileData = userDoc.data();
        console.log('User profile found:', profileData);
        setUserProfile(profileData);
      } else {
        console.log('No user profile found, creating default profile');
        // Create a default profile if one doesn't exist
        const defaultProfile = {
          username: userData.username || userData.email.split('@')[0],
          email: userData.email,
          avatar_emoji: '👤',
          score: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        try {
          await setDoc(userDocRef, defaultProfile);
          console.log('Created default profile:', defaultProfile);
          setUserProfile(defaultProfile);
        } catch (error) {
          console.error('Error creating default profile:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error fetching/creating user profile:', error);
      // Don't throw the error, but set a basic profile to prevent UI issues
      setUserProfile({
        username: userData.username || userData.email.split('@')[0],
        email: userData.email,
        avatar_emoji: '👤',
        score: 0,
      });
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChange((authUser) => {
      console.log(
        'Auth state changed:',
        authUser ? 'User logged in' : 'No user'
      );
      if (authUser) {
        const userData = {
          id: authUser.uid,
          email: authUser.email,
          username: authUser.displayName || authUser.email.split('@')[0],
        };
        console.log('Setting user data:', userData);
        setUser(userData);
        fetchUserProfile(authUser.uid, userData);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const { user: authUser, error } = await signIn(email, password);
      if (error) throw new Error(error);
      const userData = {
        id: authUser.uid,
        email: authUser.email,
        username: authUser.displayName || authUser.email.split('@')[0],
      };
      await fetchUserProfile(authUser.uid, userData);
      return authUser;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email, password) => {
    try {
      const { user: authUser, error } = await signUp(email, password);
      if (error) throw new Error(error);
      const userData = {
        id: authUser.uid,
        email: authUser.email,
        username: authUser.displayName || authUser.email.split('@')[0],
      };
      await fetchUserProfile(authUser.uid, userData);
      return authUser;
    } catch (error) {
      console.error('Error signing up:', error.code, error.message);
      return { user: null, error: error.message };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { user: authUser, error } = await signInWithGoogle();
      if (error) throw new Error(error);
      const userData = {
        id: authUser.uid,
        email: authUser.email,
        username: authUser.displayName || authUser.email.split('@')[0],
      };
      await fetchUserProfile(authUser.uid, userData);
      return authUser;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await signOutUser();
      if (error) throw new Error(error);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      if (!user) throw new Error('No authenticated user');

      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, {
        ...profileData,
        updated_at: new Date().toISOString(),
      });

      // Refresh the profile data
      await fetchUserProfile(user.id, user);

      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  };

  // The value that will be supplied to any consuming components
  const value = {
    user,
    userProfile,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    updateProfile,
  };

  console.log('Current auth state:', { user, userProfile, loading });

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
