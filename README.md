# CRM Leads Social

CRM para gestión de leads desde Facebook, Instagram y WhatsApp, con embudo comercial, multi-agente, roles y respuestas automáticas con IA.

## Funcionalidades implementadas

- Captura de leads desde anuncios en **Facebook/Instagram** (`POST /api/webhooks/social`).
- Integración de mensajería por **WhatsApp** (`POST /api/whatsapp/send`).
- **Embudo de ventas** configurable por etapas (`GET /api/funnel/stages`, `PATCH /api/leads/:id/stage`).
- Roles de **administrador** y **agente** con control por cabecera `x-role`.
- Soporte para **múltiples agentes** y asignación automática/manual.
- **IA de respuestas automáticas** para sugerir mensajes comerciales (`POST /api/ai/reply`).
- Gestión dinámica de **promociones** (`GET/POST /api/promotions`).
- Tres accesos:
  - **Web**: dashboard básico en `http://localhost:3000`.
  - **Android/iOS**: app base en `mobile/App.js` (Expo React Native).

## Ejecutar el proyecto

```bash
npm install
npm start
```

## Credenciales de prueba

- Admin: `admin@crm.local` / `admin123`
- Agentes: `alicia@crm.local` o `bruno@crm.local` / `agent123`

## Endpoints principales

- `POST /api/auth/login`
- `GET /api/leads`
- `PATCH /api/leads/:id/stage`
- `POST /api/whatsapp/send`
- `POST /api/ai/reply`
- `GET /api/dashboard/summary`
