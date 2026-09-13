import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:5000/api";

const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    });
};

const actionLabels = {
    created: "Subscription created",
    updated: "Subscription updated",
    archived: "Subscription archived",
    restored: "Subscription restored",
    collaborators_updated: "Collaborators updated"
};

const AuditModal = ({ subscription, token, onClose }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAudit = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/subscriptions/${subscription._id}/audit`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    setError(data.message || "Failed to load audit history");
                    return;
                }

                setEvents(data.events || []);
            } catch (error) {
                setError("Unable to connect to server");
            } finally {
                setLoading(false);
            }
        };

        fetchAudit();
    }, [subscription._id, token]);

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Subscription Audit History
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {subscription.customerName} · {subscription.planName}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-900 text-xl"
                    >
                        ×
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    {loading && (
                        <p className="text-slate-500">Loading audit history...</p>
                    )}

                    {error && (
                        <p className="text-red-600">{error}</p>
                    )}

                    {!loading && !error && events.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-slate-500">No events to audit yet.</p>
                            <p className="text-sm text-slate-400 mt-1">
                                New subscription actions will appear here.
                            </p>
                        </div>
                    )}

                    {!loading && !error && events.length > 0 && (
                        <div className="space-y-5">
                            {events.map((event) => (
                                <div
                                    key={event._id}
                                    className="relative pl-6 border-l-2 border-slate-200"
                                >
                                    <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-slate-900" />

                                    <p className="font-medium text-slate-900">
                                        {actionLabels[event.action] || event.action}
                                    </p>

                                    <p className="text-sm text-slate-500 mt-1">
                                        {event.details || "No additional details."}
                                    </p>

                                    <p className="text-xs text-slate-400 mt-2">
                                        {formatDate(event.createdAt)} · by {event.performedBy?.name || "Unknown user"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const Subscriptions = () => {
    const { token, user } = useAuth();

    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState("");
    const [auditSubscription, setAuditSubscription] = useState(null);

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/subscriptions`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Failed to fetch subscriptions");
                return;
            }

            setSubscriptions(data.subscriptions || []);
            setError("");
        } catch (error) {
            setError("Unable to connect to server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, [token]);

    const handleArchiveRestore = async (subscription) => {
        const isArchived = subscription.status === "archived";
        const action = isArchived ? "restore" : "archive";
        const actionLabel = isArchived ? "restore" : "archive";

        if (!window.confirm(`Are you sure you want to ${actionLabel} this subscription?`)) {
            return;
        }

        try {
            setActionLoading(subscription._id);

            const response = await fetch(
                `${API_URL}/subscriptions/${subscription._id}/${action}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || `Failed to ${actionLabel} subscription`);
                return;
            }

            await fetchSubscriptions();
        } catch (error) {
            alert("Unable to connect to server");
        } finally {
            setActionLoading("");
        }
    };

    if (loading) {
        return <p>Loading subscriptions...</p>;
    }

    if (error) {
        return (
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Subscriptions
                </h1>
                <p className="text-red-600 mt-4">{error}</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">
                    Subscriptions
                </h1>
                <p className="text-slate-500 mt-1">
                    Manage customer subscriptions
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Customer</th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Plan</th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Billing Cycle</th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Price</th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Owner</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Collaborators</th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Status</th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {subscriptions.map((subscription) => (
                            <tr
                                key={subscription._id}
                                className="border-b border-slate-100 last:border-0"
                            >
                                <td className="px-6 py-4">
                                    <p className="font-medium text-slate-900">{subscription.customerName}</p>
                                    <p className="text-sm text-slate-500">{subscription.billingEmail}</p>
                                </td>

                                <td className="px-6 py-4 text-slate-700">{subscription.planName}</td>
                                <td className="px-6 py-4 text-slate-700 capitalize">{subscription.billingCycle}</td>
                                <td className="px-6 py-4 text-slate-700">₹{subscription.price}</td>
                                <td className="px-6 py-4 text-slate-700">{subscription.owner?.name}</td>

                                <td className="px-6 py-4">
                                    {subscription.collaborators?.length > 0 ? (
                                        <div className="space-y-1">
                                            {subscription.collaborators.map((collaborator) => (
                                                <div key={collaborator._id} className="text-slate-700">
                                                    {collaborator.name}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">—</span>
                                    )}
                                </td>

                                <td className="px-6 py-4">
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
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
                                            onClick={() => setAuditSubscription(subscription)}
                                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                        >
                                            Audit
                                        </button>

                                        {user?.role === "billing_admin" && (
                                            <button
                                                onClick={() => handleArchiveRestore(subscription)}
                                                disabled={actionLoading === subscription._id}
                                                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
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

            {auditSubscription && (
                <AuditModal
                    subscription={auditSubscription}
                    token={token}
                    onClose={() => setAuditSubscription(null)}
                />
            )}
        </div>
    );
};

export default Subscriptions;