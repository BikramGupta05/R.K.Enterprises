function SellerCard({ seller, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        {/* Seller Information */}

        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-slate-900">
            {seller.shopName}
          </h2>

          <p className="mt-2 text-sm text-slate-500">{seller.city}</p>

          <p className="mt-2 text-sm text-slate-600">{seller.address}</p>

          <div className="mt-4 space-y-1 text-sm text-slate-600">
            <p>
              <span className="font-medium">Phone:</span> {seller.phone}
            </p>

            {seller.email && (
              <p>
                <span className="font-medium">Email:</span> {seller.email}
              </p>
            )}

            {seller.gstNumber && (
              <p>
                <span className="font-medium">GST:</span> {seller.gstNumber}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onEdit(seller)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(seller._id)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default SellerCard;
