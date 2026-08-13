import { useMemo, useState } from "react";

function BuyerPurchaseSummary({ buyers, onSelect }) {
  const [search, setSearch] = useState("");

  const formatDate = (date) => {
    if (!date) return "N/A";

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

  const formatMoney = (value) => {
    return `₹${Number(value || 0).toFixed(2)}`;
  };

  /*
   * Search buyers by name / shop name.
   *
   * The original buyers array is not modified.
   */
  const filteredBuyers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return buyers || [];
    }

    return (buyers || []).filter((buyer) =>
      String(buyer?.buyerName || "")
        .toLowerCase()
        .includes(searchValue),
    );
  }, [buyers, search]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
      {/* =====================================================
          SEARCH BAR
      ===================================================== */}

      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <div className="relative w-full max-w-sm">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            🔍
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search buyer / shop name..."
            className="h-8 w-full rounded-md border border-slate-300 bg-white pl-8 pr-8 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <span className="ml-auto whitespace-nowrap text-[10px] text-slate-500">
          {filteredBuyers.length} of {buyers?.length || 0}
        </span>
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      {filteredBuyers.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] border-collapse text-xs">
              {/* =====================================================
                  HEADER
              ===================================================== */}

              <thead>
                <tr className="border-b border-slate-300 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  <th className="min-w-[220px] border-r border-slate-200 px-3 py-2 text-left">
                    Buyer / Shop
                  </th>

                  <th className="w-[150px] border-r border-slate-200 px-3 py-2 text-left">
                    Last Purchase
                  </th>

                  <th className="w-[100px] border-r border-slate-200 px-3 py-2 text-right">
                    Purchases
                  </th>

                  <th className="w-[150px] border-r border-slate-200 px-3 py-2 text-right">
                    Total Paid
                  </th>

                  <th className="w-[80px] px-2 py-2 text-center">View</th>
                </tr>
              </thead>

              {/* =====================================================
                  BODY
              ===================================================== */}

              <tbody>
                {filteredBuyers.map((buyer, index) => (
                  <tr
                    key={buyer._id}
                    onClick={() => onSelect(buyer)}
                    className={`h-9 cursor-pointer border-b border-slate-200 transition last:border-b-0 hover:bg-blue-50/50 ${
                      index % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                    }`}
                  >
                    {/* Buyer */}

                    <td className="border-r border-slate-100 px-3 py-1.5">
                      <span className="font-semibold text-slate-900">
                        {buyer.buyerName || "—"}
                      </span>
                    </td>

                    {/* Last Purchase */}

                    <td className="whitespace-nowrap border-r border-slate-100 px-3 py-1.5 text-slate-600">
                      {formatDate(buyer.lastPurchaseDate)}
                    </td>

                    {/* Purchases */}

                    <td className="border-r border-slate-100 px-3 py-1.5 text-right tabular-nums text-slate-700">
                      {buyer.totalPurchases || 0}
                    </td>

                    {/* Total */}

                    <td className="border-r border-slate-100 px-3 py-1.5 text-right font-semibold tabular-nums text-slate-900">
                      {formatMoney(buyer.totalAmount)}
                    </td>

                    {/* View */}

                    <td className="px-2 py-1 text-center">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelect(buyer);
                        }}
                        className="inline-flex h-6 items-center rounded border border-slate-300 bg-white px-2.5 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* =====================================================
              FOOTER
          ===================================================== */}

          <div className="flex h-7 items-center justify-between border-t border-slate-200 bg-slate-50 px-3 text-[10px] text-slate-500">
            <span>
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filteredBuyers.length}
              </span>{" "}
              buyer{filteredBuyers.length === 1 ? "" : "s"}
            </span>

            <span>
              {search ? `Search: "${search}"` : "Buyer Purchase Summary"}
            </span>
          </div>
        </>
      ) : (
        /* =====================================================
           NO RESULTS
        ===================================================== */

        <div className="px-4 py-10 text-center">
          <h2 className="text-sm font-semibold text-slate-700">
            {search ? "No Buyer Found" : "No Buyer Purchase Data"}
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {search
              ? `No buyer matches "${search}".`
              : "No purchases were found for the selected date range."}
          </p>

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-3 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default BuyerPurchaseSummary;
