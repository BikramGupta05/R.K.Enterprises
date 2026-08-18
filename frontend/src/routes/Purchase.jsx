import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PurchaseItemRow from "../components/PurchaseItemRow";
import usePurchases from "../hooks/usePurchases";
import useBuyers from "../hooks/useBuyers";
import useItems from "../hooks/useItems";
import useMoneyDue from "../hooks/useMoneyDue";

const PAYMENT_METHODS = ["Cash", "UPI", "Net Banking", "Other"];

const formatDateForInput = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const createEmptyItem = () => ({
  itemId: "",
  quantity: "",
  pieces: "",
  price: "",
});

function Purchase() {
  const navigate = useNavigate();
  const { purchaseId } = useParams();

  const isEditMode = Boolean(purchaseId);

  const {
    addPurchase,
    editPurchase,
    fetchPurchase,
    saving,
    error: purchaseError,
  } = usePurchases();

  const { buyers, loading: buyersLoading, error: buyersError } = useBuyers();

  const { items, loading: itemsLoading, error: itemsError } = useItems();

  const { fetchBuyerAccount } = useMoneyDue();

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

  const [purchaseItems, setPurchaseItems] = useState([createEmptyItem()]);

  /* =========================================================
     Initial Payment

     This is the amount paid at the time of purchase.
     Later buyer payments are handled from Money Due.
  ========================================================= */

  const [paidAmount, setPaidAmount] = useState("");

  const [originalPaidAmount, setOriginalPaidAmount] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState("");

  const [paymentNote, setPaymentNote] = useState("");

  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState("");

  /* =========================================================
     Form State
  ========================================================= */

  const [formError, setFormError] = useState("");

  const [pageLoading, setPageLoading] = useState(isEditMode);

  const [buyerAccount, setBuyerAccount] = useState(null);

  /* =========================================================
     Current Date
  ========================================================= */

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    setPurchaseDate(`${year}-${month}-${day}`);
  }, [isEditMode]);

  /* =========================================================
     Load Existing Purchase For Edit
  ========================================================= */

  useEffect(() => {
    let active = true;

    const loadPurchase = async () => {
      if (!isEditMode) {
        return;
      }

      setPageLoading(true);
      setFormError("");

      const purchase = await fetchPurchase(purchaseId);

      if (!active) {
        return;
      }

      if (!purchase) {
        setFormError("Unable to load the purchase for editing.");
        setPageLoading(false);
        return;
      }

      const loadedBuyerId =
        purchase.buyer?._id || purchase.buyer || "";

      setBuyerId(String(loadedBuyerId));
      setPurchaseDate(formatDateForInput(purchase.purchaseDate));
      setCarriage(String(purchase.carriage ?? ""));
      const loadedPaidAmount = Number(purchase.paidAtPurchase || 0);

      setPaidAmount(loadedPaidAmount > 0 ? String(loadedPaidAmount) : "");
      setOriginalPaidAmount(loadedPaidAmount);

      const loadedItems = Array.isArray(purchase.items)
        ? purchase.items.map((item) => ({
            itemId: String(item.item?._id || item.item || ""),
            quantity: String(item.quantity ?? ""),
            pieces: String(item.pieces ?? ""),
            price: String(item.price ?? ""),
          }))
        : [];

      setPurchaseItems(loadedItems.length > 0 ? loadedItems : [createEmptyItem()]);

      /*
       * The initial payment's method/note/reference belongs to the
       * PURCHASE payment. The buyer account endpoint already exposes
       * that payment, so we reuse the existing Money Due API instead
       * of creating another backend endpoint.
       */
      if (loadedBuyerId) {
        const accountData = await fetchBuyerAccount(String(loadedBuyerId));

        if (!active) {
          return;
        }

        setBuyerAccount(accountData?.account || null);

        const initialPayment = (accountData?.payments || []).find(
          (payment) =>
            payment.source === "PURCHASE" &&
            String(payment.purchase?._id || payment.purchase || "") ===
              String(purchase._id),
        );

        if (initialPayment) {
          setPaymentMethod(initialPayment.paymentMethod || "");
          setPaymentNote(initialPayment.note || "");
          setPaymentReferenceNumber(initialPayment.referenceNumber || "");
        }
      }

      setPageLoading(false);
    };

    loadPurchase();

    return () => {
      active = false;
    };
  }, [isEditMode, purchaseId]);

  /* =========================================================
     Selected Item IDs
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
    if (selectedItemIds.size >= items.length) {
      setFormError("All available items have already been added.");
      return;
    }

    setFormError("");

    setPurchaseItems((prev) => [...prev, createEmptyItem()]);
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
     Calculate Current Due
  ========================================================= */

  const currentPaidAmount = Number(paidAmount) || 0;

  const currentDue = Math.max(grandTotal - currentPaidAmount, 0);

  /* =========================================================
     Maximum Safe Initial Payment During Edit

     Later Money Due payments belong to the buyer account.
     During edit, the initial purchase payment cannot be
     increased so far that the buyer account becomes overpaid.
  ========================================================= */

  const maximumInitialPayment = useMemo(() => {
    if (!isEditMode || !buyerAccount) {
      return grandTotal;
    }

    const totalPaid = Number(buyerAccount.totalPaid) || 0;
    const otherPaidAmount = Math.max(totalPaid - originalPaidAmount, 0);

    return Math.max(grandTotal - otherPaidAmount, 0);
  }, [
    isEditMode,
    buyerAccount,
    grandTotal,
    originalPaidAmount,
  ]);

  /* =========================================================
     Payment Field Change
  ========================================================= */

  const handlePaidAmountChange = (event) => {
    const value = event.target.value;

    if (!/^\d*(\.\d{0,2})?$/.test(value)) {
      return;
    }

    setFormError("");
    setPaidAmount(value);
  };

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

    /* -------------------------------------------------------
       Carriage Validation
    ------------------------------------------------------- */

    if (carriage !== "" && Number(carriage) < 0) {
      setFormError("Carriage cannot be negative.");
      return;
    }

    /* -------------------------------------------------------
       Payment Validation
    ------------------------------------------------------- */

    if (paidAmount !== "" && Number(paidAmount) < 0) {
      setFormError("Paid amount cannot be negative.");
      return;
    }

    if (currentPaidAmount > grandTotal) {
      setFormError(
        `Paid amount cannot be greater than the purchase total of ₹${grandTotal.toFixed(2)}.`,
      );
      return;
    }

    if (isEditMode && currentPaidAmount > maximumInitialPayment + 0.000001) {
      setFormError(
        `Paid amount cannot be greater than ₹${maximumInitialPayment.toFixed(2)} because this buyer already has other payments recorded.`,
      );
      return;
    }

    if (currentPaidAmount > 0 && !paymentMethod) {
      setFormError("Please select a payment method for the paid amount.");
      return;
    }

    if (currentPaidAmount === 0) {
      /*
       * A zero initial payment does not need payment metadata.
       */
      setPaymentMethod("");
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
      paidAmount: currentPaidAmount,
      paymentMethod: currentPaidAmount > 0 ? paymentMethod : undefined,
      paymentNote: currentPaidAmount > 0 ? paymentNote.trim() : "",
      paymentReferenceNumber:
        currentPaidAmount > 0 ? paymentReferenceNumber.trim() : "",
    };

    /* -------------------------------------------------------
       Save Purchase
    ------------------------------------------------------- */

    const success = isEditMode
      ? await editPurchase(purchaseId, purchaseData)
      : await addPurchase(purchaseData);

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

  const loading = buyersLoading || itemsLoading || pageLoading;

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
              {isEditMode ? "Edit Purchase" : "New Purchase"}
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              {isEditMode
                ? "Update the purchase details and the amount paid at purchase."
                : "Create a new purchase and record any amount paid immediately."}
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

        {pageLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-xs text-slate-500 shadow-sm">
            Loading purchase...
          </div>
        ) : (
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
                  onChange={async (event) => {
                    const nextBuyerId = event.target.value;

                    setBuyerId(nextBuyerId);
                    setFormError("");

                    if (isEditMode && nextBuyerId) {
                      const accountData = await fetchBuyerAccount(nextBuyerId);
                      setBuyerAccount(accountData?.account || null);
                    }
                  }}
                  disabled={buyersLoading || saving || isEditMode}
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

              {isEditMode && (
                <div className="border-t border-slate-100 px-4 py-2">
                  <p className="text-[11px] text-slate-500">
                    Buyer cannot be changed while editing a purchase. This
                    keeps the existing buyer payment ledger consistent.
                  </p>
                </div>
              )}

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
                  disabled={itemsLoading || !canAddMoreItems || saving}
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
                    <div className="grid grid-cols-[minmax(240px,2.5fr)_110px_110px_130px_130px_76px] items-center border-b border-slate-300 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      <div className="pr-2">Item</div>
                      <div className="px-1">Quantity</div>
                      <div className="px-1">Pieces</div>
                      <div className="px-1">Price</div>
                      <div className="px-1 text-right">Total</div>
                      <div className="text-center">Action</div>
                    </div>

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
                PAYMENT
            ================================================= */}

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Payment at Purchase
                  </h2>

                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Record how much you are paying now. The remaining amount
                    will automatically appear in Money Due.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label
                    htmlFor="paidAmount"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Amount Paid Now
                  </label>

                  <input
                    id="paidAmount"
                    type="text"
                    inputMode="decimal"
                    value={paidAmount}
                    onChange={handlePaidAmountChange}
                    onWheel={(event) => {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }}
                    placeholder="0.00"
                    disabled={saving}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-200 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="paymentMethod"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Payment Method
                  </label>

                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    disabled={saving || currentPaidAmount <= 0}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200 disabled:bg-slate-100"
                  >
                    <option value="">Select Method</option>

                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="paymentReferenceNumber"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Reference Number
                  </label>

                  <input
                    id="paymentReferenceNumber"
                    type="text"
                    value={paymentReferenceNumber}
                    onChange={(event) =>
                      setPaymentReferenceNumber(event.target.value)
                    }
                    placeholder="Optional"
                    disabled={saving || currentPaidAmount <= 0}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-200 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="paymentNote"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Note
                  </label>

                  <input
                    id="paymentNote"
                    type="text"
                    value={paymentNote}
                    onChange={(event) => setPaymentNote(event.target.value)}
                    placeholder="Optional"
                    disabled={saving || currentPaidAmount <= 0}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-200 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:grid-cols-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500">Grand Total</span>
                  <span className="text-sm font-semibold text-slate-900">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500">Paid Now</span>
                  <span className="text-sm font-semibold text-slate-900">
                    ₹{currentPaidAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-slate-600">
                    Amount Due
                  </span>
                  <span className="text-sm font-bold text-amber-700">
                    ₹{currentDue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* =================================================
                PURCHASE SUMMARY
            ================================================= */}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                <div className="flex min-h-[68px] items-center justify-between gap-4 px-4 py-3">
                  <span className="text-xs font-medium text-slate-600">
                    Items Total
                  </span>

                  <span className="text-sm font-semibold text-slate-900">
                    ₹{itemsTotal.toFixed(2)}
                  </span>
                </div>

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
                    disabled={saving}
                    className="h-9 w-28 rounded-md border border-slate-300 bg-white px-2.5 text-right text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-200 disabled:bg-slate-100"
                  />
                </div>

                <div className="flex min-h-[68px] items-center justify-between gap-4 bg-slate-50 px-4 py-3">
                  <span className="text-xs font-semibold text-slate-900">
                    Grand Total
                  </span>

                  <span className="text-base font-bold text-slate-900">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>

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
                    {saving
                      ? isEditMode
                        ? "Updating..."
                        : "Saving..."
                      : isEditMode
                        ? "Update Purchase"
                        : "Save Purchase"}
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
        )}
      </div>
    </div>
  );
}

export default Purchase;
