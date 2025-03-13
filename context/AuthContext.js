"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component that wraps the app and makes auth object available to any child component that calls useAuth()
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const router = useRouter();

  // Function to fetch user profile data
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error.message);
      return null;
    }
  };

  // Initialize the auth state when the component mounts
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      
      // Check for active session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        
        // Fetch user profile data
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
      }
      
      // Set up auth state listener
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            setUser(session.user);
            
            // Fetch user profile data
            const profile = await fetchUserProfile(session.user.id);
            setUserProfile(profile);
          } else {
            setUser(null);
            setUserProfile(null);
          }
        }
      );
      
      setLoading(false);
      
      // Cleanup function to remove the listener
      return () => {
        subscription?.unsubscribe();
      };
    };
    
    initAuth();
  }, []);

  // Sign up with email and password
  const signUp = async (email, password, username) => {
    try {
      // Create user in auth with metadata for the profile
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            avatar_emoji: getRandomAvatar(),
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fetch the newly created profile
        const profile = await fetchUserProfile(authData.user.id);
        setUserProfile(profile);
        
        return { success: true, user: authData.user };
      }
    } catch (error) {
      console.error('Error signing up:', error.message);
      return { success: false, error: error.message };
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Fetch user profile data
        const profile = await fetchUserProfile(data.user.id);
        setUserProfile(profile);
        
        return { success: true, user: data.user };
      }
    } catch (error) {
      console.error('Error signing in:', error.message);
      return { success: false, error: error.message };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      setUserProfile(null);
      router.push('/auth/login');
      
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error.message);
      return { success: false, error: error.message };
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Refresh the profile data
      const updatedProfile = await fetchUserProfile(user.id);
      setUserProfile(updatedProfile);
      
      return { success: true, profile: updatedProfile };
    } catch (error) {
      console.error('Error updating profile:', error.message);
      return { success: false, error: error.message };
    }
  };

  // Get a random avatar emoji
  const getRandomAvatar = () => {
    const avatars = ['👧', '👦', '👩', '🧑', '👨', '👱‍♀️', '👱', '👴', '👵', '🧔'];
    return avatars[Math.floor(Math.random() * avatars.length)];
  };

  // The value that will be supplied to any consuming components
  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
