import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { db } from '../../../../lib/db.js';
import { users, levelProgress, feedback, chatMessages } from '../../../../db/schema.js';
import { verifyAdmin } from '../../../../lib/verifyAdmin.js';
import { eq, desc } from 'drizzle-orm';

/* ──────────────────────────────── helpers ──────────────────────────────── */

const HEADER_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E293B' }, // slate-800
};

const HEADER_FONT = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 11,
  name: 'Calibri',
};

const HEADER_BORDER = {
  bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
};

const ALT_ROW_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF8FAFC' }, // slate-50
};

/**
 * Apply professional formatting to a worksheet.
 */
function styleSheet(ws) {
  // Style header row
  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = HEADER_BORDER;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  headerRow.height = 28;

  // Freeze header row
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  // Auto-width columns based on content
  ws.columns.forEach((col) => {
    let maxLen = col.header ? col.header.length : 10;
    col.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber === 1) return; // skip header — already measured
      const val = cell.value != null ? String(cell.value) : '';
      maxLen = Math.max(maxLen, Math.min(val.length, 60));
    });
    col.width = maxLen + 4;
  });

  // Alternating row fills + general data font
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.eachCell((cell) => {
      cell.font = { size: 10, name: 'Calibri', color: { argb: 'FF334155' } };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
    if (rowNumber % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = ALT_ROW_FILL;
      });
    }
  });

  // Auto-filter on all columns
  if (ws.rowCount > 1) {
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: ws.columnCount },
    };
  }
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-ZA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ───────────────────────── data builder per type ───────────────────────── */

async function buildUsersSheet(wb) {
  const ws = wb.addWorksheet('Users', { properties: { tabColor: { argb: 'FF3B82F6' } } });

  ws.columns = [
    { header: 'ID', key: 'id' },
    { header: 'Username', key: 'username' },
    { header: 'Avatar', key: 'avatar' },
    { header: 'Score', key: 'score' },
    { header: 'Admin', key: 'isAdmin' },
    { header: 'Joined', key: 'createdAt' },
  ];

  const rows = await db.select().from(users).orderBy(desc(users.score));

  rows.forEach((u) => {
    ws.addRow({
      id: u.id,
      username: u.username,
      avatar: u.avatarEmoji || '👤',
      score: u.score ?? 0,
      isAdmin: u.isAdmin ? 'Yes' : 'No',
      createdAt: formatDate(u.createdAt),
    });
  });

  styleSheet(ws);
  return rows.length;
}

async function buildLevelProgressSheet(wb) {
  const ws = wb.addWorksheet('Level Progress', { properties: { tabColor: { argb: 'FF10B981' } } });

  ws.columns = [
    { header: 'ID', key: 'id' },
    { header: 'User ID', key: 'userId' },
    { header: 'Username', key: 'username' },
    { header: 'Level', key: 'levelId' },
    { header: 'Score', key: 'score' },
    { header: 'Completed', key: 'completed' },
    { header: 'Last Played', key: 'lastPlayedAt' },
    { header: 'Created', key: 'createdAt' },
  ];

  // Fetch progress with username via a join
  const allUsers = await db.select({ id: users.id, username: users.username }).from(users);
  const userMap = Object.fromEntries(allUsers.map((u) => [u.id, u.username]));

  const rows = await db.select().from(levelProgress).orderBy(desc(levelProgress.lastPlayedAt));

  rows.forEach((p) => {
    ws.addRow({
      id: p.id,
      userId: p.userId,
      username: userMap[p.userId] || 'Unknown',
      levelId: p.levelId,
      score: p.score ?? 0,
      completed: p.completed ? 'Yes' : 'No',
      lastPlayedAt: formatDate(p.lastPlayedAt),
      createdAt: formatDate(p.createdAt),
    });
  });

  styleSheet(ws);
  return rows.length;
}

async function buildFeedbackSheet(wb) {
  const ws = wb.addWorksheet('Feedback', { properties: { tabColor: { argb: 'FFF59E0B' } } });

  ws.columns = [
    { header: 'ID', key: 'id' },
    { header: 'User ID', key: 'userId' },
    { header: 'Username', key: 'username' },
    { header: 'Type', key: 'feedbackType' },
    { header: 'Rating', key: 'rating' },
    { header: 'Message', key: 'message' },
    { header: 'Resolved', key: 'resolved' },
    { header: 'Submitted', key: 'createdAt' },
  ];

  const rows = await db.select().from(feedback).orderBy(desc(feedback.createdAt));

  rows.forEach((f) => {
    ws.addRow({
      id: f.id,
      userId: f.userId ?? '',
      username: f.username || 'Guest',
      feedbackType: f.feedbackType,
      rating: f.rating,
      message: f.message,
      resolved: f.resolved ? 'Yes' : 'No',
      createdAt: formatDate(f.createdAt),
    });
  });

  styleSheet(ws);
  return rows.length;
}

async function buildChatSheet(wb) {
  const ws = wb.addWorksheet('Chat Messages', { properties: { tabColor: { argb: 'FF8B5CF6' } } });

  ws.columns = [
    { header: 'ID', key: 'id' },
    { header: 'User ID', key: 'userId' },
    { header: 'Username', key: 'username' },
    { header: 'Session', key: 'sessionId' },
    { header: 'Role', key: 'role' },
    { header: 'Message', key: 'content' },
    { header: 'Sent At', key: 'createdAt' },
  ];

  const allUsers = await db.select({ id: users.id, username: users.username }).from(users);
  const userMap = Object.fromEntries(allUsers.map((u) => [u.id, u.username]));

  const rows = await db.select().from(chatMessages).orderBy(desc(chatMessages.createdAt));

  rows.forEach((m) => {
    ws.addRow({
      id: m.id,
      userId: m.userId ?? '',
      username: userMap[m.userId] || 'Guest',
      sessionId: m.sessionId,
      role: m.role,
      content: m.content,
      createdAt: formatDate(m.createdAt),
    });
  });

  styleSheet(ws);
  return rows.length;
}

/* ───────────────────────────── route handler ───────────────────────────── */

const BUILDERS = {
  users: buildUsersSheet,
  level_progress: buildLevelProgressSheet,
  feedback: buildFeedbackSheet,
  chat: buildChatSheet,
};

export async function GET(request) {
  try {
    await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'users' | 'level_progress' | 'feedback' | 'chat' | 'all'

    const wb = new ExcelJS.Workbook();
    wb.creator = 'CagE Admin';
    wb.created = new Date();
    wb.properties.date1904 = false;

    let filename;

    if (type === 'all' || !type) {
      // Build all sheets into one workbook
      await buildUsersSheet(wb);
      await buildLevelProgressSheet(wb);
      await buildFeedbackSheet(wb);
      await buildChatSheet(wb);
      filename = `cage_full_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    } else if (BUILDERS[type]) {
      await BUILDERS[type](wb);
      filename = `cage_${type}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    } else {
      return NextResponse.json(
        { error: `Invalid export type: "${type}". Use: users, level_progress, feedback, chat, or all.` },
        { status: 400 },
      );
    }

    const buffer = await wb.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Missing') ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
