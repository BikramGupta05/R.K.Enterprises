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
     Bill Total
  ======================================================= */

  const itemsTotal = useMemo(() => {
    return rows.reduce((total, row) => {
      const quantity = Number(row.quantity) || 0;

      const price = Number(row.price) || 0;

      return total + quantity * price;
    }, 0);
  }, [rows]);

  const grandTotal = itemsTotal;

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

      updatedRows[index] = {
        ...updatedRows[index],
        [field]: value,
      };

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
     Payment Change
  ======================================================= */

  const handlePaidAmountChange = (event) => {
    const value = event.target.value;

    /*
     * Allow the user to clear
     * the field while typing.
     */
    if (value === "") {
      setPaidAmount("");
      return;
    }

    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return;
    }

    /*
     * Do not allow negative values.
     */
    if (amount < 0) {
      return;
    }

    /*
     * Do not allow payment greater
     * than the bill.
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

    const selectedItemIds = new Set();

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

      if (selectedItemIds.has(row.itemId)) {
        return `The same item cannot be added twice. Row ${index + 1}.`;
      }

      selectedItemIds.add(row.itemId);

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

      const stock = stocks.find((currentStock) => {
        const currentItemId = currentStock.item?._id || currentStock.item;

        return currentItemId === row.itemId;
      });

      if (!stock) {
        return `Stock not found for row ${index + 1}.`;
      }

      if (quantity > Number(stock.quantity)) {
        return (
          `You cannot sell ${quantity} quantity of ` +
          `${stock.itemName}. Only ${stock.quantity} is available.`
        );
      }

      if (pieces > Number(stock.pieces)) {
        return (
          `You cannot sell ${pieces} pieces of ` +
          `${stock.itemName}. Only ${stock.pieces} are available.`
        );
      }
    }

    /* -------------------------------------------------------
       Payment
    ------------------------------------------------------- */

    const amount = Number(paidAmount) || 0;

    if (amount < 0) {
      return "Paid amount cannot be negative.";
    }

    if (amount > grandTotal) {
      return "Paid amount cannot be greater than " + "the final bill amount.";
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

    /* -------------------------------------------------------
       Sale Payload
    ------------------------------------------------------- */

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
       * NEW PAYMENT DATA
       */
      paidAmount: Number(paidAmount) || 0,

      paymentMethod,
    };

    /* -------------------------------------------------------
       Save Sale
    ------------------------------------------------------- */

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
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-7xl">
        {/* =================================================
            Header
        ================================================= */}

        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
          >
            ← Back
          </button>

          <div className="text-right">
            <h1 className="text-3xl font-bold text-slate-900">Selling</h1>

            <p className="mt-1 text-sm text-slate-500">
              Record items sold from your stock.
            </p>
          </div>
        </div>

        {/* =================================================
            Main
        ================================================= */}

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          {/* =================================================
              Seller + Date
          ================================================= */}

          <div className="mb-8 grid gap-6 md:grid-cols-2">
            {/* Seller */}

            <div>
              <label
                htmlFor="seller"
                className="text-sm font-semibold text-slate-700"
              >
                Select Seller
              </label>

              <select
                id="seller"
                value={sellerId}
                onChange={(event) => setSellerId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
                className="text-sm font-semibold text-slate-700"
              >
                Sale Date
              </label>

              <input
                id="sale-date"
                type="date"
                value={saleDate}
                onChange={(event) => setSaleDate(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          {/* =================================================
              Error
          ================================================= */}

          {(error || saleError) && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error || saleError}
            </div>
          )}

          {/* =================================================
              Loading
          ================================================= */}

          {loading ? (
            <div className="rounded-xl bg-slate-50 p-10 text-center text-slate-500">
              Loading sellers and stock...
            </div>
          ) : availableStocks.length === 0 ? (
            <div className="rounded-xl bg-amber-50 p-6 text-center text-amber-700">
              <h2 className="font-semibold">No Stock Available</h2>

              <p className="mt-2 text-sm">
                You need to purchase items before you can sell them.
              </p>
            </div>
          ) : (
            <>
              {/* =================================================
                  Items
              ================================================= */}

              <section>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 bg-slate-50 text-left text-sm text-slate-600">
                        <th className="p-3 font-semibold">Item</th>

                        <th className="p-3 font-semibold">Available</th>

                        <th className="p-3 font-semibold">Quantity</th>

                        <th className="p-3 font-semibold">Pieces</th>

                        <th className="p-3 font-semibold">Price</th>

                        <th className="p-3 font-semibold">Total</th>

                        <th className="p-3 font-semibold">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {rows.map((row, index) => (
                        <SaleItemRow
                          key={`${index}-${row.itemId}`}
                          row={row}
                          index={index}
                          stocks={availableStocks}
                          onChange={handleRowChange}
                          onRemove={handleRemoveRow}
                          canRemove={rows.length > 1}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* =================================================
                  Add Item
              ================================================= */}

              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  + Add More Items
                </button>
              </div>

              {/* =================================================
                  BILL SUMMARY
              ================================================= */}

              <section className="mt-8 border-t border-slate-200 pt-8">
                <div className="grid gap-8 lg:grid-cols-2">
                  {/* =================================================
                      Bill Summary
                  ================================================= */}

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Bill Summary
                    </h2>

                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <span className="text-slate-600">Items Total</span>

                        <span className="font-semibold text-slate-900">
                          ₹{itemsTotal.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 px-5 py-5">
                        <span className="text-lg font-bold text-slate-900">
                          Final Total
                        </span>

                        <span className="text-2xl font-bold text-slate-900">
                          ₹{grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      Payment Details
                  ================================================= */}

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Payment Details
                    </h2>

                    <div className="mt-4 space-y-5 rounded-xl border border-slate-200 p-5">
                      {/* Paid Amount */}

                      <div>
                        <label
                          htmlFor="paid-amount"
                          className="text-sm font-semibold text-slate-700"
                        >
                          Paid Amount
                        </label>

                        <div className="relative mt-2">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
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
                            placeholder="0.00"
                            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-9 pr-4 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                          />
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          Maximum payment: ₹{grandTotal.toFixed(2)}
                        </p>
                      </div>

                      {/* Payment Method */}

                      <div>
                        <label
                          htmlFor="payment-method"
                          className="text-sm font-semibold text-slate-700"
                        >
                          Payment Method
                        </label>

                        <select
                          id="payment-method"
                          value={paymentMethod}
                          onChange={(event) =>
                            setPaymentMethod(event.target.value)
                          }
                          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                        >
                          {PAYMENT_METHODS.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Remaining */}

                      <div className="rounded-xl bg-amber-50 px-5 py-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-amber-800">
                            Remaining Amount
                          </span>

                          <span className="text-xl font-bold text-amber-900">
                            ₹{creditAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Status */}

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">
                          Payment Status
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
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
              </section>

              {/* =================================================
                  Save
              ================================================= */}

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  disabled={saving || grandTotal <= 0}
                  onClick={handleSubmit}
                  className="rounded-xl bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving Sale..." : "Save Sale"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Selling;
