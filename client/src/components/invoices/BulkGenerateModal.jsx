import { useMemo, useState } from "react";
import Modal from "../shared/Modal";
import ResultCard from "../shared/ResultCard";
import { API_URL } from "../../api";

const BulkGenerateModal = ({
    token,
    onClose,
    onCompleted,
}) => {
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const summary = useMemo(() => {
        const results = result?.results || [];

        return {
            generated: results.filter(
                (item) => item.status === "generated"
            ).length,
            skipped: results.filter(
                (item) => item.status === "skipped"
            ).length,
            failed: results.filter(
                (item) => item.status === "failed"
            ).length,
        };
    }, [result]);

    const generateInvoices = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/invoices/generate-current-period`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to generate invoices"
                );
            }

            setResult(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Generate Current Period Invoices"
            onClose={onClose}
        >
            {!result ? (
                <div>
                    <p className="text-sm text-slate-600">
                        Generate invoices for active subscriptions that
                        do not already have an invoice for the current
                        billing period.
                    </p>

                    {error && (
                        <p className="mt-4 text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <div className="mt-6 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={generateInvoices}
                            disabled={loading}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                        >
                            {loading ? "Generating..." : "Generate"}
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="grid grid-cols-3 gap-3">
                        <ResultCard
                            label="Generated"
                            value={summary.generated}
                        />
                        <ResultCard
                            label="Skipped"
                            value={summary.skipped}
                        />
                        <ResultCard
                            label="Failed"
                            value={summary.failed}
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={onCompleted}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default BulkGenerateModal;
