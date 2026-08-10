import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import StockCard from "../components/StockCard.jsx";
import useStock from "../hooks/useStock.js";

function Stock() {
  const navigate = useNavigate();

  const { stocks, loading, error } = useStock();

  const [search, setSearch] = useState("");

  /*
   * Search + alphabetical sorting.
   */
  const filteredStocks = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return stocks
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
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Back */}
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-fit rounded-lg border border-slate-300 bg-white px-5 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
          >
            ← Back
          </button>

          <div className="sm:text-right">
            <h1 className="text-3xl font-bold text-slate-900">In Stock</h1>

            <p className="mt-1 text-sm text-slate-500">
              View all currently available items.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-100 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search item..."
            className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-base outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        {/* Loading */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">Loading stock...</p>
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800">
              {search ? "No Matching Items" : "No Stock Available"}
            </h2>

            <p className="mt-2 text-slate-500">
              {search
                ? `No stock item matches "${search}".`
                : "Your purchased items will appear here automatically."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStocks.map((stock) => (
              <StockCard key={stock._id} stock={stock} />
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && filteredStocks.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">Total different items</p>

              <p className="text-lg font-semibold text-slate-900">
                {filteredStocks.length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Stock;
