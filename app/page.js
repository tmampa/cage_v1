"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ShieldCheckIcon, 
  TrophyIcon,
  PlayIcon,
  AcademicCapIcon,
  LightBulbIcon,
  StarIcon
} from "@heroicons/react/24/solid";
import { useAuth } from "../context/AuthContext";
import { useChatbot } from "../context/ChatbotContext";

import EnhancedButton from "../components/EnhancedButton";
import { AnimatedProgressBar } from "../components/ProgressIndicators";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { extractHomeContext } from "../utils/chatbotContext";

export default function Home() {
  const { user, userProfile, signOut } = useAuth();
  
  // Create decorative bubbles
  const [bubbles, setBubbles] = useState([]);
  
  // Track actual level progress
  const [levelProgress, setLevelProgress] = useState({
    totalLevels: 6,
    completedLevels: 0,
    unlockedLevels: 1,
    loading: true
  });

  useEffect(() => {
    // Generate random bubbles
    const newBubbles = [];
    for (let i = 0; i < 15; i++) {
      newBubbles.push({
        id: i,
        size: Math.random() * 80 + 20,
        left: Math.random() * 100,
        top: Math.random() * 100,
        animationDuration: Math.random() * 20 + 10,
      });
    }
    setBubbles(newBubbles);
  }, []);

  // Load actual level progress
  useEffect(() => {
    const loadUserProgress = async () => {
      if (!user?.id) {
        setLevelProgress(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        // Get user's profile for highest level
        const userRef = doc(db, 'users', user.id);
        const userDoc = await getDoc(userRef);
        const highestLevel = userDoc.exists() ? userDoc.data().highestLevel || 1 : 1;

        // Get all progress documents for this user
        const progressRef = collection(db, 'progress');
        const q = query(progressRef, where('userId', '==', user.id));
        const querySnapshot = await getDocs(q);

        let completedCount = 0;
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.passed) {
            completedCount++;
          }
        });

        setLevelProgress({
          totalLevels: 6,
          completedLevels: completedCount,
          unlockedLevels: Math.min(highestLevel + 1, 6), // Next level is unlocked
          loading: false
        });

        console.log(`User progress: ${completedCount}/6 levels completed, ${Math.min(highestLevel + 1, 6)} unlocked`);
      } catch (error) {
        console.error('Error loading user progress:', error);
        setLevelProgress(prev => ({ ...prev, loading: false }));
      }
    };

    loadUserProgress();
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 relative overflow-hidden bg-gradient-to-b from-blue-300 to-purple-300">
      {/* User profile or auth buttons in top right */}
      <div className="absolute top-4 right-4 z-20">
        {user ? (
          <div className="flex items-center gap-2">
            <Link href="/profile">
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1 shadow-md hover:bg-blue-50 transition-colors">
                <div className="bg-blue-100 rounded-full p-1">
                  <span className="text-xl">{userProfile?.avatar_emoji || "👤"}</span>
                </div>
                <span className="font-bold text-purple-700">{userProfile?.username || "User"}</span>
              </div>
            </Link>
            <button 
              onClick={handleSignOut}
              className="bg-red-100 text-red-600 rounded-lg px-3 py-1 hover:bg-red-200 transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/auth/login">
              <button className="bg-white text-purple-700 rounded-lg px-3 py-1 hover:bg-blue-50 transition-colors font-medium">
                Sign In
              </button>
            </Link>
            <Link href="/auth/register">
              <button className="bg-purple-600 text-white rounded-lg px-3 py-1 hover:bg-purple-700 transition-colors font-medium">
                Register
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Decorative bubbles */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="bubble"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.left}%`,
            top: `${bubble.top}%`,
            animationDuration: `${bubble.animationDuration}s`,
          }}
        />
      ))}

      <div className="z-10 max-w-5xl w-full flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className="inline-block mb-4"
          >
            <ShieldCheckIcon className="h-24 w-24 text-yellow-400 drop-shadow-lg" />
          </motion.div>
          <h1 className="text-5xl font-bold text-purple-700 mb-4">
            Welcome to CagE!
          </h1>
          <p className="text-xl text-blue-700 mb-8">
            The fun way to learn about cyber security!
          </p>
        </motion.div>

        {/* User Progress Section for Logged In Users */}
        {user && userProfile && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-8 max-w-md mx-auto"
          >
            <div className="game-card p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-purple-100 rounded-full p-3 mr-3">
                  <span className="text-3xl">{userProfile.avatar_emoji || "👤"}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-purple-700">
                    Welcome back, {userProfile.username}!
                  </h3>
                  <p className="text-blue-600">Score: {userProfile.score || 0} points</p>
                </div>
              </div>
              
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {levelProgress.loading ? "..." : levelProgress.totalLevels}
                  </div>
                  <div className="text-xs text-gray-600">Total Levels</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {levelProgress.loading ? "..." : levelProgress.completedLevels}
                  </div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {userProfile.score || 0}
                  </div>
                  <div className="text-xs text-gray-600">Points</div>
                </div>
              </div>

              {/* Progress bar */}
              {!levelProgress.loading && (
                <div className="mb-4">
                  <AnimatedProgressBar
                    progress={levelProgress.completedLevels}
                    total={levelProgress.totalLevels}
                    label="Learning Progress"
                    color="green"
                    size="medium"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: user ? 0.5 : 0.3, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href={user ? "/game/levels" : "/auth/register"}>
            <EnhancedButton 
              variant="primary" 
              size="large"
              icon={user ? <PlayIcon className="w-5 h-5" /> : <AcademicCapIcon className="w-5 h-5" />}
            >
              {user ? "Continue Learning!" : "Start Learning!"}
            </EnhancedButton>
          </Link>
          
          <Link href="/leaderboard">
            <EnhancedButton 
              variant="secondary" 
              size="large"
              icon={<TrophyIcon className="w-5 h-5" />}
            >
              Leaderboard
            </EnhancedButton>
          </Link>
        </motion.div>

        {/* Features Section for New Users */}
        {!user && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-12 max-w-4xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-center text-purple-700 mb-8">
              Why Choose CagE?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <ShieldCheckIcon className="w-8 h-8 text-blue-500" />,
                  title: "Learn by Playing",
                  description: "Master cybersecurity through fun, interactive games and challenges."
                },
                {
                  icon: <LightBulbIcon className="w-8 h-8 text-yellow-500" />,
                  title: "Smart Hints",
                  description: "Get helpful hints when you're stuck to keep learning without frustration."
                },
                {
                  icon: <StarIcon className="w-8 h-8 text-purple-500" />,
                  title: "Track Progress",
                  description: "Earn points, unlock achievements, and see your cybersecurity knowledge grow."
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                  className="game-card p-6 text-center hover:shadow-xl transition-shadow"
                >
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        
        {!user && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-blue-700"
          >
            Already have an account? <Link href="/auth/login" className="text-purple-600 font-bold hover:underline">Sign In</Link>
          </motion.p>
        )}
      </div>


    </main>
  );
}
