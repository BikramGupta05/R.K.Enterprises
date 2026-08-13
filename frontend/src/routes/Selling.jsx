import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import SaleItemRow from "../components/SaleItemRow.jsx";
import useSales from "../hooks/useSales.js";
import useSellers from "../hooks/useSellers.js";
import useStock from "../hooks/useStock.js";

/* =========================================================
   Constants
========================================================= */

const EMPTY_ROW = {
  itemId: "",
  quantity: "",
  pieces: "",
  price: "",
};

const PAYMENT_METHODS = ["Cash", "UPI", "Net Banking", "Other"];

/* =========================================================
   Helpers
========================================================= */

const getTodayDate = () => {
  const today = new Date();

  return today.toISOString().split("T")[0];
};

const createEmptyRow = () => ({
  ...EMPTY_ROW,
});

/*
 * Stock can contain item either as:
 *
 * item: "itemId"
 *
 * or:
 *
 * item: { _id: "itemId" }
 *
 * Keep both cases supported.
 */
const getStockItemId = (stock) => {
  return stock?.item?._id || stock?.item || "";
};

/* =========================================================
   Selling
========================================================= */

function Selling() {
  const navigate = useNavigate();

  /* =======================================================
     Hooks
  ======================================================= */

  const { sellers, loading: sellersLoading } = useSellers();

  const { stocks, loading: stockLoading } = useStock();

  const { saving, error: saleError, addSale } = useSales();

  /* =======================================================
     Sale State
  ======================================================= */

  const [sellerId, setSellerId] = useState("");

  const [saleDate, setSaleDate] = useState(getTodayDate);

  const [rows, setRows] = useState([createEmptyRow()]);

  /* =======================================================
     Discount / Off State
  ======================================================= */

  const [off, setOff] = useState("");

  /* =======================================================
     Payment State
  ======================================================= */

  const [paidAmount, setPaidAmount] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("Cash");

  /* =======================================================
     Error
  ======================================================= */

  const [error, setError] = useState("");

  /* =======================================================
     Available Stock
  ======================================================= */

  const availableStocks = useMemo(() => {
    return stocks
      .filter((stock) => Number(stock.quantity) > 0 || Number(stock.pieces) > 0)
      .sort((a, b) =>
        (a.itemName || "").localeCompare(b.itemName || "", undefined, {
          sensitivity: "base",
        }),
      );
  }, [stocks]);

  /* =======================================================
     Selected Item IDs
  ======================================================= */

  const selectedItemIds = useMemo(() => {
    return new Set(rows.map((row) => row.itemId).filter(Boolean));
  }, [rows]);

  /* =======================================================
     Stocks Available For Each Row
  ======================================================= */

  const getStocksForRow = (rowIndex) => {
    const currentRowItemId = rows[rowIndex]?.itemId || "";

    return availableStocks.filter((stock) => {
      const stockItemId = getStockItemId(stock);

      /*
       * Always keep the currently selected item visible
       * in its own dropdown.
       */
      if (stockItemId === currentRowItemId) {
        return true;
      }

      /*
       * Hide items already selected in another row.
       */
      return !selectedItemIds.has(stockItemId);
    });
  };

  /* =======================================================
     Items Total
  ======================================================= */

  const itemsTotal = useMemo(() => {
    return rows.reduce((total, row) => {
      const quantity = Number(row.quantity) || 0;

      const price = Number(row.price) || 0;

      return total + quantity * price;
    }, 0);
  }, [rows]);

  /* =======================================================
     Off / Discount Amount
  ======================================================= */

  const numericOff = Number(off) || 0;

  /*
   * Never allow Off to be greater than Items Total.
   */
  const discountAmount = Math.min(Math.max(numericOff, 0), itemsTotal);

  /* =======================================================
     Final Total
  ======================================================= */

  const grandTotal = Math.max(itemsTotal - discountAmount, 0);

  /* =======================================================
     Payment Calculations
  ======================================================= */

  const numericPaidAmount = Number(paidAmount) || 0;

  const creditAmount = Math.max(grandTotal - numericPaidAmount, 0);

  const paymentStatus =
    creditAmount === 0 ? "PAID" : numericPaidAmount > 0 ? "PARTIAL" : "CREDIT";

  /* =======================================================
     Loading
  ======================================================= */

  const loading = sellersLoading || stockLoading;

  /* =======================================================
     Row Change
  ======================================================= */

  const handleRowChange = (index, field, value) => {
    setRows((currentRows) => {
      const updatedRows = [...currentRows];

      /*
       * Prevent duplicate selection even if the event
       * somehow comes from the UI.
       */
      if (field === "itemId" && value) {
        const alreadySelected = currentRows.some(
          (row, rowIndex) => rowIndex !== index && row.itemId === value,
        );

        if (alreadySelected) {
          return currentRows;
        }
      }

      updatedRows[index] = {
        ...updatedRows[index],
        [field]: value,
      };

      /*
       * When item changes, reset quantity and pieces.
       * Price is intentionally preserved.
       */
      if (field === "itemId") {
        updatedRows[index] = {
          ...updatedRows[index],
          itemId: value,
          quantity: "",
          pieces: "",
        };
      }

      return updatedRows;
    });
  };

  /* =======================================================
     Add Row
  ======================================================= */

  const handleAddRow = () => {
    /*
     * No reason to add another row if every available
     * stock item has already been selected.
     */
    if (selectedItemIds.size >= availableStocks.length) {
      return;
    }

    setRows((currentRows) => [...currentRows, createEmptyRow()]);
  };

  /* =======================================================
     Remove Row
  ======================================================= */

  const handleRemoveRow = (index) => {
    setRows((currentRows) =>
      currentRows.filter((_, rowIndex) => rowIndex !== index),
    );
  };

  /* =======================================================
     Off Change
  ======================================================= */

  const handleOffChange = (event) => {
    const value = event.target.value;

    /*
     * Allow empty input.
     */
    if (value === "") {
      setOff("");

      return;
    }

    const amount = Number(value);

    /*
     * Ignore invalid values.
     */
    if (!Number.isFinite(amount)) {
      return;
    }

    /*
     * No negative discount.
     */
    if (amount < 0) {
      return;
    }

    /*
     * Don't allow Off to exceed Items Total.
     */
    if (amount > itemsTotal) {
      setOff(itemsTotal.toFixed(2));

      return;
    }

    setOff(value);
  };

  /* =======================================================
     Payment Change
  ======================================================= */

  const handlePaidAmountChange = (event) => {
    const value = event.target.value;

    if (value === "") {
      setPaidAmount("");

      return;
    }

    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return;
    }

    if (amount < 0) {
      return;
    }

    /*
     * Paid amount cannot exceed Final Total.
     */
    if (amount > grandTotal) {
      setPaidAmount(grandTotal.toFixed(2));

      return;
    }

    setPaidAmount(value);
  };

  /* =======================================================
     Validation
  ======================================================= */

  const validateForm = () => {
    /* -------------------------------------------------------
       Seller
    ------------------------------------------------------- */

    if (!sellerId) {
      return "Please select a seller.";
    }

    /* -------------------------------------------------------
       Date
    ------------------------------------------------------- */

    if (!saleDate) {
      return "Please select a sale date.";
    }

    /* -------------------------------------------------------
       Items
    ------------------------------------------------------- */

    if (rows.length === 0) {
      return "Please add at least one item.";
    }

    const selectedItemIdsForValidation = new Set();

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];

      /* -----------------------------------------------------
         Item
      ----------------------------------------------------- */

      if (!row.itemId) {
        return `Please select an item in row ${index + 1}.`;
      }

      /* -----------------------------------------------------
         Duplicate Item
      ----------------------------------------------------- */

      if (selectedItemIdsForValidation.has(row.itemId)) {
        return "The same item cannot be added twice. " + `Row ${index + 1}.`;
      }

      selectedItemIdsForValidation.add(row.itemId);

      /* -----------------------------------------------------
         Values
      ----------------------------------------------------- */

      const quantity = Number(row.quantity) || 0;

      const pieces = Number(row.pieces) || 0;

      const price = Number(row.price) || 0;

      if (quantity <= 0 && pieces <= 0) {
        return `Enter quantity or pieces for row ${index + 1}.`;
      }

      if (quantity < 0 || pieces < 0 || price < 0) {
        return `Invalid values in row ${index + 1}.`;
      }

      if (price <= 0) {
        return `Please enter a selling price for row ${index + 1}.`;
      }

      /* -----------------------------------------------------
         Stock
      ----------------------------------------------------- */

      const stock = stocks.find(
        (currentStock) => getStockItemId(currentStock) === row.itemId,
      );

      if (!stock) {
        return `Stock not found for row ${index + 1}.`;
      }

      if (quantity > Number(stock.quantity)) {
        return (
          `You cannot sell ${quantity} quantity of ` +
          `${stock.itemName}. Only ${stock.quantity} ` +
          "is available."
        );
      }

      if (pieces > Number(stock.pieces)) {
        return (
          `You cannot sell ${pieces} pieces of ` +
          `${stock.itemName}. Only ${stock.pieces} ` +
          "are available."
        );
      }
    }

    /* -------------------------------------------------------
       Off / Discount
    ------------------------------------------------------- */

    const discount = Number(off) || 0;

    if (discount < 0) {
      return "Off amount cannot be negative.";
    }

    if (discount > itemsTotal) {
      return "Off amount cannot be greater than " + "the Items Total.";
    }

    /* -------------------------------------------------------
       Payment
    ------------------------------------------------------- */

    const amount = Number(paidAmount) || 0;

    if (amount < 0) {
      return "Paid amount cannot be negative.";
    }

    if (amount > grandTotal) {
      return "Paid amount cannot be greater than " + "the Final Total.";
    }

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return "Please select a valid payment method.";
    }

    return "";
  };

  /* =======================================================
     Submit
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);

      return;
    }

    const saleData = {
      sellerId,

      saleDate,

      items: rows.map((row) => ({
        itemId: row.itemId,

        quantity: Number(row.quantity) || 0,

        pieces: Number(row.pieces) || 0,

        price: Number(row.price) || 0,
      })),

      /*
       * Discount / Off.
       */
      off: discountAmount,

      /*
       * Final amount after Off.
       */
      grandTotal,

      paidAmount: Number(paidAmount) || 0,

      paymentMethod,
    };

    const result = await addSale(saleData);

    if (result.success) {
      navigate("/selling-history");

      return;
    }

    setError(result.error || "Unable to create sale.");
  };

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 px-2 py-2 sm:px-3">
      <div className="mx-auto w-full max-w-[1500px]">
        {/* =================================================
            TOP BAR
        ================================================= */}

        <div className="mb-2 flex h-8 items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            ← Back
          </button>

          <div className="text-right">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Selling
            </h1>

            <p className="hidden text-xs text-slate-500 sm:block">
              Record items sold from your stock
            </p>
          </div>
        </div>

        {/* =================================================
            MAIN
        ================================================= */}

        <div className="rounded-lg border border-slate-300 bg-white shadow-sm">
          {/* =================================================
              SELLER + DATE
          ================================================= */}

          <div className="border-b border-slate-200 bg-slate-50/70 p-2">
            <div className="grid gap-2 sm:grid-cols-2">
              {/* Seller */}

              <div>
                <label
                  htmlFor="seller"
                  className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500"
                >
                  Seller
                </label>

                <select
                  id="seller"
                  value={sellerId}
                  onChange={(event) => setSellerId(event.target.value)}
                  className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
                >
                  <option value="">Select seller shop</option>

                  {sellers.map((seller) => (
                    <option key={seller._id} value={seller._id}>
                      {seller.shopName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}

              <div>
                <label
                  htmlFor="sale-date"
                  className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500"
                >
                  Sale Date
                </label>

                <input
                  id="sale-date"
                  type="date"
                  value={saleDate}
                  onChange={(event) => setSaleDate(event.target.value)}
                  className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
                />
              </div>
            </div>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {(error || saleError) && (
            <div className="mx-2 mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error || saleError}
            </div>
          )}

          {/* =================================================
              CONTENT
          ================================================= */}

          {loading ? (
            <div className="px-4 py-10 text-center text-xs text-slate-500">
              Loading sellers and stock...
            </div>
          ) : availableStocks.length === 0 ? (
            <div className="m-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-6 text-center text-amber-700">
              <h2 className="text-sm font-semibold">No Stock Available</h2>

              <p className="mt-1 text-xs">
                You need to purchase items before you can sell them.
              </p>
            </div>
          ) : (
            <>
              {/* =================================================
                  ITEMS
              ================================================= */}

              <section className="p-2">
                <div className="overflow-x-auto rounded-md border border-slate-300">
                  <table className="w-full min-w-[950px] border-collapse text-xs">
                    <thead>
                      <tr className="h-8 border-b border-slate-300 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                        <th className="border-r border-slate-200 px-2 text-left">
                          Item
                        </th>

                        <th className="w-32 border-r border-slate-200 px-2 text-right">
                          Available
                        </th>

                        <th className="w-28 border-r border-slate-200 px-2 text-right">
                          Quantity
                        </th>

                        <th className="w-24 border-r border-slate-200 px-2 text-right">
                          Pieces
                        </th>

                        <th className="w-28 border-r border-slate-200 px-2 text-right">
                          Price
                        </th>

                        <th className="w-32 border-r border-slate-200 px-2 text-right">
                          Total
                        </th>

                        <th className="w-20 px-2 text-center">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {rows.map((row, index) => (
                        <SaleItemRow
                          key={`${index}-${row.itemId}`}
                          row={row}
                          index={index}
                          stocks={getStocksForRow(index)}
                          onChange={handleRowChange}
                          onRemove={handleRemoveRow}
                          canRemove={rows.length > 1}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Item */}

                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleAddRow}
                    disabled={selectedItemIds.size >= availableStocks.length}
                    className="inline-flex h-7 items-center rounded-md border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    + Add Item
                  </button>

                  <span className="text-[10px] text-slate-400">
                    {selectedItemIds.size} / {availableStocks.length} items
                    selected
                  </span>
                </div>
              </section>

              {/* =================================================
                  SUMMARY + PAYMENT
              ================================================= */}

              <section className="border-t border-slate-200 bg-slate-50/50 p-2">
                <div className="grid gap-2 lg:grid-cols-2">
                  {/* =================================================
                      BILL SUMMARY
                  ================================================= */}

                  <div className="rounded-md border border-slate-300 bg-white">
                    <div className="border-b border-slate-200 bg-slate-100 px-3 py-2">
                      <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                        Bill Summary
                      </h2>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {/* Items Total */}

                      <div className="flex h-8 items-center justify-between px-3 text-xs">
                        <span className="text-slate-500">Items Total</span>

                        <span className="font-semibold tabular-nums text-slate-900">
                          ₹{itemsTotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Off */}

                      <div className="flex h-9 items-center justify-between bg-slate-50 px-3">
                        <label
                          htmlFor="off"
                          className="text-xs font-medium text-slate-600"
                        >
                          Off
                        </label>

                        <div className="relative w-28">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                            ₹
                          </span>

                          <input
                            id="off"
                            type="number"
                            min="0"
                            max={itemsTotal}
                            step="0.01"
                            value={off}
                            onChange={handleOffChange}
                            onWheel={(event) => event.currentTarget.blur()}
                            placeholder="0.00"
                            className="h-7 w-full rounded-md border border-slate-300 bg-white pl-6 pr-2 text-right text-xs font-semibold tabular-nums text-slate-800 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
                          />
                        </div>
                      </div>

                      {/* Final Total */}

                      <div className="flex h-10 items-center justify-between bg-slate-50 px-3">
                        <span className="text-sm font-bold text-slate-900">
                          Final Total
                        </span>

                        <span className="text-lg font-bold tabular-nums text-slate-900">
                          ₹{grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      PAYMENT
                  ================================================= */}

                  <div className="rounded-md border border-slate-300 bg-white">
                    <div className="border-b border-slate-200 bg-slate-100 px-3 py-2">
                      <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                        Payment Details
                      </h2>
                    </div>

                    <div className="p-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        {/* Paid Amount */}

                        <div>
                          <label
                            htmlFor="paid-amount"
                            className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500"
                          >
                            Paid Amount
                          </label>

                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                              ₹
                            </span>

                            <input
                              id="paid-amount"
                              type="number"
                              min="0"
                              max={grandTotal}
                              step="0.01"
                              value={paidAmount}
                              onChange={handlePaidAmountChange}
                              onWheel={(event) => event.currentTarget.blur()}
                              placeholder="0.00"
                              className="h-8 w-full rounded-md border border-slate-300 bg-white pl-6 pr-2 text-xs font-medium tabular-nums text-slate-800 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
                            />
                          </div>

                          <p className="mt-1 text-[9px] text-slate-400">
                            Max ₹{grandTotal.toFixed(2)}
                          </p>
                        </div>

                        {/* Payment Method */}

                        <div>
                          <label
                            htmlFor="payment-method"
                            className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500"
                          >
                            Payment Method
                          </label>

                          <select
                            id="payment-method"
                            value={paymentMethod}
                            onChange={(event) =>
                              setPaymentMethod(event.target.value)
                            }
                            className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
                          >
                            {PAYMENT_METHODS.map((method) => (
                              <option key={method} value={method}>
                                {method}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Remaining + Status */}

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="flex h-9 items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-2.5">
                          <span className="text-[10px] font-semibold text-amber-700">
                            Remaining
                          </span>

                          <span className="text-sm font-bold tabular-nums text-amber-900">
                            ₹{creditAmount.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex h-9 items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-2.5">
                          <span className="text-[10px] font-semibold text-slate-600">
                            Status
                          </span>

                          <span
                            className={`rounded px-2 py-1 text-[9px] font-bold ${
                              paymentStatus === "PAID"
                                ? "bg-green-100 text-green-700"
                                : paymentStatus === "PARTIAL"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* =================================================
                    SAVE
                ================================================= */}

                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={saving || grandTotal <= 0}
                    onClick={handleSubmit}
                    className="h-8 rounded-md bg-slate-900 px-5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Sale"}
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Selling;
