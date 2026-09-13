# AI Prompts Used

AI was used for implementation, debugging, refactoring, deployment troubleshooting, and documentation. Generated code was reviewed and tested rather than accepted blindly.

## Invoice refactoring
> Refactor the invoice functionality into smaller readable controllers and reusable frontend components. Preserve all existing routes and behavior. Keep the implementation simple and do not change business rules.

## Owner filter
> Add a server-side invoice filter for the owning Account Manager. Billing Admins should be able to select an Account Manager, while Account Managers should only see subscriptions they are allowed to access. Add the required backend endpoint for Account Manager options and wire the filter into the invoice UI.

## Bad owner + subscription filter output
> The owner and subscriptions filters are not working together. If I add a subscription filter, it still shows all the invoices of that account manager. Fix the server-side query so both filters must be satisfied.

The first implementation incorrectly replaced the subscription condition. Testing exposed the issue, and the query was changed to intersect the owner and selected subscription constraints.

## Archive and audit
> Add subscription archive and restore functionality and an immutable subscription audit timeline. Record creation, updates, collaborator changes, archive, and restore with actor and timestamp. Only Billing Admins can archive/restore and manage collaborators.

## Code cleanup
> Go through the entire project, understand how the frontend, backend, database models, routes, controllers, utilities, authentication, subscription lifecycle, invoice lifecycle, dashboard, reporting, audit/history, and alerts work together. Remove genuinely unused files and code, improve readability, and implement missing assignment requirements without touching the docs folder or rewriting working functionality unnecessarily.

## Deployment debugging
AI assistance was used to diagnose:
- Render startup failure.
- `SubscriptionAudit` filename case mismatch between Windows and GitHub.
- MongoDB Atlas IP/network access.
- production CORS.
- frontend production API base URL.
- Vercel SPA routing.

These were verified against deployment logs and browser network errors.

## README/documentation
> Go through the entire Subscription Billing project and update README.md so that it accurately documents the current implementation. Do not invent features, do not modify the docs folder, and verify the tech stack, routes, environment variables, project structure, permissions, invoice lifecycle, audit history, deployment, and assignment coverage against the source code.

## Reflection
The most important lesson from the AI-assisted workflow was to test generated code against the actual assignment requirements. The combined owner/subscription filter bug and the production deployment issues would not have been caught by simply accepting generated code without verification.
