import { useMemo, useState } from "react";

function ItemSaleDetails({ item, sales, loading, onBack, onViewSale }) {
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

  /*
   * Find the requested item inside every sale.
   *
   * The fallback to sale.items[0] has intentionally been removed.
   * If the requested item is not found in a sale, that sale should
   * not appear in this item's history.
   */

  const itemRows = useMemo(() => {
    if (!sales?.length || !item?._id) {
      return [];
    }

    return sales
      .map((sale) => {
        const saleItem = sale.items?.find(
          (entry) => entry.item?.toString() === item._id?.toString(),
        );

        if (!saleItem) {
          return null;
        }

        return {
          sale,
          saleItem,
        };
      })
      .filter(Boolean);
  }, [sales, item]);

  /*
   * Search by seller name.
   */

  const filteredRows = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return itemRows;
    }

    return itemRows.filter(({ sale }) =>
      String(sale.sellerName || "")
        .toLowerCase()
        .includes(searchValue),
    );
  }, [itemRows, search]);

  /*
   * Calculate totals from the currently displayed rows.
   */

  const totalQuantity = filteredRows.reduce(
    (sum, row) => sum + Number(row.saleItem?.quantity || 0),
    0,
  );

  const totalPieces = filteredRows.reduce(
    (sum, row) => sum + Number(row.saleItem?.pieces || 0),
    0,
  );

  const totalAmount = filteredRows.reduce(
    (sum, row) => sum + Number(row.saleItem?.total || 0),
    0,
  );

  const averagePrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;

  const totalSales = filteredRows.length;

  if (!item) {
    return null;
  }

  return (
    <div className="overflow-hidden border border-slate-300 bg-white">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex h-10 items-center justify-between gap-3 border-b border-slate-300 bg-white px-2">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="h-7 shrink-0 rounded border border-slate-300 bg-white px-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            ← Back
          </button>

          <h2
            className="truncate text-sm font-bold text-slate-900"
            title={item.itemName || ""}
          >
            {item.itemName || "Item"}
          </h2>
        </div>

        <span className="whitespace-nowrap text-[10px] font-medium text-slate-400">
          {filteredRows.length} of {itemRows.length} sales
        </span>
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="grid grid-cols-5 border-b border-slate-300 bg-slate-50">
        {/* Quantity */}

        <div className="border-r border-slate-200 px-2 py-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Quantity
          </p>

          <p className="mt-0.5 text-xs font-bold tabular-nums text-slate-900">
            {totalQuantity}
          </p>
        </div>

        {/* Pieces */}

        <div className="border-r border-slate-200 px-2 py-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Pieces
          </p>

          <p className="mt-0.5 text-xs font-bold tabular-nums text-slate-900">
            {totalPieces}
          </p>
        </div>

        {/* Total */}

        <div className="border-r border-slate-200 px-2 py-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Total Sales
          </p>

          <p className="mt-0.5 text-xs font-bold tabular-nums text-slate-900">
            {formatMoney(totalAmount)}
          </p>
        </div>

        {/* Average */}

        <div className="border-r border-slate-200 px-2 py-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Avg. Price
          </p>

          <p className="mt-0.5 text-xs font-bold tabular-nums text-slate-900">
            {formatMoney(averagePrice)}
          </p>
        </div>

        {/* Sales */}

        <div className="px-2 py-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Sales
          </p>

          <p className="mt-0.5 text-xs font-bold tabular-nums text-slate-900">
            {totalSales}
          </p>
        </div>
      </div>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div className="flex h-9 items-center justify-between gap-3 border-b border-slate-300 px-2">
        <div className="relative w-[280px]">
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            🔍
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search seller..."
            className="h-7 w-full rounded border border-slate-300 bg-white pl-7 pr-2 text-[10px] font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
          />
        </div>

        <span className="whitespace-nowrap text-[10px] font-medium text-slate-400">
          {filteredRows.length} of {itemRows.length}
        </span>
      </div>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (
        <div className="px-4 py-8 text-center text-xs text-slate-500">
          Loading item history...
        </div>
      ) : filteredRows.length === 0 ? (
        /* ===================================================
           EMPTY
        =================================================== */

        <div className="px-4 py-8 text-center">
          <h3 className="text-sm font-semibold text-slate-700">
            {search ? "No Seller Found" : "No Sales Found"}
          </h3>

          <p className="mt-1 text-[10px] text-slate-400">
            {search
              ? `No sales match "${search}".`
              : "No sales were found for this item."}
          </p>
        </div>
      ) : (
        /* ===================================================
           HISTORY TABLE
        =================================================== */

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-xs">
            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr className="h-8 border-b border-slate-300 bg-slate-100">
                <th className="w-[125px] border-r border-slate-300 px-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Date
                </th>

                <th className="border-r border-slate-300 px-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Seller
                </th>

                <th className="w-[90px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Quantity
                </th>

                <th className="w-[80px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Pieces
                </th>

                <th className="w-[120px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Price
                </th>

                <th className="w-[140px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Total
                </th>

                <th className="w-[80px] px-2 text-center text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  View
                </th>
              </tr>
            </thead>

            {/* =================================================
                TABLE BODY
            ================================================= */}

            <tbody>
              {filteredRows.map(({ sale, saleItem }) => (
                <tr
                  key={sale._id}
                  className="h-9 border-b border-slate-200 last:border-b-0 hover:bg-slate-50"
                >
                  {/* Date */}

                  <td className="whitespace-nowrap border-r border-slate-200 px-2 text-[10px] text-slate-600">
                    {formatDate(sale.saleDate)}
                  </td>

                  {/* Seller */}

                  <td className="border-r border-slate-200 px-2">
                    <span
                      className="block max-w-[400px] truncate text-[11px] font-semibold text-slate-900"
                      title={sale.sellerName || ""}
                    >
                      {sale.sellerName || "—"}
                    </span>
                  </td>

                  {/* Quantity */}

                  <td className="border-r border-slate-200 px-2 text-right font-medium tabular-nums text-slate-900">
                    {Number(saleItem?.quantity || 0)}
                  </td>

                  {/* Pieces */}

                  <td className="border-r border-slate-200 px-2 text-right font-medium tabular-nums text-slate-900">
                    {Number(saleItem?.pieces || 0)}
                  </td>

                  {/* Price */}

                  <td className="border-r border-slate-200 px-2 text-right tabular-nums text-slate-700">
                    {formatMoney(saleItem?.price)}
                  </td>

                  {/* Total */}

                  <td className="border-r border-slate-200 px-2 text-right font-bold tabular-nums text-slate-900">
                    {formatMoney(saleItem?.total)}
                  </td>

                  {/* Details */}

                  <td className="px-2 text-center">
                    <button
                      type="button"
                      onClick={() => onViewSale(sale)}
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
                  {filteredRows.length} sale
                  {filteredRows.length !== 1 ? "s" : ""}
                </td>

                <td className="border-l border-slate-200 px-2 text-right text-[10px] font-bold tabular-nums text-slate-700">
                  {totalQuantity}
                </td>

                <td className="border-l border-slate-200 px-2 text-right text-[10px] font-bold tabular-nums text-slate-700">
                  {totalPieces}
                </td>

                <td className="border-l border-slate-200 px-2 text-right text-[10px] text-slate-500">
                  —
                </td>

                <td className="border-l border-slate-200 px-2 text-right text-[10px] font-bold tabular-nums text-slate-900">
                  {formatMoney(totalAmount)}
                </td>

                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default ItemSaleDetails;
