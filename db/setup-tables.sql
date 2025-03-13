-- SQL script to create necessary tables for CagE cybersecurity game
-- Run this in the Supabase SQL editor

-- Level Progress Table
CREATE TABLE IF NOT EXISTS public.level_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  last_played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, level_id)
);

-- Add appropriate policies
ALTER TABLE public.level_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own level progress"
  ON public.level_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own level progress"
  ON public.level_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own level progress"
  ON public.level_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Unlocked Levels Table
CREATE TABLE IF NOT EXISTS public.unlocked_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id INTEGER NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, level_id)
);

-- Add appropriate policies
ALTER TABLE public.unlocked_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own unlocked levels"
  ON public.unlocked_levels
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unlocked levels"
  ON public.unlocked_levels
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update profiles table to add score if needed
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;

-- Initialize level 1 as unlocked for all users
-- You can run this manually after creating a user
-- INSERT INTO public.unlocked_levels (user_id, level_id)
-- SELECT id, 1 FROM auth.users
-- ON CONFLICT (user_id, level_id) DO NOTHING;
