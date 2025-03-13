"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LockClosedIcon, LockOpenIcon, ArrowLeftIcon, StarIcon, TrophyIcon, UserIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";

export default function LevelsPage() {
  const { user, userProfile } = useAuth();
  
  // Mock data for levels
  const [levels, setLevels] = useState([
    {
      id: 1,
      title: "Cyber Security Basics",
      description: "Learn the fundamentals of staying safe online",
      difficulty: "Easy",
      unlocked: true,
      completed: false,
      icon: "🛡️",
      color: "from-blue-400 to-blue-600",
      points: 100,
      questions: 5
    },
    {
      id: 2,
      title: "Password Protection",
      description: "Create strong passwords and keep them safe",
      difficulty: "Easy",
      unlocked: true,
      completed: false,
      icon: "🔑",
      color: "from-green-400 to-green-600",
      points: 150,
      questions: 6
    },
    {
      id: 3,
      title: "Phishing Attacks",
      description: "Identify and avoid dangerous emails and messages",
      difficulty: "Medium",
      unlocked: false,
      completed: false,
      icon: "🎣",
      color: "from-yellow-400 to-yellow-600",
      points: 200,
      questions: 7
    },
    {
      id: 4,
      title: "Safe Web Browsing",
      description: "Navigate the internet safely and avoid threats",
      difficulty: "Medium",
      unlocked: false,
      completed: false,
      icon: "🌐",
      color: "from-purple-400 to-purple-600",
      points: 250,
      questions: 8
    },
    {
      id: 5,
      title: "Social Media Safety",
      description: "Protect your personal information on social platforms",
      difficulty: "Hard",
      unlocked: false,
      completed: false,
      icon: "📱",
      color: "from-pink-400 to-pink-600",
      points: 300,
      questions: 9
    },
    {
      id: 6,
      title: "Malware Defense",
      description: "Understand and protect against computer viruses",
      difficulty: "Hard",
      unlocked: false,
      completed: false,
      icon: "🦠",
      color: "from-red-400 to-red-600",
      points: 350,
      questions: 10
    }
  ]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 p-4 relative overflow-hidden">
      {/* Decorative bubbles */}
      <div className="bubble w-20 h-20 top-20 left-10 opacity-60"></div>
      <div className="bubble w-16 h-16 top-40 right-10 opacity-60"></div>
      <div className="bubble w-24 h-24 bottom-20 left-1/3 opacity-60"></div>
      <div className="bubble w-12 h-12 top-1/3 right-20 opacity-60"></div>
      
      {/* User profile in top right */}
      {user && userProfile && (
        <div className="absolute top-4 right-4 z-20">
          <Link href="/profile">
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1 shadow-md hover:bg-blue-50 transition-colors">
              <div className="bg-blue-100 rounded-full p-1">
                <span className="text-xl">{userProfile?.avatar_emoji || "👤"}</span>
              </div>
              <span className="font-bold text-purple-700">{userProfile?.username || "User"}</span>
            </div>
          </Link>
        </div>
      )}
      
      {/* Header with back button */}
      <div className="container mx-auto mb-4 sm:mb-6">
        <Link href="/" className="inline-flex items-center text-blue-700 hover:text-blue-900">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          <span>Back to Home</span>
        </Link>
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mt-4"
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-2">Choose Your Level</h1>
          <p className="text-center text-blue-700 mb-4">Complete levels to unlock new challenges and earn points!</p>
        </motion.div>
      </div>

      {/* Progress overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="container mx-auto mb-6"
      >
        <div className="game-card p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <TrophyIcon className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-purple-700">Your Progress</h3>
                <p className="text-blue-700 text-sm">Keep going to unlock all levels!</p>
              </div>
            </div>
            <div className="flex gap-4 sm:gap-8">
              <div className="text-center">
                <p className="text-xs text-blue-600">Completed</p>
                <p className="text-2xl font-bold text-purple-700">0/6</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-blue-600">Unlocked</p>
                <p className="text-2xl font-bold text-purple-700">2/6</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-blue-600">Points</p>
                <p className="text-2xl font-bold text-purple-700">{userProfile?.score || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Levels grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-2 sm:px-4"
      >
        {/* Grid layout for levels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {levels.map((level) => (
            <motion.div
              key={level.id}
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              className="game-card overflow-hidden shadow-lg h-full"
            >
              <div className={`bg-gradient-to-r ${level.color} p-4 text-white relative`}>
                <div className="flex justify-between items-center">
                  <span className="text-4xl sm:text-5xl drop-shadow-md">{level.icon}</span>
                  <div className="bg-white bg-opacity-20 rounded-full p-2">
                    {level.unlocked ? (
                      <LockOpenIcon className="w-6 h-6 text-white" />
                    ) : (
                      <LockClosedIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                </div>
                <h2 className="text-lg sm:text-xl font-bold mt-3 line-clamp-1">{level.title}</h2>
              </div>
              
              <div className="p-4 sm:p-5 flex flex-col h-full">
                <p className="text-blue-700 mb-4 flex-grow text-sm sm:text-base line-clamp-2 sm:line-clamp-3">{level.description}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {/* Difficulty */}
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-xs text-blue-600 mb-1">Difficulty</p>
                    <div className="flex">
                      <StarIcon className={`w-4 h-4 ${level.difficulty === "Easy" || level.difficulty === "Medium" || level.difficulty === "Hard" ? "text-yellow-400" : "text-gray-300"}`} />
                      <StarIcon className={`w-4 h-4 ${level.difficulty === "Medium" || level.difficulty === "Hard" ? "text-yellow-400" : "text-gray-300"}`} />
                      <StarIcon className={`w-4 h-4 ${level.difficulty === "Hard" ? "text-yellow-400" : "text-gray-300"}`} />
                    </div>
                  </div>
                  
                  {/* Points */}
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-xs text-blue-600 mb-1">Points</p>
                    <p className="font-bold text-purple-700">{level.points}</p>
                  </div>
                </div>
                
                {level.unlocked ? (
                  <Link href={`/game/play/${level.id}`} className="mt-auto">
                    <button className="btn-primary w-full py-2 text-sm sm:text-base">
                      Play Now
                    </button>
                  </Link>
                ) : (
                  <div className="mt-auto">
                    <button className="bg-gray-200 text-gray-500 py-2 px-4 rounded-full w-full cursor-not-allowed font-bold text-sm sm:text-base">
                      Locked
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-2">Complete previous levels to unlock</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* Navigation buttons */}
      <div className="container mx-auto mt-8 flex justify-center space-x-4">
        <Link href="/leaderboard">
          <button className="btn-secondary flex items-center">
            <TrophyIcon className="h-5 w-5 mr-2" />
            Leaderboard
          </button>
        </Link>
        <Link href="/profile">
          <button className="btn-secondary flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            Profile
          </button>
        </Link>
      </div>
    </div>
  );
}
