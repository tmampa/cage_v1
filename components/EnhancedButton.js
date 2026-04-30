'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function EnhancedButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  icon = null,
  className = '',
  ...props 
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    ghost: 'bg-transparent border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white'
  };

  const sizes = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]} 
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
        inline-flex items-center justify-center gap-2
        font-bold rounded-full transition-all duration-200
        focus:outline-none focus:ring-4 focus:ring-opacity-50
        ${variant === 'primary' ? 'focus:ring-orange-300' : 'focus:ring-purple-300'}
      `}
      {...props}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </motion.button>
  );
}