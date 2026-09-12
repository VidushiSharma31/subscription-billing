const Invoice = require("../models/Invoice");
const CreditNote = require("../models/CreditNote");

const getReceivables = async () => {
    const invoices = await Invoice.find({
        status: "issued"
    }).populate({
        path: "subscription",
        select: "customerName billingEmail planName"
    });

    const receivables = [];

    for (const invoice of invoices) {
        const creditNotes = await CreditNote.find({
            invoice: invoice._id
        });

        const totalCredited = creditNotes.reduce(
            (total, creditNote) => total + creditNote.amount,
            0
        );

        const outstandingAmount =
            invoice.amount - totalCredited;

        if (outstandingAmount > 0) {
            receivables.push({
                invoice,
                totalCredited,
                outstandingAmount,
                overdue:
                    new Date(invoice.dueDate) < new Date()
            });
        }
    }

    return receivables;
};

module.exports = {
    getReceivables
};