const Modal = ({ title, onClose, children, wide = false }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div
                className={`max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white p-6 shadow-xl ${
                    wide ? "max-w-3xl" : "max-w-lg"
                }`}
            >
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {title}
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="text-xl text-slate-400 hover:text-slate-700"
                    >
                        ×
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
};

export default Modal;
