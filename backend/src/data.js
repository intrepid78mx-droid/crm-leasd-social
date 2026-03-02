export const funnelStages = [
  'Nuevo lead',
  'Contactado por WhatsApp',
  'Interesado',
  'Propuesta enviada',
  'Negociación',
  'Ganado',
  'Perdido'
];

export const users = [
  { id: 1, name: 'Admin Principal', role: 'admin', email: 'admin@crm.local', password: 'admin123' },
  { id: 2, name: 'Agente Alicia', role: 'agent', email: 'alicia@crm.local', password: 'agent123' },
  { id: 3, name: 'Agente Bruno', role: 'agent', email: 'bruno@crm.local', password: 'agent123' }
];

export const promotions = [
  {
    id: 1,
    title: 'Descuento de temporada',
    message: 'Obtén 20% de descuento si compras esta semana.',
    active: true,
    updatedAt: new Date().toISOString()
  }
];

export const leads = [
  {
    id: 1,
    name: 'Carla Gómez',
    phone: '+5215511111111',
    source: 'facebook',
    stage: 'Nuevo lead',
    assignedAgentId: 2,
    tags: ['campaña-marzo'],
    lastInteraction: null,
    notes: 'Preguntó por planes premium',
    createdAt: new Date().toISOString()
  }
];

export const messages = [];
