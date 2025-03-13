// Database setup script to create necessary tables for the CagE game progress tracking
import { supabase } from '../lib/supabase.js';

async function setupDatabase() {
  console.log('Setting up database tables for CagE game...');

  try {
    // Create level_progress table
    const { error: levelProgressError } = await supabase.rpc('create_level_progress_table');
    
    if (levelProgressError) {
      // If RPC function doesn't exist, create table directly
      console.log('Creating level_progress table directly...');
      const { error } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS public.level_progress (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          level_id INTEGER NOT NULL,
          score INTEGER NOT NULL DEFAULT 0,
          completed BOOLEAN NOT NULL DEFAULT false,
          last_played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, level_id)
        );
      `);
      
      if (error) throw error;
      console.log('✅ level_progress table created successfully');
    } else {
      console.log('✅ level_progress table created successfully via RPC');
    }

    // Create unlocked_levels table
    const { error: unlockedLevelsError } = await supabase.rpc('create_unlocked_levels_table');
    
    if (unlockedLevelsError) {
      // If RPC function doesn't exist, create table directly
      console.log('Creating unlocked_levels table directly...');
      const { error } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS public.unlocked_levels (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          level_id INTEGER NOT NULL,
          unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, level_id)
        );
      `);
      
      if (error) throw error;
      console.log('✅ unlocked_levels table created successfully');
    } else {
      console.log('✅ unlocked_levels table created successfully via RPC');
    }

    console.log('Database setup completed successfully!');

  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

// Update profiles table to include score column if needed
async function updateProfilesTable() {
  try {
    console.log('Checking profiles table for score column...');
    
    // Check if score column exists in profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('score')
      .limit(1);
    
    if (error && error.message.includes('column "score" does not exist')) {
      console.log('Adding score column to profiles table...');
      const { error: alterError } = await supabase.query(`
        ALTER TABLE public.profiles 
        ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
      `);
      
      if (alterError) throw alterError;
      console.log('✅ Added score column to profiles table');
    } else {
      console.log('✅ Score column already exists in profiles table');
    }
  } catch (error) {
    console.error('Error updating profiles table:', error);
  }
}

// Initialize first level as unlocked for all users
async function initializeFirstLevelForUsers() {
  try {
    console.log('Initializing first level as unlocked for all users...');
    
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id');
    
    if (usersError) throw usersError;
    
    if (users && users.length > 0) {
      for (const user of users) {
        // Check if the user already has level 1 unlocked
        const { data: existing, error: checkError } = await supabase
          .from('unlocked_levels')
          .select('id')
          .eq('user_id', user.id)
          .eq('level_id', 1)
          .limit(1);
        
        if (checkError) throw checkError;
        
        // If not unlocked, unlock level 1
        if (!existing || existing.length === 0) {
          const { error: insertError } = await supabase
            .from('unlocked_levels')
            .insert([
              { user_id: user.id, level_id: 1 }
            ]);
          
          if (insertError) throw insertError;
          console.log(`✅ Unlocked level 1 for user ${user.id}`);
        }
      }
    }
    
    console.log('First level initialization completed');
  } catch (error) {
    console.error('Error initializing first level for users:', error);
  }
}

// Run setup
async function runSetup() {
  await setupDatabase();
  await updateProfilesTable();
  await initializeFirstLevelForUsers();
  console.log('All setup tasks completed!');
}

runSetup();
