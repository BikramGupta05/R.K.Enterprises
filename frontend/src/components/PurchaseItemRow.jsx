import { useEffect, useState } from "react";

function PurchaseItemRow({ row, index, items, onChange, onRemove, canRemove }) {
  const [itemId, setItemId] = useState(row.itemId || "");
  const [quantity, setQuantity] = useState(row.quantity || "");
  const [pieces, setPieces] = useState(row.pieces || "");
  const [price, setPrice] = useState(row.price || "");

  useEffect(() => {
    setItemId(row.itemId || "");
    setQuantity(row.quantity ?? "");
    setPieces(row.pieces ?? "");
    setPrice(row.price ?? "");
  }, [row]);

  const calculateTotal = () => {
    const quantityValue = Number(quantity) || 0;
    const priceValue = Number(price) || 0;

    return quantityValue * priceValue;
  };

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

  const handleQuantityChange = (event) => {
    const value = event.target.value;

    setQuantity(value);

    onChange(index, {
      itemId,
      quantity: value,
      pieces,
      price,
    });
  };

  const handlePiecesChange = (event) => {
    const value = event.target.value;

    setPieces(value);

    onChange(index, {
      itemId,
      quantity,
      pieces: value,
      price,
    });
  };

  const handlePriceChange = (event) => {
    const value = event.target.value;

    setPrice(value);

    onChange(index, {
      itemId,
      quantity,
      pieces,
      price: value,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-6">
      {/* Item */}

      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-600">
          Item
        </label>

        <select
          value={itemId}
          onChange={handleItemChange}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-slate-500"
        >
          <option value="">Select Item</option>

          {items.map((item) => (
            <option key={item._id} value={item._id}>
              {item.title}
            </option>
          ))}
        </select>
      </div>

      {/* Quantity */}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">
          Quantity
        </label>

        <input
          type="number"
          min="0"
          step="any"
          value={quantity}
          onChange={handleQuantityChange}
          placeholder="0"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-slate-500"
        />
      </div>

      {/* Pieces */}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">
          Pieces
        </label>

        <input
          type="number"
          min="0"
          step="1"
          value={pieces}
          onChange={handlePiecesChange}
          placeholder="0"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-slate-500"
        />
      </div>

      {/* Price */}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">
          Price
        </label>

        <input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={handlePriceChange}
          placeholder="0.00"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-slate-500"
        />
      </div>

      {/* Total + Remove */}

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Total
          </label>

          <div className="flex h-[42px] items-center rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-900">
            ₹{calculateTotal().toFixed(2)}
          </div>
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="flex h-[42px] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-600 transition hover:bg-red-100"
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
