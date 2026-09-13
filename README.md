# Subscription Billing

A full-stack subscription billing system for managing customers, subscriptions, invoices, billing workflows, audit history, receivables, dashboards, and overdue alerts.

## Live Application
- Frontend: https://subscription-billing-ir9c1xblb-vidushi8.vercel.app
- Backend: https://subscription-billing-sq31.onrender.com
- Health check: https://subscription-billing-sq31.onrender.com/api/health
- Repository: https://github.com/VidushiSharma31/subscription-billing

> The Render backend may take some time to wake up on a free-tier deployment.

## Features

### Authentication and authorization
- Email/password authentication.
- Billing Admin and Account Manager roles.
- JWT-based authentication.
- Server-side authorization.
- Account Managers can access subscriptions they own or collaborate on.
- Administrative operations are protected on the server.

### Subscription management
- Create and edit subscriptions.
- Customer name, billing email, plan, billing cycle, price, start date, and owner.
- One owning Account Manager and multiple Account Manager collaborators.
- Billing Admin can add/remove collaborators.
- Archive and restore subscriptions.
- Archived subscriptions remain available with their history and do not participate in future invoice generation.

### Invoice management
- Create invoices against subscriptions.
- Billing period start/end dates, amount, and due date.
- Draft invoices can be edited.
- Due dates can be changed until an invoice is Paid.
- Lifecycle: Draft → Issued → Paid.
- Issued invoices can be voided with a reason.
- Paid invoices are immutable.
- Credit notes provide a separate correction record for Paid invoices.

### Invoice discovery
- Search by customer name and billing email.
- Filter by status.
- Filter by overdue state.
- Filter by owning Account Manager.
- Filter by subscription.
- Sorting by due date, amount, and status.
- Server-side filtering and pagination.
- Combined filters are applied together on the server.

### Bulk invoice generation
Billing Admins can generate invoices for the current period across active subscriptions. Each subscription produces a result indicating whether the invoice was generated, skipped because it already existed, or failed with a reason.

### Receivables
- Export Issued/overdue invoices as CSV.
- Export includes subscription, amount, and due date.
- Access follows the viewer's subscription permissions.

### Dashboard
- Invoices issued this month.
- Revenue collected this month.
- Receivables.
- Overdue invoices.
- Invoice status breakdown.
- Plan breakdown.
- Weekly collected revenue for the last eight weeks.

### Audit and history
Subscription audit records cover creation, updates, collaborator changes, archive, and restore.

Invoice history covers creation, status changes with old/new status and actor, notes, and credit notes.

### Overdue alerts
- Overdue invoices appear in the alerts area.
- Navigation displays an alert count.
- Billing Admins can dismiss overdue alerts.
- An overdue condition can become active again after a due-date change and subsequent passage of the new due date.

## Tech Stack
- React, React Router, Vite, JavaScript, CSS
- Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, CORS
- Vercel, Render, MongoDB Atlas

## Architecture
```text
React / Vite frontend
        |
        | HTTPS REST API
        v
Node.js + Express backend
        |
        | Mongoose
        v
MongoDB Atlas
```

## Project Structure
```text
subscription-billing/
├── client/
│   └── src/
├── server/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── utils/
├── docs/
├── README.md
└── SUBMISSION.md
```

## Roles and Permissions

| Capability | Billing Admin | Account Manager |
|---|---|---|
| View accessible subscriptions | Yes | Yes |
| Create subscription | Yes | Yes |
| Edit subscription | Yes | Own/collaborated |
| Archive subscription | Yes | No |
| Restore subscription | Yes | No |
| Add/remove collaborators | Yes | No |
| Create accessible invoice | Yes | Own/collaborated |
| Edit Draft invoice | Yes | Own/collaborated |
| Change due date before Paid | Yes | Own/collaborated |
| Issue invoice | Yes | No |
| Mark invoice Paid | Yes | No |
| Void invoice | Yes | No |
| Create credit note | Yes | No |
| Bulk invoice generation | Yes | No |
| Dismiss overdue alerts | Yes | No |

Permissions are enforced on the backend.

## Invoice Lifecycle
```text
Draft ───────> Issued ───────> Paid
  |               |
  +------------> Void
```

Draft invoices can be edited. Issuing locks the billing period and amount. Paid invoices cannot be edited; corrections use credit notes.

## API Overview

Backend base path: `/api`

### Authentication
```text
POST /api/auth/login
GET  /api/auth/me
GET  /api/auth/account-managers
```

### Subscriptions
```text
POST /api/subscriptions
GET  /api/subscriptions
GET  /api/subscriptions/:id
PATCH /api/subscriptions/:id
PATCH /api/subscriptions/:id/archive
PATCH /api/subscriptions/:id/restore
PATCH /api/subscriptions/:id/collaborators
```

Invoice, reporting, audit, and alert routes are defined in their respective files under `server/routes/`.

## Environment Variables

### Backend
```env
MONGODB_URI=<MongoDB Atlas connection string>
JWT_SECRET=<strong secret>
CLIENT_ORIGIN=<frontend origin>
PORT=<provided by Render; local fallback is used by the application>
```

### Frontend
```env
VITE_API_URL=https://subscription-billing-sq31.onrender.com/api
```

Never commit real secrets.

## Local Development

Backend:
```bash
cd server
npm install
npm start
```

Frontend:
```bash
cd client
npm install
npm run dev
```

## Deployment

```text
MongoDB Atlas
    ↓
Render
    ↓
Vercel
```

The backend receives database credentials and JWT/CORS configuration through environment variables. The frontend receives the Render API URL through `VITE_API_URL`.

## Demo Data

### Billing Admin
```text
Email: admin@example.com
Password: admin123
```

### Account Manager 1
```text
Email: manager1@example.com
Password: manager123
```

### Account Manager 2
```text
Email: manager2@example.com
Password: manager456
```

## Assignment Coverage

| Requirement | Implementation |
|---|---|
| Roles and permissions | JWT authentication + server authorization |
| Subscription lifecycle | Subscription controllers/routes + archive/restore |
| Collaborators | Subscription collaborator management |
| Invoice lifecycle | Invoice/status controllers |
| Invoice search/filtering | Server-side invoice queries |
| Bulk generation | Bulk invoice controller |
| Receivables CSV | Reporting/export functionality |
| Dashboard | Dashboard/reporting functionality |
| Invoice history | Invoice history/timeline |
| Subscription audit | Subscription audit model/controller |
| Overdue alerts | Alert routes/controller/UI |
| Deployment | Vercel + Render + MongoDB Atlas |

## Security
- Passwords are not stored in plain text.
- JWT is used for authenticated API requests.
- Authorization is enforced on the backend.
- Ownership and collaborator access are checked server-side.
- Administrative operations are role-protected.
- Database credentials and JWT secrets use environment variables.
- Production CORS is restricted to the configured frontend origin.
