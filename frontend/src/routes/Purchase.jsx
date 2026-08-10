import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PurchaseItemRow from "../components/PurchaseItemRow";
import usePurchases from "../hooks/usePurchases";
import useBuyers from "../hooks/useBuyers";
import useItems from "../hooks/useItems";

function Purchase() {
  const navigate = useNavigate();

  const { addPurchase, saving, error: purchaseError } = usePurchases();

  const { buyers, loading: buyersLoading, error: buyersError } = useBuyers();

  const { items, loading: itemsLoading, error: itemsError } = useItems();

  const [buyerId, setBuyerId] = useState("");

  const [purchaseDate, setPurchaseDate] = useState("");

  const [carriage, setCarriage] = useState("");

  const [purchaseItems, setPurchaseItems] = useState([
    {
      itemId: "",
      quantity: "",
      pieces: "",
      price: "",
    },
  ]);

  const [formError, setFormError] = useState("");

  /* -------------------- Current Date -------------------- */

  useEffect(() => {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, "0");

    const day = String(today.getDate()).padStart(2, "0");

    setPurchaseDate(`${year}-${month}-${day}`);
  }, []);

  /* -------------------- Add Item Row -------------------- */

  const handleAddItem = () => {
    setPurchaseItems((prev) => [
      ...prev,
      {
        itemId: "",
        quantity: "",
        pieces: "",
        price: "",
      },
    ]);
  };

  /* -------------------- Remove Item Row -------------------- */

  const handleRemoveItem = (index) => {
    setPurchaseItems((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  /* -------------------- Update Item Row -------------------- */

  const handleItemChange = (index, updatedRow) => {
    setPurchaseItems((prev) =>
      prev.map((row, rowIndex) => (rowIndex === index ? updatedRow : row)),
    );
  };

  /* -------------------- Calculate Item Total -------------------- */

  const itemsTotal = useMemo(() => {
    return purchaseItems.reduce((total, purchaseItem) => {
      const quantity = Number(purchaseItem.quantity) || 0;

      const price = Number(purchaseItem.price) || 0;

      return total + quantity * price;
    }, 0);
  }, [purchaseItems]);

  /* -------------------- Calculate Grand Total -------------------- */

  const grandTotal = useMemo(() => {
    const carriageValue = Number(carriage) || 0;

    return itemsTotal + carriageValue;
  }, [itemsTotal, carriage]);

  /* -------------------- Submit Purchase -------------------- */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");

    /* ---------- Buyer Validation ---------- */

    if (!buyerId) {
      setFormError("Please select a buyer.");

      return;
    }

    /* ---------- Date Validation ---------- */

    if (!purchaseDate) {
      setFormError("Please select a purchase date.");

      return;
    }

    /* ---------- Item Validation ---------- */

    if (purchaseItems.length === 0) {
      setFormError("At least one item is required.");

      return;
    }

    for (let index = 0; index < purchaseItems.length; index++) {
      const purchaseItem = purchaseItems[index];

      if (!purchaseItem.itemId) {
        setFormError(`Please select an item in row ${index + 1}.`);

        return;
      }

      if (purchaseItem.quantity === "" || Number(purchaseItem.quantity) <= 0) {
        setFormError(`Please enter a valid quantity in row ${index + 1}.`);

        return;
      }

      if (purchaseItem.pieces === "" || Number(purchaseItem.pieces) < 0) {
        setFormError(`Please enter a valid pieces value in row ${index + 1}.`);

        return;
      }

      if (purchaseItem.price === "" || Number(purchaseItem.price) < 0) {
        setFormError(`Please enter a valid price in row ${index + 1}.`);

        return;
      }
    }

    /* ---------- Carriage Validation ---------- */

    if (carriage !== "" && Number(carriage) < 0) {
      setFormError("Carriage cannot be negative.");

      return;
    }

    /* ---------- Prepare Request ---------- */

    const purchaseData = {
      buyerId,

      purchaseDate,

      items: purchaseItems.map((purchaseItem) => ({
        itemId: purchaseItem.itemId,

        quantity: Number(purchaseItem.quantity),

        pieces: Number(purchaseItem.pieces),

        price: Number(purchaseItem.price),
      })),

      carriage: carriage === "" ? 0 : Number(carriage),
    };

    /* ---------- Save Purchase ---------- */

    const success = await addPurchase(purchaseData);

    if (success) {
      navigate("/purchase-history");
    }
  };

  /* -------------------- Errors -------------------- */

  const combinedError = formError || purchaseError || buyersError || itemsError;

  const loading = buyersLoading || itemsLoading;

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto w-full max-w-7xl">
        {/* ---------------- Header ---------------- */}

        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
          >
            ← Back
          </button>

          <div className="text-right">
            <p className="text-sm text-slate-500">Purchase Date</p>

            <p className="text-lg font-semibold text-slate-900">
              {purchaseDate
                ? new Date(`${purchaseDate}T00:00:00`).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    },
                  )
                : "Loading..."}
            </p>
          </div>
        </div>

        {/* ---------------- Title ---------------- */}

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">New Purchase</h1>

          <p className="mt-2 text-slate-500">
            Create a new purchase from one of your buyers.
          </p>
        </div>

        {/* ---------------- Main Form ---------------- */}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ---------------- Buyer Section ---------------- */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Buyer</h2>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Shop Name
            </label>

            <select
              value={buyerId}
              onChange={(event) => setBuyerId(event.target.value)}
              disabled={buyersLoading}
              className="w-full max-w-xl rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500 disabled:bg-slate-100"
            >
              <option value="">
                {buyersLoading ? "Loading buyers..." : "Select Buyer"}
              </option>

              {buyers.map((buyer) => (
                <option key={buyer._id} value={buyer._id}>
                  {buyer.shopName}
                </option>
              ))}
            </select>

            {buyers.length === 0 && !buyersLoading && (
              <div className="mt-3">
                <p className="text-sm text-slate-500">
                  You don't have any buyers yet.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/buyers")}
                  className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Add a buyer first →
                </button>
              </div>
            )}
          </div>

          {/* ---------------- Items Section ---------------- */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Items</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add the items purchased from this buyer.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                disabled={itemsLoading}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Add More Items
              </button>
            </div>

            {itemsLoading ? (
              <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">
                Loading items...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-8 text-center">
                <p className="text-slate-600">You don't have any items yet.</p>

                <button
                  type="button"
                  onClick={() => navigate("/items")}
                  className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Add an item first →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {purchaseItems.map((purchaseItem, index) => (
                  <PurchaseItemRow
                    key={index}
                    row={purchaseItem}
                    index={index}
                    items={items}
                    onChange={handleItemChange}
                    onRemove={handleRemoveItem}
                    canRemove={purchaseItems.length > 1}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ---------------- Summary ---------------- */}

          <div className="flex justify-end">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold text-slate-900">
                Purchase Summary
              </h2>

              {/* Item Total */}

              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <span className="text-slate-600">Items Total</span>

                <span className="font-semibold text-slate-900">
                  ₹{itemsTotal.toFixed(2)}
                </span>
              </div>

              {/* Carriage */}

              <div className="border-b border-slate-200 py-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Carriage / Fare
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={carriage}
                  onChange={(event) => setCarriage(event.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:border-slate-500"
                />
              </div>

              {/* Grand Total */}

              <div className="flex items-center justify-between pt-5">
                <span className="text-lg font-semibold text-slate-900">
                  Grand Total
                </span>

                <span className="text-2xl font-bold text-slate-900">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* ---------------- Error ---------------- */}

          {combinedError && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {combinedError}
            </div>
          )}

          {/* ---------------- Save Button ---------------- */}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={
                saving || loading || buyers.length === 0 || items.length === 0
              }
              className="rounded-xl bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving Purchase..." : "Save Purchase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Purchase;
