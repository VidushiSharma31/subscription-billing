# Architecture & Engineering Decisions

## 1. MERN Stack

### Chose
Use MongoDB, Express.js, React, and Node.js for the application.

### Rejected
Using a separate frontend/backend language combination such as React with a Python backend.

### Why
The MERN stack allows the application to use JavaScript across the frontend and backend. It also provides a straightforward REST API architecture and works well with MongoDB for the application's document-oriented data.


## 2. Server-Side Role Authorization

### Chose
Enforce authorization through backend middleware.

### Rejected
Relying on the React frontend to hide actions that a user is not allowed to perform.

### Why
Frontend restrictions improve the user experience but do not provide security because users can call API endpoints directly. Authorization therefore needs to be enforced on the server.

The application supports:
-Billing Admin
-Account Manager


## 3. Password Hashing

### Chose
Hash user passwords using bcrypt before storing them in MongoDB.

### Rejected
Storing passwords directly or using a simple one-way hash without a password-specific hashing algorithm.

### Why
Passwords should never be stored in plaintext. bcrypt is designed for password hashing and provides a safer approach for storing user credentials.

## 4. Separate Invoice Status History

### Chose
Store invoice status changes in a separate InvoiceStatusHistory collection.

### Rejected
Keeping only the current invoice status or storing the entire history as a mutable array inside the invoice document.

### Why
Invoice status history is an audit trail. A separate collection makes each status transition an independent historical record and prevents the audit information from being lost when the current invoice status changes.


## 5. Owner + subscription filter intersection

**Initial approach:** Owner filtering replaced the subscription restriction.

**Problem:** Owner + Subscription returned all invoices for the owner.

**Reversed/fixed decision:** Treat both as intersecting constraints.

**Why:** Every selected filter should narrow the same result set. This was caught during testing and corrected.

## 6. Split invoice controller

**Initial approach:** One large invoice controller handled CRUD, status, notes, credit notes, and bulk generation.

**Reversed decision:** Split responsibilities into focused controllers.

**Why:** The original file became difficult to read and maintain. Focused controllers made the code easier to reason about.

## 7. Environment-based API configuration

**Chose:** `VITE_API_URL`.

**Rejected:** Hardcoding production URLs into individual components.

**Why:** Local and deployed environments need different API bases without changing application code.