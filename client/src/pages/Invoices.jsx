import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:5000/api";

const Invoices = () => {
    const { token, user } = useAuth();

    const [invoices, setInvoices] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [overdueFilter, setOverdueFilter] = useState("");
    const [subscriptionFilter, setSubscriptionFilter] = useState("");

    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);

    const isAdmin = user?.role === "billing_admin";

    const fetchSubscriptions = async () => {
        try {
            const response = await fetch(
                `${API_URL}/subscriptions?limit=100`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to fetch subscriptions"
                );
            }

            setSubscriptions(data.subscriptions);
        } catch (error) {
            setError(error.message);
        }
    };

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams();

            if (search.trim()) {
                params.append("search", search.trim());
            }

            if (statusFilter) {
                params.append("status", statusFilter);
            }

            if (overdueFilter) {
                params.append("overdue", overdueFilter);
            }

            if (subscriptionFilter) {
                params.append("subscription", subscriptionFilter);
            }

            params.append("sortBy", sortBy);
            params.append("sortOrder", sortOrder);
            params.append("page", page);
            params.append("limit", 10);

            const response = await fetch(
                `${API_URL}/invoices?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to fetch invoices"
                );
            }

            setInvoices(data.invoices);
            setPagination(data.pagination);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, [token]);

    useEffect(() => {
        setPage(1);
    }, [
        search,
        statusFilter,
        overdueFilter,
        subscriptionFilter,
        sortBy,
        sortOrder,
    ]);

    useEffect(() => {
        fetchInvoices();
    }, [
        token,
        search,
        statusFilter,
        overdueFilter,
        subscriptionFilter,
        sortBy,
        sortOrder,
        page,
    ]);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatAmount = (amount) => {
        return `₹${Number(amount).toLocaleString("en-IN")}`;
    };

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("");
        setOverdueFilter("");
        setSubscriptionFilter("");
    };

    const toggleSortOrder = () => {
        setSortOrder((current) =>
            current === "asc" ? "desc" : "asc"
        );
    };

    const refreshInvoices = async () => {
        await fetchInvoices();
    };

    const hasFilters =
        search.trim() ||
        statusFilter ||
        overdueFilter ||
        subscriptionFilter;

    return (
        <div>
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Invoices
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Create, manage, and track subscription invoices.
                    </p>
                </div>

                <div className="flex gap-3">
                    {isAdmin && (
                        <button
                            onClick={() => setShowBulkModal(true)}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Generate Current Period
                        </button>
                    )}

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        Create Invoice
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-[240px] flex-1">
                        <input
                            type="text"
                            placeholder="Search customer, email, or plan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="issued">Issued</option>
                        <option value="paid">Paid</option>
                        <option value="void">Void</option>
                    </select>

                    <select
                        value={overdueFilter}
                        onChange={(e) => setOverdueFilter(e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-500"
                    >
                        <option value="">All Invoices</option>
                        <option value="true">Overdue</option>
                        <option value="false">Not Overdue</option>
                    </select>

                    <select
                        value={subscriptionFilter}
                        onChange={(e) =>
                            setSubscriptionFilter(e.target.value)
                        }
                        className="max-w-[250px] rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-500"
                    >
                        <option value="">All Subscriptions</option>

                        {subscriptions.map((subscription) => (
                            <option
                                key={subscription._id}
                                value={subscription._id}
                            >
                                {subscription.customerName} —{" "}
                                {subscription.planName}
                            </option>
                        ))}
                    </select>

                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            </div>

            {/* Sorting */}
            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                    {pagination.total}{" "}
                    {pagination.total === 1
                        ? "invoice"
                        : "invoices"}
                </p>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">
                        Sort by
                    </span>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
                    >
                        <option value="createdAt">Created Date</option>
                        <option value="dueDate">Due Date</option>
                        <option value="amount">Amount</option>
                        <option value="periodStart">
                            Period Start
                        </option>
                        <option value="periodEnd">
                            Period End
                        </option>
                    </select>

                    <button
                        onClick={toggleSortOrder}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
                    >
                        {sortOrder === "asc"
                            ? "↑ Asc"
                            : "↓ Desc"}
                    </button>
                </div>
            </div>

            {loading && (
                <p className="mb-4 text-sm text-slate-500">
                    Updating invoices...
                </p>
            )}

            {error && (
                <p className="mb-4 text-sm text-red-600">
                    {error}
                </p>
            )}

            {/* Invoice Table */}
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
                                <th className="px-6 py-4"></th>
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
                                                onClick={() =>
                                                    setSelectedInvoice(
                                                        invoice
                                                    )
                                                }
                                                className="font-medium text-slate-900 hover:underline"
                                            >
                                                {invoice._id.slice(-8)}
                                            </button>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">
                                                {invoice.subscription
                                                    ?.customerName || "—"}
                                            </div>

                                            <div className="mt-1 text-xs text-slate-500">
                                                {invoice.subscription
                                                    ?.planName || "—"}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-slate-600">
                                            <div>
                                                {formatDate(
                                                    invoice.periodStart
                                                )}
                                            </div>

                                            <div className="text-xs text-slate-400">
                                                to{" "}
                                                {formatDate(
                                                    invoice.periodEnd
                                                )}
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
                                                        invoice.status ===
                                                        "paid"
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
                                                onClick={() =>
                                                    setSelectedInvoice(
                                                        invoice
                                                    )
                                                }
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

            {/* Pagination */}
            {pagination.totalPages > 0 && (
                <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Page {pagination.page} of{" "}
                        {pagination.totalPages}
                    </p>

                    <div className="flex gap-2">
                        <button
                            onClick={() =>
                                setPage((current) =>
                                    Math.max(current - 1, 1)
                                )
                            }
                            disabled={page === 1}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <button
                            onClick={() =>
                                setPage((current) =>
                                    Math.min(
                                        current + 1,
                                        pagination.totalPages
                                    )
                                )
                            }
                            disabled={
                                page === pagination.totalPages
                            }
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Create Invoice */}
            {showCreateModal && (
                <CreateInvoiceModal
                    token={token}
                    subscriptions={subscriptions}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        refreshInvoices();
                    }}
                />
            )}

            {/* Invoice Details */}
            {selectedInvoice && (
                <InvoiceDetailsModal
                    invoice={selectedInvoice}
                    token={token}
                    isAdmin={isAdmin}
                    onClose={() => setSelectedInvoice(null)}
                    onUpdated={async () => {
                        await refreshInvoices();

                        const response = await fetch(
                            `${API_URL}/invoices/${selectedInvoice._id}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            }
                        );

                        if (response.ok) {
                            const updated = await response.json();
                            setSelectedInvoice(
                                updated.invoice || updated
                            );
                        }
                    }}
                    onCreditNote={() => setShowCreditModal(true)}
                />
            )}

            {/* Credit Note */}
            {showCreditModal && selectedInvoice && (
                <CreditNoteModal
                    token={token}
                    invoice={selectedInvoice}
                    onClose={() => setShowCreditModal(false)}
                    onCreated={async () => {
                        setShowCreditModal(false);
                        await refreshInvoices();
                    }}
                />
            )}

            {/* Bulk Generation */}
            {showBulkModal && (
                <BulkGenerationModal
                    token={token}
                    onClose={() => setShowBulkModal(false)}
                    onCompleted={() => {
                        setShowBulkModal(false);
                        refreshInvoices();
                    }}
                />
            )}
        </div>
    );
};

