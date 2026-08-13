function PurchaseDateFilter({
  from,
  to,
  onFromChange,
  onToChange,
  onApply,
  onClear,
  loading = false,
}) {
  const hasFilter = Boolean(from || to);

  return (
    <div className="w-fit shrink-0 rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
      <div className="flex flex-col gap-1.5">
        {/* From Date */}
        <div className="flex h-7 items-center gap-2">
          <label
            htmlFor="purchase-from-date"
            className="w-8 shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-500"
          >
            From
          </label>

          <input
            id="purchase-from-date"
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            className="h-7 w-[150px] rounded border border-slate-300 bg-white px-2 text-[11px] font-medium text-slate-700 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
          />
        </div>

        {/* To Date */}
        <div className="flex h-7 items-center gap-2">
          <label
            htmlFor="purchase-to-date"
            className="w-8 shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-500"
          >
            To
          </label>

          <input
            id="purchase-to-date"
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            className="h-7 w-[150px] rounded border border-slate-300 bg-white px-2 text-[11px] font-medium text-slate-700 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={onApply}
            disabled={loading}
            className="h-7 rounded bg-slate-900 px-3 text-[10px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "..." : "Apply"}
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={loading || !hasFilter}
            className="h-7 rounded border border-slate-300 bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

export default PurchaseDateFilter;
