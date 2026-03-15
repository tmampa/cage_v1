'use client';

import Link from 'next/link';
import {
  HomeIcon,
  PuzzlePieceIcon,
  TrophyIcon,
  UserIcon,
} from '@heroicons/react/24/solid';

const tabs = [
  { key: 'home', label: 'Home', href: '/', icon: HomeIcon },
  { key: 'levels', label: 'Levels', href: '/game/levels', icon: PuzzlePieceIcon },
  { key: 'leaderboard', label: 'Leaderboard', href: '/leaderboard', icon: TrophyIcon },
  { key: 'profile', label: 'Profile', href: '/profile', icon: UserIcon },
];

export default function BottomNav({ activeTab = '' }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-lg z-30">
      <div className="flex justify-around items-center">
        {tabs.map(({ key, label, href, icon: Icon }) => {
          const isActive = key === activeTab;
          return (
            <Link key={key} href={href} className="flex-1">
              <div className={`flex flex-col items-center py-2.5 transition-colors ${
                isActive ? 'text-purple-600' : 'text-gray-500 hover:text-blue-500'
              }`}>
                {isActive && (
                  <div className="absolute top-0 w-8 h-0.5 bg-purple-600 rounded-full" />
                )}
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-0.5 font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
