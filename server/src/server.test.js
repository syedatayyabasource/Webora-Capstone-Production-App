import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
process.env.NODE_ENV = 'test';
const { default: app } = await import('./server.js');

async function login(email, password, role) {
  const response = await request(app).post('/api/auth/login').send({ email, password, role });
  return response.body.token;
}

describe('Webora API', () => {
  let adminToken; let memberToken; let clientToken;
  beforeAll(async () => {
    adminToken = await login('admin@webora.test', 'Admin@123', 'ADMIN');
    memberToken = await login('member@webora.test', 'Member@123', 'TEAM_MEMBER');
    clientToken = await login('client@webora.test', 'Client@123', 'CLIENT');
  });

  it('health check works', async () => { const r = await request(app).get('/api/health'); expect(r.status).toBe(200); expect(r.body.ok).toBe(true); });
  it('rejects incorrect password', async () => { const r = await request(app).post('/api/auth/login').send({ email:'admin@webora.test', password:'Wrong@123', role:'ADMIN' }); expect(r.status).toBe(401); });
  it('rejects a valid account when the selected role is wrong', async () => { const r = await request(app).post('/api/auth/login').send({ email:'admin@webora.test', password:'Admin@123', role:'TEAM_MEMBER' }); expect(r.status).toBe(401); });
  it('logs in an admin with the matching database role', async () => { const r = await request(app).post('/api/auth/login').send({ email:'admin@webora.test', password:'Admin@123', role:'ADMIN' }); expect(r.status).toBe(200); expect(r.body.user.role).toBe('ADMIN'); });
  it('rejects unauthenticated project access', async () => { const r = await request(app).get('/api/projects'); expect(r.status).toBe(401); });
  it('allows a team member to create a project', async () => { const r = await request(app).post('/api/projects').set('Authorization',`Bearer ${memberToken}`).send({ name:'Team Test Project', description:'Test', client_id:1, status:'PLANNING', progress:10, deadline:'2026-12-01' }); expect(r.status).toBe(201); });
  it('prevents a team member from deleting a project', async () => { const r = await request(app).delete('/api/projects/1').set('Authorization',`Bearer ${memberToken}`); expect(r.status).toBe(403); });
  it('prevents a client from accessing the clients management endpoint', async () => { const r = await request(app).get('/api/clients').set('Authorization',`Bearer ${clientToken}`); expect(r.status).toBe(403); });
  it('allows an admin to delete a task', async () => { const r = await request(app).delete('/api/tasks/1').set('Authorization',`Bearer ${adminToken}`); expect(r.status).toBe(204); });
  it('scopes client projects to the logged-in client', async () => { const r = await request(app).get('/api/projects').set('Authorization',`Bearer ${clientToken}`); expect(r.status).toBe(200); expect(r.body.every(p => p.client_id === 1)).toBe(true); });
  it('rejects invalid project input on the server', async () => { const r = await request(app).post('/api/projects').set('Authorization',`Bearer ${adminToken}`).send({ name:'', client_id:1, status:'PLANNING', progress:200, deadline:'' }); expect(r.status).toBe(400); });
  it('allows admin-only team access endpoint', async () => { const member = await request(app).get('/api/team').set('Authorization',`Bearer ${memberToken}`); const admin = await request(app).get('/api/team').set('Authorization',`Bearer ${adminToken}`); expect(member.status).toBe(403); expect(admin.status).toBe(200); });
});
