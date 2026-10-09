import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
const scrypt = promisify(scryptCallback);
export const digest = value => createHash('sha256').update(value).digest('hex');
export const token = () => randomBytes(32).toString('base64url');
export function openDB(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL DEFAULT '',role TEXT NOT NULL CHECK(role IN ('owner','participant','viewer')),password TEXT,active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL);
    CREATE UNIQUE INDEX IF NOT EXISTS single_owner ON users(role) WHERE role='owner';
    CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS invitations(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS checks(id TEXT PRIMARY KEY,value INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS visits(id TEXT PRIMARY KEY,status TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value INTEGER NOT NULL);
    INSERT OR IGNORE INTO meta VALUES('revision',0);
    CREATE TABLE IF NOT EXISTS videos(id TEXT PRIMARY KEY,video_id TEXT NOT NULL UNIQUE,title TEXT NOT NULL,day_id TEXT,created_at TEXT NOT NULL,deleted INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS personal_storage(user_id TEXT NOT NULL REFERENCES users(id),key TEXT NOT NULL,value TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(user_id,key));
    CREATE TABLE IF NOT EXISTS personal_archive(user_id TEXT NOT NULL REFERENCES users(id),key TEXT NOT NULL,digest TEXT NOT NULL,value TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(user_id,key,digest));
    CREATE TABLE IF NOT EXISTS throttle(key TEXT PRIMARY KEY,count INTEGER NOT NULL,until INTEGER NOT NULL);
  `);
  return db;
}
export const emailAddress = value => {
  if (typeof value !== 'string' || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw Error('Укажите корректный email.');
  return value.trim().toLowerCase();
};
export function passwordValid(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw Error('Пароль должен содержать от 12 до 128 символов.');
}
export async function passwordHash(password) {
  passwordValid(password);
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 });
  return `${salt}:${hash.toString('hex')}`;
}
export async function passwordMatches(password, stored) {
  if (typeof password !== 'string' || password.length > 128) return false;
  const [salt, hash] = (stored || '00000000000000000000000000000000:'+'0'.repeat(128)).split(':');
  const result = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 });
  return timingSafeEqual(result, Buffer.from(hash,'hex')) && !!stored;
}
export function publicUser(user) { return user ? {id:user.id,email:user.email,name:user.name,role:user.role} : null; }
export function transaction(db, work) {
  db.exec('BEGIN IMMEDIATE');
  try { const value=work(); db.exec('COMMIT'); return value; } catch(error) {db.exec('ROLLBACK');throw error;}
}
export function invite(db,userId) {
  const value=token();
  db.prepare('DELETE FROM invitations WHERE user_id=?').run(userId);
  db.prepare('INSERT INTO invitations VALUES(?,?,?)').run(digest(value),userId,Date.now()+24*3600_000);
  return value;
}
export function youtubeId(value) {
  try { const u=new URL(value); if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.port) return null;
    const host=u.hostname.toLowerCase(),parts=u.pathname.split('/').filter(Boolean);
    if(!['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtu.be'].includes(host))return null;
    const id=host.endsWith('youtu.be')?parts[0]:parts[0]==='watch'?u.searchParams.get('v'):['shorts','embed','live'].includes(parts[0])?parts[1]:null;
    return /^[A-Za-z0-9_-]{11}$/.test(id||'')?id:null;
  }catch{return null;}
}
