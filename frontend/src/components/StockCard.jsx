function StockCard({ stock }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {stock.itemName}
          </h2>

          <p className="mt-1 text-sm text-slate-500">Current available stock</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-[120px] rounded-xl bg-slate-50 px-5 py-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Quantity
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {stock.quantity}
            </p>
          </div>

          <div className="min-w-[120px] rounded-xl bg-slate-50 px-5 py-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Pieces
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {stock.pieces}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockCard;
