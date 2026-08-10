import { useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import SaleHistoryCard from "../components/SaleHistoryCard.jsx";
import SaleDetails from "../components/SaleDetails.jsx";
import useSales from "../hooks/useSales.js";

function SellingHistory() {
  const navigate = useNavigate();

  const { sales, loading, error } = useSales();

  const [selectedSale, setSelectedSale] = useState(null);

  const [search, setSearch] = useState("");

  /* =========================================================
     Filter + Sort
  ========================================================= */

  const filteredSales = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return [...sales]
      .filter((sale) => {
        if (!searchValue) {
          return true;
        }

        return (
          sale.sellerName?.toLowerCase().includes(searchValue) ||
          sale.saleNumber?.toLowerCase().includes(searchValue)
        );
      })
      .sort((a, b) => {
        return new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
      });
  }, [sales, search]);

  /* =========================================================
     Open Details
  ========================================================= */

  const handleView = (sale) => {
    setSelectedSale(sale);
  };

  /* =========================================================
     Close Details
  ========================================================= */

  const handleClose = () => {
    setSelectedSale(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
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

          <button
            type="button"
            onClick={() => navigate("/selling")}
            className="rounded-lg bg-slate-900 px-5 py-2 font-medium text-white transition hover:bg-slate-800"
          >
            + New Sale
          </button>
        </div>

        {/* =================================================
            Title
        ================================================= */}

        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900">Selling History</h1>

          <p className="mt-2 text-slate-500">
            View all items sold and previous sales.
          </p>
        </div>

        {/* =================================================
            Search
        ================================================= */}

        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by seller name or sale number..."
            className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        {/* =================================================
            Error
        ================================================= */}

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            Loading
        ================================================= */}

        {loading ? (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            Loading selling history...
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <h2 className="text-xl font-semibold text-slate-700">
              {search ? "No Matching Sales" : "No Selling History"}
            </h2>

            <p className="mt-2 text-slate-500">
              {search
                ? `No sale matches "${search}".`
                : "Your completed sales will appear here."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={() => navigate("/selling")}
                className="mt-5 rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800"
              >
                Create Your First Sale
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSales.map((sale) => (
              <SaleHistoryCard key={sale._id} sale={sale} onView={handleView} />
            ))}
          </div>
        )}

        {/* =================================================
            Details Modal
        ================================================= */}

        <SaleDetails sale={selectedSale} onClose={handleClose} />
      </div>
    </div>
  );
}

export default SellingHistory;
