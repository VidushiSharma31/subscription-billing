# Submission

## Project
**Subscription Billing**

## GitHub Repository
https://github.com/VidushiSharma31/subscription-billing

## Live Application
https://subscription-billing-ir9c1xblb-vidushi8.vercel.app

## Backend
https://subscription-billing-sq31.onrender.com

## Health Check
https://subscription-billing-sq31.onrender.com/api/health

## Demo Credentials

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

## Deployment
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

The backend uses environment variables for MongoDB credentials, JWT secrets, and the allowed frontend origin. The frontend uses `VITE_API_URL` for the deployed API base URL.

## Demo Data
The deployed application contains representative users, subscriptions, invoices, audit history, dashboard data, and overdue data.

## Free-tier note
The deployed backend may sleep when idle. The first request after inactivity can therefore take longer than subsequent requests.

## Assignment Coverage
- Roles and server-side permissions
- Subscription CRUD and archive/restore
- Collaborators
- Invoice lifecycle
- Paid invoice immutability and credit notes
- Server-side invoice filtering and pagination
- Bulk invoice generation
- Receivables CSV
- Dashboard
- Immutable invoice history
- Subscription audit history
- Overdue alerts

## Final Verification
Before submission, verify both demo roles and confirm:
- login works
- subscription create/edit/archive/restore works
- collaborator permissions work
- invoice lifecycle rules are enforced
- invoice filters work together
- receivables export works
- dashboard loads
- audit/history displays events
- overdue alerts work
