const Detail = ({ label, value }) => {
    return (
        <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-medium text-slate-900">
                {value}
            </p>
        </div>
    );
};

export default Detail;
