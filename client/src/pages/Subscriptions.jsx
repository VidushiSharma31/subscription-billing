import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const Subscriptions = () => {
    const { token } = useAuth();

    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchSubscriptions = async () => {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/subscriptions",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    setError(
                        data.message ||
                        "Failed to fetch subscriptions"
                    );
                    return;
                }

                setSubscriptions(data.subscriptions);
            } catch (error) {
                setError("Unable to connect to server");
            } finally {
                setLoading(false);
            }
        };

        fetchSubscriptions();
    }, [token]);

    if (loading) {
        return <p>Loading subscriptions...</p>;
    }

    if (error) {
        return (
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Subscriptions
                </h1>

                <p className="text-red-600 mt-4">
                    {error}
                </p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">
                    Subscriptions
                </h1>

                <p className="text-slate-500 mt-1">
                    Manage customer subscriptions
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">
                                Customer
                            </th>

                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">
                                Plan
                            </th>

                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">
                                Billing Cycle
                            </th>

                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">
                                Price
                            </th>

                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">
                                Owner
                            </th>

                            <th className="px-6 py-4 font-semibold text-slate-700"> 
                                Collaborators 
                            </th>

                            <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">
                                Status
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {subscriptions.map((subscription) => (
                            <tr
                                key={subscription._id}
                                className="border-b border-slate-100 last:border-0"
                            >
                                <td className="px-6 py-4">
                                    <p className="font-medium text-slate-900">
                                        {subscription.customerName}
                                    </p>

                                    <p className="text-sm text-slate-500">
                                        {subscription.billingEmail}
                                    </p>
                                </td>

                                <td className="px-6 py-4 text-slate-700">
                                    {subscription.planName}
                                </td>

                                <td className="px-6 py-4 text-slate-700 capitalize">
                                    {subscription.billingCycle}
                                </td>

                                <td className="px-6 py-4 text-slate-700">
                                    ₹{subscription.price}
                                </td>

                                <td className="px-6 py-4 text-slate-700">
                                    {subscription.owner?.name}
                                </td>

                                <td className="px-6 py-4"> 
                                    {subscription.collaborators?.length > 0 ? ( 
                                        <div className="space-y-1"> 
                                            {subscription.collaborators.map( (collaborator) => (
                                                <div key={ collaborator._id } className="text-slate-700" > 
                                                    { collaborator.name } 
                                                </div> 
                                                ))
                                            } 
                                        </div> 
                                    ) : ( <span className="text-slate-400"> — </span> )} 
                                </td>

                                <td className="px-6 py-4">
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                            subscription.status === "active"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-slate-100 text-slate-600"
                                        }`}
                                    >
                                        {subscription.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Subscriptions;