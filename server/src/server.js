import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { auth, allow, findUser, signToken, verifyPassword } from './auth.js';
import { loginSchema, clientSchema, projectSchema, taskSchema, teamMemberSchema } from './validation.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');
const PORT = process.env.PORT || 5000;
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json());
app.use(morgan('dev'));

const parse = (schema, body) => { const result = schema.safeParse(body); return result.success ? result : { error: result.error.issues[0]?.message || 'Invalid input.' }; };
const publicUser = user => ({ id: user.id, name: user.name, email: user.email, role: user.role, client_id: user.client_id ?? null });

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'Webora API', version: '1.0.0' }));

app.post('/api/auth/login', (req, res) => {
  const value = parse(loginSchema, req.body);
  if (value.error) return res.status(400).json({ message: value.error });
  const user = findUser(value.data.email, value.data.role);
  if (!user || !verifyPassword(value.data.password, user.password_hash)) return res.status(401).json({ message: 'Email, password or role is incorrect.' });
  return res.json({ token: signToken(user), user: publicUser(user) });
});

app.post('/api/auth/register-client', (req, res) => {
  const value = parse(clientSchema, req.body);
  if (value.error) return res.status(400).json({ message: value.error });
  const hash = bcrypt.hashSync(value.data.password, 10);
  const transaction = db.transaction(() => {
    const clientId = db.prepare('INSERT INTO clients(name,email,password_hash) VALUES(?,?,?)').run(value.data.name, value.data.email, hash).lastInsertRowid;
    const userId = db.prepare('INSERT INTO users(name,email,password_hash,role,client_id) VALUES(?,?,?,?,?)').run(value.data.name, value.data.email, hash, 'CLIENT', clientId).lastInsertRowid;
    return db.prepare('SELECT id,name,email,role,client_id FROM users WHERE id=?').get(userId);
  });
  try { const user = transaction(); return res.status(201).json({ token: signToken(user), user }); }
  catch { return res.status(409).json({ message: 'An account with this email already exists.' }); }
});

app.get('/api/me', auth, (req, res) => {
  const user = db.prepare('SELECT id,name,email,role,client_id FROM users WHERE id=?').get(req.user.id);
  if (!user) return res.status(401).json({ message: 'Account no longer exists.' });
  res.json({ user });
});

app.get('/api/dashboard', auth, (req, res) => {
  const isClient = req.user.role === 'CLIENT';
  const projects = isClient
    ? db.prepare('SELECT p.*, c.name client_name FROM projects p JOIN clients c ON c.id=p.client_id WHERE p.client_id=? ORDER BY p.deadline ASC').all(req.user.client_id)
    : db.prepare('SELECT p.*, c.name client_name FROM projects p JOIN clients c ON c.id=p.client_id ORDER BY p.deadline ASC').all();
  const tasks = isClient
    ? db.prepare('SELECT t.*, p.name project_name FROM tasks t JOIN projects p ON p.id=t.project_id WHERE p.client_id=? ORDER BY t.due_date ASC').all(req.user.client_id)
    : db.prepare('SELECT t.*, p.name project_name FROM tasks t JOIN projects p ON p.id=t.project_id ORDER BY t.due_date ASC').all();
  const completion = projects.length ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length) : 0;
  res.json({ projects, tasks, stats: { projects: projects.length, tasks: tasks.length, completion } });
});

app.get('/api/team', auth, allow('ADMIN'), (req, res) => {
  const members = db.prepare("SELECT id,name,email,role,created_at FROM users WHERE role IN ('ADMIN','TEAM_MEMBER') ORDER BY role,name").all();
  res.json({ members });
});

app.post('/api/team', auth, allow('ADMIN'), (req, res) => {
  const value = parse(teamMemberSchema, req.body);
  if (value.error) return res.status(400).json({ message: value.error });
  const hash = bcrypt.hashSync(value.data.password, 10);
  try {
    const id = db.prepare('INSERT INTO users(name,email,password_hash,role,client_id) VALUES(?,?,?,?,NULL)').run(value.data.name, value.data.email, hash, 'TEAM_MEMBER').lastInsertRowid;
    res.status(201).json(db.prepare('SELECT id,name,email,role,created_at FROM users WHERE id=?').get(id));
  } catch {
    res.status(409).json({ message: 'An account with this email already exists.' });
  }
});

