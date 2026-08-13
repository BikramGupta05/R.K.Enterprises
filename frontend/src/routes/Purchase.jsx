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

  /* =========================================================
     Buyer
  ========================================================= */

  const [buyerId, setBuyerId] = useState("");

  /* =========================================================
     Purchase Date
  ========================================================= */

  const [purchaseDate, setPurchaseDate] = useState("");

  /* =========================================================
     Carriage
  ========================================================= */

  const [carriage, setCarriage] = useState("");

  /* =========================================================
     Purchase Items
  ========================================================= */

  const [purchaseItems, setPurchaseItems] = useState([
    {
      itemId: "",
      quantity: "",
      pieces: "",
      price: "",
    },
  ]);

  /* =========================================================
     Form Error
  ========================================================= */

  const [formError, setFormError] = useState("");

  /* =========================================================
     Current Date
  ========================================================= */

  useEffect(() => {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, "0");

    const day = String(today.getDate()).padStart(2, "0");

    setPurchaseDate(`${year}-${month}-${day}`);
  }, []);

  /* =========================================================
     Selected Item IDs

     Used to prevent the same item from being
     selected in multiple rows.
  ========================================================= */

  const selectedItemIds = useMemo(() => {
    return new Set(
      purchaseItems
        .map((purchaseItem) => purchaseItem.itemId)
        .filter(Boolean)
        .map((id) => String(id)),
    );
  }, [purchaseItems]);

  /* =========================================================
     Add Item Row
  ========================================================= */

  const handleAddItem = () => {
    /*
     * Don't create unnecessary rows if every
     * available item is already selected.
     */

    const selectedCount = selectedItemIds.size;

    if (selectedCount >= items.length) {
      setFormError("All available items have already been added.");

      return;
    }

    setFormError("");

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

  /* =========================================================
     Remove Item Row
  ========================================================= */

  const handleRemoveItem = (index) => {
    setFormError("");

    setPurchaseItems((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  /* =========================================================
     Update Item Row
  ========================================================= */

  const handleItemChange = (index, updatedRow) => {
    setFormError("");

    setPurchaseItems((prev) =>
      prev.map((row, rowIndex) => (rowIndex === index ? updatedRow : row)),
    );
  };

  /* =========================================================
     Calculate Items Total
  ========================================================= */

  const itemsTotal = useMemo(() => {
    return purchaseItems.reduce((total, purchaseItem) => {
      const quantity = Number(purchaseItem.quantity) || 0;

      const price = Number(purchaseItem.price) || 0;

      return total + quantity * price;
    }, 0);
  }, [purchaseItems]);

  /* =========================================================
     Calculate Grand Total
  ========================================================= */

  const grandTotal = useMemo(() => {
    const carriageValue = Number(carriage) || 0;

    return itemsTotal + carriageValue;
  }, [itemsTotal, carriage]);

  /* =========================================================
     Submit Purchase
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");

    /* -------------------------------------------------------
       Buyer Validation
    ------------------------------------------------------- */

    if (!buyerId) {
      setFormError("Please select a buyer.");

      return;
    }

    /* -------------------------------------------------------
       Date Validation
    ------------------------------------------------------- */

    if (!purchaseDate) {
      setFormError("Please select a purchase date.");

      return;
    }

    /* -------------------------------------------------------
       Item Validation
    ------------------------------------------------------- */

    if (purchaseItems.length === 0) {
      setFormError("At least one item is required.");

      return;
    }

    /* -------------------------------------------------------
       Duplicate Item Validation
    ------------------------------------------------------- */

    const selectedIds = new Set();

    for (let index = 0; index < purchaseItems.length; index += 1) {
      const purchaseItem = purchaseItems[index];

      if (!purchaseItem.itemId) {
        setFormError(`Please select an item in row ${index + 1}.`);

        return;
      }

      const currentItemId = String(purchaseItem.itemId);

      if (selectedIds.has(currentItemId)) {
        setFormError(`The same item cannot be added twice. Row ${index + 1}.`);

        return;
      }

      selectedIds.add(currentItemId);

      /* -----------------------------------------------------
         Quantity
      ----------------------------------------------------- */

      if (purchaseItem.quantity === "" || Number(purchaseItem.quantity) <= 0) {
        setFormError(`Please enter a valid quantity in row ${index + 1}.`);

        return;
      }

      /* -----------------------------------------------------
         Pieces
      ----------------------------------------------------- */

      if (purchaseItem.pieces === "" || Number(purchaseItem.pieces) < 0) {
        setFormError(`Please enter a valid pieces value in row ${index + 1}.`);

        return;
      }

      /* -----------------------------------------------------
         Price
      ----------------------------------------------------- */

      if (purchaseItem.price === "" || Number(purchaseItem.price) < 0) {
        setFormError(`Please enter a valid price in row ${index + 1}.`);

        return;
      }
    }

    /* -------------------------------------------------------
       Carriage Validation
    ------------------------------------------------------- */

    if (carriage !== "" && Number(carriage) < 0) {
      setFormError("Carriage cannot be negative.");

      return;
    }

    /* -------------------------------------------------------
       Prepare Request
    ------------------------------------------------------- */

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

    /* -------------------------------------------------------
       Save Purchase
    ------------------------------------------------------- */

    const success = await addPurchase(purchaseData);

    if (success) {
      navigate("/dashboard/purchase-history");
    }
  };

  /* =========================================================
     Errors
  ========================================================= */

  const combinedError = formError || purchaseError || buyersError || itemsError;

  /* =========================================================
     Loading
  ========================================================= */

  const loading = buyersLoading || itemsLoading;

  /* =========================================================
     Can Add More Rows
  ========================================================= */

  const canAddMoreItems = !itemsLoading && selectedItemIds.size < items.length;

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-[1500px]">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              New Purchase
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Create a new purchase from one of your buyers.
            </p>
          </div>

          <div className="text-right">
            <p className="text-[11px] text-slate-500">Purchase Date</p>

            <p className="text-sm font-semibold text-slate-900">
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

        {/* ===================================================
            MAIN FORM
        =================================================== */}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* =================================================
              BUYER
          ================================================= */}

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">Buyer</h2>
            </div>

            <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
              <label className="w-28 shrink-0 text-xs font-medium text-slate-600">
                Shop Name
              </label>

              <select
                value={buyerId}
                onChange={(event) => setBuyerId(event.target.value)}
                disabled={buyersLoading}
                className="h-9 w-full max-w-xl rounded-md border border-slate-300 bg-white px-3 text-xs outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200 disabled:bg-slate-100"
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
            </div>

            {buyers.length === 0 && !buyersLoading && (
              <div className="border-t border-slate-100 px-4 py-3">
                <p className="text-xs text-slate-500">
                  You don't have any buyers yet.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/dashboard/buyers")}
                  className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Add a buyer first →
                </button>
              </div>
            )}
          </div>

          {/* =================================================
              ITEMS
          ================================================= */}

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Items Header */}

            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Items</h2>

                <p className="mt-0.5 text-[11px] text-slate-500">
                  Each item can only be added once.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                disabled={itemsLoading || !canAddMoreItems}
                className="rounded-md bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Add More Items
              </button>
            </div>

            {itemsLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Loading items...
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-slate-600">
                  You don't have any items yet.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/dashboard/items")}
                  className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Add an item first →
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[850px]">
                  {/* -----------------------------------------
                      TABLE HEADER
                  ----------------------------------------- */}

                  <div className="grid grid-cols-[minmax(240px,2.5fr)_110px_110px_130px_130px_76px] items-center border-b border-slate-300 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    <div className="pr-2">Item</div>

                    <div className="px-1">Quantity</div>

                    <div className="px-1">Pieces</div>

                    <div className="px-1">Price</div>

                    <div className="px-1 text-right">Total</div>

                    <div className="text-center">Action</div>
                  </div>

                  {/* -----------------------------------------
                      ROWS
                  ----------------------------------------- */}

                  <div>
                    {purchaseItems.map((purchaseItem, index) => (
                      <PurchaseItemRow
                        key={index}
                        row={purchaseItem}
                        index={index}
                        items={items}
                        selectedItemIds={selectedItemIds}
                        onChange={handleItemChange}
                        onRemove={handleRemoveItem}
                        canRemove={purchaseItems.length > 1}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =================================================
              PURCHASE SUMMARY
          ================================================= */}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              {/* -----------------------------------------
                  ITEMS TOTAL
              ----------------------------------------- */}

              <div className="flex min-h-[68px] items-center justify-between gap-4 px-4 py-3">
                <span className="text-xs font-medium text-slate-600">
                  Items Total
                </span>

                <span className="text-sm font-semibold text-slate-900">
                  ₹{itemsTotal.toFixed(2)}
                </span>
              </div>

              {/* -----------------------------------------
                  CARRIAGE / FARE
              ----------------------------------------- */}

              <div className="flex min-h-[68px] items-center justify-between gap-4 px-4 py-3">
                <label
                  htmlFor="carriage"
                  className="text-xs font-medium text-slate-600"
                >
                  Carriage / Fare
                </label>

                <input
                  id="carriage"
                  type="text"
                  inputMode="decimal"
                  value={carriage}
                  onChange={(event) => {
                    const value = event.target.value;

                    if (!/^\d*(\.\d{0,2})?$/.test(value)) {
                      return;
                    }

                    setCarriage(value);
                  }}
                  onWheel={(event) => {
                    event.preventDefault();

                    event.currentTarget.blur();
                  }}
                  placeholder="0.00"
                  className="h-9 w-28 rounded-md border border-slate-300 bg-white px-2.5 text-right text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
                />
              </div>

              {/* -----------------------------------------
                  GRAND TOTAL
              ----------------------------------------- */}

              <div className="flex min-h-[68px] items-center justify-between gap-4 bg-slate-50 px-4 py-3">
                <span className="text-xs font-semibold text-slate-900">
                  Grand Total
                </span>

                <span className="text-base font-bold text-slate-900">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>

              {/* -----------------------------------------
                  SAVE PURCHASE
              ----------------------------------------- */}

              <div className="flex min-h-[68px] items-center px-4 py-3">
                <button
                  type="submit"
                  disabled={
                    saving ||
                    loading ||
                    buyers.length === 0 ||
                    items.length === 0
                  }
                  className="h-9 w-full rounded-md bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Purchase"}
                </button>
              </div>
            </div>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {combinedError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              {combinedError}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Purchase;
