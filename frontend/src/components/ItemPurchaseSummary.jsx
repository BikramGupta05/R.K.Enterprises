import { useMemo, useState } from "react";

function ItemPurchaseSummary({ items, onSelect }) {
  const [search, setSearch] = useState("");

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

  const formatMoney = (value) => {
    return `₹${Number(value || 0).toFixed(2)}`;
  };

  /*
   * Filter items by item name.
   *
   * Search is case insensitive.
   */
  const filteredItems = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return items || [];
    }

    return (items || []).filter((item) =>
      (item.itemName || "").toLowerCase().includes(searchValue),
    );
  }, [items, search]);

  return (
    <div className="w-full">
      {/* =========================================================
          SEARCH
      ========================================================= */}

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          {/* Search Icon */}

          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            🔍
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search item..."
            className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-300"
          />
        </div>

        {/* Result Count */}

        <div className="whitespace-nowrap text-xs text-slate-500">
          {filteredItems.length} of {(items || []).length}
        </div>
      </div>

      {/* =========================================================
          TABLE
      ========================================================= */}

      <div className="w-full overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
        {filteredItems.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px] table-fixed border-collapse text-xs">
              {/* =====================================================
                  COLUMN WIDTHS
              ===================================================== */}

              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[13%]" />
                <col className="w-[10%]" />
                <col className="w-[9%]" />
                <col className="w-[13%]" />
                <col className="w-[11%]" />
                <col className="w-[9%]" />
                <col className="w-[11%]" />
              </colgroup>

              {/* =====================================================
                  TABLE HEADER
              ===================================================== */}

              <thead>
                <tr className="h-10 border-b border-slate-300 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  <th className="border-r border-slate-200 px-3 py-2 text-left">
                    Item
                  </th>

                  <th className="border-r border-slate-200 px-3 py-2 text-left">
                    Last Purchased
                  </th>

                  <th className="border-r border-slate-200 px-3 py-2 text-right">
                    Quantity
                  </th>

                  <th className="border-r border-slate-200 px-3 py-2 text-right">
                    Pieces
                  </th>

                  <th className="border-r border-slate-200 px-3 py-2 text-right">
                    Total Paid
                  </th>

                  <th className="border-r border-slate-200 px-3 py-2 text-right">
                    Avg. Price
                  </th>

                  <th className="border-r border-slate-200 px-3 py-2 text-right">
                    Purchases
                  </th>

                  <th className="px-3 py-2 text-center">View</th>
                </tr>
              </thead>

              {/* =====================================================
                  TABLE BODY
              ===================================================== */}

              <tbody>
                {filteredItems.map((item, index) => (
                  <tr
                    key={item._id}
                    onClick={() => onSelect(item)}
                    className={`h-10 cursor-pointer border-b border-slate-200 transition last:border-b-0 hover:bg-blue-50 ${
                      index % 2 === 1 ? "bg-slate-50/50" : "bg-white"
                    }`}
                  >
                    {/* =================================================
                        ITEM
                    ================================================= */}

                    <td className="border-r border-slate-100 px-3 py-1.5">
                      <div
                        className="truncate font-semibold text-slate-900"
                        title={item.itemName}
                      >
                        {item.itemName || "—"}
                      </div>
                    </td>

                    {/* =================================================
                        LAST PURCHASED
                    ================================================= */}

                    <td className="whitespace-nowrap border-r border-slate-100 px-3 py-1.5 text-left text-slate-700">
                      {formatDate(item.lastPurchaseDate)}
                    </td>

                    {/* =================================================
                        QUANTITY
                    ================================================= */}

                    <td className="border-r border-slate-100 px-3 py-1.5 text-right font-medium tabular-nums text-slate-900">
                      {Number(item.totalQuantity || 0)}
                    </td>

                    {/* =================================================
                        PIECES
                    ================================================= */}

                    <td className="border-r border-slate-100 px-3 py-1.5 text-right font-medium tabular-nums text-slate-900">
                      {Number(item.totalPieces || 0)}
                    </td>

                    {/* =================================================
                        TOTAL PAID
                    ================================================= */}

                    <td className="border-r border-slate-100 px-3 py-1.5 text-right font-semibold tabular-nums text-slate-900">
                      {formatMoney(item.totalAmount)}
                    </td>

                    {/* =================================================
                        AVERAGE PRICE
                    ================================================= */}

                    <td className="border-r border-slate-100 px-3 py-1.5 text-right tabular-nums text-slate-700">
                      {formatMoney(item.averagePrice)}
                    </td>

                    {/* =================================================
                        PURCHASE COUNT
                    ================================================= */}

                    <td className="border-r border-slate-100 px-3 py-1.5 text-right font-medium tabular-nums text-slate-700">
                      {item.purchaseCount || 0}
                    </td>

                    {/* =================================================
                        DETAILS
                    ================================================= */}

                    <td className="px-3 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelect(item);
                        }}
                        className="rounded border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* =========================================================
             NO RESULTS
          ========================================================= */

          <div className="px-6 py-10 text-center">
            <h2 className="text-sm font-semibold text-slate-700">
              {search.trim() ? "No Matching Items" : "No Item Purchase Data"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {search.trim()
                ? `No item matches "${search}".`
                : "No purchased items were found for the selected date range."}
            </p>

            {search.trim() && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-3 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ItemPurchaseSummary;
