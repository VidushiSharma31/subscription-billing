import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Welcome back
                            </p>

                            <h1 className="text-3xl font-bold text-slate-900 mt-1">
                                {user?.name}
                            </h1>

                            <p className="text-slate-500 mt-2">
                                Role: {user?.role}
                            </p>
                        </div>

                        <button
                            onClick={logout}
                            className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;