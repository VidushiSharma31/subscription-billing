import { useState } from "react";
import Modal from "../shared/Modal";
import FormField from "../shared/FormField";
import ModalActions from "../shared/ModalActions";
import { API_URL } from "../../api";

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

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            const response = await fetch(
                `${API_URL}/invoices/${invoice._id}/credit-notes`,
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
                        onChange={(e) => setAmount(e.target.value)}
                        className="form-input"
                    />
                </FormField>

                <FormField label="Reason">
                    <textarea
                        required
                        rows="4"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="form-input"
                        placeholder="Reason for credit note..."
                    />
                </FormField>

                {error && (
                    <p className="text-sm text-red-600">{error}</p>
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

export default CreditNoteModal;