/* ============================================================
   CREATE INVOICE MODAL
============================================================ */

const CreateInvoiceModal = ({
    token,
    subscriptions,
    onClose,
    onCreated,
}) => {
    const [form, setForm] = useState({
        subscription: "",
        periodStart: "",
        periodEnd: "",
        amount: "",
        dueDate: "",
    });

    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            const response = await fetch(
                "http://localhost:5000/api/invoices",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        subscription: form.subscription,
                        periodStart: form.periodStart,
                        periodEnd: form.periodEnd,
                        amount: Number(form.amount),
                        dueDate: form.dueDate,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to create invoice"
                );
            }

            onCreated();
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal title="Create Invoice" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Subscription">
                    <select
                        required
                        value={form.subscription}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                subscription: e.target.value,
                            })
                        }
                        className="form-input"
                    >
                        <option value="">
                            Select subscription
                        </option>

                        {subscriptions
                            .filter(
                                (subscription) =>
                                    subscription.status === "active"
                            )
                            .map((subscription) => (
                                <option
                                    key={subscription._id}
                                    value={subscription._id}
                                >
                                    {subscription.customerName} —{" "}
                                    {subscription.planName}
                                </option>
                            ))}
                    </select>
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Period Start">
                        <input
                            required
                            type="date"
                            value={form.periodStart}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    periodStart: e.target.value,
                                })
                            }
                            className="form-input"
                        />
                    </FormField>

                    <FormField label="Period End">
                        <input
                            required
                            type="date"
                            value={form.periodEnd}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    periodEnd: e.target.value,
                                })
                            }
                            className="form-input"
                        />
                    </FormField>
                </div>

                <FormField label="Amount">
                    <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.amount}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                amount: e.target.value,
                            })
                        }
                        className="form-input"
                        placeholder="0"
                    />
                </FormField>

                <FormField label="Due Date">
                    <input
                        required
                        type="date"
                        value={form.dueDate}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                dueDate: e.target.value,
                            })
                        }
                        className="form-input"
                    />
                </FormField>

                {error && (
                    <p className="text-sm text-red-600">
                        {error}
                    </p>
                )}

                <ModalActions
                    onClose={onClose}
                    saving={saving}
                    submitText="Create Invoice"
                />
            </form>
        </Modal>
    );
};

