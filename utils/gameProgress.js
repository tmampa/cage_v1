import { supabase } from '../lib/supabase';

/**
 * Save a user's level progress to Supabase
 * @param {string} userId - The user's ID
 * @param {number} levelId - The completed level ID
 * @param {number} score - The user's score for this level
 * @param {boolean} completed - Whether the level was successfully completed
 * @returns {Promise} - Supabase operation result
 */
export async function saveLevelProgress(userId, levelId, score, completed) {
  try {
    // Get the current progress for this level
    const { data: existingProgress, error: progressError } = await supabase
      .from('level_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('level_id', levelId)
      .single();

    // Check if the table exists
    if (progressError && progressError.code === '42P01') {
      console.error(
        "The level_progress table doesn't exist. Please run the setup SQL script in the Supabase dashboard."
      );
      return {
        error: 'Database tables not set up. Please contact an administrator.',
      };
    }

    // If this level was already completed before, only update if new score is higher
    if (existingProgress && existingProgress.completed) {
      if (score > existingProgress.score) {
        // Update only the score
        const { error: updateError } = await supabase
          .from('level_progress')
          .update({
            score: score,
            last_played_at: new Date(),
          })
          .eq('user_id', userId)
          .eq('level_id', levelId);

        if (updateError) throw updateError;
      }
    } else {
      // If no existing progress or level was not completed before,
      // Insert or update the progress record
      const { error: upsertError } = await supabase
        .from('level_progress')
        .upsert(
          [
            {
              user_id: userId,
              level_id: levelId,
              score: score,
              completed: completed,
              last_played_at: new Date(),
            },
          ],
          { onConflict: 'user_id,level_id' }
        );

      if (upsertError) throw upsertError;

      // If level was completed successfully, unlock the next level
      if (completed) {
        await unlockNextLevel(userId, levelId);
      }
    }

    // Update the user's total score
    await updateUserTotalScore(userId);

    return { success: true };
  } catch (error) {
    console.error('Error saving level progress:', error);
    return { error: error.message };
  }
}

/**
 * Get a user's progress for all levels
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} - Array of level progress objects
 */
export async function getUserProgress(userId) {
  try {
    const { data, error } = await supabase
      .from('level_progress')
      .select('*')
      .eq('user_id', userId);

    // Check if the table exists
    if (error && error.code === '42P01') {
      console.error(
        "The level_progress table doesn't exist. Please run the setup SQL script in the Supabase dashboard."
      );
      return [];
    }

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting user progress:', error);
    return [];
  }
}

/**
 * Get the user's progress for a specific level
 * @param {string} userId - The user's ID
 * @param {number} levelId - The level ID
 * @returns {Promise<Object>} - Level progress object
 */
export async function getLevelProgress(userId, levelId) {
  try {
    const { data, error } = await supabase
      .from('level_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('level_id', levelId)
      .single();

    // Check if the table exists
    if (error && error.code === '42P01') {
      console.error(
        "The level_progress table doesn't exist. Please run the setup SQL script in the Supabase dashboard."
      );
      return null;
    }

    if (error && !error.message.includes('No rows found')) {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error(`Error getting progress for level ${levelId}:`, error);
    return null;
  }
}

/**
 * Calculate and update a user's total score across all levels
 * @param {string} userId - The user's ID
 * @returns {Promise<number>} - The updated total score
 */
export async function updateUserTotalScore(userId) {
  try {
    // Sum up scores from all completed levels
    const { data, error } = await supabase
      .from('level_progress')
      .select('score')
      .eq('user_id', userId)
      .eq('completed', true);

    // Check if the table exists
    if (error && error.code === '42P01') {
      console.error(
        "The level_progress table doesn't exist. Please run the setup SQL script in the Supabase dashboard."
      );
      return 0;
    }

    if (error) throw error;

    // Calculate total score
    const totalScore = data.reduce((sum, item) => sum + item.score, 0);

    // Update the user's profile with the new total score
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ score: totalScore })
      .eq('id', userId);

    if (updateError) throw updateError;

    return totalScore;
  } catch (error) {
    console.error('Error updating total score:', error);
    return 0;
  }
}

/**
 * Get all unlocked levels for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} - Array of unlocked level IDs
 */
export async function getUnlockedLevels(userId) {
  try {
    // First ensure level 1 is unlocked
    try {
      const { data: existingLevel1, error: checkError } = await supabase
        .from('unlocked_levels')
        .select('id')
        .eq('user_id', userId)
        .eq('level_id', 1)
        .maybeSingle();

      // If the table doesn't exist, we'll just return level 1 as unlocked
      if (checkError && checkError.code === '42P01') {
        console.error(
          "The unlocked_levels table doesn't exist. Please run the setup SQL script in the Supabase dashboard."
        );
        return [1]; // Default to level 1 if table doesn't exist
      }

      // If level 1 isn't unlocked yet, unlock it
      if (!existingLevel1) {
        const { error: insertError } = await supabase
          .from('unlocked_levels')
          .insert([{ user_id: userId, level_id: 1 }]);

        // Just log the error, don't fail the whole function
        if (insertError && insertError.code !== '42P01') {
          console.warn('Error unlocking level 1:', insertError);
        }
      }
    } catch (error) {
      console.warn('Error checking/ensuring level 1 is unlocked:', error);
    }

    // Get all unlocked levels
    const { data, error } = await supabase
      .from('unlocked_levels')
      .select('level_id')
      .eq('user_id', userId);

    // Check if the table exists
    if (error && error.code === '42P01') {
      console.error(
        "The unlocked_levels table doesn't exist. Please run the setup SQL script in the Supabase dashboard."
      );
      return [1]; // Default to level 1 if table doesn't exist
    }

    if (error) throw error;

    // Extract just the level_id values
    return data && data.length > 0 ? data.map((item) => item.level_id) : [1]; // Default to level 1 if no data
  } catch (error) {
    console.error('Error getting unlocked levels:', error);
    return [1]; // Default to level 1 if error
  }
}

/**
 * Unlock the next level after completing a level
 * @param {string} userId - The user's ID
 * @param {number} completedLevelId - The ID of the level that was just completed
 * @returns {Promise<boolean>} - Success status
 */
export async function unlockNextLevel(userId, completedLevelId) {
  try {
    // Calculate the next level ID
    const nextLevelId = completedLevelId + 1;

    // Check if this level already exists in the unlocked_levels table
    const { data: existingUnlock, error: checkError } = await supabase
      .from('unlocked_levels')
      .select('id')
      .eq('user_id', userId)
      .eq('level_id', nextLevelId)
      .maybeSingle();

    // Check if the table exists
    if (checkError && checkError.code === '42P01') {
      console.error(
        "The unlocked_levels table doesn't exist. Please run the setup SQL script in the Supabase dashboard."
      );
      return false;
    }

    // If not already unlocked, insert it
    if (!existingUnlock) {
      const { error } = await supabase.from('unlocked_levels').insert([
        {
          user_id: userId,
          level_id: nextLevelId,
          unlocked_at: new Date(),
        },
      ]);

      if (error) throw error;

      console.log(`Level ${nextLevelId} unlocked for user ${userId}`);
    }

    return true;
  } catch (error) {
    console.error('Error unlocking next level:', error);
    return false;
  }
}

/**
 * Initialize a new user's game progress
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>} - Success status
 */
export async function initializeUserProgress(userId) {
  try {
    // Unlock level 1 for new users
    const { error } = await supabase.from('unlocked_levels').insert([
      {
        user_id: userId,
        level_id: 1,
        unlocked_at: new Date().toISOString(),
      },
    ]);

    if (error && error.code !== '23505') throw error; // 23505 is the Postgres error code for unique violation
    return true;
  } catch (error) {
    console.error('Error initializing user progress:', error);
    return false;
  }
}

// Helper function to create the level_progress table if it doesn't exist
async function createLevelProgressTable() {
  try {
    // First check if table exists
    const { data, error: checkError } = await supabase
      .from('level_progress')
      .select('id')
      .limit(1);

    // If table doesn't exist, we'll get an error
    if (checkError && checkError.code === '42P01') {
      // Create the table with direct SQL query
      const { error } = await supabase.query(`
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
      `);

      if (error) throw error;
      console.log('✅ Created level_progress table');
    }
  } catch (error) {
    console.error('Error creating level_progress table:', error);
    throw error;
  }
}

// Helper function to create the unlocked_levels table if it doesn't exist
async function createUnlockedLevelsTable() {
  try {
    // First check if table exists
    const { data, error: checkError } = await supabase
      .from('unlocked_levels')
      .select('id')
      .limit(1);

    // If table doesn't exist, we'll get an error
    if (checkError && checkError.code === '42P01') {
      // Create the table with direct SQL query
      const { error } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS public.unlocked_levels (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          level_id INTEGER NOT NULL,
          unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, level_id)
        );
      `);

      if (error) throw error;
      console.log('✅ Created unlocked_levels table');
    }
  } catch (error) {
    console.error('Error creating unlocked_levels table:', error);
    throw error;
  }
}

/**
 * Get leaderboard data sorted by total score
 * @param {string} timeFilter - Filter by time period ('all', 'week', 'month')
 * @returns {Promise<Array>} - Array of users with their scores and profiles
 */
export async function getLeaderboardData(timeFilter = 'all') {
  try {
    let query = supabase
      .from('profiles')
      .select('id, username, score') // Removed avatar_url as it doesn't exist
      .order('score', { ascending: false })
      .limit(100);

    // Apply time filter if needed
    if (timeFilter === 'week') {
      // Filter for scores updated in the last week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      query = query.gte('updated_at', oneWeekAgo.toISOString());
    } else if (timeFilter === 'month') {
      // Filter for scores updated in the last month
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      query = query.gte('updated_at', oneMonthAgo.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform data to match the expected format
    return data.map((user, index) => ({
      id: index + 1,
      userId: user.id,
      username: user.username || `User-${user.id.substring(0, 4)}`,
      score: user.score || 0,
      avatar: '👤', // Default avatar since avatar_url doesn't exist
    }));
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return [];
  }
}
