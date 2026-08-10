function SaleDetails({ sale, onClose }) {
  if (!sale) {
    return null;
  }

  const formattedDate = sale.saleDate
    ? new Date(sale.saleDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Unknown date";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        {/* Header */}

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {sale.sellerName}
            </h2>

            <div className="mt-2 space-y-1 text-sm text-slate-500">
              <p>
                Date:{" "}
                <span className="font-medium text-slate-700">
                  {formattedDate}
                </span>
              </p>

              <p>
                Sale No:{" "}
                <span className="font-medium text-slate-700">
                  {sale.saleNumber}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-2xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            ×
          </button>
        </div>

        {/* Items Table */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-50 text-left text-sm text-slate-600">
                <th className="p-3 font-semibold">Item</th>

                <th className="p-3 font-semibold">Quantity</th>

                <th className="p-3 font-semibold">Pieces</th>

                <th className="p-3 font-semibold">Price</th>

                <th className="p-3 text-right font-semibold">Total</th>
              </tr>
            </thead>

            <tbody>
              {sale.items?.map((item) => (
                <tr key={item._id} className="border-b border-slate-200">
                  <td className="p-3 font-medium text-slate-900">
                    {item.itemName}
                  </td>

                  <td className="p-3 text-slate-600">{item.quantity}</td>

                  <td className="p-3 text-slate-600">{item.pieces}</td>

                  <td className="p-3 text-slate-600">
                    ₹{Number(item.price || 0).toFixed(2)}
                  </td>

                  <td className="p-3 text-right font-medium text-slate-900">
                    ₹{Number(item.total || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}

        <div className="mt-8 flex justify-end">
          <div className="w-full max-w-sm rounded-2xl bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Items Total</span>

              <span className="font-semibold text-slate-900">
                ₹{Number(sale.itemsTotal || 0).toFixed(2)}
              </span>
            </div>

            <div className="my-4 border-t border-slate-200" />

            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-slate-900">
                Final Total
              </span>

              <span className="text-2xl font-bold text-slate-900">
                ₹{Number(sale.grandTotal || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Close */}

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SaleDetails;
