function PurchaseHistoryCard({ purchase, onView, onEdit, onDelete }) {
  const formattedDate = new Date(purchase.purchaseDate).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        {/* Purchase Information */}

        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {purchase.buyerName}
          </h2>

          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            <span>
              Date:{" "}
              <span className="font-medium text-slate-700">
                {formattedDate}
              </span>
            </span>

            <span>
              Purchase No:{" "}
              <span className="font-medium text-slate-700">
                {purchase.purchaseNumber}
              </span>
            </span>

            <span>
              Items:{" "}
              <span className="font-medium text-slate-700">
                {purchase.items?.length || 0}
              </span>
            </span>
          </div>
        </div>

        {/* Amount */}

        <div className="md:text-right">
          <p className="text-sm text-slate-500">Grand Total</p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            ₹{Number(purchase.grandTotal || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Actions */}

      <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
        <button
          type="button"
          onClick={() => onView(purchase)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          View Details
        </button>

        <button
          type="button"
          onClick={() => onEdit(purchase)}
          className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete(purchase._id)}
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default PurchaseHistoryCard;
