import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api";

const Layout = () => {
    const { user, logout, token } = useAuth();
    const location = useLocation();
    const [overdueCount, setOverdueCount] = useState(0);

    useEffect(() => {
        if (!token) return undefined;

        const loadCount = async () => {
            try {
                const data = await apiRequest("/alerts/overdue/count", { token });
                setOverdueCount(data.count || 0);
            } catch {
                setOverdueCount(0);
            }
        };

        loadCount();
        window.addEventListener("overdue-alerts-changed", loadCount);

        return () => {
            window.removeEventListener("overdue-alerts-changed", loadCount);
        };
    }, [token, location.pathname]);

    const navLinkClass = ({ isActive }) =>
        `block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
        }`;

    return (
        <div className="flex min-h-screen bg-slate-100">
            <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
                <div className="border-b border-slate-200 p-6">
                    <h1 className="text-xl font-bold text-slate-900">Subscription Billing</h1>
                    <p className="mt-1 text-xs text-slate-500">Billing Management</p>
                </div>

                <nav className="space-y-1 p-4">
                    <NavLink to="/dashboard" className={navLinkClass}>
                        <span className="flex items-center justify-between">
                            Dashboard
                            {overdueCount > 0 && (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                                    {overdueCount}
                                </span>
                            )}
                        </span>
                    </NavLink>
                    <NavLink to="/subscriptions" className={navLinkClass}>
                        Subscriptions
                    </NavLink>
                    <NavLink to="/invoices" className={navLinkClass}>
                        Invoices
                    </NavLink>
                </nav>

                <div className="mt-auto border-t border-slate-200 p-4">
                    <div className="mb-3">
                        <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                            {user?.role === "billing_admin" ? "Billing Admin" : "Account Manager"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={logout}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-x-auto p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
