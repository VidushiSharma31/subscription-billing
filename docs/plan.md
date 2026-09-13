# Development Plan

## Session Breakdown

The work was divided into focused sessions, with each session covering one major part of the application:

1. **Foundation & Authentication** — Set up the MERN structure, database, models, JWT authentication, and role-based authorization.
2. **Subscription Management** — Built subscription CRUD, access control, collaborators, archive/restore, and server-side search, filtering, sorting, and pagination.
3. **Invoice Management** — Implemented invoice creation, listing, lifecycle transitions, history, notes, credit notes, due dates, overdue handling, and access control.
4. **Bulk Billing & Refinement** — Added bulk invoice generation, duplicate prevention, and generated/skipped/failed results.
5. **Frontend, Deployment & Documentation** — Completed the frontend workflows, fixed integration issues, deployed the application, and finalized the required documentation.

## Build Order

The project was built from the backend foundation upward. Authentication and authorization were implemented first because permissions are central to both subscriptions and invoices. Subscription management was built next because invoices depend on subscriptions. Invoice functionality followed, including its lifecycle and history. Frontend work and deployment were completed after the core backend workflows were stable.

This order made it easier to test access-control rules early and avoid building frontend functionality on top of unstable APIs.

## Estimated vs Actual

The assignment suggested approximately **12 hours** as a guideline. The actual development time exceeded the initial estimate because of additional debugging, refinement, deployment issues, and integration work.

The main sources of additional time were:

* Refining server-side filtering and access-control behavior
* Adding subscription audit history
* Debugging production deployment
* Fixing environment, CORS, routing, and database configuration issues

## Scope Cuts

When time became limited, optional stretch features were deprioritized in favor of completing the core assignment requirements. The focus remained on subscription management, invoice lifecycle management, access control, audit/history functionality, deployment, and required documentation.

Reporting/dashboard enhancements and other non-essential improvements were left out rather than compromising the required workflows.
