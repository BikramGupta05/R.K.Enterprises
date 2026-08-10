function SaleSummary({ sales, onSelect }) {
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
      {sales?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Date
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Seller
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Sale Number
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Items
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Items Total
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Carriage
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Grand Total
                </th>

                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600">
                  View
                </th>
              </tr>
            </thead>

            <tbody>
              {sales.map((sale) => (
                <tr
                  key={sale._id}
                  className="border-b border-slate-100 transition hover:bg-slate-50 last:border-b-0"
                >
                  <td className="whitespace-nowrap px-6 py-5 text-slate-700">
                    {formatDate(sale.saleDate)}
                  </td>

                  <td className="px-6 py-5">
                    <span className="font-semibold text-slate-900">
                      {sale.sellerName}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                    {sale.saleNumber}
                  </td>

                  <td className="px-6 py-5 text-right text-slate-700">
                    {sale.items?.length || 0}
                  </td>

                  <td className="px-6 py-5 text-right text-slate-700">
                    {formatMoney(sale.itemsTotal)}
                  </td>

                  <td className="px-6 py-5 text-right text-slate-700">
                    {formatMoney(sale.carriage)}
                  </td>

                  <td className="px-6 py-5 text-right font-bold text-slate-900">
                    {formatMoney(sale.grandTotal)}
                  </td>

                  <td className="px-6 py-5 text-center">
                    <button
                      type="button"
                      onClick={() => onSelect(sale)}
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
            No Sales Found
          </h2>

          <p className="mt-2 text-slate-500">
            No sales were found for the selected date range.
          </p>
        </div>
      )}
    </div>
  );
}

export default SaleSummary;
