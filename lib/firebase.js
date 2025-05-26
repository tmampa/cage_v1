// Import Firebase modules
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  Timestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  initializeFirestore,
  // Remove enableMultiTabIndexedDbPersistence
  persistentLocalCache,      // Add this
  persistentMultipleTabManager // Add this
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

// Your web app's Firebase configuration
// Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app;
let db;
let auth;
let googleProvider;

try {
  app = initializeApp(firebaseConfig);
  // Modify db initialization for multi-tab persistence
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();

  // Verify Firebase configuration
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error(
      'Firebase configuration is incomplete. Please check your environment variables.'
    );
  }

  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

/**
 * Get leaderboard data from Firestore
 * @param {string} timeFilter - Filter by time period ('all', 'week', 'month')
 * @returns {Promise<Array>} - Array of users with their scores
 */
export const getFirebaseLeaderboardData = async (timeFilter = 'all') => {
  try {
    const leaderboardRef = collection(db, 'leaderboard');
    let q;

    if (timeFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      q = query(
        leaderboardRef,
        where('updatedAt', '>=', weekAgo.toISOString()),
        orderBy('updatedAt', 'desc'),
        orderBy('score', 'desc')
      );
    } else if (timeFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      q = query(
        leaderboardRef,
        where('updatedAt', '>=', monthAgo.toISOString()),
        orderBy('updatedAt', 'desc'),
        orderBy('score', 'desc')
      );
    } else {
      // All time
      q = query(leaderboardRef, orderBy('score', 'desc'));
    }

    const querySnapshot = await getDocs(q);
    const leaderboardData = [];

    querySnapshot.forEach((doc) => {
      leaderboardData.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return leaderboardData;
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    throw error;
  }
};

/**
 * Save a user's level progress to Firestore
 */
export async function saveFirebaseLevelProgress(
  userId,
  levelId,
  score,
  completed
) {
  try {
    const levelProgressRef = doc(db, 'level_progress', `${userId}_${levelId}`);

    // Get current progress
    const progressDoc = await getDoc(levelProgressRef);
    const existingProgress = progressDoc.exists() ? progressDoc.data() : null;

    // If level was already completed, only update if new score is higher
    if (existingProgress && existingProgress.completed) {
      if (score > existingProgress.score) {
        await updateDoc(levelProgressRef, {
          score: score,
          last_played_at: Timestamp.now(),
        });
      }
    } else {
      // Insert or update the progress record
      await setDoc(levelProgressRef, {
        user_id: userId,
        level_id: levelId,
        score: score,
        completed: completed,
        last_played_at: Timestamp.now(),
        created_at: existingProgress?.created_at || Timestamp.now(),
      });

      // If level was completed successfully, unlock the next level
      if (completed) {
        await unlockFirebaseNextLevel(userId, levelId);
      }
    }

    // Update the user's total score
    await updateFirebaseUserTotalScore(userId);

    return { success: true };
  } catch (error) {
    console.error('Error saving level progress:', error);
    return { error: error.message };
  }
}

/**
 * Get a user's progress for all levels from Firestore
 */
export async function getFirebaseUserProgress(userId) {
  try {
    const progressQuery = query(
      collection(db, 'level_progress'),
      where('user_id', '==', userId)
    );

    const querySnapshot = await getDocs(progressQuery);
    const progress = [];

    querySnapshot.forEach((doc) => {
      progress.push(doc.data());
    });

    return progress;
  } catch (error) {
    console.error('Error getting user progress:', error);
    return [];
  }
}

/**
 * Get the user's progress for a specific level from Firestore
 */
export async function getFirebaseLevelProgress(userId, levelId) {
  try {
    const levelProgressRef = doc(db, 'level_progress', `${userId}_${levelId}`);
    const docSnap = await getDoc(levelProgressRef);

    if (docSnap.exists()) {
      return docSnap.data();
    }

    return null;
  } catch (error) {
    console.error(`Error getting progress for level ${levelId}:`, error);
    return null;
  }
}

/**
 * Calculate and update a user's total score across all levels in Firestore
 */
export async function updateFirebaseUserTotalScore(userId) {
  try {
    const progressQuery = query(
      collection(db, 'level_progress'),
      where('user_id', '==', userId),
      where('completed', '==', true)
    );

    const querySnapshot = await getDocs(progressQuery);
    let totalScore = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totalScore += data.score || 0;
    });

    // Update the user's profile with the new total score
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      score: totalScore,
      updatedAt: Timestamp.now(),
    });

    return totalScore;
  } catch (error) {
    console.error('Error updating total score:', error);
    return 0;
  }
}

/**
 * Get all unlocked levels for a user from Firestore
 */
export async function getFirebaseUnlockedLevels(userId) {
  try {
    // First ensure level 1 is unlocked
    const level1Ref = doc(db, 'unlocked_levels', `${userId}_1`);
    const level1Doc = await getDoc(level1Ref);

    if (!level1Doc.exists()) {
      await setDoc(level1Ref, {
        user_id: userId,
        level_id: 1,
        unlocked_at: Timestamp.now(),
      });
    }

    // Get all unlocked levels
    const unlockedQuery = query(
      collection(db, 'unlocked_levels'),
      where('user_id', '==', userId)
    );

    const querySnapshot = await getDocs(unlockedQuery);
    const unlockedLevels = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      unlockedLevels.push(data.level_id);
    });

    return unlockedLevels.length > 0 ? unlockedLevels : [1];
  } catch (error) {
    console.error('Error getting unlocked levels:', error);
    return [1];
  }
}

/**
 * Unlock the next level after completing a level in Firestore
 */
export async function unlockFirebaseNextLevel(userId, completedLevelId) {
  try {
    const nextLevelId = completedLevelId + 1;
    const nextLevelRef = doc(db, 'unlocked_levels', `${userId}_${nextLevelId}`);

    // Check if already unlocked
    const docSnap = await getDoc(nextLevelRef);

    if (!docSnap.exists()) {
      await setDoc(nextLevelRef, {
        user_id: userId,
        level_id: nextLevelId,
        unlocked_at: Timestamp.now(),
      });

      console.log(`Level ${nextLevelId} unlocked for user ${userId}`);
    }

    return true;
  } catch (error) {
    console.error('Error unlocking next level:', error);
    return false;
  }
}

/**
 * Initialize a new user's game progress in Firestore
 */
export async function initializeFirebaseUserProgress(userId) {
  try {
    const level1Ref = doc(db, 'unlocked_levels', `${userId}_1`);

    await setDoc(level1Ref, {
      user_id: userId,
      level_id: 1,
      unlocked_at: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error('Error initializing user progress:', error);
    return false;
  }
}

// Authentication functions
export async function signUp(email, password) {
  try {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Create a user profile document
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      username: email.split('@')[0], // Default username from email
      score: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Initialize user progress
    await initializeFirebaseUserProgress(user.uid);

    return { user, error: null };
  } catch (error) {
    console.error('Error signing up:', error);
    return { user: null, error: error.message };
  }
}

export async function signIn(email, password) {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return { user, error: null };
  } catch (error) {
    console.error('Error signing in:', error);
    return { user: null, error: error.message };
  }
}

export async function signInWithGoogle() {
  try {
    const { user } = await signInWithPopup(auth, googleProvider);

    // Check if user profile exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      // Create user profile if it doesn't exist
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        username: user.displayName || user.email.split('@')[0],
        score: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Initialize user progress
      await initializeFirebaseUserProgress(user.uid);
    }

    return { user, error: null };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return { user: null, error: error.message };
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error: error.message };
  }
}

// Auth state observer
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export { db, auth };
