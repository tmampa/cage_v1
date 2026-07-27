import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema.js';

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Add your Neon PostgreSQL connection string to .env.');
  }

  let parsed;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL is not a valid PostgreSQL connection string.');
  }

  if (parsed.hostname === 'host') {
    throw new Error('DATABASE_URL is still using the placeholder host. Replace it with your Neon database hostname.');
  }

  return databaseUrl;
}

const sql = neon(getDatabaseUrl());
export const db = drizzle(sql, { schema });
