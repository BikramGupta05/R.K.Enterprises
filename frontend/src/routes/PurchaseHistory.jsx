import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import PurchaseDetails from "../components/PurchaseDetails.jsx";

import PurchaseHistoryTabs from "../components/PurchaseHistoryTabs.jsx";

import PurchaseDateFilter from "../components/PurchaseDateFilter.jsx";

import BuyerPurchaseSummary from "../components/BuyerPurchaseSummary.jsx";

import BuyerPurchaseDetails from "../components/BuyerPurchaseDetails.jsx";

import ItemPurchaseSummary from "../components/ItemPurchaseSummary.jsx";

import ItemPurchaseDetails from "../components/ItemPurchaseDetails.jsx";

import usePurchaseHistory from "../hooks/usePurchaseHistory.js";

function PurchaseHistory() {
  const navigate = useNavigate();

  /* =========================================================
     Purchase History Hook
  ========================================================= */

  const {
    purchases,

    buyerSummaries,
    buyerHistory,

    itemSummaries,
    itemHistory,

    selectedBuyer,
    selectedItem,

    buyerDetails,
    itemDetails,

    loading,
    error,

    loadPurchases,
    loadBuyerSummaries,
    loadBuyerHistory,

    loadItemSummaries,
    loadItemHistory,

    clearBuyerHistory,
    clearItemHistory,

    clearError,
  } = usePurchaseHistory();

  /* =========================================================
     Active Section
  ========================================================= */

  const [activeTab, setActiveTab] = useState("all");

  /* =========================================================
     Selected Purchase
  ========================================================= */

  const [selectedPurchase, setSelectedPurchase] = useState(null);

  /* =========================================================
     Search
  ========================================================= */

  const [search, setSearch] = useState("");

  /* =========================================================
     All Purchase Date Filter
  ========================================================= */

  const [allFrom, setAllFrom] = useState("");

  const [allTo, setAllTo] = useState("");

  /* =========================================================
     Buyer Date Filter
  ========================================================= */

  const [buyerFrom, setBuyerFrom] = useState("");

  const [buyerTo, setBuyerTo] = useState("");

  /* =========================================================
     Item Date Filter
  ========================================================= */

  const [itemFrom, setItemFrom] = useState("");

  const [itemTo, setItemTo] = useState("");

  /* =========================================================
     Initial Load
  ========================================================= */

  useEffect(() => {
    loadPurchases();
    loadBuyerSummaries();
    loadItemSummaries();
  }, [loadPurchases, loadBuyerSummaries, loadItemSummaries]);

  /* =========================================================
     Change Section
  ========================================================= */

  const handleTabChange = async (tab) => {
    setActiveTab(tab);

    setSearch("");

    setSelectedPurchase(null);

    clearError();

    if (tab === "all") {
      await loadPurchases({
        from: allFrom || undefined,
        to: allTo || undefined,
      });

      return;
    }

    if (tab === "buyer") {
      clearBuyerHistory();

      await loadBuyerSummaries({
        from: buyerFrom || undefined,
        to: buyerTo || undefined,
      });

      return;
    }

    if (tab === "item") {
      clearItemHistory();

      await loadItemSummaries({
        from: itemFrom || undefined,
        to: itemTo || undefined,
      });
    }
  };

  /* =========================================================
     All Purchases Filter
  ========================================================= */

  const applyAllFilter = async () => {
    setSelectedPurchase(null);

    await loadPurchases({
      from: allFrom || undefined,

      to: allTo || undefined,
    });
  };

  const clearAllFilter = async () => {
    setAllFrom("");
    setAllTo("");
    setSearch("");

    await loadPurchases();
  };

  /* =========================================================
     Buyer Filter
  ========================================================= */

  const applyBuyerFilter = async () => {
    clearBuyerHistory();

    await loadBuyerSummaries({
      from: buyerFrom || undefined,

      to: buyerTo || undefined,
    });
  };

  const clearBuyerFilter = async () => {
    setBuyerFrom("");
    setBuyerTo("");

    clearBuyerHistory();

    await loadBuyerSummaries();
  };

  /* =========================================================
     Item Filter
  ========================================================= */

  const applyItemFilter = async () => {
    clearItemHistory();

    await loadItemSummaries({
      from: itemFrom || undefined,

      to: itemTo || undefined,
    });
  };

  const clearItemFilter = async () => {
    setItemFrom("");
    setItemTo("");

    clearItemHistory();

    await loadItemSummaries();
  };

  /* =========================================================
     Select Buyer
  ========================================================= */

  const handleBuyerSelect = async (buyer) => {
    setSelectedPurchase(null);

    await loadBuyerHistory(buyer._id, {
      from: buyerFrom || undefined,

      to: buyerTo || undefined,
    });
  };

  /* =========================================================
     Select Item
  ========================================================= */

  const handleItemSelect = async (item) => {
    setSelectedPurchase(null);

    await loadItemHistory(item._id, {
      from: itemFrom || undefined,

      to: itemTo || undefined,
    });
  };

  /* =========================================================
     Search All Purchases
  ========================================================= */

  const filteredPurchases = purchases.filter((purchase) => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return true;
    }

    return (
      purchase.buyerName?.toLowerCase().includes(value) ||
      purchase.purchaseNumber?.toLowerCase().includes(value)
    );
  });

  /* =========================================================
     View Purchase Details
  ========================================================= */

  const handleViewPurchase = (purchase) => {
    setSelectedPurchase(purchase);
  };

  /* =========================================================
     Close Purchase Details
  ========================================================= */

  const closePurchaseDetails = () => {
    setSelectedPurchase(null);
  };

  /* =========================================================
     Render
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-6xl">
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
            onClick={() => navigate("/purchase")}
            className="rounded-lg bg-slate-900 px-5 py-2 font-medium text-white transition hover:bg-slate-800"
          >
            + New Purchase
          </button>
        </div>

        {/* =================================================
            Title
        ================================================= */}

        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900">
            Purchase History
          </h1>

          <p className="mt-2 text-slate-500">
            View and analyse all your previous purchases.
          </p>
        </div>

        {/* =================================================
            Tabs
        ================================================= */}

        <PurchaseHistoryTabs activeTab={activeTab} onChange={handleTabChange} />

        {/* =================================================
            Global Error
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={clearError}
              className="font-semibold text-red-800 hover:underline"
            >
              ×
            </button>
          </div>
        )}

        {/* =================================================
            SECTION 1
            ALL PURCHASES
        ================================================= */}

        {activeTab === "all" && (
          <section>
            <PurchaseDateFilter
              from={allFrom}
              to={allTo}
              onFromChange={setAllFrom}
              onToChange={setAllTo}
              onApply={applyAllFilter}
              onClear={clearAllFilter}
              loading={loading}
            />

            {/* Search */}

            <div className="mb-6">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by buyer name or purchase number..."
                className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {/* Loading */}

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                Loading purchase history...
              </div>
            ) : filteredPurchases.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <h2 className="text-xl font-semibold text-slate-700">
                  No Purchases Found
                </h2>

                <p className="mt-2 text-slate-500">
                  No purchases match your current filter.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                          Date
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                          Buyer / Shop
                        </th>

                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                          Purchase Number
                        </th>

                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                          Items
                        </th>

                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                          Items Total
                        </th>

                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                          Carriage
                        </th>

                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                          Grand Total
                        </th>

                        <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600">
                          View
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredPurchases.map((purchase) => {
                        const date = purchase.purchaseDate
                          ? new Date(purchase.purchaseDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "N/A";

                        return (
                          <tr
                            key={purchase._id}
                            className="border-b border-slate-100 transition hover:bg-slate-50 last:border-b-0"
                          >
                            <td className="whitespace-nowrap px-6 py-5 text-slate-700">
                              {date}
                            </td>

                            <td className="px-6 py-5">
                              <span className="font-semibold text-slate-900">
                                {purchase.buyerName}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                              {purchase.purchaseNumber}
                            </td>

                            <td className="px-6 py-5 text-right text-slate-700">
                              {purchase.items?.length || 0}
                            </td>

                            <td className="px-6 py-5 text-right text-slate-700">
                              ₹{Number(purchase.itemsTotal || 0).toFixed(2)}
                            </td>

                            <td className="px-6 py-5 text-right text-slate-700">
                              ₹{Number(purchase.carriage || 0).toFixed(2)}
                            </td>

                            <td className="px-6 py-5 text-right font-bold text-slate-900">
                              ₹{Number(purchase.grandTotal || 0).toFixed(2)}
                            </td>

                            <td className="px-6 py-5 text-center">
                              <button
                                type="button"
                                onClick={() => handleViewPurchase(purchase)}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* =================================================
            SECTION 2
            BY BUYER
        ================================================= */}

        {activeTab === "buyer" && (
          <section>
            {!selectedBuyer && (
              <>
                <PurchaseDateFilter
                  from={buyerFrom}
                  to={buyerTo}
                  onFromChange={setBuyerFrom}
                  onToChange={setBuyerTo}
                  onApply={applyBuyerFilter}
                  onClear={clearBuyerFilter}
                  loading={loading}
                />

                <BuyerPurchaseSummary
                  buyers={buyerSummaries}
                  onSelect={handleBuyerSelect}
                  selectedBuyerId={selectedBuyer?._id}
                />
              </>
            )}

            {selectedBuyer && (
              <BuyerPurchaseDetails
                buyer={selectedBuyer}
                summary={buyerDetails}
                purchases={buyerHistory}
                loading={loading}
                onBack={clearBuyerHistory}
                onViewPurchase={handleViewPurchase}
              />
            )}
          </section>
        )}

        {/* =================================================
            SECTION 3
            BY ITEM
        ================================================= */}

        {activeTab === "item" && (
          <section>
            {!selectedItem && (
              <>
                <PurchaseDateFilter
                  from={itemFrom}
                  to={itemTo}
                  onFromChange={setItemFrom}
                  onToChange={setItemTo}
                  onApply={applyItemFilter}
                  onClear={clearItemFilter}
                  loading={loading}
                />

                <ItemPurchaseSummary
                  items={itemSummaries}
                  onSelect={handleItemSelect}
                  selectedItemId={selectedItem?._id}
                />
              </>
            )}

            {selectedItem && (
              <ItemPurchaseDetails
                item={selectedItem}
                summary={itemDetails}
                history={itemHistory}
                loading={loading}
                onBack={clearItemHistory}
              />
            )}
          </section>
        )}
      </div>

      {/* =================================================
          PURCHASE DETAILS MODAL
      ================================================= */}

      <PurchaseDetails
        purchase={selectedPurchase}
        onClose={closePurchaseDetails}
      />
    </div>
  );
}

export default PurchaseHistory;
