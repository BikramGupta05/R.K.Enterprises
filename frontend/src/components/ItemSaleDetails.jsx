function ItemSaleDetails({ item, sales, loading, onBack, onViewSale }) {
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

  /*
   * Flatten the requested item from each sale.
   */

  const itemRows =
    sales?.map((sale) => {
      const saleItem =
        sale.items?.find(
          (entry) => entry.item?.toString() === item?._id?.toString(),
        ) || sale.items?.[0];

      return {
        sale,
        saleItem,
      };
    }) || [];

  /*
   * Calculate totals.
   */

  const totalQuantity = itemRows.reduce(
    (sum, row) => sum + Number(row.saleItem?.quantity || 0),
    0,
  );

  const totalPieces = itemRows.reduce(
    (sum, row) => sum + Number(row.saleItem?.pieces || 0),
    0,
  );

  const totalAmount = itemRows.reduce(
    (sum, row) => sum + Number(row.saleItem?.total || 0),
    0,
  );

  const averagePrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;

  return (
    <div>
      {/* Header */}

      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
        >
          ← Back to Items
        </button>
      </div>

      {/* Item heading */}

      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900">
          {item?.itemName || "Item"}
        </h2>

        <p className="mt-1 text-slate-500">
          Complete selling history for this item.
        </p>
      </div>

      {/* Summary */}

      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Total Quantity
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Total Pieces
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Total Sales
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Average Price
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Sale Count
                </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="px-6 py-5 text-right text-xl font-bold text-slate-900">
                  {totalQuantity}
                </td>

                <td className="px-6 py-5 text-right text-xl font-bold text-slate-900">
                  {totalPieces}
                </td>

                <td className="px-6 py-5 text-right text-xl font-bold text-slate-900">
                  {formatMoney(totalAmount)}
                </td>

                <td className="px-6 py-5 text-right text-xl font-bold text-slate-900">
                  {formatMoney(averagePrice)}
                </td>

                <td className="px-6 py-5 text-right text-xl font-bold text-slate-900">
                  {itemRows.length}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* History */}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          Loading item history...
        </div>
      ) : itemRows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h3 className="text-xl font-semibold text-slate-700">
            No Sales Found
          </h3>

          <p className="mt-2 text-slate-500">
            No sales were found for this item.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                    Date
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                    Seller
                  </th>

                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                    Quantity
                  </th>

                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                    Pieces
                  </th>

                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                    Price
                  </th>

                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                    Total
                  </th>

                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600">
                    View
                  </th>
                </tr>
              </thead>

              <tbody>
                {itemRows.map(({ sale, saleItem }) => (
                  <tr
                    key={sale._id}
                    className="border-b border-slate-100 transition hover:bg-slate-50 last:border-b-0"
                  >
                    <td className="whitespace-nowrap px-6 py-5 text-slate-700">
                      {formatDate(sale.saleDate)}
                    </td>

                    <td className="px-6 py-5 font-semibold text-slate-900">
                      {sale.sellerName}
                    </td>

                    <td className="px-6 py-5 text-right text-slate-700">
                      {saleItem?.quantity ?? 0}
                    </td>

                    <td className="px-6 py-5 text-right text-slate-700">
                      {saleItem?.pieces ?? 0}
                    </td>

                    <td className="px-6 py-5 text-right text-slate-700">
                      {formatMoney(saleItem?.price)}
                    </td>

                    <td className="px-6 py-5 text-right font-bold text-slate-900">
                      {formatMoney(saleItem?.total)}
                    </td>

                    <td className="px-6 py-5 text-center">
                      <button
                        type="button"
                        onClick={() => onViewSale(sale)}
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
        </div>
      )}
    </div>
  );
}

export default ItemSaleDetails;
