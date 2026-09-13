import { useMemo, useState } from "react";
import Modal from "../shared/Modal";
import ModalActions from "../shared/ModalActions";
import { apiRequest } from "../../api";

const CollaboratorsModal = ({
    token,
    subscription,
    accountManagers,
    onClose,
    onSaved
}) => {
    const ownerId = subscription.owner?._id || subscription.owner;
    const managers = accountManagers.filter((manager) => manager._id !== ownerId);
    const [selected, setSelected] = useState(
        (subscription.collaborators || []).map((item) => item._id || item)
    );
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const selectedSet = useMemo(() => new Set(selected), [selected]);

    const toggle = (id) => {
        setSelected((current) => (
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id]
        ));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            await apiRequest(`/subscriptions/${subscription._id}/collaborators`, {
                token,
                method: "PATCH",
                body: { collaboratorIds: selected }
            });

            onSaved();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal title="Manage collaborators" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-slate-600">
                    Only billing admins can add or remove account managers as collaborators.
                    The owner cannot also be a collaborator.
                </p>

                {managers.length === 0 ? (
                    <p className="text-sm text-slate-500">No other account managers available.</p>
                ) : (
                    <div className="space-y-2">
                        {managers.map((manager) => (
                            <label
                                key={manager._id}
                                className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedSet.has(manager._id)}
                                    onChange={() => toggle(manager._id)}
                                />
                                <span>
                                    <span className="block text-sm font-medium text-slate-900">
                                        {manager.name}
                                    </span>
                                    <span className="block text-xs text-slate-500">
                                        {manager.email}
                                    </span>
                                </span>
                            </label>
                        ))}
                    </div>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}

                <ModalActions
                    onClose={onClose}
                    saving={saving}
                    submitText="Save collaborators"
                />
            </form>
        </Modal>
    );
};

export default CollaboratorsModal;
