import { useMemo, useState } from "react";

function SellerSaleDetails({ seller, sales, loading, onBack, onViewSale }) {
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
   * Search sales by sale number.
   * Seller name is already fixed by this page, so there is no need
   * to repeat it in the search.
   */

  const filteredSales = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return sales || [];
    }

    return (sales || []).filter((sale) =>
      String(sale.saleNumber || "")
        .toLowerCase()
        .includes(searchValue),
    );
  }, [sales, search]);

  /*
   * Calculate totals from the currently displayed sales.
   */

  const totalSales = filteredSales.length;

  const totalItems = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.items?.length || 0),
    0,
  );

  const totalItemsAmount = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.itemsTotal || 0),
    0,
  );

  const totalCarriage = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.carriage || 0),
    0,
  );

  const totalAmount = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.grandTotal || 0),
    0,
  );

  if (!seller) {
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
            title={seller.sellerName || ""}
          >
            {seller.sellerName || "Seller"}
          </h2>
        </div>

        <span className="whitespace-nowrap text-[10px] font-medium text-slate-400">
          {filteredSales.length} of {(sales || []).length} sales
        </span>
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="grid grid-cols-5 border-b border-slate-300 bg-slate-50">
        {/* Sales */}

        <div className="border-r border-slate-200 px-2 py-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Sales
          </p>

          <p className="mt-0.5 text-xs font-bold tabular-nums text-slate-900">
            {totalSales}
          </p>
        </div>

        {/* Items */}

        <div className="border-r border-slate-200 px-2 py-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Items
          </p>

          <p className="mt-0.5 text-xs font-bold tabular-nums text-slate-900">
            {totalItems}
          </p>
        </div>

        {/* Items Total */}

        <div className="border-r border-slate-200 px-2 py-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Items Total
          </p>

          <p className="mt-0.5 text-xs font-bold tabular-nums text-slate-900">
            {formatMoney(totalItemsAmount)}
          </p>
        </div>

        {/* Carriage */}

        <div className="border-r border-slate-200 px-2 py-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Carriage
          </p>

          <p className="mt-0.5 text-xs font-bold tabular-nums text-slate-900">
            {formatMoney(totalCarriage)}
          </p>
        </div>

        {/* Total */}

        <div className="px-2 py-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
            Total Received
          </p>

          <p className="mt-0.5 text-xs font-bold tabular-nums text-slate-900">
            {formatMoney(totalAmount)}
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
            placeholder="Search sale number..."
            className="h-7 w-full rounded border border-slate-300 bg-white pl-7 pr-2 text-[10px] font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
          />
        </div>

        <span className="whitespace-nowrap text-[10px] font-medium text-slate-400">
          {filteredSales.length} of {(sales || []).length}
        </span>
      </div>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (
        <div className="px-4 py-8 text-center text-xs text-slate-500">
          Loading seller history...
        </div>
      ) : filteredSales.length === 0 ? (
        /* ===================================================
           EMPTY
        =================================================== */

        <div className="px-4 py-8 text-center">
          <h3 className="text-sm font-semibold text-slate-700">
            {search ? "No Sales Found" : "No Sales Found"}
          </h3>

          <p className="mt-1 text-[10px] text-slate-400">
            {search
              ? `No sale matches "${search}".`
              : "No sales were found for this seller."}
          </p>
        </div>
      ) : (
        /* ===================================================
           SALES TABLE
        =================================================== */

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-xs">
            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr className="h-8 border-b border-slate-300 bg-slate-100">
                <th className="w-[125px] border-r border-slate-300 px-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Date
                </th>

                <th className="border-r border-slate-300 px-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Sale Number
                </th>

                <th className="w-[80px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Items
                </th>

                <th className="w-[140px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Items Total
                </th>

                <th className="w-[120px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Carriage
                </th>

                <th className="w-[150px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Grand Total
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
              {filteredSales.map((sale) => (
                <tr
                  key={sale._id}
                  className="h-9 border-b border-slate-200 last:border-b-0 hover:bg-slate-50"
                >
                  {/* Date */}

                  <td className="whitespace-nowrap border-r border-slate-200 px-2 text-[10px] text-slate-600">
                    {formatDate(sale.saleDate)}
                  </td>

                  {/* Sale Number */}

                  <td className="border-r border-slate-200 px-2">
                    <span
                      className="block max-w-[400px] truncate text-[11px] font-semibold text-slate-900"
                      title={sale.saleNumber || ""}
                    >
                      {sale.saleNumber || "—"}
                    </span>
                  </td>

                  {/* Items */}

                  <td className="border-r border-slate-200 px-2 text-right font-medium tabular-nums text-slate-900">
                    {sale.items?.length || 0}
                  </td>

                  {/* Items Total */}

                  <td className="border-r border-slate-200 px-2 text-right tabular-nums text-slate-700">
                    {formatMoney(sale.itemsTotal)}
                  </td>

                  {/* Carriage */}

                  <td className="border-r border-slate-200 px-2 text-right tabular-nums text-slate-700">
                    {formatMoney(sale.carriage)}
                  </td>

                  {/* Grand Total */}

                  <td className="border-r border-slate-200 px-2 text-right font-bold tabular-nums text-slate-900">
                    {formatMoney(sale.grandTotal)}
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
                  {filteredSales.length} sale
                  {filteredSales.length !== 1 ? "s" : ""}
                </td>

                <td className="border-l border-slate-200 px-2 text-right text-[10px] font-bold tabular-nums text-slate-700">
                  {totalItems}
                </td>

                <td className="border-l border-slate-200 px-2 text-right text-[10px] font-bold tabular-nums text-slate-700">
                  {formatMoney(totalItemsAmount)}
                </td>

                <td className="border-l border-slate-200 px-2 text-right text-[10px] font-bold tabular-nums text-slate-700">
                  {formatMoney(totalCarriage)}
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

export default SellerSaleDetails;
