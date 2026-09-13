import { useEffect, useState } from "react";
import Modal from "../shared/Modal";
import FormField from "../shared/FormField";
import ActionButton from "../shared/ActionButton";
import Detail from "../shared/Detail";
import { API_URL } from "../../api";
import { formatAmount, formatDate } from "../../utils/format";

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
    const [timeline, setTimeline] = useState([]);
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
            setError("");

            const [historyResponse, notesResponse, timelineResponse] = await Promise.all([
                fetch(`${API_URL}/invoices/${invoice._id}/history`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/invoices/${invoice._id}/notes`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/invoices/${invoice._id}/timeline`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const historyData = await historyResponse.json();
            const notesData = await notesResponse.json();
            const timelineData = await timelineResponse.json();

            if (!historyResponse.ok) {
                throw new Error(
                    historyData.message || "Failed to load invoice history"
                );
            }

            if (!notesResponse.ok) {
                throw new Error(notesData.message || "Failed to load invoice notes");
            }
            if (!timelineResponse.ok) {
                throw new Error(timelineData.message || "Failed to load invoice timeline");
            }

            setHistory(historyData.history || []);
            setNotes(notesData.notes || []);
            setTimeline(timelineData.timeline || []);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [invoice._id, token]);

    const updateStatus = async (status, reason) => {
        try {
            setSaving(true);
            setError("");

            const response = await fetch(
                `${API_URL}/invoices/${invoice._id}/status`,
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

    const updateDueDate = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            const response = await fetch(
                `${API_URL}/invoices/${invoice._id}/due-date`,
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

    const saveDraftEdit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            const response = await fetch(
                `${API_URL}/invoices/${invoice._id}`,
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

    const addNote = async (event) => {
        event.preventDefault();

        if (!newNote.trim()) return;

        try {
            setSaving(true);
            setError("");

            const response = await fetch(
                `${API_URL}/invoices/${invoice._id}/notes`,
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

    const canEditDueDate =
        invoice.status === "draft" || invoice.status === "issued";

    return (
        <Modal
            title={`Invoice ${invoice._id.slice(-8)}`}
            onClose={onClose}
            wide
        >
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4">
                    <Detail
                        label="Customer"
                        value={invoice.subscription?.customerName || "—"}
                    />
                    <Detail
                        label="Plan"
                        value={invoice.subscription?.planName || "—"}
                    />
                    <Detail
                        label="Billing Period"
                        value={`${formatDate(
                            invoice.periodStart
                        )} - ${formatDate(invoice.periodEnd)}`}
                    />
                    <Detail
                        label="Amount"
                        value={formatAmount(invoice.amount)}
                    />
                    <Detail label="Status" value={invoice.status} />
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
                                    type="button"
                                    onClick={() => setEditingDraft(true)}
                                    className="text-sm font-medium text-slate-700 underline"
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        {editingDraft && (
                            <form
                                onSubmit={saveDraftEdit}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Period Start">
                                        <input
                                            required
                                            type="date"
                                            value={draftForm.periodStart}
                                            onChange={(e) =>
                                                setDraftForm((current) => ({
                                                    ...current,
                                                    periodStart: e.target.value,
                                                }))
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
                                                setDraftForm((current) => ({
                                                    ...current,
                                                    periodEnd: e.target.value,
                                                }))
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
                                            setDraftForm((current) => ({
                                                ...current,
                                                amount: e.target.value,
                                            }))
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
                                            setDraftForm((current) => ({
                                                ...current,
                                                dueDate: e.target.value,
                                            }))
                                        }
                                        className="form-input"
                                    />
                                </FormField>

                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditingDraft(false)
                                        }
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

                {isAdmin && invoice.status !== "paid" && invoice.status !== "void" && (
                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-slate-900">
                            Actions
                        </h3>

                        <div className="flex flex-wrap gap-2">
                            {invoice.status === "draft" && (
                                <ActionButton
                                    onClick={() => updateStatus("issued")}
                                    disabled={saving}
                                >
                                    Issue Invoice
                                </ActionButton>
                            )}

                            {invoice.status === "issued" && (
                                <ActionButton
                                    onClick={() => updateStatus("paid")}
                                    disabled={saving}
                                >
                                    Mark Paid
                                </ActionButton>
                            )}

                            <ActionButton
                                onClick={() => setConfirmingVoid(true)}
                                disabled={saving}
                                secondary
                            >
                                Void Invoice
                            </ActionButton>
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
                                type="button"
                                onClick={() => {
                                    setConfirmingVoid(false);
                                    setVoidReason("");
                                }}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (!voidReason.trim()) return;

                                    updateStatus(
                                        "void",
                                        voidReason.trim()
                                    );

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
                                required
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

                {isAdmin && invoice.status === "paid" && (
                    <div>
                        <button
                            type="button"
                            onClick={onCreditNote}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Create Credit Note
                        </button>
                    </div>
                )}

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
                            onChange={(e) => setNewNote(e.target.value)}
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
                                        {note.createdBy?.name || "User"} ·{" "}
                                        {formatDate(note.createdAt)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">
                        Unified Timeline
                    </h3>

                    {timeline.length === 0 ? (
                        <p className="text-sm text-slate-500">No timeline events yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {timeline.map((item) => (
                                <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-medium text-slate-800 capitalize">
                                                {item.type.replace("_", " ")}
                                            </p>
                                            {item.type === "created" && (
                                                <p className="mt-1 text-sm text-slate-600">Invoice created as draft.</p>
                                            )}
                                            {item.type === "status_change" && (
                                                <p className="mt-1 text-sm text-slate-600">
                                                    {item.details.oldStatus} → {item.details.newStatus}
                                                    {item.details.reason ? ` · ${item.details.reason}` : ""}
                                                </p>
                                            )}
                                            {item.type === "note" && (
                                                <p className="mt-1 text-sm text-slate-600">{item.details.text}</p>
                                            )}
                                            {item.type === "credit_note" && (
                                                <p className="mt-1 text-sm text-slate-600">
                                                    {formatAmount(item.details.amount)} · {item.details.reason}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right text-xs text-slate-400">
                                            <p>{item.user?.name || "User"}</p>
                                            <p>{formatDate(item.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {error && (
                    <p className="text-sm text-red-600">{error}</p>
                )}
            </div>
        </Modal>
    );
};

export default InvoiceDetailsModal;