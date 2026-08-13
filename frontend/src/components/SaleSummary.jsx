function SaleSummary({ sales, onSelect }) {
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

  return (
    <div className="overflow-hidden border border-slate-300 bg-white">
      {sales?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-xs">
            {/* =================================================
                HEADER
            ================================================= */}

            <thead>
              <tr className="h-8 border-b border-slate-300 bg-slate-100">
                <th className="w-[110px] border-r border-slate-300 px-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Date
                </th>

                <th className="border-r border-slate-300 px-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Seller
                </th>

                <th className="w-[150px] border-r border-slate-300 px-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Sale No.
                </th>

                <th className="w-[65px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Items
                </th>

                <th className="w-[135px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Items Total
                </th>

                <th className="w-[120px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Carriage
                </th>

                <th className="w-[145px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Grand Total
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
              {sales.map((sale) => (
                <tr
                  key={sale._id}
                  onClick={() => onSelect(sale)}
                  className="h-9 cursor-pointer border-b border-slate-200 last:border-b-0 hover:bg-slate-50"
                >
                  {/* Date */}

                  <td className="border-r border-slate-200 px-2 whitespace-nowrap text-[10px] text-slate-600">
                    {formatDate(sale.saleDate)}
                  </td>

                  {/* Seller */}

                  <td className="border-r border-slate-200 px-2">
                    <span
                      className="block max-w-[300px] truncate text-[11px] font-semibold text-slate-900"
                      title={sale.sellerName || ""}
                    >
                      {sale.sellerName || "—"}
                    </span>
                  </td>

                  {/* Sale Number */}

                  <td className="border-r border-slate-200 px-2 whitespace-nowrap text-[10px] text-slate-600">
                    {sale.saleNumber || "—"}
                  </td>

                  {/* Items */}

                  <td className="border-r border-slate-200 px-2 text-right font-medium tabular-nums text-slate-700">
                    {sale.items?.length || 0}
                  </td>

                  {/* Items Total */}

                  <td className="border-r border-slate-200 px-2 text-right tabular-nums text-slate-700">
                    {formatMoney(sale.itemsTotal)}
                  </td>

                  {/* Carriage */}

                  <td className="border-r border-slate-200 px-2 text-right tabular-nums text-slate-600">
                    {Number(sale.carriage || 0) > 0
                      ? formatMoney(sale.carriage)
                      : "—"}
                  </td>

                  {/* Grand Total */}

                  <td className="border-r border-slate-200 px-2 text-right font-bold tabular-nums text-slate-900">
                    {formatMoney(sale.grandTotal)}
                  </td>

                  {/* Details */}

                  <td className="px-2 text-center">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(sale);
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
                FOOTER
            ================================================= */}

            <tfoot>
              <tr className="h-7 border-t border-slate-300 bg-slate-50">
                <td
                  colSpan="3"
                  className="px-2 text-[9px] font-semibold text-slate-500"
                >
                  {sales.length} sale
                  {sales.length !== 1 ? "s" : ""}
                </td>

                <td className="border-l border-slate-200 px-2 text-right text-[10px] font-semibold tabular-nums text-slate-700">
                  {sales.reduce(
                    (total, sale) => total + (sale.items?.length || 0),
                    0,
                  )}
                </td>

                <td className="border-l border-slate-200 px-2 text-right text-[10px] font-semibold tabular-nums text-slate-700">
                  {formatMoney(
                    sales.reduce(
                      (total, sale) => total + (Number(sale.itemsTotal) || 0),
                      0,
                    ),
                  )}
                </td>

                <td className="border-l border-slate-200 px-2 text-right text-[10px] font-semibold tabular-nums text-slate-700">
                  {formatMoney(
                    sales.reduce(
                      (total, sale) => total + (Number(sale.carriage) || 0),
                      0,
                    ),
                  )}
                </td>

                <td className="border-l border-slate-200 px-2 text-right text-[10px] font-bold tabular-nums text-slate-900">
                  {formatMoney(
                    sales.reduce(
                      (total, sale) => total + (Number(sale.grandTotal) || 0),
                      0,
                    ),
                  )}
                </td>

                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="px-4 py-8 text-center">
          <h2 className="text-sm font-semibold text-slate-700">
            No Sales Found
          </h2>

          <p className="mt-1 text-[10px] text-slate-400">
            No sales were found for the selected date range.
          </p>
        </div>
      )}
    </div>
  );
}

export default SaleSummary;
