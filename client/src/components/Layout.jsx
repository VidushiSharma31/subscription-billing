import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Layout = () => {
    const { user, logout } = useAuth();

    const navLinkClass = ({ isActive }) =>
        `block px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            isActive
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
        }`;

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 border-b border-slate-200">
                    <h1 className="text-xl font-bold text-slate-900">
                        Subscription Billing
                    </h1>

                    <p className="text-xs text-slate-500 mt-1">
                        Billing Management
                    </p>
                </div>

                <nav className="p-4 space-y-1">
                    <NavLink
                        to="/dashboard"
                        className={navLinkClass}
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/subscriptions"
                        className={navLinkClass}
                    >
                        Subscriptions
                    </NavLink>

                    <NavLink
                        to="/invoices"
                        className={navLinkClass}
                    >
                        Invoices
                    </NavLink>
                </nav>

                <div className="mt-auto p-4 border-t border-slate-200">
                    <div className="mb-3">
                        <p className="text-sm font-medium text-slate-900">
                            {user?.name}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                            {user?.role === "billing_admin"
                                ? "Billing Admin"
                                : "Account Manager"}
                        </p>
                    </div>

                    <button
                        onClick={logout}
                        className="w-full border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;