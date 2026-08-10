function SellerSaleDetails({ seller, sales, loading, onBack, onViewSale }) {
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

  const totalSales = sales?.length || 0;

  const totalAmount =
    sales?.reduce((sum, sale) => sum + Number(sale.grandTotal || 0), 0) || 0;

  return (
    <div>
      {/* Header */}

      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
        >
          ← Back to Sellers
        </button>
      </div>

      {/* Seller heading */}

      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900">
          {seller?.sellerName || "Seller"}
        </h2>

        <p className="mt-1 text-slate-500">
          Complete sales history for this seller.
        </p>
      </div>

      {/* Summary table */}

      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Total Sales
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                  Total Received
                </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="px-6 py-5 text-xl font-bold text-slate-900">
                  {totalSales}
                </td>

                <td className="px-6 py-5 text-right text-xl font-bold text-slate-900">
                  {formatMoney(totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* History */}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          Loading seller history...
        </div>
      ) : sales?.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h3 className="text-xl font-semibold text-slate-700">
            No Sales Found
          </h3>

          <p className="mt-2 text-slate-500">
            No sales were found for this seller.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                    Date
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

                    <td className="px-6 py-5 font-medium text-slate-900">
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

export default SellerSaleDetails;
