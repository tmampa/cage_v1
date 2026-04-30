import { z } from 'zod';
import { MAX_LEVEL_ID } from '../../constants/levels.js';

// ─── Shared field schemas ────────────────────────────────────────────────────

export const UsernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores');

export const PasswordSchema = z.string().min(1).max(255);
export const RegisterPasswordSchema = z.string().min(6, 'Password must be at least 6 characters').max(128);

export const AvatarEmojiSchema = z.string().min(1).max(10);

export const FeedbackTypeEnum = z.enum(['general', 'bug', 'feature']);

const idQueryString = z.coerce.number().int().positive();
const limitQueryString = z.coerce.number().int().min(1).max(200);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const AuthLoginSchema = z.object({
  username: UsernameSchema,
  password: PasswordSchema,
});

export const AuthRegisterSchema = z.object({
  username: UsernameSchema,
  password: RegisterPasswordSchema,
});

export const AuthMePatchSchema = z
  .object({
    username: UsernameSchema.optional(),
    avatarEmoji: AvatarEmojiSchema.optional(),
  })
  .refine((v) => v.username !== undefined || v.avatarEmoji !== undefined, {
    message: 'Provide username or avatarEmoji',
  });

// ─── Progress ────────────────────────────────────────────────────────────────

export const ProgressPostSchema = z.object({
  levelId: z.number().int().min(1).max(MAX_LEVEL_ID),
  score: z.number().int().min(0).max(100000),
  completed: z.boolean().optional().default(false),
});

// ─── Questions ───────────────────────────────────────────────────────────────

export const QuestionsPostSchema = z.object({
  levelId: z.coerce.number().int().min(1).max(MAX_LEVEL_ID),
});

// ─── Chat ────────────────────────────────────────────────────────────────────

const ChatHistoryEntrySchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(2000),
});

export const ChatPostSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(500, 'Message must be 500 characters or less'),
  conversationHistory: z.array(ChatHistoryEntrySchema).max(20).optional(),
  sessionId: z.string().regex(/^[a-zA-Z0-9_-]{8,80}$/).optional(),
});

// ─── Feedback ────────────────────────────────────────────────────────────────

export const FeedbackPostSchema = z.object({
  feedbackType: FeedbackTypeEnum.default('general'),
  rating: z.coerce.number().int().min(0).max(5).default(0),
  message: z.string().trim().min(1, 'Message is required').max(2000),
});

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export const LeaderboardQuerySchema = z.object({
  filter: z.enum(['all', 'week', 'month']).default('all'),
});

// ─── Admin: users ────────────────────────────────────────────────────────────

export const AdminUsersQuerySchema = z.object({
  limit: limitQueryString.default(50),
  sortBy: z.enum(['score', 'username']).default('score'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().max(100).optional().default(''),
});

export const AdminUserIdParamSchema = z.object({
  userId: idQueryString,
});

// ─── Admin: feedback ─────────────────────────────────────────────────────────

export const AdminFeedbackQuerySchema = z.object({
  limit: limitQueryString.default(50),
  type: z.enum(['all', 'general', 'bug', 'feature']).default('all'),
  status: z.enum(['all', 'resolved', 'unresolved']).default('all'),
});

export const AdminFeedbackPatchSchema = z.object({
  feedbackId: idQueryString,
  resolved: z.boolean(),
});

// ─── Admin: chat ─────────────────────────────────────────────────────────────

export const AdminChatQuerySchema = z.object({
  userId: idQueryString.optional(),
});
