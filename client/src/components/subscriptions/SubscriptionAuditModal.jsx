import { useEffect, useState } from "react";
import Modal from "../shared/Modal";
import { apiRequest } from "../../api";
import { formatDateTime } from "../../utils/format";

const actionLabels = {
    created: "Subscription created",
    updated: "Subscription updated",
    archived: "Subscription archived",
    restored: "Subscription restored",
    collaborators_updated: "Collaborators updated"
};

const SubscriptionAuditModal = ({ subscription, token, onClose }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAudit = async () => {
            try {
                const data = await apiRequest(`/subscriptions/${subscription._id}/audit`, { token });
                setEvents(data.events || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAudit();
    }, [subscription._id, token]);

    return (
        <Modal title="Subscription audit history" onClose={onClose} wide>
            <p className="mb-4 text-sm text-slate-500">
                {subscription.customerName} · {subscription.planName}
            </p>

            {loading && <p className="text-sm text-slate-500">Loading audit history...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && events.length === 0 && (
                <p className="text-sm text-slate-500">No audit events yet.</p>
            )}

            {!loading && !error && events.length > 0 && (
                <div className="space-y-4">
                    {events.map((event) => (
                        <div key={event._id} className="relative border-l-2 border-slate-200 pl-6">
                            <div className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-slate-900" />
                            <p className="font-medium text-slate-900">
                                {actionLabels[event.action] || event.action}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                {event.details || "No additional details."}
                            </p>
                            <p className="mt-2 text-xs text-slate-400">
                                {formatDateTime(event.createdAt)} · {event.performedBy?.name || "Unknown user"}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    );
};

export default SubscriptionAuditModal;
