import { useMemo, useState } from "react";

function ItemSaleSummary({ items, onSelect }) {
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
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredItems = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return items || [];
    }

    return (items || []).filter((item) =>
      String(item.itemName || "")
        .toLowerCase()
        .includes(searchValue),
    );
  }, [items, search]);

  /* =========================================================
     TOTALS
  ========================================================= */

  const totalQuantity = filteredItems.reduce(
    (total, item) => total + (Number(item.totalQuantity) || 0),
    0,
  );

  const totalPieces = filteredItems.reduce(
    (total, item) => total + (Number(item.totalPieces) || 0),
    0,
  );

  const totalAmount = filteredItems.reduce(
    (total, item) => total + (Number(item.totalAmount) || 0),
    0,
  );

  const totalSales = filteredItems.reduce(
    (total, item) => total + (Number(item.saleCount) || 0),
    0,
  );

  return (
    <div className="overflow-hidden border border-slate-300 bg-white">
      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div className="flex h-10 items-center justify-between gap-3 border-b border-slate-300 bg-white px-2">
        <div className="relative w-[280px] shrink-0">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            🔍
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search item..."
            className="h-7 w-full rounded border border-slate-300 bg-white pl-8 pr-2 text-[11px] font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
          />
        </div>

        <span className="whitespace-nowrap text-[10px] font-medium text-slate-400">
          {filteredItems.length} of {items?.length || 0}
        </span>
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      {filteredItems.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-xs">
            {/* =================================================
                HEADER
            ================================================= */}

            <thead>
              <tr className="h-8 border-b border-slate-300 bg-slate-100">
                <th className="border-r border-slate-300 px-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Item
                </th>

                <th className="w-[125px] border-r border-slate-300 px-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Last Sold
                </th>

                <th className="w-[90px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Quantity
                </th>

                <th className="w-[80px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Pieces
                </th>

                <th className="w-[140px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Total Sales
                </th>

                <th className="w-[120px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Avg. Price
                </th>

                <th className="w-[70px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Sales
                </th>

                <th className="w-[85px] px-2 text-center text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  View
                </th>
              </tr>
            </thead>

            {/* =================================================
                BODY
            ================================================= */}

            <tbody>
              {filteredItems.map((item) => (
                <tr
                  key={item._id}
                  onClick={() => onSelect(item)}
                  className="h-9 cursor-pointer border-b border-slate-200 last:border-b-0 hover:bg-slate-50"
                >
                  {/* Item */}

                  <td className="border-r border-slate-200 px-2">
                    <span
                      className="block max-w-[400px] truncate text-[11px] font-semibold text-slate-900"
                      title={item.itemName || ""}
                    >
                      {item.itemName || "—"}
                    </span>
                  </td>

                  {/* Last Sold */}

                  <td className="whitespace-nowrap border-r border-slate-200 px-2 text-[10px] text-slate-600">
                    {formatDate(item.lastSaleDate)}
                  </td>

                  {/* Quantity */}

                  <td className="border-r border-slate-200 px-2 text-right font-medium tabular-nums text-slate-900">
                    {Number(item.totalQuantity || 0)}
                  </td>

                  {/* Pieces */}

                  <td className="border-r border-slate-200 px-2 text-right font-medium tabular-nums text-slate-900">
                    {Number(item.totalPieces || 0)}
                  </td>

                  {/* Total Sales */}

                  <td className="border-r border-slate-200 px-2 text-right font-bold tabular-nums text-slate-900">
                    {formatMoney(item.totalAmount)}
                  </td>

                  {/* Average Price */}

                  <td className="border-r border-slate-200 px-2 text-right tabular-nums text-slate-700">
                    {formatMoney(item.averagePrice)}
                  </td>

                  {/* Sales Count */}

                  <td className="border-r border-slate-200 px-2 text-right font-medium tabular-nums text-slate-700">
                    {item.saleCount || 0}
                  </td>

                  {/* Details */}

                  <td className="px-2 text-center">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(item);
                      }}
                      className="h-6 rounded border border-slate-300 bg-white px-2.5 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* =================================================
                TOTAL ROW
            ================================================= */}

            <tfoot>
              <tr className="h-7 border-t border-slate-300 bg-slate-50">
                <td
                  colSpan="2"
                  className="px-2 text-[9px] font-semibold text-slate-500"
                >
                  {filteredItems.length} item
                  {filteredItems.length !== 1 ? "s" : ""}
                </td>

                <td className="border-l border-slate-200 px-2 text-right text-[10px] font-bold tabular-nums text-slate-700">
                  {totalQuantity}
                </td>

                <td className="border-l border-slate-200 px-2 text-right text-[10px] font-bold tabular-nums text-slate-700">
                  {totalPieces}
                </td>

                <td className="border-l border-slate-200 px-2 text-right text-[10px] font-bold tabular-nums text-slate-900">
                  {formatMoney(totalAmount)}
                </td>

                <td className="border-l border-slate-200 px-2 text-right text-[10px] text-slate-500">
                  —
                </td>

                <td className="border-l border-slate-200 px-2 text-right text-[10px] font-bold tabular-nums text-slate-700">
                  {totalSales}
                </td>

                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        /* =====================================================
           NO RESULTS
        ===================================================== */

        <div className="px-4 py-8 text-center">
          <h2 className="text-sm font-semibold text-slate-700">
            {search ? "No Item Found" : "No Item Sales Data"}
          </h2>

          <p className="mt-1 text-[10px] text-slate-400">
            {search
              ? `No item matches "${search}".`
              : "No sold items were found for the selected date range."}
          </p>
        </div>
      )}
    </div>
  );
}

export default ItemSaleSummary;
