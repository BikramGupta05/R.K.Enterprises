import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PurchaseHistoryCard from "../components/PurchaseHistoryCard";
import PurchaseDetails from "../components/PurchaseDetails";
import usePurchases from "../hooks/usePurchases";

function PurchaseHistory() {
  const navigate = useNavigate();

  const { purchases, loading, error, removePurchase } = usePurchases();

  const [search, setSearch] = useState("");
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  /* -------------------- Search + Sort -------------------- */

  const filteredPurchases = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    const filtered = purchases.filter((purchase) => {
      if (!searchValue) {
        return true;
      }

      const buyerName = purchase.buyerName?.toLowerCase() || "";

      const purchaseNumber = purchase.purchaseNumber?.toLowerCase() || "";

      return (
        buyerName.includes(searchValue) || purchaseNumber.includes(searchValue)
      );
    });

    return [...filtered].sort(
      (a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate),
    );
  }, [purchases, search]);

  /* -------------------- View Purchase -------------------- */

  const handleView = (purchase) => {
    setSelectedPurchase(purchase);
  };

  /* -------------------- Close Details -------------------- */

  const handleCloseDetails = () => {
    setSelectedPurchase(null);
  };

  /* -------------------- Edit Purchase -------------------- */

  const handleEdit = (purchase) => {
    navigate(`/purchase/${purchase._id}/edit`);
  };

  /* -------------------- Delete Purchase -------------------- */

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this purchase?",
    );

    if (!confirmDelete) {
      return;
    }

    await removePurchase(id);

    if (selectedPurchase && selectedPurchase._id === id) {
      setSelectedPurchase(null);
    }
  };

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

          <button
            type="button"
            onClick={() => navigate("/purchase")}
            className="rounded-lg bg-slate-900 px-5 py-2 font-medium text-white transition hover:bg-slate-800"
          >
            + New Purchase
          </button>
        </div>

        {/* ---------------- Title ---------------- */}

        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900">
            Purchase History
          </h1>

          <p className="mt-2 text-slate-500">
            View and manage your previous purchases.
          </p>
        </div>

        {/* ---------------- Search ---------------- */}

        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by shop name or purchase number..."
            className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-base outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        {/* ---------------- Error ---------------- */}

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ---------------- Loading ---------------- */}

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">Loading purchase history...</p>
          </div>
        ) : filteredPurchases.length === 0 ? (
          /* ---------------- Empty State ---------------- */

          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-700">
              {search ? "No Matching Purchases" : "No Purchase History"}
            </h2>

            <p className="mt-3 text-slate-500">
              {search
                ? "No purchase matches your search."
                : "You have not created any purchases yet."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={() => navigate("/purchase")}
                className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white transition hover:bg-slate-800"
              >
                Create Your First Purchase
              </button>
            )}
          </div>
        ) : (
          /* ---------------- Purchase List ---------------- */

          <div className="space-y-4">
            {filteredPurchases.map((purchase) => (
              <PurchaseHistoryCard
                key={purchase._id}
                purchase={purchase}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* ---------------- Purchase Details ---------------- */}

        {selectedPurchase && (
          <PurchaseDetails
            purchase={selectedPurchase}
            onClose={handleCloseDetails}
          />
        )}
      </div>
    </div>
  );
}

export default PurchaseHistory;
