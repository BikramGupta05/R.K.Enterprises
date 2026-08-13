function BuyerPurchaseDetails({
  buyer,
  summary,
  purchases,
  loading,
  onBack,
  onViewPurchase,
}) {
  if (!buyer) {
    return null;
  }

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Buyer information */}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
            >
              ← Back
            </button>

            <div className="border-l border-slate-200 pl-3">
              <h2 className="text-lg font-bold text-slate-900">
                {buyer.buyerName}
              </h2>
            </div>
          </div>

          {/* Compact summary */}

          <div className="flex items-center divide-x divide-slate-200 rounded-md border border-slate-200 bg-slate-50">
            <div className="px-4 py-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Purchases
              </p>

              <p className="text-sm font-bold tabular-nums text-slate-900">
                {summary?.totalPurchases || 0}
              </p>
            </div>

            <div className="px-4 py-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Total
              </p>

              <p className="text-sm font-bold tabular-nums text-slate-900">
                ₹{Number(summary?.totalAmount || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (
        <div className="px-4 py-8 text-center text-sm text-slate-500">
          Loading buyer history...
        </div>
      ) : purchases.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm font-medium text-slate-600">
            No purchases found for this buyer.
          </p>
        </div>
      ) : (
        /* ===================================================
           COMPACT EXCEL STYLE TABLE
        =================================================== */

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                <th className="w-[120px] border-r border-slate-200 px-3 py-2 text-left">
                  Date
                </th>

                <th className="min-w-[190px] border-r border-slate-200 px-3 py-2 text-left">
                  Purchase No.
                </th>

                <th className="w-[80px] border-r border-slate-200 px-3 py-2 text-right">
                  Items
                </th>

                <th className="w-[130px] border-r border-slate-200 px-3 py-2 text-right">
                  Items Total
                </th>

                <th className="w-[110px] border-r border-slate-200 px-3 py-2 text-right">
                  Carriage
                </th>

                <th className="w-[135px] border-r border-slate-200 px-3 py-2 text-right">
                  Grand Total
                </th>

                <th className="w-[80px] px-3 py-2 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {purchases.map((purchase, index) => (
                <tr
                  key={purchase._id}
                  className={`border-b border-slate-200 transition last:border-b-0 hover:bg-blue-50/40 ${
                    index % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                  }`}
                >
                  {/* Date */}

                  <td className="whitespace-nowrap border-r border-slate-100 px-3 py-2 text-slate-700">
                    {formatDate(purchase.purchaseDate)}
                  </td>

                  {/* Purchase number */}

                  <td className="whitespace-nowrap border-r border-slate-100 px-3 py-2 font-mono text-xs text-slate-600">
                    {purchase.purchaseNumber || "—"}
                  </td>

                  {/* Items */}

                  <td className="border-r border-slate-100 px-3 py-2 text-right tabular-nums text-slate-700">
                    {purchase.items?.length || 0}
                  </td>

                  {/* Items total */}

                  <td className="border-r border-slate-100 px-3 py-2 text-right tabular-nums text-slate-700">
                    ₹{Number(purchase.itemsTotal || 0).toFixed(2)}
                  </td>

                  {/* Carriage */}

                  <td className="border-r border-slate-100 px-3 py-2 text-right tabular-nums text-slate-600">
                    ₹{Number(purchase.carriage || 0).toFixed(2)}
                  </td>

                  {/* Grand total */}

                  <td className="border-r border-slate-100 px-3 py-2 text-right font-semibold tabular-nums text-slate-900">
                    ₹{Number(purchase.grandTotal || 0).toFixed(2)}
                  </td>

                  {/* Action */}

                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => onViewPurchase(purchase)}
                      className="inline-flex h-7 items-center rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      View
                    </button>
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

      {!loading && purchases.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">
          <span>
            {purchases.length} purchase
            {purchases.length === 1 ? "" : "s"}
          </span>

          <span className="font-medium text-slate-600">{buyer.buyerName}</span>
        </div>
      )}
    </div>
  );
}

export default BuyerPurchaseDetails;
