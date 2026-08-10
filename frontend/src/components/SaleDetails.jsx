function SaleDetails({ sale, onClose }) {
  if (!sale) {
    return null;
  }

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatMoney = (value) => {
    return `₹${Number(value || 0).toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div className="mx-auto my-8 w-full max-w-6xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Sale Details</h2>

            <p className="mt-1 text-sm text-slate-500">{sale.saleNumber}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        {/* Sale information */}

        <div className="grid gap-4 border-b border-slate-200 p-6 md:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Date
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {formatDate(sale.saleDate)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Seller
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {sale.sellerName || "N/A"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Items Total
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {formatMoney(sale.itemsTotal)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Grand Total
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {formatMoney(sale.grandTotal)}
            </p>
          </div>
        </div>

        {/* Items table */}

        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Sold Items
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-3 text-left text-sm font-semibold text-slate-600">
                    Item
                  </th>

                  <th className="px-5 py-3 text-right text-sm font-semibold text-slate-600">
                    Quantity
                  </th>

                  <th className="px-5 py-3 text-right text-sm font-semibold text-slate-600">
                    Pieces
                  </th>

                  <th className="px-5 py-3 text-right text-sm font-semibold text-slate-600">
                    Price
                  </th>

                  <th className="px-5 py-3 text-right text-sm font-semibold text-slate-600">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {sale.items?.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {item.itemName}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-700">
                      {item.quantity}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-700">
                      {item.pieces}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-700">
                      {formatMoney(item.price)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-slate-900">
                      {formatMoney(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50">
                  <td
                    colSpan="4"
                    className="px-5 py-4 text-right font-semibold text-slate-700"
                  >
                    Items Total
                  </td>

                  <td className="px-5 py-4 text-right font-bold text-slate-900">
                    {formatMoney(sale.itemsTotal)}
                  </td>
                </tr>

                <tr className="bg-slate-50">
                  <td
                    colSpan="4"
                    className="px-5 py-4 text-right font-semibold text-slate-700"
                  >
                    Carriage
                  </td>

                  <td className="px-5 py-4 text-right font-semibold text-slate-900">
                    {formatMoney(sale.carriage)}
                  </td>
                </tr>

                <tr className="bg-slate-50">
                  <td
                    colSpan="4"
                    className="px-5 py-4 text-right text-lg font-bold text-slate-900"
                  >
                    Grand Total
                  </td>

                  <td className="px-5 py-4 text-right text-lg font-bold text-slate-900">
                    {formatMoney(sale.grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SaleDetails;
