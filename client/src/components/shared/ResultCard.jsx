const ResultCard = ({ label, value }) => {
    return (
        <div className="rounded-lg border border-slate-200 p-4 text-center">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
                {value}
            </p>
        </div>
    );
};

export default ResultCard;
