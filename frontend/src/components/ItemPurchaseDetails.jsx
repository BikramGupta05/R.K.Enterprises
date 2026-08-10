function ItemPurchaseDetails({ item, summary, history, loading, onBack }) {
  if (!item) {
    return null;
  }

  return (
    <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}

      <div className="border-b border-slate-200 pb-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          ← Back to Items
        </button>

        <h2 className="text-2xl font-bold text-slate-900">{item.itemName}</h2>

        <p className="mt-1 text-sm text-slate-500">
          Complete purchase history of this item.
        </p>
      </div>

      {/* Summary */}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Total Quantity
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {Number(summary?.totalQuantity || 0)}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Total Pieces
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {Number(summary?.totalPieces || 0)}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Total Paid
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            ₹{Number(summary?.totalAmount || 0).toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Average Price
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            ₹{Number(summary?.averagePrice || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* History */}

      <div className="mt-8">
        <h3 className="text-xl font-bold text-slate-900">Purchase History</h3>

        {loading ? (
          <div className="py-10 text-center text-slate-500">
            Loading item history...
          </div>
        ) : history.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
            No purchase history found.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-50 text-left text-sm text-slate-600">
                  <th className="p-3 font-semibold">Date</th>

                  <th className="p-3 font-semibold">Buyer</th>

                  <th className="p-3 font-semibold">Quantity</th>

                  <th className="p-3 font-semibold">Pieces</th>

                  <th className="p-3 font-semibold">Price</th>

                  <th className="p-3 text-right font-semibold">Total</th>
                </tr>
              </thead>

              <tbody>
                {history.map((record) => {
                  const date = record.purchaseDate
                    ? new Date(record.purchaseDate).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )
                    : "N/A";

                  return (
                    <tr
                      key={`${record.purchaseId}-${record.item}`}
                      className="border-b border-slate-200"
                    >
                      <td className="p-3 font-medium text-slate-900">{date}</td>

                      <td className="p-3 text-slate-600">{record.buyerName}</td>

                      <td className="p-3 text-slate-600">{record.quantity}</td>

                      <td className="p-3 text-slate-600">{record.pieces}</td>

                      <td className="p-3 text-slate-600">
                        ₹{Number(record.price || 0).toFixed(2)}
                      </td>

                      <td className="p-3 text-right font-semibold text-slate-900">
                        ₹{Number(record.total || 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ItemPurchaseDetails;
