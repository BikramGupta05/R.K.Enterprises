function SellingDateFilter({
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
    <div className="flex w-full justify-end">
      <div className="flex items-center gap-2">
        {/* From */}

        <div className="flex items-center gap-1.5">
          <label
            htmlFor="selling-from-date"
            className="text-[10px] font-bold uppercase text-slate-500"
          >
            From
          </label>

          <input
            id="selling-from-date"
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            className="h-8 w-[145px] rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
          />
        </div>

        {/* To */}

        <div className="flex items-center gap-1.5">
          <label
            htmlFor="selling-to-date"
            className="text-[10px] font-bold uppercase text-slate-500"
          >
            To
          </label>

          <input
            id="selling-to-date"
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            className="h-8 w-[145px] rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
          />
        </div>

        {/* Apply */}

        <button
          type="button"
          onClick={onApply}
          disabled={loading}
          className="h-8 rounded-md bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "..." : "Apply"}
        </button>

        {/* Clear */}

        <button
          type="button"
          onClick={onClear}
          disabled={loading || !hasFilter}
          className="h-8 rounded-md border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default SellingDateFilter;
