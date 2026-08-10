function PurchaseDateFilter({
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
            htmlFor="purchase-from-date"
            className="text-sm font-semibold text-slate-700"
          >
            From Date
          </label>

          <input
            id="purchase-from-date"
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        {/* To */}

        <div>
          <label
            htmlFor="purchase-to-date"
            className="text-sm font-semibold text-slate-700"
          >
            To Date
          </label>

          <input
            id="purchase-to-date"
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        {/* Apply */}

        <button
          type="button"
          onClick={onApply}
          disabled={loading}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Loading..." : "Apply"}
        </button>

        {/* Clear */}

        <button
          type="button"
          onClick={onClear}
          disabled={loading || (!from && !to)}
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Leave either date empty if you only want to filter from one side.
      </p>
    </div>
  );
}

export default PurchaseDateFilter;
