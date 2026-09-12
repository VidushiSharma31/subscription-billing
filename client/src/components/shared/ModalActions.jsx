const ModalActions = ({
    onClose,
    saving,
    submitText,
    savingText = "Saving...",
}) => {
    return (
        <div className="flex justify-end gap-2 pt-2">
            <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
                Cancel
            </button>

            <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
                {saving ? savingText : submitText}
            </button>
        </div>
    );
};

export default ModalActions;