app.get('/api/clients', auth, allow('ADMIN', 'TEAM_MEMBER'), (req, res) => {
  const clients = db.prepare('SELECT c.id,c.name,c.email,c.created_at,COUNT(p.id) project_count FROM clients c LEFT JOIN projects p ON p.client_id=c.id GROUP BY c.id ORDER BY c.name').all();
  res.json(clients);
});

app.post('/api/clients', auth, allow('ADMIN', 'TEAM_MEMBER'), (req, res) => {
  const value = parse(clientSchema, req.body);
  if (value.error) return res.status(400).json({ message: value.error });
  const hash = bcrypt.hashSync(value.data.password, 10);
  try {
    const transaction = db.transaction(() => {
      const id = db.prepare('INSERT INTO clients(name,email,password_hash) VALUES(?,?,?)').run(value.data.name, value.data.email, hash).lastInsertRowid;
      db.prepare('INSERT INTO users(name,email,password_hash,role,client_id) VALUES(?,?,?,?,?)').run(value.data.name, value.data.email, hash, 'CLIENT', id);
      return db.prepare('SELECT c.id,c.name,c.email,c.created_at,0 project_count FROM clients c WHERE c.id=?').get(id);
    });
    res.status(201).json(transaction());
  } catch { res.status(409).json({ message: 'A client with this email already exists.' }); }
});

app.put('/api/clients/:id', auth, allow('ADMIN', 'TEAM_MEMBER'), (req, res) => {
  const value = parse(clientSchema.partial(), req.body);
  if (value.error) return res.status(400).json({ message: value.error });
  const old = db.prepare('SELECT * FROM clients WHERE id=?').get(req.params.id);
  if (!old) return res.status(404).json({ message: 'Client not found.' });
  try {
    const d = value.data;
    const hash = d.password ? bcrypt.hashSync(d.password, 10) : old.password_hash;
    const transaction = db.transaction(() => {
      db.prepare('UPDATE clients SET name=?,email=?,password_hash=? WHERE id=?').run(d.name ?? old.name, d.email ?? old.email, hash, req.params.id);
      db.prepare('UPDATE users SET name=?,email=?,password_hash=? WHERE client_id=?').run(d.name ?? old.name, d.email ?? old.email, hash, req.params.id);
    });
    transaction();
    res.json(db.prepare('SELECT c.id,c.name,c.email,c.created_at,COUNT(p.id) project_count FROM clients c LEFT JOIN projects p ON p.client_id=c.id WHERE c.id=? GROUP BY c.id').get(req.params.id));
  } catch { res.status(409).json({ message: 'The client email is already in use.' }); }
});

app.delete('/api/clients/:id', auth, allow('ADMIN'), (req, res) => {
  const client = db.prepare('SELECT id FROM clients WHERE id=?').get(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found.' });
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM users WHERE client_id=?').run(req.params.id);
    db.prepare('DELETE FROM clients WHERE id=?').run(req.params.id);
  });
  transaction();
  res.status(204).end();
});

app.get('/api/projects', auth, (req, res) => {
  const projects = req.user.role === 'CLIENT'
    ? db.prepare('SELECT p.*, c.name client_name FROM projects p JOIN clients c ON c.id=p.client_id WHERE p.client_id=? ORDER BY p.deadline ASC').all(req.user.client_id)
    : db.prepare('SELECT p.*, c.name client_name FROM projects p JOIN clients c ON c.id=p.client_id ORDER BY p.deadline ASC').all();
  res.json(projects);
});

app.post('/api/projects', auth, allow('ADMIN', 'TEAM_MEMBER'), (req, res) => {
  const value = parse(projectSchema, req.body);
  if (value.error) return res.status(400).json({ message: value.error });
  if (!db.prepare('SELECT id FROM clients WHERE id=?').get(value.data.client_id)) return res.status(400).json({ message: 'Selected client does not exist.' });
  const id = db.prepare('INSERT INTO projects(name,description,client_id,status,progress,deadline,updated_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)').run(value.data.name, value.data.description || '', value.data.client_id, value.data.status, value.data.progress, value.data.deadline).lastInsertRowid;
  res.status(201).json(db.prepare('SELECT p.*,c.name client_name FROM projects p JOIN clients c ON c.id=p.client_id WHERE p.id=?').get(id));
});

