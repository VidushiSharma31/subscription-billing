const express = require("express");

const {
    createInvoice,
    getInvoices,
    getInvoice,
    updateInvoiceDraft,
    updateInvoiceDueDate
} = require("../controllers/invoiceController");

const {
    updateInvoiceStatus,
    getInvoiceHistory
} = require("../controllers/invoiceStatusController");

const { getInvoiceTimeline } = require("../controllers/invoiceTimelineController");

const {
    addInvoiceNote,
    getInvoiceNotes
} = require("../controllers/invoiceNoteController");

const {
    createCreditNote,
    getCreditNotes
} = require("../controllers/creditNoteController");

const {
    generateCurrentPeriodInvoices
} = require("../controllers/invoiceBulkController");

const authenticateUser = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", authenticateUser, createInvoice);
router.get("/", authenticateUser, getInvoices);
router.get("/:id", authenticateUser, getInvoice);

router.put("/:id", authenticateUser, updateInvoiceDraft);
router.patch("/:id/due-date", authenticateUser, updateInvoiceDueDate);

router.patch(
    "/:id/status",
    authenticateUser,
    authorizeRoles("billing_admin"),
    updateInvoiceStatus
);

router.get("/:id/history", authenticateUser, getInvoiceHistory);
router.get("/:id/timeline", authenticateUser, getInvoiceTimeline);

router.post("/:id/notes", authenticateUser, addInvoiceNote);
router.get("/:id/notes", authenticateUser, getInvoiceNotes);

router.get("/:id/credit-notes", authenticateUser, getCreditNotes);

router.post(
    "/:id/credit-notes",
    authenticateUser,
    authorizeRoles("billing_admin"),
    createCreditNote
);

router.post(
    "/generate-current-period",
    authenticateUser,
    authorizeRoles("billing_admin"),
    generateCurrentPeriodInvoices
);

module.exports = router;
