function SaleItemRow({ row, index, stocks, onChange, onRemove, canRemove }) {
  /* =========================================================
     Selected Stock
  ========================================================= */

  const selectedStock = stocks.find((stock) => {
    const stockItemId = stock.item?._id || stock.item;

    return stockItemId === row.itemId;
  });

  /* =========================================================
     Available Stock
  ========================================================= */

  const availableQuantity = Number(selectedStock?.quantity || 0);

  const availablePieces = Number(selectedStock?.pieces || 0);

  /* =========================================================
     Row Total
  ========================================================= */

  const quantity = Number(row.quantity) || 0;
  const price = Number(row.price) || 0;

  const rowTotal = quantity * price;

  /* =========================================================
     Render
  ========================================================= */

  return (
    <tr className="border-b border-slate-200 last:border-b-0">
      {/* =====================================================
          Item
      ===================================================== */}

      <td className="p-3 align-top">
        <select
          value={row.itemId}
          onChange={(event) => onChange(index, "itemId", event.target.value)}
          className="w-full min-w-[180px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          <option value="">Select item</option>

          {stocks.map((stock) => {
            const itemId = stock.item?._id || stock.item;

            return (
              <option key={stock._id} value={itemId}>
                {stock.itemName}
              </option>
            );
          })}
        </select>
      </td>

      {/* =====================================================
          Available Stock
      ===================================================== */}

      <td className="p-3 align-top">
        <div className="min-w-[120px] rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <p>
            Qty:{" "}
            <span className="font-semibold text-slate-900">
              {availableQuantity}
            </span>
          </p>

          <p className="mt-1">
            Pieces:{" "}
            <span className="font-semibold text-slate-900">
              {availablePieces}
            </span>
          </p>
        </div>
      </td>

      {/* =====================================================
          Quantity
      ===================================================== */}

      <td className="p-3 align-top">
        <input
          type="number"
          min="0"
          step="1"
          value={row.quantity}
          onChange={(event) => onChange(index, "quantity", event.target.value)}
          className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          placeholder="Qty"
        />
      </td>

      {/* =====================================================
          Pieces
      ===================================================== */}

      <td className="p-3 align-top">
        <input
          type="number"
          min="0"
          step="1"
          value={row.pieces}
          onChange={(event) => onChange(index, "pieces", event.target.value)}
          className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          placeholder="Pieces"
        />
      </td>

      {/* =====================================================
          Selling Price
      ===================================================== */}

      <td className="p-3 align-top">
        <input
          type="number"
          min="0"
          step="0.01"
          value={row.price}
          onChange={(event) => onChange(index, "price", event.target.value)}
          className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          placeholder="Price"
        />
      </td>

      {/* =====================================================
          Total
      ===================================================== */}

      <td className="p-3 align-top">
        <div className="min-w-[110px] px-3 py-2 text-sm font-semibold text-slate-900">
          ₹{rowTotal.toFixed(2)}
        </div>
      </td>

      {/* =====================================================
          Remove
      ===================================================== */}

      <td className="p-3 align-top">
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
          >
            Remove
          </button>
        )}
      </td>
    </tr>
  );
}

export default SaleItemRow;