/* ============================================================
   INVOICE DETAILS MODAL
============================================================ */

const InvoiceDetailsModal = ({
    invoice,
    token,
    isAdmin,
    onClose,
    onUpdated,
    onCreditNote,
}) => {
    const [history, setHistory] = useState([]);
    const [notes, setNotes] = useState([]);

    const [newNote, setNewNote] = useState("");
    const [newDueDate, setNewDueDate] = useState(
        invoice.dueDate?.slice(0, 10) || ""
    );

    const [confirmingVoid, setConfirmingVoid] = useState(false);
    const [voidReason, setVoidReason] = useState("");

    const [editingDraft, setEditingDraft] = useState(false);
    const [draftForm, setDraftForm] = useState({
        periodStart: invoice.periodStart?.slice(0, 10) || "",
        periodEnd: invoice.periodEnd?.slice(0, 10) || "",
        amount: invoice.amount ?? "",
        dueDate: invoice.dueDate?.slice(0, 10) || "",
    });

    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchDetails = async () => {
        try {
            const [historyResponse, notesResponse] = await Promise.all([
                fetch(
                    `http://localhost:5000/api/invoices/${invoice._id}/history`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                ),
                fetch(
                    `http://localhost:5000/api/invoices/${invoice._id}/notes`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                ),
            ]);

            const historyData = await historyResponse.json();
            const notesData = await notesResponse.json();

            if (historyResponse.ok) {
                setHistory(
                    historyData.history || historyData
                );
            }

            if (notesResponse.ok) {
                setNotes(notesData.notes || notesData);
            }
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [invoice._id]);

    const updateStatus = async (status) => {
        try {
            setSaving(true);
            setError("");

            const response = await fetch(
                `http://localhost:5000/api/invoices/${invoice._id}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(
                        reason ? { status, reason } : { status }
                    ),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to update status"
                );
            }

            await onUpdated();
            await fetchDetails();
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    const updateDueDate = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            const response = await fetch(
                `http://localhost:5000/api/invoices/${invoice._id}/due-date`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        dueDate: newDueDate,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to update due date"
                );
            }

            await onUpdated();
            setNewDueDate(data.invoice.dueDate.slice(0, 10));
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    const saveDraftEdit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            const response = await fetch(
                `http://localhost:5000/api/invoices/${invoice._id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        periodStart: draftForm.periodStart,
                        periodEnd: draftForm.periodEnd,
                        amount: Number(draftForm.amount),
                        dueDate: draftForm.dueDate,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to update invoice"
                );
            }

            await onUpdated();
            setEditingDraft(false);
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    const addNote = async (e) => {
        e.preventDefault();

        if (!newNote.trim()) {
            return;
        }

        try {
            setSaving(true);
            setError("");

            const response = await fetch(
                `http://localhost:5000/api/invoices/${invoice._id}/notes`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        text: newNote.trim(),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to add note"
                );
            }

            setNewNote("");
            await fetchDetails();
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    const canEditDueDate = invoice.status === "issued";

    return (
        <Modal
            title={`Invoice ${invoice._id.slice(-8)}`}
            onClose={onClose}
            wide
        >
            <div className="space-y-6">
                {/* Invoice information */}
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4">
                    <Detail
                        label="Customer"
                        value={
                            invoice.subscription?.customerName || "—"
                        }
                    />

                    <Detail
                        label="Plan"
                        value={
                            invoice.subscription?.planName || "—"
                        }
                    />

                    <Detail
                        label="Billing Period"
                        value={`${formatDate(invoice.periodStart)} - ${formatDate(
                            invoice.periodEnd
                        )}`}
                    />

                    <Detail
                        label="Amount"
                        value={formatAmount(invoice.amount)}
                    />

                    <Detail
                        label="Status"
                        value={invoice.status}
                    />

                    <Detail
                        label="Due Date"
                        value={formatDate(invoice.dueDate)}
                    />
                </div>

                {invoice.status === "draft" && (
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900">
                                Edit Invoice
                            </h3>

                            {!editingDraft && (
                                <button
                                    onClick={() => setEditingDraft(true)}
                                    className="text-sm font-medium text-slate-700 underline"
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        {editingDraft && (
                            <form onSubmit={saveDraftEdit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Period Start">
                                        <input
                                            required
                                            type="date"
                                            value={draftForm.periodStart}
                                            onChange={(e) =>
                                                setDraftForm({
                                                    ...draftForm,
                                                    periodStart: e.target.value,
                                                })
                                            }
                                            className="form-input"
                                        />
                                    </FormField>

                                    <FormField label="Period End">
                                        <input
                                            required
                                            type="date"
                                            value={draftForm.periodEnd}
                                            onChange={(e) =>
                                                setDraftForm({
                                                    ...draftForm,
                                                    periodEnd: e.target.value,
                                                })
                                            }
                                            className="form-input"
                                        />
                                    </FormField>
                                </div>

                                <FormField label="Amount">
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={draftForm.amount}
                                        onChange={(e) =>
                                            setDraftForm({
                                                ...draftForm,
                                                amount: e.target.value,
                                            })
                                        }
                                        className="form-input"
                                    />
                                </FormField>

                                <FormField label="Due Date">
                                    <input
                                        required
                                        type="date"
                                        value={draftForm.dueDate}
                                        onChange={(e) =>
                                            setDraftForm({
                                                ...draftForm,
                                                dueDate: e.target.value,
                                            })
                                        }
                                        className="form-input"
                                    />
                                </FormField>

                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingDraft(false)}
                                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                                    >
                                        {saving ? "Saving..." : "Save"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* Admin actions */}
                {isAdmin && invoice.status !== "paid" && (
                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-slate-900">
                            Actions
                        </h3>

                        <div className="flex flex-wrap gap-2">
                            {invoice.status === "draft" && (
                                <>
                                    <ActionButton
                                        onClick={() =>
                                            updateStatus("issued")
                                        }
                                        disabled={saving}
                                    >
                                        Issue Invoice
                                    </ActionButton>

                                    <ActionButton
                                        onClick={() => setConfirmingVoid(true)}
                                        disabled={saving}
                                        secondary
                                    >
                                        Void Invoice
                                    </ActionButton>
                                </>
                            )}

                            {invoice.status === "issued" && (
                                <>
                                    <ActionButton
                                        onClick={() =>
                                            updateStatus("paid")
                                        }
                                        disabled={saving}
                                    >
                                        Mark Paid
                                    </ActionButton>

                                    <ActionButton
                                        onClick={() => setConfirmingVoid(true)}
                                        disabled={saving}
                                        secondary
                                    >
                                        Void Invoice
                                    </ActionButton>
                                </>
                            )}
                        </div>
                    </div>      
                )}

                {confirmingVoid && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <p className="mb-2 text-sm font-medium text-red-900">
                            Void this invoice
                        </p>

                        <textarea
                            required
                            rows="2"
                            value={voidReason}
                            onChange={(e) => setVoidReason(e.target.value)}
                            placeholder="Reason for voiding this invoice..."
                            className="form-input mb-3"
                        />

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setConfirmingVoid(false);
                                    setVoidReason("");
                                }}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={() => {
                                    if (!voidReason.trim()) return;
                                    updateStatus("void", voidReason.trim());
                                    setConfirmingVoid(false);
                                    setVoidReason("");
                                }}
                                disabled={saving || !voidReason.trim()}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                            >
                                {saving ? "Voiding..." : "Confirm Void"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Due date */}
                {canEditDueDate && (
                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-slate-900">
                            Due Date
                        </h3>

                        <form
                            onSubmit={updateDueDate}
                            className="flex gap-2"
                        >
                            <input
                                type="date"
                                value={newDueDate}
                                onChange={(e) =>
                                    setNewDueDate(e.target.value)
                                }
                                className="form-input max-w-xs"
                            />

                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Credit notes */}
                {isAdmin && invoice.status === "paid" && (
                    <div>
                        <button
                            onClick={onCreditNote}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Create Credit Note
                        </button>
                    </div>
                )}

                {/* Notes */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">
                        Notes
                    </h3>

                    <form
                        onSubmit={addNote}
                        className="mb-4 flex gap-2"
                    >
                        <input
                            value={newNote}
                            onChange={(e) =>
                                setNewNote(e.target.value)
                            }
                            placeholder="Add a note..."
                            className="form-input flex-1"
                        />

                        <button
                            type="submit"
                            disabled={saving || !newNote.trim()}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                        >
                            Add
                        </button>
                    </form>

                    {notes.length === 0 ? (
                        <p className="text-sm text-slate-500">
                            No notes yet.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {notes.map((note) => (
                                <div
                                    key={note._id}
                                    className="rounded-lg border border-slate-200 p-3"
                                >
                                    <p className="text-sm text-slate-700">
                                        {note.text}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        {note.createdBy?.name ||
                                            "User"}{" "}
                                        ·{" "}
                                        {formatDate(note.createdAt)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status history */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">
                        Status History
                    </h3>

                    {history.length === 0 ? (
                        <p className="text-sm text-slate-500">
                            No status history yet.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {history.map((item) => (
                                <div
                                    key={item._id}
                                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                                >
                                    <div>
                                        <span className="font-medium text-slate-700">
                                            {item.oldStatus || "—"}
                                        </span>

                                        <span className="mx-2 text-slate-400">
                                            →
                                        </span>

                                        <span className="font-medium text-slate-700">
                                            {item.newStatus}
                                        </span>

                                        {item.reason && (
                                        <p className="mt-1 text-xs text-slate-500">
                                            Reason: {item.reason}
                                        </p>
                                    )}
                                    </div>

                                    <div className="text-xs text-slate-400">
                                        {item.changedBy?.name ||
                                            "User"}{" "}
                                        ·{" "}
                                        {formatDate(
                                            item.createdAt
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {error && (
                    <p className="text-sm text-red-600">
                        {error}
                    </p>
                )}
            </div>
        </Modal>
    );
};

/* ============================================================
   CREDIT NOTE MODAL
============================================================ */

const CreditNoteModal = ({
    token,
    invoice,
    onClose,
    onCreated,
}) => {
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            const response = await fetch(
                `http://localhost:5000/api/invoices/${invoice._id}/credit-notes`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        amount: Number(amount),
                        reason: reason.trim(),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to create credit note"
                );
            }

            onCreated();
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal title="Create Credit Note" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Amount">
                    <input
                        required
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={(e) =>
                            setAmount(e.target.value)
                        }
                        className="form-input"
                    />
                </FormField>

                <FormField label="Reason">
                    <textarea
                        required
                        rows="4"
                        value={reason}
                        onChange={(e) =>
                            setReason(e.target.value)
                        }
                        className="form-input"
                        placeholder="Reason for credit note..."
                    />
                </FormField>

                {error && (
                    <p className="text-sm text-red-600">
                        {error}
                    </p>
                )}

                <ModalActions
                    onClose={onClose}
                    saving={saving}
                    submitText="Create Credit Note"
                />
            </form>
        </Modal>
    );
};

/* ============================================================
   BULK GENERATION MODAL
============================================================ */

const BulkGenerationModal = ({
    token,
    onClose,
    onCompleted,
}) => {
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const generateInvoices = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                "http://localhost:5000/api/invoices/generate-current-period",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to generate invoices"
                );
            }

            setResult(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Generate Current Period Invoices"
            onClose={onClose}
        >
            {!result ? (
                <div>
                    <p className="text-sm text-slate-600">
                        Generate invoices for active subscriptions
                        that do not already have an invoice for the
                        current billing period.
                    </p>

                    {error && (
                        <p className="mt-4 text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <div className="mt-6 flex justify-end gap-2">
                        <button
                            onClick={onClose}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={generateInvoices}
                            disabled={loading}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                        >
                            {loading
                                ? "Generating..."
                                : "Generate"}
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="grid grid-cols-3 gap-3">
                        <ResultCard
                            label="Generated"
                            value={
                                result.generated?.length || 0
                            }
                        />

                        <ResultCard
                            label="Skipped"
                            value={
                                result.skipped?.length || 0
                            }
                        />

                        <ResultCard
                            label="Failed"
                            value={
                                result.failed?.length || 0
                            }
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onCompleted}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

/* ============================================================
   SHARED COMPONENTS
============================================================ */

const Modal = ({ title, onClose, children, wide = false }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div
                className={`max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white p-6 shadow-xl ${
                    wide ? "max-w-3xl" : "max-w-lg"
                }`}
            >
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {title}
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-xl text-slate-400 hover:text-slate-700"
                    >
                        ×
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
};

const FormField = ({ label, children }) => {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {label}
            </label>

            {children}
        </div>
    );
};

const ModalActions = ({
    onClose,
    saving,
    submitText,
}) => {
    return (
        <div className="flex justify-end gap-2 pt-2">
            <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
                Cancel
            </button>

            <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
                {saving ? "Saving..." : submitText}
            </button>
        </div>
    );
};

const ActionButton = ({
    children,
    onClick,
    disabled,
    secondary = false,
}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 ${
                secondary
                    ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
        >
            {children}
        </button>
    );
};

const Detail = ({ label, value }) => {
    return (
        <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-medium text-slate-900">
                {value}
            </p>
        </div>
    );
};

const ResultCard = ({ label, value }) => {
    return (
        <div className="rounded-lg border border-slate-200 p-4 text-center">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
                {value}
            </p>
        </div>
    );
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatAmount = (amount) => {
    return `₹${Number(amount).toLocaleString("en-IN")}`;
};

export default Invoices;