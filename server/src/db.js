import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../data');
fs.mkdirSync(dataDir, { recursive: true });
const databasePath = process.env.NODE_ENV === 'test' ? ':memory:' : path.join(dataDir, 'webora.db');
export const db = new Database(databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('ADMIN','TEAM_MEMBER','CLIENT')),
  client_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS clients(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS projects(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  client_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PLANNING',
  progress INTEGER NOT NULL DEFAULT 0,
  deadline TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS tasks(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  project_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'TODO',
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  due_date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);
`);

function seedDemoData() {
  if (db.prepare('SELECT COUNT(*) AS count FROM users').get().count > 0) return;
  const insertClient = db.prepare('INSERT INTO clients(name,email,password_hash) VALUES(?,?,?)');
  const client1 = insertClient.run('NovaTech Solutions', 'client@webora.test', bcrypt.hashSync('Client@123', 10)).lastInsertRowid;
  const client2 = insertClient.run('Vertex Studio', 'vertex@webora.test', bcrypt.hashSync('Client@123', 10)).lastInsertRowid;
  const insertUser = db.prepare('INSERT INTO users(name,email,password_hash,role,client_id) VALUES(?,?,?,?,?)');
  insertUser.run('Tayyaba Zahra', 'admin@webora.test', bcrypt.hashSync('Admin@123', 10), 'ADMIN', null);
  insertUser.run('Ayesha Khan', 'member@webora.test', bcrypt.hashSync('Member@123', 10), 'TEAM_MEMBER', null);
  insertUser.run('NovaTech Client', 'client@webora.test', bcrypt.hashSync('Client@123', 10), 'CLIENT', client1);
  const insertProject = db.prepare('INSERT INTO projects(name,description,client_id,status,progress,deadline) VALUES(?,?,?,?,?,?)');
  const p1 = insertProject.run('NovaTech Business Website', 'Corporate website redesign and conversion-focused landing pages.', client1, 'IN_PROGRESS', 72, '2026-09-18').lastInsertRowid;
  const p2 = insertProject.run('Vertex Commerce Portal', 'Modern storefront and client account experience.', client2, 'PLANNING', 28, '2026-10-04').lastInsertRowid;
  const insertTask = db.prepare('INSERT INTO tasks(title,description,project_id,status,priority,due_date) VALUES(?,?,?,?,?,?)');
  insertTask.run('Finalize homepage copy', 'Review hero, services and CTA copy.', p1, 'IN_PROGRESS', 'HIGH', '2026-09-03');
  insertTask.run('Responsive QA pass', 'Check tablet and mobile breakpoints.', p1, 'TODO', 'MEDIUM', '2026-09-07');
  insertTask.run('Approve sitemap', 'Confirm primary navigation structure.', p2, 'TODO', 'HIGH', '2026-09-01');
}
seedDemoData();
