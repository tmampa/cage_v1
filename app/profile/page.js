"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { 
  ArrowLeftIcon, 
  UserCircleIcon, 
  TrophyIcon, 
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from "@heroicons/react/24/solid";

const avatarEmojis = ['👧', '👦', '👩', '🧑', '👨', '👱‍♀️', '👱', '👴', '👵', '🧔'];

export default function ProfilePage() {
  const { user, userProfile, updateProfile, signOut } = useAuth();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    } else if (userProfile) {
      setUsername(userProfile.username || "");
      setSelectedAvatar(userProfile.avatar_emoji || "👤");
    }
  }, [user, userProfile, router]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset to original values
      setUsername(userProfile.username || "");
      setSelectedAvatar(userProfile.avatar_emoji || "👤");
      setError("");
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    setError("");
    setSuccess("");
    
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await updateProfile({
        username: username.trim(),
        avatar_emoji: selectedAvatar,
        updated_at: new Date()
      });
      
      if (result.success) {
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
      } else {
        setError(result.error || "Failed to update profile");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 flex items-center justify-center">
        <div className="game-card p-8 text-center">
          <p className="text-blue-700 mb-4">Please sign in to view your profile</p>
          <Link href="/auth/login">
            <button className="btn-primary">Sign In</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 p-4 relative overflow-hidden">
      {/* Decorative bubbles */}
      <div className="bubble w-20 h-20 top-20 left-10"></div>
      <div className="bubble w-16 h-16 top-40 right-10"></div>
      <div className="bubble w-24 h-24 bottom-20 left-1/3"></div>
      <div className="bubble w-12 h-12 top-1/3 right-20"></div>
      
      {/* Back button */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-blue-700 hover:text-blue-900">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          <span>Back to Home</span>
        </Link>
      </div>
      
      <div className="container mx-auto max-w-md">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-bold text-purple-700 mb-2">Your Profile</h1>
          <p className="text-blue-700">Manage your cyber hero identity</p>
        </motion.div>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4"
          >
            {error}
          </motion.div>
        )}
        
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4"
          >
            {success}
          </motion.div>
        )}
        
        <div className="game-card overflow-hidden">
          {/* Profile header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Cyber Hero Profile</h2>
              {!isEditing ? (
                <button 
                  onClick={handleEditToggle}
                  className="bg-white text-purple-600 rounded-full p-2 hover:bg-blue-100 transition-colors"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="bg-green-500 text-white rounded-full p-2 hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    <CheckIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleEditToggle}
                    className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Profile content */}
          <div className="p-6">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-4xl mb-3">
                {selectedAvatar}
              </div>
              
              {isEditing && (
                <div className="mt-3">
                  <p className="text-sm text-blue-700 mb-2">Select an avatar:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {avatarEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setSelectedAvatar(emoji)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                          selectedAvatar === emoji 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-blue-100 hover:bg-blue-200'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Username */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Username
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your username"
                  minLength={3}
                  maxLength={20}
                />
              ) : (
                <div className="bg-blue-50 px-3 py-2 rounded-lg text-lg font-bold text-purple-700">
                  {userProfile.username}
                </div>
              )}
            </div>
            
            {/* Email */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Email
              </label>
              <div className="bg-blue-50 px-3 py-2 rounded-lg text-gray-700">
                {user.email}
              </div>
              <p className="text-xs text-blue-600 mt-1">Email cannot be changed</p>
            </div>
            
            {/* Stats */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-purple-700 mb-3">Your Stats</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <TrophyIcon className="w-5 h-5 text-yellow-500 mr-2" />
                    <span className="text-blue-700">Total Score</span>
                  </div>
                  <span className="font-bold text-purple-700">{userProfile.score || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Account Created</span>
                  <span className="text-gray-700">
                    {new Date(userProfile.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/game/levels" className="w-full">
            <button className="btn-primary w-full">Play Game</button>
          </Link>
          <Link href="/leaderboard" className="w-full">
            <button className="btn-secondary w-full">View Leaderboard</button>
          </Link>
          <button 
            onClick={handleSignOut}
            className="w-full bg-red-100 text-red-600 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
