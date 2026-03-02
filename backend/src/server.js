import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { funnelStages, leads, messages, promotions, users } from './data.js';

const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '../../web');

const send = (res, status, payload, contentType = 'application/json') => {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-role'
  });
  res.end(contentType === 'application/json' ? JSON.stringify(payload) : payload);
};

const parseBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString());
};

const requireRole = (req, roles) => {
  const role = req.headers['x-role'];
  return roles.includes(role);
};

const findAgent = (agentId) => users.find((user) => user.id === Number(agentId) && user.role === 'agent');

const routes = async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'OPTIONS') return send(res, 204, {});

  if (url.pathname === '/' && req.method === 'GET') {
    const html = await readFile(path.join(webRoot, 'index.html'), 'utf8');
    return send(res, 200, html, 'text/html; charset=utf-8');
  }

  if (url.pathname === '/api/health' && req.method === 'GET') return send(res, 200, { ok: true, app: 'CRM Leads Social' });

  if (url.pathname === '/api/auth/login' && req.method === 'POST') {
    const { email, password } = await parseBody(req);
    const user = users.find((candidate) => candidate.email === email && candidate.password === password);
    if (!user) return send(res, 401, { error: 'Credenciales inválidas' });
    return send(res, 200, {
      token: Buffer.from(`${user.email}:${user.role}`).toString('base64'),
      profile: { id: user.id, name: user.name, role: user.role, email: user.email }
    });
  }

  if (url.pathname === '/api/users' && req.method === 'GET') {
    if (!requireRole(req, ['admin'])) return send(res, 403, { error: 'Rol no autorizado' });
    return send(res, 200, users.map(({ password, ...profile }) => profile));
  }

  if (url.pathname === '/api/users/agents' && req.method === 'POST') {
    if (!requireRole(req, ['admin'])) return send(res, 403, { error: 'Rol no autorizado' });
    const { name, email } = await parseBody(req);
    if (!name || !email) return send(res, 400, { error: 'name y email son requeridos' });
    const user = { id: users.length + 1, name, email, role: 'agent', password: 'agent123' };
    users.push(user);
    const { password, ...profile } = user;
    return send(res, 201, profile);
  }

  if (url.pathname === '/api/webhooks/social' && req.method === 'POST') {
    const { name, phone, source = 'facebook', tags = [] } = await parseBody(req);
    if (!name || !phone) return send(res, 400, { error: 'name y phone son requeridos' });
    const availableAgents = users.filter((user) => user.role === 'agent');
    const assignedAgent = availableAgents[leads.length % availableAgents.length];
    const lead = {
      id: leads.length + 1,
      name,
      phone,
      source,
      stage: funnelStages[0],
      assignedAgentId: assignedAgent?.id,
      tags,
      lastInteraction: null,
      notes: '',
      createdAt: new Date().toISOString()
    };
    leads.push(lead);
    return send(res, 201, lead);
  }

  if (url.pathname === '/api/funnel/stages' && req.method === 'GET') return send(res, 200, funnelStages);

  if (url.pathname === '/api/leads' && req.method === 'GET') {
    const stage = url.searchParams.get('stage');
    const assignedAgentId = url.searchParams.get('assignedAgentId');
    const source = url.searchParams.get('source');
    const filtered = leads.filter((lead) => {
      if (stage && lead.stage !== stage) return false;
      if (assignedAgentId && lead.assignedAgentId !== Number(assignedAgentId)) return false;
      if (source && lead.source !== source) return false;
      return true;
    });
    return send(res, 200, filtered);
  }

  if (url.pathname.match(/^\/api\/leads\/\d+\/stage$/) && req.method === 'PATCH') {
    if (!requireRole(req, ['admin', 'agent'])) return send(res, 403, { error: 'Rol no autorizado' });
    const leadId = Number(url.pathname.split('/')[3]);
    const lead = leads.find((item) => item.id === leadId);
    const { stage } = await parseBody(req);
    if (!lead) return send(res, 404, { error: 'Lead no encontrado' });
    if (!funnelStages.includes(stage)) return send(res, 400, { error: 'Etapa inválida' });
    lead.stage = stage;
    return send(res, 200, lead);
  }

  if (url.pathname.match(/^\/api\/leads\/\d+\/assign$/) && req.method === 'PATCH') {
    if (!requireRole(req, ['admin'])) return send(res, 403, { error: 'Rol no autorizado' });
    const leadId = Number(url.pathname.split('/')[3]);
    const lead = leads.find((item) => item.id === leadId);
    const { agentId } = await parseBody(req);
    const agent = findAgent(agentId);
    if (!lead) return send(res, 404, { error: 'Lead no encontrado' });
    if (!agent) return send(res, 400, { error: 'Agente inválido' });
    lead.assignedAgentId = agent.id;
    return send(res, 200, lead);
  }

  if (url.pathname === '/api/whatsapp/send' && req.method === 'POST') {
    if (!requireRole(req, ['admin', 'agent'])) return send(res, 403, { error: 'Rol no autorizado' });
    const { leadId, text } = await parseBody(req);
    const lead = leads.find((item) => item.id === Number(leadId));
    if (!lead) return send(res, 404, { error: 'Lead no encontrado' });
    if (!text) return send(res, 400, { error: 'Mensaje vacío' });
    const payload = { id: messages.length + 1, leadId: lead.id, channel: 'whatsapp', text, sentAt: new Date().toISOString() };
    lead.lastInteraction = payload.sentAt;
    messages.push(payload);
    return send(res, 201, payload);
  }

  if (url.pathname === '/api/ai/reply' && req.method === 'POST') {
    if (!requireRole(req, ['admin', 'agent'])) return send(res, 403, { error: 'Rol no autorizado' });
    const { leadId, customerMessage } = await parseBody(req);
    const lead = leads.find((item) => item.id === Number(leadId));
    if (!lead) return send(res, 404, { error: 'Lead no encontrado' });
    const promotion = promotions.find((item) => item.active);
    const autoReply = `Hola ${lead.name}, gracias por tu mensaje: "${customerMessage}". Actualmente estás en la etapa "${lead.stage}". ${promotion ? `Promo activa: ${promotion.message}` : 'Pronto te compartimos nuevas promociones.'}`;
    return send(res, 200, { leadId: lead.id, reply: autoReply, model: 'assistant-sales-v1' });
  }

  if (url.pathname === '/api/promotions' && req.method === 'GET') return send(res, 200, promotions);

  if (url.pathname === '/api/promotions' && req.method === 'POST') {
    if (!requireRole(req, ['admin'])) return send(res, 403, { error: 'Rol no autorizado' });
    const { title, message, active = true } = await parseBody(req);
    if (!title || !message) return send(res, 400, { error: 'title y message son requeridos' });
    const promotion = { id: promotions.length + 1, title, message, active, updatedAt: new Date().toISOString() };
    promotions.push(promotion);
    return send(res, 201, promotion);
  }

  if (url.pathname === '/api/dashboard/summary' && req.method === 'GET') {
    const byStage = funnelStages.map((stage) => ({ stage, total: leads.filter((lead) => lead.stage === stage).length }));
    return send(res, 200, { totalLeads: leads.length, totalAgents: users.filter((user) => user.role === 'agent').length, byStage });
  }

  return send(res, 404, { error: 'Ruta no encontrada' });
};

http
  .createServer((req, res) => {
    routes(req, res).catch((error) => {
      send(res, 500, { error: 'Error interno', detail: error.message });
    });
  })
  .listen(PORT, () => console.log(`CRM Leads Social corriendo en http://localhost:${PORT}`));
