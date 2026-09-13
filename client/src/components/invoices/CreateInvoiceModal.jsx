import { useState } from "react";
import Modal from "../shared/Modal";
import FormField from "../shared/FormField";
import ModalActions from "../shared/ModalActions";
import { API_URL } from "../../api";

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

    const updateField = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            const response = await fetch(`${API_URL}/invoices`, {
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
            });

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
                            updateField("subscription", e.target.value)
                        }
                        className="form-input"
                    >
                        <option value="">Select subscription</option>

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
                                updateField("periodStart", e.target.value)
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
                                updateField("periodEnd", e.target.value)
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
                            updateField("amount", e.target.value)
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
                            updateField("dueDate", e.target.value)
                        }
                        className="form-input"
                    />
                </FormField>

                {error && (
                    <p className="text-sm text-red-600">{error}</p>
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

export default CreateInvoiceModal;
