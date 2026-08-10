function SellingDateFilter({
  from,
  to,
  onFromChange,
  onToChange,
  onApply,
  onClear,
  loading = false,
}) {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
        {/* From */}

        <div>
          <label
            htmlFor="selling-from-date"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            From Date
          </label>

          <input
            id="selling-from-date"
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        {/* To */}

        <div>
          <label
            htmlFor="selling-to-date"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            To Date
          </label>

          <input
            id="selling-to-date"
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        {/* Apply */}

        <button
          type="button"
          onClick={onApply}
          disabled={loading}
          className="rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Loading..." : "Apply"}
        </button>

        {/* Clear */}

        <button
          type="button"
          onClick={onClear}
          disabled={loading}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default SellingDateFilter;
