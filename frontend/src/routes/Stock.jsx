import { useMemo, useState } from "react";

import useStock from "../hooks/useStock.js";

function Stock() {
  const { stocks = [], loading, error } = useStock();

  const [search, setSearch] = useState("");

  /* =========================================================
     SEARCH + SORT
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
    <div className="min-h-screen bg-slate-50 px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-[1500px]">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              In Stock
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Currently available inventory
            </p>
          </div>

          {!loading && (
            <div className="text-xs font-medium text-slate-500">
              {filteredStocks.length}{" "}
              {filteredStocks.length === 1 ? "item" : "items"}
            </div>
          )}
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* =====================================================
            SEARCH
        ===================================================== */}

        <div className="mb-3 flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search item..."
            className="h-7 w-full max-w-md bg-transparent px-2 text-xs text-slate-900 outline-none placeholder:text-slate-400"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="h-7 shrink-0 rounded border border-slate-300 bg-white px-2.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Clear
            </button>
          )}
        </div>

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-xs text-slate-500 shadow-sm">
            Loading stock...
          </div>
        ) : filteredStocks.length === 0 ? (
          /* ===================================================
             EMPTY STATE
          =================================================== */

          <div className="rounded-lg border border-slate-200 bg-white px-4 py-12 text-center shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">
              {search ? "No Matching Items" : "No Stock Available"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {search
                ? `No stock item matches "${search}".`
                : "Your purchased items will appear here automatically."}
            </p>
          </div>
        ) : (
          /* ===================================================
             STOCK TABLE
          =================================================== */

          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                {/* =================================================
                    HEADER
                ================================================= */}

                <thead>
                  <tr className="h-9 bg-slate-100">
                    <th className="border-b border-r border-slate-300 px-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">
                      Item
                    </th>

                    <th className="w-36 border-b border-r border-slate-300 px-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                      Quantity
                    </th>

                    <th className="w-36 border-b border-slate-300 px-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                      Pieces
                    </th>
                  </tr>
                </thead>

                {/* =================================================
                    BODY
                ================================================= */}

                <tbody>
                  {filteredStocks.map((stock, index) => (
                    <tr
                      key={stock._id}
                      className={`h-9 transition hover:bg-blue-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      }`}
                    >
                      {/* Item */}

                      <td className="border-b border-r border-slate-200 px-3 text-left">
                        <span className="font-medium text-slate-800">
                          {stock.itemName || "Unnamed Item"}
                        </span>
                      </td>

                      {/* Quantity */}

                      <td className="border-b border-r border-slate-200 px-3 text-right tabular-nums text-slate-700">
                        {Number(stock.quantity) || 0}
                      </td>

                      {/* Pieces */}

                      <td className="border-b border-slate-200 px-3 text-right tabular-nums text-slate-700">
                        {Number(stock.pieces) || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* =================================================
                TABLE FOOTER
            ================================================= */}

            <div className="flex h-7 items-center justify-between border-t border-slate-200 bg-slate-50 px-3 text-[10px] text-slate-500">
              <span>
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredStocks.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {stocks.length}
                </span>{" "}
                items
              </span>

              <span>
                Total records:{" "}
                <span className="font-semibold text-slate-700">
                  {stocks.length}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Stock;
