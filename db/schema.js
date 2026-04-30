import { pgTable, serial, varchar, integer, boolean, timestamp, text } from 'drizzle-orm/pg-core';

/**
 * Users table — only stores username, hashed password, and game data.
 * No email, no real name, no personal info.
 */
export const users = pgTable('users', {
  id:            serial('id').primaryKey(),
  username:      varchar('username', { length: 20 }).notNull().unique(),
  passwordHash:  varchar('password_hash', { length: 255 }).notNull(),
  avatarEmoji:   varchar('avatar_emoji', { length: 10 }).notNull().default('👤'),
  score:         integer('score').notNull().default(0),
  isAdmin:       boolean('is_admin').notNull().default(false),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
});

/**
 * Level progress table — tracks per-user, per-level completion state.
 */
export const levelProgress = pgTable('level_progress', {
  id:           serial('id').primaryKey(),
  userId:       integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  levelId:      integer('level_id').notNull(),
  score:        integer('score').notNull().default(0),
  completed:    boolean('completed').notNull().default(false),
  lastPlayedAt: timestamp('last_played_at').notNull().defaultNow(),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
});

/**
 * Feedback table — anonymous feedback from users.
 */
export const feedback = pgTable('feedback', {
  id:          serial('id').primaryKey(),
  userId:      integer('user_id'),        // nullable — guests can submit too
  username:    varchar('username', { length: 20 }),
  feedbackType: varchar('feedback_type', { length: 20 }).notNull().default('general'),
  rating:      integer('rating').notNull().default(0),
  message:     text('message').notNull(),
  resolved:    boolean('resolved').notNull().default(false),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
});

/**
 * Chat messages table — stores authenticated user chatbot conversations
 * so admins can review support/learning history.
 */
export const chatMessages = pgTable('chat_messages', {
  id:        serial('id').primaryKey(),
  userId:    integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar('session_id', { length: 80 }).notNull(),
  role:      varchar('role', { length: 20 }).notNull(),
  content:   text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
