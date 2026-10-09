import { env } from 'cloudflare:workers';
export function videoDb(): D1Database {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) throw new Error('Video database binding unavailable');
  return db;
}
