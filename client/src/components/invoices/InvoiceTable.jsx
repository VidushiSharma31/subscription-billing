import { formatAmount, formatDate } from "../../utils/format";

const InvoiceTable = ({ invoices, onSelect }) => {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">
                                Invoice
                            </th>
                            <th className="px-6 py-4 font-semibold text-slate-700">
                                Customer
                            </th>
                            <th className="px-6 py-4 font-semibold text-slate-700">
                                Billing Period
                            </th>
                            <th className="px-6 py-4 font-semibold text-slate-700">
                                Amount
                            </th>
                            <th className="px-6 py-4 font-semibold text-slate-700">
                                Due Date
                            </th>
                            <th className="px-6 py-4 font-semibold text-slate-700">
                                Status
                            </th>
                            <th className="px-6 py-4" />
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {invoices.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="px-6 py-10 text-center text-slate-500"
                                >
                                    No invoices found.
                                </td>
                            </tr>
                        ) : (
                            invoices.map((invoice) => (
                                <tr
                                    key={invoice._id}
                                    className="hover:bg-slate-50"
                                >
                                    <td className="px-6 py-4">
                                        <button
                                            type="button"
                                            onClick={() => onSelect(invoice)}
                                            className="font-medium text-slate-900 hover:underline"
                                        >
                                            {invoice._id.slice(-8)}
                                        </button>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">
                                            {invoice.subscription?.customerName ||
                                                "—"}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            {invoice.subscription?.planName ||
                                                "—"}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-slate-600">
                                        <div>{formatDate(invoice.periodStart)}</div>
                                        <div className="text-xs text-slate-400">
                                            to {formatDate(invoice.periodEnd)}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 font-medium text-slate-700">
                                        {formatAmount(invoice.amount)}
                                    </td>

                                    <td className="px-6 py-4 text-slate-600">
                                        {formatDate(invoice.dueDate)}
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                                    invoice.status === "paid"
                                                        ? "bg-green-100 text-green-700"
                                                        : invoice.status ===
                                                          "issued"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : invoice.status ===
                                                          "void"
                                                        ? "bg-slate-200 text-slate-600"
                                                        : "bg-yellow-100 text-yellow-700"
                                                }`}
                                            >
                                                {invoice.status}
                                            </span>

                                            {invoice.overdue && (
                                                <span className="text-xs font-medium text-red-600">
                                                    Overdue
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => onSelect(invoice)}
                                            className="text-sm font-medium text-slate-600 hover:text-slate-900"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InvoiceTable;
