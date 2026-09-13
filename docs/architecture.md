# Architecture

## Overview
```text
Browser
  |
  | HTTPS / REST
  v
React + Vite frontend
  |
  | JSON API
  v
Node.js + Express backend
  |
  | Mongoose
  v
MongoDB Atlas
```

The frontend is hosted on Vercel, the backend on Render, and persistent data in MongoDB Atlas.

## Frontend
The frontend handles authentication UI, subscription/invoice pages, filters, pagination, dashboard, audit/history presentation, alerts, and user feedback. API communication uses the shared API utility and `VITE_API_URL`.

## Backend
The backend is the enforcement point for authentication, role authorization, subscription/invoice access, lifecycle rules, reporting, audit creation, and alerts.

Main route groups:
```text
/api/auth
/api/subscriptions
/api/invoices
/api/reports
/api/alerts
```

## Authorization Flow
```text
Frontend
  ↓ JWT
Express route
  ↓
Authentication / authorization
  ↓
Controller
  ↓
Ownership/collaborator access check
  ↓
MongoDB
```

The frontend may hide unavailable actions for usability, but the backend is authoritative.

## Representative Archive Request
```text
1. Billing Admin clicks Archive.
2. Frontend sends PATCH /api/subscriptions/:id/archive.
3. Express authenticates the request.
4. Controller verifies Billing Admin permission.
5. Subscription is marked archived.
6. SubscriptionAudit records actor, action, and timestamp.
7. Updated subscription is returned.
8. Frontend refreshes the list.
```

Archiving preserves invoice history and prevents future invoice generation.

## Representative Invoice Filtering
```text
1. User selects filters.
2. Frontend sends query parameters.
3. Backend builds one MongoDB query.
4. Access restrictions are applied.
5. Search, owner, subscription, status, overdue, sorting, and pagination are applied server-side.
6. Backend returns matching invoices and total count.
```

## Deployment
```text
Vercel
  React/Vite
      |
      v
Render
  Express/Node.js
      |
      v
MongoDB Atlas
```
