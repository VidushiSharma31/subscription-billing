import {
    useCallback,
    useEffect,
    useState
} from "react";
import { useSearchParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import InvoiceTable from "../components/invoices/InvoiceTable";
import InvoiceFilters from "../components/invoices/InvoiceFilters";
import CreateInvoiceModal from "../components/invoices/CreateInvoiceModal";
import InvoiceDetailsModal from "../components/invoices/InvoiceDetailsModal";
import CreditNoteModal from "../components/invoices/CreditNoteModal";
import BulkGenerateModal from "../components/invoices/BulkGenerateModal";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

const Invoices = () => {
    const {
        token,
        user
    } = useAuth();

    const [searchParams] = useSearchParams();


    /* -----------------------------
       Data
    ----------------------------- */

    const [invoices, setInvoices] =
        useState([]);

    const [subscriptions, setSubscriptions] =
        useState([]);

    const [accountManagers, setAccountManagers] =
        useState([]);


    /* -----------------------------
       Filters
    ----------------------------- */

    const [search, setSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("");

    const [overdueFilter, setOverdueFilter] =
        useState("");

    const [ownerFilter, setOwnerFilter] =
        useState("");

    const [subscriptionFilter, setSubscriptionFilter] =
        useState(searchParams.get("subscription") || "");


    /* -----------------------------
       Sorting
    ----------------------------- */

    const [sortBy, setSortBy] =
        useState("createdAt");

    const [sortOrder, setSortOrder] =
        useState("desc");


    /* -----------------------------
       Pagination
    ----------------------------- */

    const [page, setPage] =
        useState(1);

    const [pagination, setPagination] =
        useState({
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
        });


    /* -----------------------------
       UI state
    ----------------------------- */

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [selectedInvoice, setSelectedInvoice] =
        useState(null);

    const [showCreateModal, setShowCreateModal] =
        useState(false);

    const [showCreditModal, setShowCreditModal] =
        useState(false);

    const [showBulkModal, setShowBulkModal] =
        useState(false);


    const isAdmin =
        user?.role === "billing_admin";

    const exportReceivables = async () => {
        try {
            const response = await fetch(`${API_URL}/reports/receivables/export`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to export receivables");
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "receivables.csv";
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            setError(error.message);
        }
    };


    /* -----------------------------
       Fetch subscriptions
    ----------------------------- */

    const fetchSubscriptions =
        useCallback(async () => {
            try {
                const response =
                    await fetch(
                        `${API_URL}/subscriptions?limit=100`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Failed to fetch subscriptions"
                    );
                }

                setSubscriptions(
                    data.subscriptions || []
                );
            } catch (error) {
                setError(error.message);
            }
        }, [token]);


    /* -----------------------------
       Fetch account managers
    ----------------------------- */

    const fetchAccountManagers =
        useCallback(async () => {
            /*
             * Only Billing Admins need the
             * complete list of account managers.
             *
             * Account Managers cannot select
             * another manager as an owner filter.
             */
            if (!isAdmin) {
                setAccountManagers([]);
                return;
            }

            try {
                const response =
                    await fetch(
                        `${API_URL}/auth/account-managers`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Failed to fetch account managers"
                    );
                }

                setAccountManagers(
                    data.accountManagers || []
                );
            } catch (error) {
                setError(error.message);
            }
        }, [token, isAdmin]);


    /* -----------------------------
       Fetch invoices
    ----------------------------- */

    const fetchInvoices =
        useCallback(async () => {
            try {
                setLoading(true);
                setError("");

                const params =
                    new URLSearchParams();


                if (search.trim()) {
                    params.append(
                        "search",
                        search.trim()
                    );
                }


                if (statusFilter) {
                    params.append(
                        "status",
                        statusFilter
                    );
                }


                if (overdueFilter) {
                    params.append(
                        "overdue",
                        overdueFilter
                    );
                }


                if (ownerFilter) {
                    params.append(
                        "owner",
                        ownerFilter
                    );
                }


                if (subscriptionFilter) {
                    params.append(
                        "subscription",
                        subscriptionFilter
                    );
                }


                params.append(
                    "sortBy",
                    sortBy
                );

                params.append(
                    "sortOrder",
                    sortOrder
                );

                params.append(
                    "page",
                    page
                );

                params.append(
                    "limit",
                    10
                );


                const response =
                    await fetch(
                        `${API_URL}/invoices?${params.toString()}`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Failed to fetch invoices"
                    );
                }


                setInvoices(
                    data.invoices || []
                );


                setPagination(
                    data.pagination || {
                        page,
                        limit: 10,
                        total: 0,
                        totalPages: 0
                    }
                );
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }, [
            token,
            search,
            statusFilter,
            overdueFilter,
            ownerFilter,
            subscriptionFilter,
            sortBy,
            sortOrder,
            page
        ]);


    /* -----------------------------
       Initial data
    ----------------------------- */

    useEffect(() => {
        fetchSubscriptions();
    }, [
        fetchSubscriptions
    ]);


    useEffect(() => {
        fetchAccountManagers();
    }, [
        fetchAccountManagers
    ]);


    /* -----------------------------
       Reset pagination whenever
       filters change.
    ----------------------------- */

    useEffect(() => {
        setPage(1);
    }, [
        search,
        statusFilter,
        overdueFilter,
        ownerFilter,
        subscriptionFilter,
        sortBy,
        sortOrder
    ]);


    /* -----------------------------
       Fetch invoices whenever
       filters / page change.
    ----------------------------- */

    useEffect(() => {
        fetchInvoices();
    }, [
        fetchInvoices
    ]);


    /* -----------------------------
       Refresh invoice list
    ----------------------------- */

    const refreshInvoices =
        async () => {
            await fetchInvoices();
        };


    /* -----------------------------
       Refresh selected invoice
    ----------------------------- */

    const refreshSelectedInvoice =
        async () => {
            if (!selectedInvoice) {
                return;
            }

            const response =
                await fetch(
                    `${API_URL}/invoices/${selectedInvoice._id}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            if (response.ok) {
                const data =
                    await response.json();

                setSelectedInvoice(
                    data.invoice || data
                );
            }
        };


    /* -----------------------------
       Clear filters
    ----------------------------- */

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("");
        setOverdueFilter("");
        setOwnerFilter("");
        setSubscriptionFilter("");
    };


    const hasFilters =
        Boolean(search.trim()) ||
        Boolean(statusFilter) ||
        Boolean(overdueFilter) ||
        Boolean(ownerFilter) ||
        Boolean(subscriptionFilter);


    return (
        <div>

            {/* Page heading */}

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

                    <button
                        type="button"
                        onClick={exportReceivables}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Export Receivables CSV
                    </button>

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() =>
                                setShowBulkModal(true)
                            }
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Generate Current Period
                        </button>
                    )}


                    <button
                        type="button"
                        onClick={() =>
                            setShowCreateModal(true)
                        }
                        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        Create Invoice
                    </button>

                </div>
            </div>


            {/* Filters */}

            <InvoiceFilters
                search={search}
                statusFilter={statusFilter}
                overdueFilter={overdueFilter}
                ownerFilter={ownerFilter}
                subscriptionFilter={
                    subscriptionFilter
                }
                accountManagers={
                    accountManagers
                }
                subscriptions={
                    subscriptions
                }
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSearchChange={setSearch}
                onStatusChange={
                    setStatusFilter
                }
                onOverdueChange={
                    setOverdueFilter
                }
                onOwnerChange={
                    setOwnerFilter
                }
                onSubscriptionChange={
                    setSubscriptionFilter
                }
                onSortChange={setSortBy}
                onToggleSort={() =>
                    setSortOrder(
                        (current) =>
                            current === "asc"
                                ? "desc"
                                : "asc"
                    )
                }
                onClear={clearFilters}
                hasFilters={hasFilters}
            />


            {/* Result count */}

            <p className="mb-4 text-sm text-slate-500">
                {pagination.total}{" "}
                {
                    pagination.total === 1
                        ? "invoice"
                        : "invoices"
                }
            </p>


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


            {/* Invoice table */}

            <InvoiceTable
                invoices={invoices}
                onSelect={
                    setSelectedInvoice
                }
            />


            {/* Pagination */}

            {pagination.totalPages > 0 && (
                <div className="mt-4 flex items-center justify-between">

                    <p className="text-sm text-slate-500">
                        Page{" "}
                        {pagination.page}{" "}
                        of{" "}
                        {pagination.totalPages}
                    </p>


                    <div className="flex gap-2">

                        <button
                            type="button"
                            onClick={() =>
                                setPage(
                                    (current) =>
                                        Math.max(
                                            current - 1,
                                            1
                                        )
                                )
                            }
                            disabled={
                                page === 1
                            }
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>


                        <button
                            type="button"
                            onClick={() =>
                                setPage(
                                    (current) =>
                                        Math.min(
                                            current + 1,
                                            pagination.totalPages
                                        )
                                )
                            }
                            disabled={
                                page ===
                                pagination.totalPages
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
                    subscriptions={
                        subscriptions
                    }
                    onClose={() =>
                        setShowCreateModal(false)
                    }
                    onCreated={async () => {
                        setShowCreateModal(false);
                        await refreshInvoices();
                    }}
                />
            )}


            {/* Invoice Details */}

            {selectedInvoice && (
                <InvoiceDetailsModal
                    invoice={
                        selectedInvoice
                    }
                    token={token}
                    isAdmin={isAdmin}
                    onClose={() => {
                        setSelectedInvoice(
                            null
                        );

                        setShowCreditModal(
                            false
                        );
                    }}
                    onUpdated={async () => {
                        await refreshInvoices();
                        await refreshSelectedInvoice();
                    }}
                    onCreditNote={() =>
                        setShowCreditModal(
                            true
                        )
                    }
                />
            )}


            {/* Credit Note */}

            {showCreditModal &&
                selectedInvoice && (
                    <CreditNoteModal
                        token={token}
                        invoice={
                            selectedInvoice
                        }
                        onClose={() =>
                            setShowCreditModal(
                                false
                            )
                        }
                        onCreated={async () => {
                            setShowCreditModal(
                                false
                            );

                            await refreshInvoices();
                            await refreshSelectedInvoice();
                        }}
                    />
                )}


            {/* Bulk Generate */}

            {showBulkModal && (
                <BulkGenerateModal
                    token={token}
                    onClose={() =>
                        setShowBulkModal(false)
                    }
                    onCompleted={async () => {
                        setShowBulkModal(false);
                        await refreshInvoices();
                    }}
                />
            )}

        </div>
    );
};

export default Invoices;