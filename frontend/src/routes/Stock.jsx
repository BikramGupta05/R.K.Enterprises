import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import useStock from "../hooks/useStock.js";

function Stock() {
  const navigate = useNavigate();

  const { stocks = [], loading, error } = useStock();

  const [search, setSearch] = useState("");

  /* =========================================================
     Search + Sort
  ========================================================= */

  const filteredStocks = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return [...stocks]
      .filter((stock) =>
        (stock.itemName || "").toLowerCase().includes(searchValue),
      )
      .sort((a, b) =>
        (a.itemName || "").localeCompare(b.itemName || "", undefined, {
          sensitivity: "base",
        }),
      );
  }, [stocks, search]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto w-full max-w-6xl">
        {/* =====================================================
            Header
        ===================================================== */}

        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            ← Back
          </button>

          <div className="text-right">
            <h1 className="text-2xl font-bold text-slate-900">In Stock</h1>

            <p className="text-xs text-slate-500">
              Currently available inventory
            </p>
          </div>
        </div>

        {/* =====================================================
            Error
        ===================================================== */}

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =====================================================
            Search
        ===================================================== */}

        <div className="mb-4 flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search item..."
            className="w-full max-w-md bg-transparent px-2 py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />

          {!loading && (
            <span className="ml-3 whitespace-nowrap text-xs text-slate-500">
              {filteredStocks.length} items
            </span>
          )}
        </div>

        {/* =====================================================
            Loading
        ===================================================== */}

        {loading ? (
          <div className="rounded-md border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Loading stock...
          </div>
        ) : filteredStocks.length === 0 ? (
          /* ===================================================
             Empty State
          =================================================== */

          <div className="rounded-md border border-slate-200 bg-white px-4 py-10 text-center">
            <h2 className="text-base font-semibold text-slate-800">
              {search ? "No Matching Items" : "No Stock Available"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {search
                ? `No stock item matches "${search}".`
                : "Your purchased items will appear here automatically."}
            </p>
          </div>
        ) : (
          /* ===================================================
             Excel Style Table
          =================================================== */

          <div className="overflow-hidden rounded-md border border-slate-300 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                {/* =================================================
                    Header
                ================================================= */}

                <thead>
                  <tr className="bg-slate-100">
                    <th className="border-b border-r border-slate-300 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Item
                    </th>

                    <th className="w-32 border-b border-r border-slate-300 px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Quantity
                    </th>

                    <th className="w-32 border-b border-slate-300 px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Pieces
                    </th>
                  </tr>
                </thead>

                {/* =================================================
                    Body
                ================================================= */}

                <tbody>
                  {filteredStocks.map((stock, index) => (
                    <tr
                      key={stock._id}
                      className={`transition hover:bg-blue-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      }`}
                    >
                      {/* Item */}

                      <td className="border-b border-r border-slate-200 px-3 py-1.5 text-left">
                        <span className="font-medium text-slate-800">
                          {stock.itemName || "Unnamed Item"}
                        </span>
                      </td>

                      {/* Quantity */}

                      <td className="border-b border-r border-slate-200 px-3 py-1.5 text-right tabular-nums text-slate-700">
                        {Number(stock.quantity) || 0}
                      </td>

                      {/* Pieces */}

                      <td className="border-b border-slate-200 px-3 py-1.5 text-right tabular-nums text-slate-700">
                        {Number(stock.pieces) || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================
            Bottom Summary
        ===================================================== */}

        {!loading && filteredStocks.length > 0 && (
          <div className="mt-3 flex items-center justify-between px-1 text-xs text-slate-500">
            <span>
              Showing {filteredStocks.length} of {stocks.length} items
            </span>

            <span>Total records: {stocks.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Stock;
