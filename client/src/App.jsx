import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BarChart3, CalendarDays, Check, CheckCircle2, CheckSquare, ChevronRight, Clock3, Edit3, FolderKanban, LayoutDashboard, LogOut, Menu, Plus, Search, ShieldCheck, Trash2, UserRound, Users, X, AlertCircle, LockKeyhole, BriefcaseBusiness } from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_URL || '/api';
const ROLES = { ADMIN: 'Admin', TEAM_MEMBER: 'Team Member', CLIENT: 'Client' };

async function api(path, options = {}) {
  const token = localStorage.getItem('webora_token');
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, { ...options, headers });
  let data = null;
  try { data = await response.json(); } catch {}
  if (response.status === 401) {
    localStorage.removeItem('webora_token');
    localStorage.removeItem('webora_user');
  }
  if (!response.ok) throw new Error(data?.message || 'Something went wrong.');
  return data;
}

const AuthContext = createContext(null);
function useAuth() { return useContext(AuthContext); }

function useStoredAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('webora_user')) || null; } catch { return null; }
  });
  const login = (token, nextUser) => {
    localStorage.setItem('webora_token', token);
    localStorage.setItem('webora_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };
  const logout = () => {
    localStorage.removeItem('webora_token');
    localStorage.removeItem('webora_user');
    setUser(null);
  };
  return { user, login, logout };
}

export default function App() {
  const auth = useStoredAuth();
  return <AuthContext.Provider value={auth}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/app/*" element={<Protected />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </AuthContext.Provider>;
}

function Brand({ compact = false }) {
  return <div className={`brand ${compact ? 'compact' : ''}`}>
    <img src="/webora-logo.png" alt="Webora" />
    <div><b>WEBORA</b><small>Website Operations &amp; Client Workspace</small></div>
  </div>;
}

function Footer() {
  return <footer className="footer">© 2026 Webora · Website Operations &amp; Client Workspace · Developed by <strong>Tayyaba Zahra</strong></footer>;
}

function Landing() {
  const nav = useNavigate();
  return <div className="site">
    <header className="landing-nav"><button className="brand-btn" onClick={() => nav('/')}><Brand /></button><div className="nav-actions"><button className="link-btn" onClick={() => nav('/login')}>Sign in</button><button className="primary" onClick={() => nav('/signup')}>Get started <ArrowRight size={18} /></button></div></header>
    <main>
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow">WEBSITE OPERATIONS, SIMPLIFIED</p><h1>Manage websites.<br /><span>Deliver projects.</span><br />Keep clients<br />aligned.</h1><p className="lead">Webora brings clients, projects, tasks and delivery updates into one polished workspace built for modern web teams.</p><div className="hero-actions"><button className="primary" onClick={() => nav('/login')}>Open workspace <ArrowUpRight size={18} /></button><button className="text-link" onClick={() => nav('/signup')}>Create client access</button></div></div>
        <PerformanceCard />
      </section>
      <section className="feature-grid"><Feature icon={<FolderKanban />} title="Project control" text="Keep deadlines, status and progress visible from one operational workspace." /><Feature icon={<Users />} title="Client alignment" text="Give every client a focused portal without exposing management controls." /><Feature icon={<ShieldCheck />} title="Role-aware access" text="Admin, Team Member and Client permissions are enforced on the server." /></section>
      <section className="workflow-strip"><div><p className="eyebrow cyan">BUILT FOR SERIOUS DELIVERY</p><h2>Turn project chaos into a clear workflow.</h2></div><button className="light-btn" onClick={() => nav('/login')}>Start with Webora <ArrowUpRight size={18} /></button></section>
    </main><Footer />
  </div>;
}

function PerformanceCard() {
  const bars = [40, 57, 49, 73, 63, 87, 78, 95];
  return <div className="performance"><div className="perf-top"><span>Project performance</span><strong>+18.4%</strong></div><div className="metrics"><Metric n="07" t="Active projects" /><Metric n="32" t="Tasks" /><Metric n="78%" t="Completion" /></div><div className="bars">{bars.map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div><div className="mini-project"><span><b /> NovaTech Business Website</span><strong>72%</strong></div></div>;
}
function Metric({ n, t }) { return <div className="metric"><small>{t}</small><b>{n}</b></div>; }
function Feature({ icon, title, text }) { return <article className="feature"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article>; }

function AuthShell({ title, subtitle, children }) {
  const nav = useNavigate();
  return <div className="auth-page"><header><button className="brand-btn" onClick={() => nav('/')}><Brand compact /></button></header><div className="auth-card"><div className="auth-badge"><LockKeyhole size={18} /></div><h1>{title}</h1><p>{subtitle}</p>{children}</div><Footer /></div>;
}
function Field({ label, hint, children }) { return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
function Notice({ type = 'success', text }) { return <div className={`notice ${type}`} role="alert">{type === 'success' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}<span>{text}</span></div>; }

function Login() {
  const { user, login } = useAuth(); const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', role: '' }); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  useEffect(() => { if (user) nav('/app', { replace: true }); }, [user, nav]);
  const submit = async e => { e.preventDefault(); setError(''); if (form.password.length < 8) return setError('Password must be at least 8 characters.'); setLoading(true); try { const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(form) }); login(data.token, data.user); nav('/app', { replace: true }); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  return <AuthShell title="Welcome back" subtitle="Sign in to your Webora workspace."><form className="auth-form" onSubmit={submit}>
    <Field label="Email address"><input aria-label="Email address" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" /></Field>
    <Field label="Password"><input aria-label="Password" type="password" required minLength="8" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Minimum 8 characters" /></Field>
    <Field label="Workspace role" hint="Your selection is verified against the database account."><select aria-label="Workspace role" required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="">Select your role</option><option value="ADMIN">Admin</option><option value="TEAM_MEMBER">Team Member</option><option value="CLIENT">Client</option></select></Field>
    {error && <Notice type="error" text={error} />}<button className="primary full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'} <ArrowUpRight size={17} /></button>
    <div className="secure-note"><ShieldCheck size={16} /><span>Access is verified against your Webora account and role.</span></div>
    <p className="switch">New client? <button type="button" onClick={() => nav('/signup')}>Create your client account</button></p>
  </form></AuthShell>;
}

function Signup() {
  const { user, login } = useAuth(); const nav = useNavigate(); const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' }); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  useEffect(() => { if (user) nav('/app', { replace: true }); }, [user, nav]);
  const submit = async e => { e.preventDefault(); setError(''); if (form.password !== form.confirm) return setError('Passwords do not match.'); setLoading(true); try { const data = await api('/auth/register-client', { method: 'POST', body: JSON.stringify({ name: form.name, email: form.email, password: form.password }) }); login(data.token, data.user); nav('/app', { replace: true }); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  return <AuthShell title="Create client access" subtitle="Set up a secure client portal for project visibility."><form className="auth-form" onSubmit={submit}>
    <Field label="Full name"><input aria-label="Full name" required minLength="2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" /></Field>
    <Field label="Work email"><input aria-label="Work email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" /></Field>
    <Field label="Password"><input aria-label="Signup password" type="password" required minLength="8" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" /></Field>
    <Field label="Confirm password"><input aria-label="Confirm password" type="password" required value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} placeholder="Repeat your password" /></Field>
    {error && <Notice type="error" text={error} />}<button className="primary full" disabled={loading}>{loading ? 'Creating…' : 'Create client account'} <ArrowUpRight size={17} /></button><p className="switch">Already have access? <button type="button" onClick={() => nav('/login')}>Sign in</button></p>
  </form></AuthShell>;
}

function Protected() {
  const { user } = useAuth();
  return user && localStorage.getItem('webora_token') ? <AppShell /> : <Navigate to="/login" replace />;
}

const NAV = [
  ['/app', 'Overview', LayoutDashboard, ['ADMIN', 'TEAM_MEMBER', 'CLIENT']],
  ['/app/projects', 'Projects', FolderKanban, ['ADMIN', 'TEAM_MEMBER', 'CLIENT']],
  ['/app/tasks', 'Tasks', CheckSquare, ['ADMIN', 'TEAM_MEMBER', 'CLIENT']],
  ['/app/clients', 'Clients', Users, ['ADMIN', 'TEAM_MEMBER']],
  ['/app/access', 'Team access', ShieldCheck, ['ADMIN']],
];

function roleLabel(role) { return ROLES[role] || role; }
function initials(name = '') { return name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase(); }

function AppShell() {
  const { user, logout } = useAuth(); const nav = useNavigate(); const [open, setOpen] = useState(false);
  const visibleNav = NAV.filter(([, , , roles]) => roles.includes(user.role));
  const path = useLocation().pathname;
  const signOut = () => { logout(); nav('/'); };
  return <div className="app-shell"><aside className={open ? 'open' : ''}><div className="side-top"><button className="brand-btn" onClick={() => nav('/app')}><Brand compact /></button><button className="close-mobile" onClick={() => setOpen(false)}><X /></button></div><div className="workspace"><span>WORKSPACE</span><b>{user.role === 'CLIENT' ? 'Client portal' : 'Webora Operations'}</b><small>{roleLabel(user.role)} access</small></div><nav>{visibleNav.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/app'} onClick={() => setOpen(false)}><Icon size={18} /><span>{label}</span></NavLink>)}</nav><div className="side-bottom"><div className="user-mini"><div className="avatar">{initials(user.name)}</div><div><b>{user.name}</b><small>{roleLabel(user.role)}</small></div></div><button className="logout" onClick={signOut}><LogOut size={17} /> Sign out</button></div></aside><div className="app-main"><header className="app-header"><button className="menu-btn" onClick={() => setOpen(true)}><Menu /></button><div><p className="header-kicker">{roleLabel(user.role)} workspace</p><h2>{pageTitle(path)}</h2></div><div className="header-user"><div className="avatar small">{initials(user.name)}</div><span>{user.email}</span></div></header><div className="app-content"><Routes><Route index element={<Overview />} /><Route path="projects" element={<Projects />} /><Route path="tasks" element={<Tasks />} /><Route path="clients" element={<RoleGuard roles={['ADMIN', 'TEAM_MEMBER']}><Clients /></RoleGuard>} /><Route path="access" element={<RoleGuard roles={['ADMIN']}><Access /></RoleGuard>} /><Route path="*" element={<Navigate to="/app" replace />} /></Routes></div></div></div>;
}
function pageTitle(path) { if (path.includes('/projects')) return 'Projects'; if (path.includes('/tasks')) return 'Tasks'; if (path.includes('/clients')) return 'Clients'; if (path.includes('/access')) return 'Team access'; return 'Overview'; }
function RoleGuard({ roles, children }) { const { user } = useAuth(); return roles.includes(user.role) ? children : <Navigate to="/app" replace />; }

function PageIntro({ eyebrow, title, text, action }) { return <div className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{text}</p></div>{action}</div>; }
function Loading() { return <div className="loading"><span className="spinner" /> Loading workspace…</div>; }
function Empty({ icon = <FolderKanban size={20} />, title, text, action }) { return <div className="empty"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{text}</p>{action}</div>; }
function Status({ value }) { return <span className={`status ${value.toLowerCase()}`}>{value.replace('_', ' ')}</span>; }
function Badge({ value }) { return <span className={`badge ${value.toLowerCase()}`}>{value}</span>; }
function formatDate(value) { if (!value) return '—'; return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function Modal({ title, eyebrow = 'WORKSPACE', children, onClose }) { return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="modal"><div className="modal-head"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div><button className="icon-btn" onClick={onClose}><X size={18} /></button></div>{children}</div></div>; }

function Overview() {
  const { user } = useAuth(); const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api('/dashboard').then(setData).catch(e => setError(e.message)); }, []);
  if (error) return <Notice type="error" text={error} />; if (!data) return <Loading />;
  const { stats, projects, tasks } = data;
  return <><PageIntro eyebrow={`${roleLabel(user.role).toUpperCase()} WORKSPACE`} title={`Good to see you, ${user.name.split(' ')[0]}.`} text={user.role === 'CLIENT' ? 'Track your active work, upcoming deliverables and project progress.' : 'A focused command center for projects, clients and delivery work.'} />
    <div className="stat-grid"><Stat icon={<FolderKanban />} label="Active projects" value={String(stats.projects).padStart(2, '0')} /><Stat icon={<CheckSquare />} label="Open tasks" value={String(stats.tasks).padStart(2, '0')} /><Stat icon={<BarChart3 />} label="Average completion" value={`${stats.completion}%`} /><Stat icon={<Clock3 />} label="Upcoming work" value={String(tasks.filter(t => t.status !== 'DONE').length).padStart(2, '0')} /></div>
    <div className="dashboard-grid"><section className="panel"><div className="panel-head"><h3>{user.role === 'CLIENT' ? 'Your projects' : 'Project performance'}</h3><NavLink className="ghost-link" to="/app/projects">View all <ChevronRight size={14} /></NavLink></div><div className="project-list">{projects.slice(0, 5).map(p => <div className="project-row" key={p.id}><div className="row-main"><span className="dot" /><div><b>{p.name}</b><span>{p.client_name}</span></div></div><div className="progress-wrap"><div className="progress"><i style={{ width: `${p.progress}%` }} /></div><strong>{p.progress}%</strong></div><Status value={p.status} /></div>)}{!projects.length && <Empty title="No projects yet" text="Projects assigned to this workspace will appear here." />}</div></section><section className="panel"><div className="panel-head"><h3>Upcoming tasks</h3><NavLink className="ghost-link" to="/app/tasks">View all <ChevronRight size={14} /></NavLink></div><div className="task-list">{tasks.slice(0, 5).map(t => <div className="task-row" key={t.id}><div><b>{t.title}</b><span>{t.project_name}</span></div><div className="task-meta"><Badge value={t.priority} /><span><CalendarDays size={12} />{formatDate(t.due_date)}</span></div></div>)}{!tasks.length && <Empty title="No tasks yet" text="Delivery tasks will appear here." />}</div></section></div></>;
}
function Stat({ icon, label, value }) { return <div className="stat-card"><div className="stat-icon">{icon}</div><small>{label}</small><b>{value}</b></div>; }

function Projects() {
  const { user } = useAuth(); const canEdit = user.role !== 'CLIENT'; const canDelete = user.role === 'ADMIN'; const [items, setItems] = useState([]); const [clients, setClients] = useState([]); const [q, setQ] = useState(''); const [modal, setModal] = useState(null); const [notice, setNotice] = useState(null); const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { const projects = await api('/projects'); setItems(projects); if (canEdit) setClients(await api('/clients')); } catch (e) { setNotice({ type: 'error', text: e.message }); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [user.role]);
  const filtered = items.filter(p => `${p.name} ${p.client_name} ${p.status}`.toLowerCase().includes(q.toLowerCase()));
  const save = async form => { if (modal.item) await api(`/projects/${modal.item.id}`, { method: 'PUT', body: JSON.stringify(form) }); else await api('/projects', { method: 'POST', body: JSON.stringify(form) }); setModal(null); setNotice({ type: 'success', text: modal.item ? 'Project updated successfully.' : 'Project created successfully.' }); await load(); };
  const remove = async id => { if (!window.confirm('Delete this project? Related tasks will also be removed.')) return; try { await api(`/projects/${id}`, { method: 'DELETE' }); setNotice({ type: 'success', text: 'Project deleted.' }); await load(); } catch (e) { setNotice({ type: 'error', text: e.message }); } };
  return <><PageIntro eyebrow="DELIVERY CONTROL" title="Projects" text="Manage scope, client ownership, progress and deadlines from one place." action={canEdit && <button className="primary" onClick={() => setModal({ item: null })}><Plus size={18} /> New project</button>} />{notice && <Notice type={notice.type} text={notice.text} />}<div className="toolbar"><div className="search"><Search size={17} /><input aria-label="Search projects" placeholder="Search projects…" value={q} onChange={e => setQ(e.target.value)} /></div><span>{filtered.length} project{filtered.length !== 1 ? 's' : ''}</span></div>{loading ? <Loading /> : <div className="cards-grid">{filtered.map(p => <article className="entity-card" key={p.id}><div className="card-top"><Status value={p.status} /><div className="card-actions">{canEdit && <button title="Edit" onClick={() => setModal({ item: p })}><Edit3 size={15} /></button>}{canDelete && <button className="danger" title="Delete" onClick={() => remove(p.id)}><Trash2 size={15} /></button>}</div></div><h3>{p.name}</h3><p>{p.description || 'No project description provided.'}</p><div className="client-line"><Users size={14} /> {p.client_name}</div><div className="card-progress"><div><span>Progress</span><b>{p.progress}%</b></div><div className="progress"><i style={{ width: `${p.progress}%` }} /></div></div><div className="card-footer"><span><CalendarDays size={13} /> {formatDate(p.deadline)}</span><span>Updated {formatDate((p.updated_at || '').slice(0, 10))}</span></div></article>)}{!filtered.length && <div className="panel full-span"><Empty title={q ? 'No projects found' : 'No projects yet'} text={q ? 'Try a different search.' : canEdit ? 'Create your first project to start tracking delivery.' : 'Projects assigned to you will appear here.'} action={canEdit && !q && <button className="primary" onClick={() => setModal({ item: null })}><Plus size={16} /> New project</button>} /></div>}</div>}{modal && <ProjectModal item={modal.item} clients={clients} onClose={() => setModal(null)} onSave={save} />}</>;
}
function ProjectModal({ item, clients, onClose, onSave }) { const [form, setForm] = useState(item ? { name: item.name, description: item.description, client_id: item.client_id, status: item.status, progress: item.progress, deadline: item.deadline } : { name: '', description: '', client_id: clients[0]?.id || '', status: 'PLANNING', progress: 0, deadline: '' }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const submit = async e => { e.preventDefault(); setError(''); if (Number(form.progress) < 0 || Number(form.progress) > 100) return setError('Progress must be between 0 and 100.'); setBusy(true); try { await onSave({ ...form, progress: Number(form.progress), client_id: Number(form.client_id) }); } catch (e) { setError(e.message); } finally { setBusy(false); } }; return <Modal title={item ? 'Edit project' : 'Create project'} onClose={onClose}><form className="modal-form" onSubmit={submit}><Field label="Project name"><input required minLength="2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. NovaTech Business Website" /></Field><Field label="Client"><select required value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}><option value="">Select a client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><div className="two-col"><Field label="Status"><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>PLANNING</option><option>IN_PROGRESS</option><option>REVIEW</option><option>COMPLETED</option></select></Field><Field label="Progress %"><input type="number" min="0" max="100" required value={form.progress} onChange={e => setForm({ ...form, progress: e.target.value })} /></Field></div><Field label="Deadline"><input type="date" required value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></Field><Field label="Description"><textarea rows="4" maxLength="500" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Project scope, delivery notes and context…" /></Field>{error && <Notice type="error" text={error} />}<div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save project'} <Check size={16} /></button></div></form></Modal>; }

function Clients() {
  const { user } = useAuth(); const canDelete = user.role === 'ADMIN'; const [items, setItems] = useState([]); const [q, setQ] = useState(''); const [modal, setModal] = useState(null); const [notice, setNotice] = useState(null); const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { setItems(await api('/clients')); } catch (e) { setNotice({ type: 'error', text: e.message }); } finally { setLoading(false); } }; useEffect(() => { load(); }, []);
  const filtered = items.filter(c => `${c.name} ${c.email}`.toLowerCase().includes(q.toLowerCase()));
  const save = async form => { try { if (modal.item) await api(`/clients/${modal.item.id}`, { method: 'PUT', body: JSON.stringify(form) }); else await api('/clients', { method: 'POST', body: JSON.stringify(form) }); setModal(null); setNotice({ type: 'success', text: modal.item ? 'Client updated successfully.' : 'Client added successfully.' }); await load(); } catch (e) { throw e; } };
  const remove = async id => { if (!window.confirm('Delete this client? Their projects and tasks will also be removed.')) return; try { await api(`/clients/${id}`, { method: 'DELETE' }); setNotice({ type: 'success', text: 'Client deleted.' }); await load(); } catch (e) { setNotice({ type: 'error', text: e.message }); } };
  return <><PageIntro eyebrow="CLIENT RELATIONSHIPS" title="Clients" text="Keep client accounts, ownership and project relationships organized." action={<button className="primary" onClick={() => setModal({ item: null })}><Plus size={18} /> Add client</button>} />{notice && <Notice type={notice.type} text={notice.text} />}<div className="toolbar"><div className="search"><Search size={17} /><input aria-label="Search clients" placeholder="Search clients…" value={q} onChange={e => setQ(e.target.value)} /></div><span>{filtered.length} client{filtered.length !== 1 ? 's' : ''}</span></div>{loading ? <Loading /> : <div className="client-table"><div className="table-head"><span>Client</span><span>Email</span><span>Projects</span><span>Actions</span></div>{filtered.map(c => <div className="table-row" key={c.id}><div className="person"><div className="avatar">{initials(c.name)}</div><b>{c.name}</b></div><span>{c.email}</span><span className="count-pill">{c.project_count}</span><div className="row-actions"><button onClick={() => setModal({ item: c })}><Edit3 size={15} /> Edit</button>{canDelete && <button className="danger-text" onClick={() => remove(c.id)}><Trash2 size={15} /> Delete</button>}</div></div>)}{!filtered.length && <Empty icon={<Users size={20} />} title={q ? 'No clients found' : 'No clients yet'} text={q ? 'Try another search.' : 'Add your first client account to connect projects.'} />}</div>}{modal && <ClientModal item={modal.item} onClose={() => setModal(null)} onSave={save} />}</>;
}
function ClientModal({ item, onClose, onSave }) { const [form, setForm] = useState({ name: item?.name || '', email: item?.email || '', password: '' }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const submit = async e => { e.preventDefault(); setError(''); if (!item && form.password.length < 8) return setError('Password must be at least 8 characters.'); setBusy(true); try { const payload = { name: form.name, email: form.email }; if (form.password) payload.password = form.password; await onSave(payload); } catch (e) { setError(e.message); } finally { setBusy(false); } }; return <Modal title={item ? 'Edit client' : 'Add client'} onClose={onClose}><form className="modal-form" onSubmit={submit}><Field label="Name"><input required minLength="2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Client or company name" /></Field><Field label="Email"><input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="client@company.com" /></Field><Field label={item ? 'New password (optional)' : 'Password'}><input type="password" minLength="8" required={!item} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={item ? 'Leave blank to keep current password' : 'At least 8 characters'} /></Field>{error && <Notice type="error" text={error} />}<div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save client'} <Check size={16} /></button></div></form></Modal>; }

function Tasks() {
  const { user } = useAuth(); const canEdit = user.role !== 'CLIENT'; const canDelete = user.role === 'ADMIN'; const [items, setItems] = useState([]); const [projects, setProjects] = useState([]); const [q, setQ] = useState(''); const [modal, setModal] = useState(null); const [notice, setNotice] = useState(null); const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { setItems(await api('/tasks')); if (canEdit) setProjects(await api('/projects')); } catch (e) { setNotice({ type: 'error', text: e.message }); } finally { setLoading(false); } }; useEffect(() => { load(); }, [user.role]);
  const filtered = items.filter(t => `${t.title} ${t.project_name} ${t.status} ${t.priority}`.toLowerCase().includes(q.toLowerCase()));
  const save = async form => { await api(modal.item ? `/tasks/${modal.item.id}` : '/tasks', { method: modal.item ? 'PUT' : 'POST', body: JSON.stringify(form) }); setModal(null); setNotice({ type: 'success', text: modal.item ? 'Task updated successfully.' : 'Task created successfully.' }); await load(); };
  const remove = async id => { if (!window.confirm('Delete this task?')) return; try { await api(`/tasks/${id}`, { method: 'DELETE' }); setNotice({ type: 'success', text: 'Task deleted.' }); await load(); } catch (e) { setNotice({ type: 'error', text: e.message }); } };
  return <><PageIntro eyebrow="DELIVERY WORK" title="Tasks" text="Break projects into clear, accountable work with priorities and deadlines." action={canEdit && <button className="primary" onClick={() => setModal({ item: null })}><Plus size={18} /> New task</button>} />{notice && <Notice type={notice.type} text={notice.text} />}<div className="toolbar"><div className="search"><Search size={17} /><input aria-label="Search tasks" placeholder="Search tasks…" value={q} onChange={e => setQ(e.target.value)} /></div><span>{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span></div>{loading ? <Loading /> : <div className="task-table"><div className="table-head"><span>Task</span><span>Project</span><span>Status</span><span>Priority</span><span>Due</span><span>Actions</span></div>{filtered.map(t => <div className="table-row task-table-row" key={t.id}><div><b>{t.title}</b><small>{t.description || 'No description'}</small></div><span>{t.project_name}</span><Status value={t.status} /><Badge value={t.priority} /><span>{formatDate(t.due_date)}</span><div className="row-actions">{canEdit && <button onClick={() => setModal({ item: t })}><Edit3 size={15} /></button>}{canDelete && <button className="danger-text" onClick={() => remove(t.id)}><Trash2 size={15} /></button>}</div></div>)}{!filtered.length && <Empty icon={<CheckSquare size={20} />} title={q ? 'No tasks found' : 'No tasks yet'} text={q ? 'Try another search.' : 'Create a task to make delivery actionable.'} />}</div>}{modal && <TaskModal item={modal.item} projects={projects} onClose={() => setModal(null)} onSave={save} />}</>;
}
function TaskModal({ item, projects, onClose, onSave }) { const [form, setForm] = useState(item ? { title: item.title, description: item.description, project_id: item.project_id, status: item.status, priority: item.priority, due_date: item.due_date } : { title: '', description: '', project_id: projects[0]?.id || '', status: 'TODO', priority: 'MEDIUM', due_date: '' }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const submit = async e => { e.preventDefault(); setError(''); if (!form.project_id) return setError('Select a project.'); setBusy(true); try { await onSave({ ...form, project_id: Number(form.project_id) }); } catch (e) { setError(e.message); } finally { setBusy(false); } }; return <Modal title={item ? 'Edit task' : 'Create task'} onClose={onClose}><form className="modal-form" onSubmit={submit}><Field label="Task title"><input required minLength="2" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Finalize homepage copy" /></Field><Field label="Project"><select required value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}><option value="">Select a project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><div className="two-col"><Field label="Status"><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>TODO</option><option>IN_PROGRESS</option><option>DONE</option></select></Field><Field label="Priority"><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></Field></div><Field label="Due date"><input type="date" required value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></Field><Field label="Description"><textarea rows="4" maxLength="500" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What needs to be done?" /></Field>{error && <Notice type="error" text={error} />}<div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save task'} <Check size={16} /></button></div></form></Modal>; }

function Access() {
  const [members, setMembers] = useState([]); const [notice, setNotice] = useState(null); const [loading, setLoading] = useState(true); const [modal, setModal] = useState(false);
  const load = () => api('/team').then(d => setMembers(d.members)).catch(e => setNotice({ type: 'error', text: e.message })).finally(() => setLoading(false));
  useEffect(load, []);
  const createMember = async form => { await api('/team', { method: 'POST', body: JSON.stringify(form) }); setModal(false); setNotice({ type: 'success', text: 'Team member account created successfully.' }); setLoading(true); await load(); };
  return <><PageIntro eyebrow="SECURITY & ACCESS" title="Team access" text="Admin-controlled workspace access. Team Member accounts are created here; public signup never creates privileged accounts." action={<button className="primary" onClick={() => setModal(true)}><Plus size={18} /> Add team member</button>} />
    {notice && <Notice type={notice.type} text={notice.text} />}
    {loading ? <Loading /> : <div className="access-grid"><section className="panel"><div className="panel-head"><h3>Workspace members</h3><span className="soft-count">{members.length} active</span></div>{members.map(m => <div className="member-row" key={m.id}><div className="person"><div className="avatar">{initials(m.name)}</div><div><b>{m.name}</b><span>{m.email}</span></div></div><Status value={m.role === 'TEAM_MEMBER' ? 'TEAM_MEMBER' : 'ADMIN'} /></div>)}</section><section className="panel permission-card"><div className="panel-head"><h3>Permission matrix</h3><ShieldCheck size={20} /></div><Permission role="ADMIN" text="Full management, including delete and access control." /><Permission role="TEAM_MEMBER" text="Create and edit operational records. Delete and access control are restricted." /><Permission role="CLIENT" text="Self-signup is limited to client accounts. Clients only see their own assigned work." /></section></div>}
    {modal && <TeamMemberModal onClose={() => setModal(false)} onSave={createMember} />}</>;
}
function TeamMemberModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async e => { e.preventDefault(); setError(''); setBusy(true); try { await onSave(form); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  return <Modal title="Add team member" eyebrow="ADMIN CONTROL" onClose={onClose}><form className="modal-form" onSubmit={submit}><div className="secure-note"><ShieldCheck size={16} /><span>This account will be created as Team Member. Admin access cannot be granted from this form.</span></div><Field label="Full name"><input required minLength="2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ayesha Khan" /></Field><Field label="Work email"><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="member@company.com" /></Field><Field label="Temporary password" hint="At least 8 characters. Share this securely with the team member."><input required minLength="8" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Minimum 8 characters" /></Field>{error && <Notice type="error" text={error} />}<div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Creating…' : 'Create account'} <Check size={16} /></button></div></form></Modal>;
}
function Permission({ role, text }) { return <div className="permission"><div><span className="role-dot" /> <b>{roleLabel(role)}</b></div><p>{text}</p></div>; }

export { api, ROLES };
