import { useEffect, useState } from "react";
import Modal from "../shared/Modal";
import { formatDate } from "../../utils/format";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SubscriptionAuditModal = ({ subscription, token, onClose }) => {
    const [audit, setAudit] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadAudit = async () => {
            try {
                const response = await fetch(`${API_URL}/subscriptions/${subscription._id}/audit`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to load audit history");
                setAudit(data.audit || []);
            } catch (err) {
                setError(err.message);
            }
        };
        loadAudit();
    }, [subscription._id, token]);

    return (
        <Modal title="Subscription Audit" onClose={onClose}>
            <div className="space-y-3">
                {error && <p className="text-sm text-red-600">{error}</p>}
                {audit.length === 0 && !error ? (
                    <p className="text-sm text-slate-500">No audit events yet.</p>
                ) : (
                    audit.map((item) => (
                        <div key={item._id} className="rounded-lg border border-slate-200 p-3">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-medium text-slate-800 capitalize">
                                        {item.action.replaceAll("_", " ")}
                                    </p>
                                    {item.action === "collaborators_updated" && (
                                        <p className="mt-1 text-sm text-slate-500">Collaborator list changed.</p>
                                    )}
                                </div>
                                <div className="text-right text-xs text-slate-400">
                                    <p>{item.changedBy?.name || "User"}</p>
                                    <p>{formatDate(item.createdAt)}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
};

export default SubscriptionAuditModal;