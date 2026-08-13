import React from "react";

function PurchaseItemRow({
  row,
  index,
  items,
  selectedItemIds,
  onChange,
  onRemove,
  canRemove,
}) {
  /* =========================================================
     Available Items

     An item already selected in another row must not appear
     in this row's dropdown.

     Important:
     The item currently selected in THIS row is kept visible.
  ========================================================= */

  const availableItems = items.filter((item) => {
    const itemId = String(item._id);

    const currentItemId = String(row.itemId || "");

    /*
     * Keep the current row's selected item visible.
     */
    if (itemId === currentItemId) {
      return true;
    }

    /*
     * Hide items selected in another row.
     */
    return !selectedItemIds.has(itemId);
  });

  /* =========================================================
     Total
  ========================================================= */

  const quantity = Number(row.quantity) || 0;

  const price = Number(row.price) || 0;

  const total = quantity * price;

  /* =========================================================
     Item Change
  ========================================================= */

  const handleItemChange = (event) => {
    const itemId = event.target.value;

    /*
     * Extra protection:
     *
     * Even if an item somehow becomes selected in another row,
     * don't allow the duplicate selection.
     */
    if (
      itemId &&
      selectedItemIds.has(String(itemId)) &&
      String(itemId) !== String(row.itemId || "")
    ) {
      return;
    }

    onChange(index, {
      ...row,
      itemId,
    });
  };

  /* =========================================================
     Quantity Change
  ========================================================= */

  const handleQuantityChange = (event) => {
    onChange(index, {
      ...row,
      quantity: event.target.value,
    });
  };

  /* =========================================================
     Pieces Change
  ========================================================= */

  const handlePiecesChange = (event) => {
    onChange(index, {
      ...row,
      pieces: event.target.value,
    });
  };

  /* =========================================================
     Price Change
  ========================================================= */

  const handlePriceChange = (event) => {
    onChange(index, {
      ...row,
      price: event.target.value,
    });
  };

  return (
    <div className="grid grid-cols-[minmax(240px,2.5fr)_110px_110px_130px_130px_76px] items-center border-b border-slate-200 px-3 py-2 last:border-b-0">
      {/* =====================================================
          ITEM
      ===================================================== */}

      <div className="pr-2">
        <select
          value={row.itemId || ""}
          onChange={handleItemChange}
          className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
        >
          <option value="">Select Item</option>

          {availableItems.map((item) => (
            <option key={item._id} value={item._id}>
              {item.title}
            </option>
          ))}
        </select>
      </div>

      {/* =====================================================
          QUANTITY
      ===================================================== */}

      <div className="px-1">
        <input
          type="number"
          min="0"
          step="any"
          value={row.quantity}
          onChange={handleQuantityChange}
          className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
        />
      </div>

      {/* =====================================================
          PIECES
      ===================================================== */}

      <div className="px-1">
        <input
          type="number"
          min="0"
          step="1"
          value={row.pieces}
          onChange={handlePiecesChange}
          className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
        />
      </div>

      {/* =====================================================
          PRICE
      ===================================================== */}

      <div className="px-1">
        <input
          type="number"
          min="0"
          step="0.01"
          value={row.price}
          onChange={handlePriceChange}
          className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
        />
      </div>

      {/* =====================================================
          TOTAL
      ===================================================== */}

      <div className="px-1">
        <div className="flex h-9 items-center justify-end rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold tabular-nums text-slate-800">
          ₹{total.toFixed(2)}
        </div>
      </div>

      {/* =====================================================
          REMOVE
      ===================================================== */}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
          className="h-9 rounded-md border border-red-200 bg-white px-2.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default PurchaseItemRow;
