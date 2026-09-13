import { useState } from "react";
import Modal from "../shared/Modal";
import FormField from "../shared/FormField";
import ModalActions from "../shared/ModalActions";
import { apiRequest } from "../../api";

const emptyForm = {
    customerName: "",
    billingEmail: "",
    planName: "",
    billingCycle: "monthly",
    price: "",
    startDate: "",
    owner: ""
};

const toForm = (subscription) => ({
    customerName: subscription.customerName || "",
    billingEmail: subscription.billingEmail || "",
    planName: subscription.planName || "",
    billingCycle: subscription.billingCycle || "monthly",
    price: subscription.price ?? "",
    startDate: subscription.startDate ? subscription.startDate.slice(0, 10) : "",
    owner: subscription.owner?._id || subscription.owner || ""
});

const SubscriptionFormModal = ({
    token,
    user,
    accountManagers,
    subscription,
    onClose,
    onSaved
}) => {
    const isEdit = Boolean(subscription);
    const isAdmin = user?.role === "billing_admin";
    const [form, setForm] = useState(isEdit ? toForm(subscription) : emptyForm);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            const payload = {
                customerName: form.customerName.trim(),
                billingEmail: form.billingEmail.trim(),
                planName: form.planName.trim(),
                billingCycle: form.billingCycle,
                price: Number(form.price),
                startDate: form.startDate
            };

            if (!isEdit && isAdmin) {
                payload.owner = form.owner;
            }

            await apiRequest(
                isEdit ? `/subscriptions/${subscription._id}` : "/subscriptions",
                {
                    token,
                    method: isEdit ? "PUT" : "POST",
                    body: payload
                }
            );

            onSaved();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal title={isEdit ? "Edit Subscription" : "Create Subscription"} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Customer name">
                    <input
                        required
                        value={form.customerName}
                        onChange={(event) => updateField("customerName", event.target.value)}
                        className="form-input"
                    />
                </FormField>

                <FormField label="Billing email">
                    <input
                        required
                        type="email"
                        value={form.billingEmail}
                        onChange={(event) => updateField("billingEmail", event.target.value)}
                        className="form-input"
                    />
                </FormField>

                <FormField label="Plan name">
                    <input
                        required
                        value={form.planName}
                        onChange={(event) => updateField("planName", event.target.value)}
                        className="form-input"
                    />
                </FormField>

                <FormField label="Billing cycle">
                    <select
                        value={form.billingCycle}
                        onChange={(event) => updateField("billingCycle", event.target.value)}
                        className="form-input"
                    >
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                    </select>
                </FormField>

                <FormField label="Price">
                    <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={(event) => updateField("price", event.target.value)}
                        className="form-input"
                    />
                </FormField>

                <FormField label="Start date">
                    <input
                        required
                        type="date"
                        value={form.startDate}
                        onChange={(event) => updateField("startDate", event.target.value)}
                        className="form-input"
                    />
                </FormField>

                {!isEdit && isAdmin && (
                    <FormField label="Owning account manager">
                        <select
                            required
                            value={form.owner}
                            onChange={(event) => updateField("owner", event.target.value)}
                            className="form-input"
                        >
                            <option value="">Select owner</option>
                            {accountManagers.map((manager) => (
                                <option key={manager._id} value={manager._id}>
                                    {manager.name}
                                </option>
                            ))}
                        </select>
                    </FormField>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}

                <ModalActions
                    onClose={onClose}
                    saving={saving}
                    submitText={isEdit ? "Save changes" : "Create subscription"}
                />
            </form>
        </Modal>
    );
};

export default SubscriptionFormModal;
