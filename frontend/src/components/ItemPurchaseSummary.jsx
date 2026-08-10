function ItemPurchaseSummary({ items, onSelect }) {
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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {items?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Item
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Last Purchased
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Quantity
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Pieces
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Total Paid
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Avg. Price
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Purchases
                </th>

                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600">
                  View
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr
                  key={item._id}
                  onClick={() => onSelect(item)}
                  className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 last:border-b-0"
                >
                  <td className="px-6 py-5">
                    <div className="font-semibold text-slate-900">
                      {item.itemName}
                    </div>
                  </td>

                  <td className="px-6 py-5 text-slate-600">
                    {formatDate(item.lastPurchaseDate)}
                  </td>

                  <td className="px-6 py-5 text-right font-medium text-slate-900">
                    {Number(item.totalQuantity || 0)}
                  </td>

                  <td className="px-6 py-5 text-right font-medium text-slate-900">
                    {Number(item.totalPieces || 0)}
                  </td>

                  <td className="px-6 py-5 text-right font-semibold text-slate-900">
                    {formatMoney(item.totalAmount)}
                  </td>

                  <td className="px-6 py-5 text-right text-slate-700">
                    {formatMoney(item.averagePrice)}
                  </td>

                  <td className="px-6 py-5 text-right text-slate-700">
                    {item.purchaseCount || 0}
                  </td>

                  <td className="px-6 py-5 text-center">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(item);
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center">
          <h2 className="text-xl font-semibold text-slate-700">
            No Item Purchase Data
          </h2>

          <p className="mt-2 text-slate-500">
            No purchased items were found for the selected date range.
          </p>
        </div>
      )}
    </div>
  );
}

export default ItemPurchaseSummary;
