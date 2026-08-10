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

  return (
    <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}

      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-3 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Back to Buyers
          </button>

          <h2 className="text-2xl font-bold text-slate-900">
            {buyer.buyerName}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Complete purchase history from this buyer.
          </p>
        </div>

        {/* Summary */}

        <div className="flex gap-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Purchases
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {summary?.totalPurchases || 0}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Total
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              ₹{Number(summary?.totalAmount || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}

      {loading ? (
        <div className="py-10 text-center text-slate-500">
          Loading buyer history...
        </div>
      ) : purchases.length === 0 ? (
        <div className="py-10 text-center text-slate-500">
          No purchases found for this buyer.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {purchases.map((purchase) => {
            const date = purchase.purchaseDate
              ? new Date(purchase.purchaseDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "N/A";

            return (
              <div
                key={purchase._id}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {date}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Purchase No:{" "}
                      <span className="font-medium text-slate-700">
                        {purchase.purchaseNumber}
                      </span>
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Items:{" "}
                      <span className="font-medium text-slate-700">
                        {purchase.items?.length || 0}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-5 md:justify-end">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-slate-400">
                        Total
                      </p>

                      <p className="mt-1 text-xl font-bold text-slate-900">
                        ₹{Number(purchase.grandTotal || 0).toFixed(2)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onViewPurchase(purchase)}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BuyerPurchaseDetails;
