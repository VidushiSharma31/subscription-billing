const isInvoiceOverdue = (invoice) => {
    return (
        invoice.status === "issued" &&
        new Date(invoice.dueDate) < new Date()
    );
};

module.exports = {
    isInvoiceOverdue
};