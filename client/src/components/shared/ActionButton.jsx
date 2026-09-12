const ActionButton = ({
    children,
    onClick,
    disabled = false,
    secondary = false,
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 ${
                secondary
                    ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
        >
            {children}
        </button>
    );
};

export default ActionButton;
