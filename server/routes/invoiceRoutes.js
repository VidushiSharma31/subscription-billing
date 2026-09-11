const express = require("express");

const {
    createInvoice,
    getInvoices,
    updateInvoiceStatus,
    getInvoice,
    getInvoiceHistory,
    addInvoiceNote,
    getInvoiceNotes, 
    createCreditNote,
    getCreditNotes
} = require("../controllers/invoiceController");

const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/",
    authenticateUser,
    createInvoice
);

router.get(
    "/",
    authenticateUser,
    getInvoices
);

router.patch(
    "/:id/status",
    authenticateUser,
    authorizeRoles("billing_admin"),
    updateInvoiceStatus
);

router.get(
    "/:id",
    authenticateUser,
    getInvoice
);

router.get(
    "/:id/history",
    authenticateUser,
    getInvoiceHistory
);

router.post(
    "/:id/notes",
    authenticateUser,
    addInvoiceNote
);

router.get(
    "/:id/notes",
    authenticateUser,
    getInvoiceNotes
);

router.get(
    "/:id/credit-notes",
    authenticateUser,
    getCreditNotes
);

router.post(
    "/:id/credit-notes",
    authenticateUser,
    authorizeRoles("billing_admin"),
    createCreditNote
);

module.exports = router;