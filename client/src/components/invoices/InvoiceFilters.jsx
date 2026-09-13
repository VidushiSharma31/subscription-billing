const InvoiceFilters = ({
    search,
    statusFilter,
    overdueFilter,
    ownerFilter,
    subscriptionFilter,
    accountManagers,
    subscriptions,
    sortBy,
    sortOrder,
    onSearchChange,
    onStatusChange,
    onOverdueChange,
    onOwnerChange,
    onSubscriptionChange,
    onSortChange,
    onToggleSort,
    onClear,
    hasFilters
}) => {
    return (
        <>
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">

                    {/* Search */}
                    <div className="min-w-[240px] flex-1">
                        <input
                            type="text"
                            placeholder="Search customer, email, or plan..."
                            value={search}
                            onChange={(e) =>
                                onSearchChange(
                                    e.target.value
                                )
                            }
                            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
                        />
                    </div>


                    {/* Status */}
                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            onStatusChange(
                                e.target.value
                            )
                        }
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-500"
                    >
                        <option value="">
                            All Statuses
                        </option>

                        <option value="draft">
                            Draft
                        </option>

                        <option value="issued">
                            Issued
                        </option>

                        <option value="paid">
                            Paid
                        </option>

                        <option value="void">
                            Void
                        </option>
                    </select>


                    {/* Overdue */}
                    <select
                        value={overdueFilter}
                        onChange={(e) =>
                            onOverdueChange(
                                e.target.value
                            )
                        }
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-500"
                    >
                        <option value="">
                            All Invoices
                        </option>

                        <option value="true">
                            Overdue
                        </option>

                        <option value="false">
                            Not Overdue
                        </option>
                    </select>


                    {/* Owner */}
                    <select
                        value={ownerFilter}
                        onChange={(e) =>
                            onOwnerChange(
                                e.target.value
                            )
                        }
                        className="max-w-[250px] rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-500"
                    >
                        <option value="">
                            All Account Managers
                        </option>

                        {accountManagers.map(
                            (manager) => (
                                <option
                                    key={manager._id}
                                    value={manager._id}
                                >
                                    {manager.name}
                                </option>
                            )
                        )}
                    </select>


                    {/* Subscription */}
                    <select
                        value={
                            subscriptionFilter
                        }
                        onChange={(e) =>
                            onSubscriptionChange(
                                e.target.value
                            )
                        }
                        className="max-w-[250px] rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-500"
                    >
                        <option value="">
                            All Subscriptions
                        </option>

                        {subscriptions.map(
                            (subscription) => (
                                <option
                                    key={
                                        subscription._id
                                    }
                                    value={
                                        subscription._id
                                    }
                                >
                                    {
                                        subscription.customerName
                                    }{" "}
                                    —{" "}
                                    {
                                        subscription.planName
                                    }
                                </option>
                            )
                        )}
                    </select>


                    {/* Clear */}
                    {hasFilters && (
                        <button
                            type="button"
                            onClick={onClear}
                            className="px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            </div>


            {/* Sorting */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">

                    <span className="text-sm text-slate-500">
                        Sort by
                    </span>

                    <select
                        value={sortBy}
                        onChange={(e) =>
                            onSortChange(
                                e.target.value
                            )
                        }
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
                    >
                        <option value="createdAt">
                            Created Date
                        </option>

                        <option value="dueDate">
                            Due Date
                        </option>

                        <option value="amount">
                            Amount
                        </option>

                        <option value="periodStart">
                            Period Start
                        </option>

                        <option value="periodEnd">
                            Period End
                        </option>

                        <option value="status">
                            Status
                        </option>
                    </select>


                    <button
                        type="button"
                        onClick={onToggleSort}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
                    >
                        {sortOrder === "asc"
                            ? "↑ Asc"
                            : "↓ Desc"}
                    </button>
                </div>
            </div>
        </>
    );
};

export default InvoiceFilters;