import { useEffect, useState } from "react";

function PurchaseItemRow({ row, index, items, onChange, onRemove, canRemove }) {
  const [itemId, setItemId] = useState(row.itemId || "");
  const [quantity, setQuantity] = useState(row.quantity ?? "");
  const [pieces, setPieces] = useState(row.pieces ?? "");
  const [price, setPrice] = useState(row.price ?? "");

  useEffect(() => {
    setItemId(row.itemId || "");
    setQuantity(row.quantity ?? "");
    setPieces(row.pieces ?? "");
    setPrice(row.price ?? "");
  }, [row]);

  /* =========================================================
     Calculate Total
  ========================================================= */

  const calculateTotal = () => {
    const quantityValue = Number(quantity) || 0;
    const priceValue = Number(price) || 0;

    return quantityValue * priceValue;
  };

  /* =========================================================
     Prevent Mouse Wheel Changes
  ========================================================= */

  const preventWheelChange = (event) => {
    event.preventDefault();
    event.currentTarget.blur();
  };

  /* =========================================================
     Quantity
     
     Allowed:
     1
     8
     8.5
     8.55

     Not allowed:
     8.555
     e
     +
     -
     abc
  ========================================================= */

  const handleQuantityChange = (event) => {
    const value = event.target.value;

    if (!/^\d*(\.\d{0,2})?$/.test(value)) {
      return;
    }

    setQuantity(value);

    onChange(index, {
      itemId,
      quantity: value,
      pieces,
      price,
    });
  };

  /* =========================================================
     Pieces
     
     Whole numbers only.
  ========================================================= */

  const handlePiecesChange = (event) => {
    const value = event.target.value;

    if (!/^\d*$/.test(value)) {
      return;
    }

    setPieces(value);

    onChange(index, {
      itemId,
      quantity,
      pieces: value,
      price,
    });
  };

  /* =========================================================
     Price
     
     Maximum 2 decimal places.
  ========================================================= */

  const handlePriceChange = (event) => {
    const value = event.target.value;

    if (!/^\d*(\.\d{0,2})?$/.test(value)) {
      return;
    }

    setPrice(value);

    onChange(index, {
      itemId,
      quantity,
      pieces,
      price: value,
    });
  };

  /* =========================================================
     Item Change
  ========================================================= */

  const handleItemChange = (event) => {
    const value = event.target.value;

    setItemId(value);

    onChange(index, {
      itemId: value,
      quantity,
      pieces,
      price,
    });
  };

  return (
    <div className="grid grid-cols-[minmax(240px,2.5fr)_110px_110px_130px_130px_76px] items-center border-b border-slate-200 bg-white px-3 py-2 last:border-b-0">
      {/* =====================================================
          ITEM
      ===================================================== */}

      <div className="pr-2">
        <select
          value={itemId}
          onChange={handleItemChange}
          className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
        >
          <option value="">Select Item</option>

          {items.map((item) => (
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
          type="text"
          inputMode="decimal"
          value={quantity}
          onChange={handleQuantityChange}
          onWheel={preventWheelChange}
          placeholder="0.00"
          className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
        />
      </div>

      {/* =====================================================
          PIECES
      ===================================================== */}

      <div className="px-1">
        <input
          type="text"
          inputMode="numeric"
          value={pieces}
          onChange={handlePiecesChange}
          onWheel={preventWheelChange}
          placeholder="0"
          className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
        />
      </div>

      {/* =====================================================
          PRICE
      ===================================================== */}

      <div className="px-1">
        <input
          type="text"
          inputMode="decimal"
          value={price}
          onChange={handlePriceChange}
          onWheel={preventWheelChange}
          placeholder="0.00"
          className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
        />
      </div>

      {/* =====================================================
          TOTAL
      ===================================================== */}

      <div className="px-1">
        <div className="flex h-9 items-center justify-end rounded-md border border-slate-200 bg-slate-50 px-2.5 text-sm font-semibold text-slate-900">
          ₹{calculateTotal().toFixed(2)}
        </div>
      </div>

      {/* =====================================================
          REMOVE
      ===================================================== */}

      <div className="flex justify-center pl-1">
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="h-9 rounded-md border border-red-200 bg-red-50 px-2.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
            title="Remove item"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

export default PurchaseItemRow;
