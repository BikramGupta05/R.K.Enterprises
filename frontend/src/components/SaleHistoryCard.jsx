function SaleHistoryCard({ sale, onView }) {
  const formattedDate = sale.saleDate
    ? new Date(sale.saleDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Unknown date";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        {/* Sale Information */}

        <div>
          <h2 className="text-xl font-semibold text-slate-900">
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

            <p>
              Items:{" "}
              <span className="font-medium text-slate-700">
                {sale.items?.length || 0}
              </span>
            </p>
          </div>
        </div>

        {/* Amount + Button */}

        <div className="flex items-center justify-between gap-5 md:justify-end">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Total
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              ₹{Number(sale.grandTotal || 0).toFixed(2)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onView(sale)}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default SaleHistoryCard;
