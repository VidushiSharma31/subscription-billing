import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { formatAmount, formatDate } from "../utils/format";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Dashboard = () => {
    const { token, user } = useAuth();
    const [data, setData] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            setError("");
            const [dashboardResponse, alertResponse] = await Promise.all([
                fetch(`${API_URL}/reports/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_URL}/alerts/overdue`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const dashboardData = await dashboardResponse.json();
            const alertData = await alertResponse.json();

            if (!dashboardResponse.ok) {
                throw new Error(dashboardData.message || "Failed to load dashboard");
            }

            if (!alertResponse.ok) {
                throw new Error(alertData.message || "Failed to load alerts");
            }

            setData(dashboardData);
            setAlerts(alertData.alerts || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [token]);

    const maxRevenue = useMemo(
        () => Math.max(...(data?.revenueData || []).map((item) => Number(item.revenue) || 0), 1),
        [data]
    );

    const dismissAlert = async (id) => {
        try {
            const response = await fetch(`${API_URL}/alerts/overdue/${id}/dismiss`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Failed to dismiss alert");
            setAlerts((current) => current.filter((alert) => alert._id !== id));
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <p className="text-sm text-slate-500">Loading dashboard...</p>;

    if (error && !data) {
        return <p className="text-sm text-red-600">{error}</p>;
    }

    const cards = [
        ["Issued this month", data?.issuedThisMonth],
        ["Collected this month", data?.collectedThisMonth],
        ["Receivables", data?.receivables],
        ["Overdue", data?.overdueReceivables]
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Billing Dashboard</h1>
                <p className="mt-1 text-sm text-slate-500">A quick view of billing performance and receivables.</p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {cards.map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">{label}</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">{formatAmount(value)}</p>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="font-semibold text-slate-900">Invoice status breakdown</h2>
                    <div className="mt-4 space-y-3">
                        {(data?.statusBreakdown || []).map((item) => (
                            <div key={item._id} className="flex items-center justify-between text-sm">
                                <span className="capitalize text-slate-600">{item._id}</span>
                                <span className="font-semibold text-slate-900">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="font-semibold text-slate-900">Plan breakdown</h2>
                    <div className="mt-4 space-y-3">
                        {(data?.planBreakdown || []).map((item) => (
                            <div key={item._id} className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">{item._id}</span>
                                <span className="font-semibold text-slate-900">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-slate-900">Collected revenue · last 8 weeks</h2>
                <div className="mt-5 space-y-3">
                    {(data?.revenueData || []).map((item) => (
                        <div key={item._id} className="grid grid-cols-[90px_1fr_100px] items-center gap-3 text-sm">
                            <span className="text-slate-500">{item._id}</span>
                            <div className="h-3 rounded bg-slate-100 overflow-hidden">
                                <div className="h-full rounded bg-slate-700" style={{ width: `${(Number(item.revenue) / maxRevenue) * 100}%` }} />
                            </div>
                            <span className="text-right font-medium text-slate-700">{formatAmount(item.revenue)}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-slate-900">Overdue alerts</h2>
                        <p className="mt-1 text-sm text-slate-500">Unpaid issued invoices past their due date.</p>
                    </div>
                    <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700">{alerts.length}</span>
                </div>

                {alerts.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">No active overdue alerts.</p>
                ) : (
                    <div className="mt-4 space-y-3">
                        {alerts.map((alert) => (
                            <div key={alert._id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/40 p-4">
                                <div>
                                    <p className="font-medium text-slate-900">{alert.invoice.customerName}</p>
                                    <p className="text-sm text-slate-500">
                                        {alert.invoice.planName} · {formatAmount(alert.invoice.amount)} · Due {formatDate(alert.invoice.dueDate)}
                                    </p>
                                </div>
                                {user?.role === "billing_admin" && (
                                    <button onClick={() => dismissAlert(alert._id)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                        Dismiss
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Dashboard;
