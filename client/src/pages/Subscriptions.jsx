import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api";
import { formatAmount } from "../utils/format";
import SubscriptionAuditModal from "../components/subscriptions/SubscriptionAuditModal";
import SubscriptionFormModal from "../components/subscriptions/SubscriptionFormModal";
import CollaboratorsModal from "../components/subscriptions/CollaboratorsModal";

const Subscriptions = () => {
    const { token, user } = useAuth();
    const isAdmin = user?.role === "billing_admin";

    const [subscriptions, setSubscriptions] = useState([]);
    const [accountManagers, setAccountManagers] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState("");
    const [auditSubscription, setAuditSubscription] = useState(null);
    const [formSubscription, setFormSubscription] = useState(undefined);
    const [collaboratorSubscription, setCollaboratorSubscription] = useState(null);
    const [notice, setNotice] = useState("");

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: String(page),
                limit: "10",
                sortBy: "createdAt",
                sortOrder: "desc"
            });

            if (statusFilter) params.set("status", statusFilter);
            if (search.trim()) params.set("search", search.trim());

            const data = await apiRequest(`/subscriptions?${params.toString()}`, { token });
            setSubscriptions(data.subscriptions || []);
            setPagination(data.pagination || pagination);
            setError("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, [token, page, statusFilter]);

    useEffect(() => {
        const loadManagers = async () => {
            if (!isAdmin) {
                setAccountManagers([]);
                return;
            }

            try {
                const data = await apiRequest("/auth/account-managers", { token });
                setAccountManagers(data.accountManagers || []);
            } catch (err) {
                setError(err.message);
            }
        };

        loadManagers();
    }, [token, isAdmin]);

    const handleArchiveRestore = async (subscription) => {
        const isArchived = subscription.status === "archived";
        const action = isArchived ? "restore" : "archive";

        if (!window.confirm(`Are you sure you want to ${action} this subscription?`)) {
            return;
        }

        try {
            setActionLoading(subscription._id);
            await apiRequest(`/subscriptions/${subscription._id}/${action}`, {
                token,
                method: "PATCH"
            });
            setNotice(isArchived
                ? "Subscription restored. It can generate invoices again."
                : "Subscription archived. Future invoice generation is stopped.");
            await fetchSubscriptions();
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading("");
        }
    };

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
                    <p className="mt-1 text-slate-500">Manage customer subscriptions</p>
                </div>

                <button
                    type="button"
                    onClick={() => setFormSubscription(null)}
                    className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                    Create subscription
                </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-3">
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            setPage(1);
                            fetchSubscriptions();
                        }
                    }}
                    placeholder="Search customer, email, or plan"
                    className="form-input max-w-sm"
                />
                <select
                    value={statusFilter}
                    onChange={(event) => {
                        setPage(1);
                        setStatusFilter(event.target.value);
                    }}
                    className="form-input max-w-xs"
                >
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                </select>
                <button
                    type="button"
                    onClick={() => {
                        setPage(1);
                        fetchSubscriptions();
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                    Search
                </button>
            </div>

            {notice && <p className="mb-4 text-sm text-green-700">{notice}</p>}
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            {loading && <p className="mb-4 text-sm text-slate-500">Loading subscriptions...</p>}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Customer</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Plan</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Cycle</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Price</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Owner</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Collaborators</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Status</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && subscriptions.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="px-6 py-10 text-center text-slate-500">
                                        No subscriptions found.
                                    </td>
                                </tr>
                            )}

                            {subscriptions.map((subscription) => (
                                <tr key={subscription._id} className="border-b border-slate-100 last:border-0">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-900">{subscription.customerName}</p>
                                        <p className="text-sm text-slate-500">{subscription.billingEmail}</p>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">{subscription.planName}</td>
                                    <td className="px-6 py-4 capitalize text-slate-700">{subscription.billingCycle}</td>
                                    <td className="px-6 py-4 text-slate-700">{formatAmount(subscription.price)}</td>
                                    <td className="px-6 py-4 text-slate-700">{subscription.owner?.name}</td>
                                    <td className="px-6 py-4 text-slate-700">
                                        {subscription.collaborators?.length
                                            ? subscription.collaborators.map((item) => item.name).join(", ")
                                            : "—"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                subscription.status === "active"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-slate-100 text-slate-600"
                                            }`}
                                        >
                                            {subscription.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setFormSubscription(subscription)}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAuditSubscription(subscription)}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                            >
                                                Audit
                                            </button>
                                            <Link
                                                to={`/invoices?subscription=${subscription._id}`}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                            >
                                                Invoices
                                            </Link>
                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    onClick={() => setCollaboratorSubscription(subscription)}
                                                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                >
                                                    Collaborators
                                                </button>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleArchiveRestore(subscription)}
                                                    disabled={actionLoading === subscription._id}
                                                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                                >
                                                    {actionLoading === subscription._id
                                                        ? "Saving..."
                                                        : subscription.status === "archived"
                                                            ? "Restore"
                                                            : "Archive"}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={page === 1}
                            onClick={() => setPage((current) => Math.max(current - 1, 1))}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            disabled={page === pagination.totalPages}
                            onClick={() => setPage((current) => current + 1)}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {auditSubscription && (
                <SubscriptionAuditModal
                    subscription={auditSubscription}
                    token={token}
                    onClose={() => setAuditSubscription(null)}
                />
            )}

            {formSubscription !== undefined && (
                <SubscriptionFormModal
                    token={token}
                    user={user}
                    accountManagers={accountManagers}
                    subscription={formSubscription}
                    onClose={() => setFormSubscription(undefined)}
                    onSaved={async () => {
                        setFormSubscription(undefined);
                        setNotice(formSubscription ? "Subscription updated." : "Subscription created.");
                        await fetchSubscriptions();
                    }}
                />
            )}

            {collaboratorSubscription && (
                <CollaboratorsModal
                    token={token}
                    subscription={collaboratorSubscription}
                    accountManagers={accountManagers}
                    onClose={() => setCollaboratorSubscription(null)}
                    onSaved={async () => {
                        setCollaboratorSubscription(null);
                        setNotice("Collaborators updated.");
                        await fetchSubscriptions();
                    }}
                />
            )}
        </div>
    );
};

export default Subscriptions;
