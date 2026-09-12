const FormField = ({ label, children }) => {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {label}
            </label>
            {children}
        </div>
    );
};

export default FormField;
