# Schema

Answer each of these, in your own words.

- Table by table: what columns and types does each one have?
- Which relationships are one-to-many, and which are many-to-many?
- Which constraints are enforced by the database, and which by application code — and why did you draw the line there?
- What did you deliberately denormalise?
- What would break first if this had 100x the data?


---

# Database Schema

The application uses MongoDB with Mongoose for data persistence.

## User

Stores application users and their roles.

Fields:
- `_id`
- `name`
- `email`
- `password`
- `role`
- `createdAt`
- `updatedAt`

Roles:
- `billing_admin`
- `account_manager`

Passwords are excluded from normal queries and are stored as bcrypt hashes.

---

## Subscription

Represents a customer's active or historical subscription.

Fields:
- `_id`
- `customerName`
- `billingEmail`
- `planName`
- `billingCycle`
- `price`
- `startDate`
- `owner`
- `collaborators`
- `status`
- `createdAt`
- `updatedAt`

Relationships:
- `owner` references `User`
- `collaborators` references multiple `User` documents

Status:
- `active`
- `archived`

Archived subscriptions are retained for historical purposes and do not generate future invoices.

---

## Invoice

Represents a billing invoice belonging to a subscription.

Fields:
- `_id`
- `subscription`
- `periodStart`
- `periodEnd`
- `amount`
- `dueDate`
- `status`
- `createdAt`
- `updatedAt`

Relationship:
- `subscription` references `Subscription`

Statuses:
- `draft`
- `issued`
- `paid`
- `void`

---

## Credit Note

Represents a correction applied to an invoice.

Fields:
- `_id`
- `invoice`
- `amount`
- `reason`
- `createdBy`
- `createdAt`
- `updatedAt`

Relationships:
- `invoice` references `Invoice`
- `createdBy` references `User`

Credit notes will be used to correct paid invoices rather than modifying the paid invoice itself.

---

## Invoice Status History

Stores immutable invoice status transitions.

Fields:
- `_id`
- `invoice`
- `oldStatus`
- `newStatus`
- `changedBy`
- `createdAt`
- `updatedAt`

Relationships:
- `invoice` references `Invoice`
- `changedBy` references `User`

---

## Invoice Note

Stores notes associated with invoices.

Fields:
- `_id`
- `invoice`
- `text`
- `createdBy`
- `createdAt`
- `updatedAt`

Relationships:
- `invoice` references `Invoice`
- `createdBy` references `User`

---

## Relationships

```text
User
 ├── owns → Subscription
 ├── collaborates on → Subscription
 ├── creates → CreditNote
 ├── changes status of → Invoice
 └── creates → InvoiceNote

Subscription
 └── has many → Invoice

Invoice
 ├── has many → InvoiceStatusHistory
 ├── has many → InvoiceNote
 └── may have → CreditNote