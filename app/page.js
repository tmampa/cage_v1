"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheckIcon, TrophyIcon, UserIcon } from "@heroicons/react/24/solid";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, userProfile, signOut } = useAuth();
  const router = useRouter();
  
  // Create decorative bubbles
  const [bubbles, setBubbles] = useState([]);

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

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link href={user ? "/game/levels" : "/auth/register"}>
            <button className="btn-primary">
              {user ? "Start Adventure!" : "Join Now!"}
            </button>
          </Link>
          <Link href="/leaderboard">
            <button className="btn-secondary flex items-center justify-center">
              <TrophyIcon className="h-5 w-5 mr-2" />
              Leaderboard
            </button>
          </Link>
        </motion.div>
        
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
