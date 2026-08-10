function PurchaseDetails({ purchase, onClose }) {
  if (!purchase) {
    return null;
  }

  const formattedDate = new Date(purchase.purchaseDate).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}

        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {purchase.buyerName}
            </h2>

            <div className="mt-2 space-y-1 text-sm text-slate-500">
              <p>
                Purchase No:{" "}
                <span className="font-medium text-slate-700">
                  {purchase.purchaseNumber}
                </span>
              </p>

              <p>
                Date:{" "}
                <span className="font-medium text-slate-700">
                  {formattedDate}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-600 transition hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Items */}

        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Purchased Items
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left text-sm text-slate-600">
                  <th className="border-b border-slate-200 px-4 py-3">#</th>

                  <th className="border-b border-slate-200 px-4 py-3">Item</th>

                  <th className="border-b border-slate-200 px-4 py-3">
                    Quantity
                  </th>

                  <th className="border-b border-slate-200 px-4 py-3">
                    Pieces
                  </th>

                  <th className="border-b border-slate-200 px-4 py-3">Price</th>

                  <th className="border-b border-slate-200 px-4 py-3 text-right">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {purchase.items?.map((item, index) => (
                  <tr
                    key={item._id || `${item.item}-${index}`}
                    className="text-sm"
                  >
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-500">
                      {index + 1}
                    </td>

                    <td className="border-b border-slate-100 px-4 py-3 font-medium text-slate-900">
                      {item.itemName}
                    </td>

                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                      {item.quantity}
                    </td>

                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                      {item.pieces}
                    </td>

                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                      ₹{Number(item.price || 0).toFixed(2)}
                    </td>

                    <td className="border-b border-slate-100 px-4 py-3 text-right font-semibold text-slate-900">
                      ₹{Number(item.total || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex justify-between text-slate-600">
                <span>Items Total</span>

                <span className="font-medium text-slate-900">
                  ₹{Number(purchase.itemsTotal || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Carriage / Fare</span>

                <span className="font-medium text-slate-900">
                  ₹{Number(purchase.carriage || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between border-t border-slate-200 pt-3">
                <span className="text-lg font-semibold text-slate-900">
                  Grand Total
                </span>

                <span className="text-xl font-bold text-slate-900">
                  ₹{Number(purchase.grandTotal || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}

        <div className="flex justify-end border-t border-slate-200 p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white transition hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PurchaseDetails;
