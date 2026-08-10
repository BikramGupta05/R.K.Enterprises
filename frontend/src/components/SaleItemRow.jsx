function SaleItemRow({ row, index, stocks, onChange, onRemove, canRemove }) {
  const selectedStock = stocks.find(
    (stock) => stock.item === row.itemId || stock.item?._id === row.itemId,
  );

  const availableQuantity = selectedStock?.quantity ?? 0;

  const availablePieces = selectedStock?.pieces ?? 0;

  const rowTotal = Number(row.quantity || 0) * Number(row.price || 0);

  return (
    <tr className="border-b border-slate-200">
      {/* Item */}

      <td className="p-3 align-top">
        <select
          value={row.itemId}
          onChange={(event) => onChange(index, "itemId", event.target.value)}
          className="w-full min-w-[180px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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

      {/* Available */}

      <td className="p-3 align-top">
        <div className="min-w-[120px] rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <p>
            Qty: <span className="font-semibold">{availableQuantity}</span>
          </p>

          <p className="mt-1">
            Pieces: <span className="font-semibold">{availablePieces}</span>
          </p>
        </div>
      </td>

      {/* Quantity */}

      <td className="p-3 align-top">
        <input
          type="number"
          min="0"
          step="1"
          value={row.quantity}
          onChange={(event) => onChange(index, "quantity", event.target.value)}
          className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          placeholder="Qty"
        />
      </td>

      {/* Pieces */}

      <td className="p-3 align-top">
        <input
          type="number"
          min="0"
          step="1"
          value={row.pieces}
          onChange={(event) => onChange(index, "pieces", event.target.value)}
          className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          placeholder="Pieces"
        />
      </td>

      {/* Price */}

      <td className="p-3 align-top">
        <input
          type="number"
          min="0"
          step="0.01"
          value={row.price}
          onChange={(event) => onChange(index, "price", event.target.value)}
          className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          placeholder="Price"
        />
      </td>

      {/* Total */}

      <td className="p-3 align-top">
        <div className="min-w-[100px] rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
          ₹{rowTotal.toFixed(2)}
        </div>
      </td>

      {/* Remove */}

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
