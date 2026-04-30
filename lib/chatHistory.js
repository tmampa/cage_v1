/**
 * Re-export shim: the chat data-access layer lives in `db/queries/chatRepo.js`
 * since Phase 4 of the architecture refactor. New code should import from
 * `db/queries/chatRepo` directly.
 */
export {
  buildChatSessions,
  getChatUsersWithHistory,
  getChatSessionsForUser,
  insertChatMessage,
} from '../db/queries/chatRepo.js';
