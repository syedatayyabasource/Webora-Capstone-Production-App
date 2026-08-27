import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import App from './App.jsx';

beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

function renderApp(initialEntries=['/']) { return render(<BrowserRouter><App /></BrowserRouter>); }

describe('Webora frontend', () => {
  it('renders the professional landing hero', () => { renderApp(); expect(screen.getByText('Manage websites.')).toBeInTheDocument(); expect(screen.getByText('Project control')).toBeInTheDocument(); });
  it('renders the client access signup path', async () => { const user = userEvent.setup(); renderApp(); await user.click(screen.getByRole('button', { name:/get started/i })); expect(screen.getByRole('heading', { name:/create client access/i })).toBeInTheDocument(); });
  it('shows all three role options on login', async () => { const user = userEvent.setup(); renderApp(); await user.click(screen.getByRole('button', { name:/sign in/i })); expect(screen.getByRole('option', { name:'Admin' })).toBeInTheDocument(); expect(screen.getByRole('option', { name:'Team Member' })).toBeInTheDocument(); expect(screen.getByRole('option', { name:'Client' })).toBeInTheDocument(); });
  it('validates password length before sending login', async () => { const user = userEvent.setup(); global.fetch = vi.fn(); renderApp(); await user.click(screen.getByRole('button', { name:/sign in/i })); await user.type(screen.getByLabelText('Email address'),'admin@webora.test'); await user.type(screen.getByLabelText('Password'),'short'); await user.click(screen.getByRole('button', { name:/sign in/i })); expect(screen.getByRole('alert')).toHaveTextContent('Password must be at least 8 characters.'); expect(global.fetch).not.toHaveBeenCalled(); });
  it('redirects unauthenticated users to login', () => { render(<MemoryRouter initialEntries={['/app']}><App /></MemoryRouter>); expect(screen.getByRole('heading', { name:/welcome back/i })).toBeInTheDocument(); });
  it('hides client management navigation for a client session', async () => { localStorage.setItem('webora_token','fake'); localStorage.setItem('webora_user',JSON.stringify({id:3,name:'NovaTech Client',email:'client@webora.test',role:'CLIENT',client_id:1})); global.fetch = vi.fn().mockResolvedValue({ ok:true, json:async()=>({projects:[],tasks:[],stats:{projects:0,tasks:0,completion:0}}) }); render(<MemoryRouter initialEntries={['/app']}><App /></MemoryRouter>); expect(await screen.findByText(/client portal/i)).toBeInTheDocument(); expect(screen.queryByRole('link',{name:'Clients'})).not.toBeInTheDocument(); expect(screen.queryByRole('link',{name:'Team access'})).not.toBeInTheDocument(); });
});
