const Invoice = require("../models/Invoice");
const CreditNote = require("../models/CreditNote");
const { getAccessibleSubscriptionIds } = require("./reportAccess");
const { isInvoiceOverdue } = require("./invoiceStatus");

const getReceivables = async (user) => {
    const accessibleIds = await getAccessibleSubscriptionIds(user);
    const filter = { status: "issued" };

    if (accessibleIds) {
        filter.subscription = { $in: accessibleIds };
    }

    const invoices = await Invoice.find(filter).populate({
        path: "subscription",
        select: "customerName billingEmail planName"
    });

    const creditNotes = await CreditNote.find({
        invoice: { $in: invoices.map((invoice) => invoice._id) }
    });

    const creditedByInvoice = new Map();

    for (const note of creditNotes) {
        creditedByInvoice.set(
            note.invoice.toString(),
            (creditedByInvoice.get(note.invoice.toString()) || 0) + note.amount
        );
    }

    return invoices.map((invoice) => {
        const totalCredited = creditedByInvoice.get(invoice._id.toString()) || 0;

        return {
            invoice,
            totalCredited,
            outstandingAmount: Math.max(invoice.amount - totalCredited, 0),
            overdue: isInvoiceOverdue(invoice)
        };
    }).filter((item) => item.outstandingAmount > 0);
};

module.exports = { getReceivables };
