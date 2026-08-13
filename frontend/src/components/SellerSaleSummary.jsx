import { useMemo, useState } from "react";

function SellerSaleSummary({ sellers, onSelect }) {
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

  const filteredSellers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return sellers || [];
    }

    return (sellers || []).filter((seller) =>
      String(seller.sellerName || "")
        .toLowerCase()
        .includes(searchValue),
    );
  }, [sellers, search]);

  /* =========================================================
     TOTALS
  ========================================================= */

  const totalSales = filteredSellers.reduce(
    (total, seller) => total + (Number(seller.totalSales) || 0),
    0,
  );

  const totalAmount = filteredSellers.reduce(
    (total, seller) => total + (Number(seller.totalAmount) || 0),
    0,
  );

  return (
    <div className="overflow-hidden border border-slate-300 bg-white">
      {/* =====================================================
          SEARCH BAR
      ===================================================== */}

      <div className="flex h-10 items-center justify-between gap-3 border-b border-slate-300 bg-white px-2">
        <div className="relative w-[280px]">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            🔍
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search seller / shop..."
            className="h-7 w-full rounded border border-slate-300 bg-white pl-8 pr-2 text-[11px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
          />
        </div>

        <span className="whitespace-nowrap text-[10px] font-medium text-slate-400">
          {filteredSellers.length} of {sellers?.length || 0}
        </span>
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      {filteredSellers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-xs">
            {/* =================================================
                HEADER
            ================================================= */}

            <thead>
              <tr className="h-8 border-b border-slate-300 bg-slate-100">
                <th className="border-r border-slate-300 px-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Seller / Shop
                </th>

                <th className="w-[125px] border-r border-slate-300 px-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Last Sale
                </th>

                <th className="w-[75px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Sales
                </th>

                <th className="w-[155px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Total Received
                </th>

                <th className="w-[90px] px-2 text-center text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  View
                </th>
              </tr>
            </thead>

            {/* =================================================
                BODY
            ================================================= */}

            <tbody>
              {filteredSellers.map((seller) => (
                <tr
                  key={seller._id}
                  onClick={() => onSelect(seller)}
                  className="h-9 cursor-pointer border-b border-slate-200 last:border-b-0 hover:bg-slate-50"
                >
                  {/* Seller */}

                  <td className="border-r border-slate-200 px-2">
                    <span
                      className="block max-w-[400px] truncate text-[11px] font-semibold text-slate-900"
                      title={seller.sellerName || ""}
                    >
                      {seller.sellerName || "—"}
                    </span>
                  </td>

                  {/* Last Sale */}

                  <td className="whitespace-nowrap border-r border-slate-200 px-2 text-[10px] text-slate-600">
                    {formatDate(seller.lastSaleDate)}
                  </td>

                  {/* Sales */}

                  <td className="border-r border-slate-200 px-2 text-right font-medium tabular-nums text-slate-900">
                    {seller.totalSales || 0}
                  </td>

                  {/* Total */}

                  <td className="border-r border-slate-200 px-2 text-right font-bold tabular-nums text-slate-900">
                    {formatMoney(seller.totalAmount)}
                  </td>

                  {/* Details */}

                  <td className="px-2 text-center">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(seller);
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
                TOTAL
            ================================================= */}

            <tfoot>
              <tr className="h-7 border-t border-slate-300 bg-slate-50">
                <td
                  colSpan="2"
                  className="px-2 text-[9px] font-semibold text-slate-500"
                >
                  {filteredSellers.length} seller
                  {filteredSellers.length !== 1 ? "s" : ""}
                </td>

                <td className="border-l border-slate-200 px-2 text-right text-[10px] font-bold tabular-nums text-slate-700">
                  {totalSales}
                </td>

                <td className="border-l border-slate-200 px-2 text-right text-[10px] font-bold tabular-nums text-slate-900">
                  {formatMoney(totalAmount)}
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
            {search ? "No Seller Found" : "No Seller Sales Data"}
          </h2>

          <p className="mt-1 text-[10px] text-slate-400">
            {search
              ? `No seller or shop matches "${search}".`
              : "No sales were found for the selected date range."}
          </p>
        </div>
      )}
    </div>
  );
}

export default SellerSaleSummary;
