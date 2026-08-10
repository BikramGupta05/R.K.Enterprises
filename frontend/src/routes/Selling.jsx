import { useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import SaleItemRow from "../components/SaleItemRow.jsx";
import useSales from "../hooks/useSales.js";
import useSellers from "../hooks/useSellers.js";
import useStock from "../hooks/useStock.js";

function Selling() {
  const navigate = useNavigate();

  const { sellers, loading: sellersLoading } = useSellers();

  const { stocks, loading: stockLoading } = useStock();

  const { saving, error: saleError, addSale } = useSales();

  const [sellerId, setSellerId] = useState("");

  const [saleDate, setSaleDate] = useState(() => {
    const today = new Date();

    return today.toISOString().split("T")[0];
  });

  const createEmptyRow = () => ({
    itemId: "",
    quantity: "",
    pieces: "",
    price: "",
  });

  const [rows, setRows] = useState([createEmptyRow()]);

  const [error, setError] = useState("");

  /* =========================================================
     Available stocks
  ========================================================= */

  const availableStocks = useMemo(() => {
    return stocks
      .filter((stock) => Number(stock.quantity) > 0 || Number(stock.pieces) > 0)
      .sort((a, b) =>
        (a.itemName || "").localeCompare(b.itemName || "", undefined, {
          sensitivity: "base",
        }),
      );
  }, [stocks]);

  /* =========================================================
     Calculate Total
  ========================================================= */

  const itemsTotal = useMemo(() => {
    return rows.reduce((total, row) => {
      const quantity = Number(row.quantity) || 0;

      const price = Number(row.price) || 0;

      return total + quantity * price;
    }, 0);
  }, [rows]);

  /* =========================================================
     Change Row
  ========================================================= */

  const handleRowChange = (index, field, value) => {
    setRows((current) => {
      const updated = [...current];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      /*
       * When an item changes,
       * reset quantity and pieces
       * so old values don't carry over.
       */
      if (field === "itemId") {
        updated[index] = {
          ...updated[index],
          itemId: value,
          quantity: "",
          pieces: "",
        };
      }

      return updated;
    });
  };

  /* =========================================================
     Add Row
  ========================================================= */

  const handleAddRow = () => {
    setRows((current) => [...current, createEmptyRow()]);
  };

  /* =========================================================
     Remove Row
  ========================================================= */

  const handleRemoveRow = (index) => {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  /* =========================================================
     Validate
  ========================================================= */

  const validateForm = () => {
    if (!sellerId) {
      return "Please select a seller.";
    }

    if (!saleDate) {
      return "Please select a sale date.";
    }

    if (rows.length === 0) {
      return "Please add at least one item.";
    }

    const selectedItemIds = new Set();

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];

      if (!row.itemId) {
        return `Please select an item in row ${index + 1}.`;
      }

      /*
       * Don't allow duplicate items
       * in the same sale.
       */
      if (selectedItemIds.has(row.itemId)) {
        return `Item "${row.itemId}" is added more than once.`;
      }

      selectedItemIds.add(row.itemId);

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

      const stock = stocks.find(
        (stock) => (stock.item?._id || stock.item) === row.itemId,
      );

      if (!stock) {
        return `Stock not found for row ${index + 1}.`;
      }

      if (quantity > Number(stock.quantity)) {
        return `You cannot sell ${quantity} quantity of ${stock.itemName}. Only ${stock.quantity} is available.`;
      }

      if (pieces > Number(stock.pieces)) {
        return `You cannot sell ${pieces} pieces of ${stock.itemName}. Only ${stock.pieces} are available.`;
      }
    }

    return "";
  };

  /* =========================================================
     Submit Sale
  ========================================================= */

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
    };

    const result = await addSale(saleData);

    if (result.success) {
      /*
       * Sale was successfully saved.
       *
       * Backend has already decreased
       * the stock inside the transaction.
       */

      navigate("/selling-history");
    } else {
      setError(result.error || "Unable to create sale.");
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  const loading = sellersLoading || stockLoading;

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
            Main Card
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
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
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
                  Table
              ================================================= */}

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

              {/* =================================================
                  Add More
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
                  Total
              ================================================= */}

              <div className="mt-8 flex justify-end">
                <div className="w-full max-w-sm rounded-2xl bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Items Total</span>

                    <span className="text-xl font-bold text-slate-900">
                      ₹{itemsTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="my-4 border-t border-slate-200" />

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-slate-900">
                      Final Total
                    </span>

                    <span className="text-2xl font-bold text-slate-900">
                      ₹{itemsTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* =================================================
                  Save
              ================================================= */}

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  disabled={saving}
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
