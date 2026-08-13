import { useMemo, useState } from "react";

function ItemPurchaseDetails({ item, summary, history, loading, onBack }) {
  const [search, setSearch] = useState("");

  if (!item) {
    return null;
  }

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* =====================================================
     FORMAT MONEY
  ===================================================== */

  const formatMoney = (value) => {
    return `₹${Number(value || 0).toFixed(2)}`;
  };

  /* =====================================================
     FILTER HISTORY
     
     Search is performed using buyer name.
  ===================================================== */

  const filteredHistory = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return history || [];
    }

    return (history || []).filter((record) =>
      String(record?.buyerName || "")
        .toLowerCase()
        .includes(searchValue),
    );
  }, [history, search]);

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
      {/* =====================================================
          HEADER + SEARCH
      ===================================================== */}

      <div className="flex flex-wrap items-center gap-3 border-b border-slate-300 bg-slate-50 px-3 py-2">
        {/* Back Button */}

        <button
          type="button"
          onClick={onBack}
          className="shrink-0 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          ← Back
        </button>

        {/* Item Name */}

        <h2 className="min-w-0 shrink-0 max-w-[220px] truncate text-sm font-bold text-slate-900">
          {item.itemName}
        </h2>

        {/* Search */}

        {!loading && history?.length > 0 && (
          <div className="relative ml-auto w-full max-w-xs">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              🔍
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search buyer name..."
              className="h-7 w-full rounded-md border border-slate-300 bg-white pl-7 pr-7 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 transition hover:text-slate-700"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Search Result Count */}

        {!loading && history?.length > 0 && (
          <span className="hidden whitespace-nowrap text-[10px] text-slate-500 sm:block">
            {filteredHistory.length}/{history.length}
          </span>
        )}
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="grid grid-cols-2 border-b border-slate-300 bg-white sm:grid-cols-4">
        {/* Total Quantity */}

        <div className="border-b border-r border-slate-200 px-3 py-2 sm:border-b-0">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Total Quantity
          </p>

          <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900">
            {Number(summary?.totalQuantity || 0)}
          </p>
        </div>

        {/* Total Pieces */}

        <div className="border-b border-slate-200 px-3 py-2 sm:border-b-0 sm:border-r">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Total Pieces
          </p>

          <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900">
            {Number(summary?.totalPieces || 0)}
          </p>
        </div>

        {/* Total Paid */}

        <div className="border-r border-slate-200 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Total Paid
          </p>

          <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900">
            {formatMoney(summary?.totalAmount)}
          </p>
        </div>

        {/* Average Price */}

        <div className="px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Average Price
          </p>

          <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900">
            {formatMoney(summary?.averagePrice)}
          </p>
        </div>
      </div>

      {/* =====================================================
          PURCHASE HISTORY HEADER
      ===================================================== */}

      <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-3 py-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">
          Purchase History
        </h3>

        {!loading && history?.length > 0 && (
          <span className="text-[10px] text-slate-500">
            {filteredHistory.length} of {history.length} records
          </span>
        )}
      </div>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (
        <div className="px-4 py-10 text-center text-xs text-slate-500">
          Loading item history...
        </div>
      ) : !history || history.length === 0 ? (
        /* =====================================================
           NO HISTORY
        ===================================================== */

        <div className="px-4 py-10 text-center">
          <p className="text-sm font-semibold text-slate-700">
            No Purchase History
          </p>

          <p className="mt-1 text-xs text-slate-500">
            No purchase records were found for this item.
          </p>
        </div>
      ) : filteredHistory.length === 0 ? (
        /* =====================================================
           NO SEARCH RESULTS
        ===================================================== */

        <div className="px-4 py-10 text-center">
          <p className="text-sm font-semibold text-slate-700">
            No Matching Buyer
          </p>

          <p className="mt-1 text-xs text-slate-500">
            No purchase record matches "{search}".
          </p>

          <button
            type="button"
            onClick={() => setSearch("")}
            className="mt-3 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Clear Search
          </button>
        </div>
      ) : (
        /* =====================================================
           PURCHASE HISTORY TABLE
        ===================================================== */

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] border-collapse text-xs">
            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                <th className="w-[130px] border-r border-slate-200 px-3 py-2 text-left">
                  Date
                </th>

                <th className="min-w-[180px] border-r border-slate-200 px-3 py-2 text-left">
                  Buyer
                </th>

                <th className="w-[110px] border-r border-slate-200 px-3 py-2 text-right">
                  Quantity
                </th>

                <th className="w-[100px] border-r border-slate-200 px-3 py-2 text-right">
                  Pieces
                </th>

                <th className="w-[120px] border-r border-slate-200 px-3 py-2 text-right">
                  Price
                </th>

                <th className="w-[130px] px-3 py-2 text-right">Total</th>
              </tr>
            </thead>

            {/* =================================================
                TABLE BODY
            ================================================= */}

            <tbody>
              {filteredHistory.map((record, index) => (
                <tr
                  key={`${record.purchaseId}-${record.item}`}
                  className={`h-9 border-b border-slate-200 transition last:border-b-0 hover:bg-blue-50/50 ${
                    index % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                  }`}
                >
                  {/* Date */}

                  <td className="whitespace-nowrap border-r border-slate-100 px-3 py-1.5 font-medium text-slate-700">
                    {formatDate(record.purchaseDate)}
                  </td>

                  {/* Buyer */}

                  <td className="border-r border-slate-100 px-3 py-1.5 font-semibold text-slate-900">
                    {record.buyerName || "—"}
                  </td>

                  {/* Quantity */}

                  <td className="border-r border-slate-100 px-3 py-1.5 text-right tabular-nums text-slate-700">
                    {Number(record.quantity || 0)}
                  </td>

                  {/* Pieces */}

                  <td className="border-r border-slate-100 px-3 py-1.5 text-right tabular-nums text-slate-700">
                    {Number(record.pieces || 0)}
                  </td>

                  {/* Price */}

                  <td className="border-r border-slate-100 px-3 py-1.5 text-right tabular-nums text-slate-700">
                    {formatMoney(record.price)}
                  </td>

                  {/* Total */}

                  <td className="px-3 py-1.5 text-right font-semibold tabular-nums text-slate-900">
                    {formatMoney(record.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* =====================================================
          FOOTER
      ===================================================== */}

      {!loading && history?.length > 0 && filteredHistory.length > 0 && (
        <div className="flex h-7 items-center justify-between border-t border-slate-200 bg-slate-50 px-3 text-[10px] text-slate-500">
          <span>
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredHistory.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {history.length}
            </span>{" "}
            purchase record
            {history.length === 1 ? "" : "s"}
          </span>

          <span className="font-medium">{item.itemName}</span>
        </div>
      )}
    </div>
  );
}

export default ItemPurchaseDetails;