app.put('/api/projects/:id', auth, allow('ADMIN', 'TEAM_MEMBER'), (req, res) => {
  const value = parse(projectSchema, req.body);
  if (value.error) return res.status(400).json({ message: value.error });
  if (!db.prepare('SELECT id FROM projects WHERE id=?').get(req.params.id)) return res.status(404).json({ message: 'Project not found.' });
  if (!db.prepare('SELECT id FROM clients WHERE id=?').get(value.data.client_id)) return res.status(400).json({ message: 'Selected client does not exist.' });
  db.prepare('UPDATE projects SET name=?,description=?,client_id=?,status=?,progress=?,deadline=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(value.data.name, value.data.description || '', value.data.client_id, value.data.status, value.data.progress, value.data.deadline, req.params.id);
  res.json(db.prepare('SELECT p.*,c.name client_name FROM projects p JOIN clients c ON c.id=p.client_id WHERE p.id=?').get(req.params.id));
});

app.delete('/api/projects/:id', auth, allow('ADMIN'), (req, res) => {
  const result = db.prepare('DELETE FROM projects WHERE id=?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ message: 'Project not found.' });
  res.status(204).end();
});

app.get('/api/tasks', auth, (req, res) => {
  const tasks = req.user.role === 'CLIENT'
    ? db.prepare('SELECT t.*,p.name project_name FROM tasks t JOIN projects p ON p.id=t.project_id WHERE p.client_id=? ORDER BY t.due_date ASC').all(req.user.client_id)
    : db.prepare('SELECT t.*,p.name project_name FROM tasks t JOIN projects p ON p.id=t.project_id ORDER BY t.due_date ASC').all();
  res.json(tasks);
});

app.post('/api/tasks', auth, allow('ADMIN', 'TEAM_MEMBER'), (req, res) => {
  const value = parse(taskSchema, req.body);
  if (value.error) return res.status(400).json({ message: value.error });
  if (!db.prepare('SELECT id FROM projects WHERE id=?').get(value.data.project_id)) return res.status(400).json({ message: 'Selected project does not exist.' });
  const id = db.prepare('INSERT INTO tasks(title,description,project_id,status,priority,due_date,updated_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)').run(value.data.title, value.data.description || '', value.data.project_id, value.data.status, value.data.priority, value.data.due_date).lastInsertRowid;
  res.status(201).json(db.prepare('SELECT t.*,p.name project_name FROM tasks t JOIN projects p ON p.id=t.project_id WHERE t.id=?').get(id));
});

app.put('/api/tasks/:id', auth, allow('ADMIN', 'TEAM_MEMBER'), (req, res) => {
  const value = parse(taskSchema, req.body);
  if (value.error) return res.status(400).json({ message: value.error });
  if (!db.prepare('SELECT id FROM tasks WHERE id=?').get(req.params.id)) return res.status(404).json({ message: 'Task not found.' });
  if (!db.prepare('SELECT id FROM projects WHERE id=?').get(value.data.project_id)) return res.status(400).json({ message: 'Selected project does not exist.' });
  db.prepare('UPDATE tasks SET title=?,description=?,project_id=?,status=?,priority=?,due_date=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(value.data.title, value.data.description || '', value.data.project_id, value.data.status, value.data.priority, value.data.due_date, req.params.id);
  res.json(db.prepare('SELECT t.*,p.name project_name FROM tasks t JOIN projects p ON p.id=t.project_id WHERE t.id=?').get(req.params.id));
});

app.delete('/api/tasks/:id', auth, allow('ADMIN'), (req, res) => {
  const result = db.prepare('DELETE FROM tasks WHERE id=?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ message: 'Task not found.' });
  res.status(204).end();
});

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) return res.sendFile(path.join(clientDist, 'index.html'));
    next();
  });
}
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ message: 'Unexpected server error.' }); });
if (process.env.NODE_ENV !== 'test') app.listen(PORT, () => console.log(`Webora API running on http://localhost:${PORT}`));
export default app;
