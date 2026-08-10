function BuyerCard({ buyer, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">
            {buyer.shopName}
          </h2>

          <p className="text-slate-600">
            <span className="font-semibold">City:</span> {buyer.city}
          </p>

          <p className="text-slate-600">
            <span className="font-semibold">Address:</span> {buyer.address}
          </p>

          <p className="text-slate-600">
            <span className="font-semibold">Phone:</span> {buyer.phone}
          </p>

          <p className="text-slate-600">
            <span className="font-semibold">Email:</span> {buyer.email || "N/A"}
          </p>

          <p className="text-slate-600">
            <span className="font-semibold">GST:</span>{" "}
            {buyer.gstNumber || "N/A"}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onEdit(buyer)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Edit
          </button>

          <button
            onClick={() => onDelete(buyer._id)}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default BuyerCard;
