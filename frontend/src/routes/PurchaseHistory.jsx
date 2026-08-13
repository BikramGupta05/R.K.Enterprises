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

  const [activeTab, setActiveTab] = useState("all");

  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const [search, setSearch] = useState("");

  const [allFrom, setAllFrom] = useState("");
  const [allTo, setAllTo] = useState("");

  const [buyerFrom, setBuyerFrom] = useState("");
  const [buyerTo, setBuyerTo] = useState("");

  const [itemFrom, setItemFrom] = useState("");
  const [itemTo, setItemTo] = useState("");

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadPurchases();
    loadBuyerSummaries();
    loadItemSummaries();
  }, [loadPurchases, loadBuyerSummaries, loadItemSummaries]);

  /* =========================================================
     CHANGE ACTIVE TAB
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
     ALL PURCHASES FILTER
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
    setSelectedPurchase(null);

    await loadPurchases();
  };

  /* =========================================================
     BUYER FILTER
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
     ITEM FILTER
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
     SELECT BUYER
  ========================================================= */

  const handleBuyerSelect = async (buyer) => {
    setSelectedPurchase(null);

    await loadBuyerHistory(buyer._id, {
      from: buyerFrom || undefined,
      to: buyerTo || undefined,
    });
  };

  /* =========================================================
     SELECT ITEM
  ========================================================= */

  const handleItemSelect = async (item) => {
    setSelectedPurchase(null);

    await loadItemHistory(item._id, {
      from: itemFrom || undefined,
      to: itemTo || undefined,
    });
  };

  /* =========================================================
     SEARCH PURCHASES
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
     VIEW PURCHASE
  ========================================================= */

  const handleViewPurchase = (purchase) => {
    setSelectedPurchase(purchase);
  };

  /* =========================================================
     CLOSE PURCHASE DETAILS
  ========================================================= */

  const closePurchaseDetails = () => {
    setSelectedPurchase(null);
  };

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* =========================================================
     ACTIVE DATE FILTER
  ========================================================= */

  const renderActiveDateFilter = () => {
    if (activeTab === "all") {
      return (
        <PurchaseDateFilter
          from={allFrom}
          to={allTo}
          onFromChange={setAllFrom}
          onToChange={setAllTo}
          onApply={applyAllFilter}
          onClear={clearAllFilter}
          loading={loading}
        />
      );
    }

    if (activeTab === "buyer" && !selectedBuyer) {
      return (
        <PurchaseDateFilter
          from={buyerFrom}
          to={buyerTo}
          onFromChange={setBuyerFrom}
          onToChange={setBuyerTo}
          onApply={applyBuyerFilter}
          onClear={clearBuyerFilter}
          loading={loading}
        />
      );
    }

    if (activeTab === "item" && !selectedItem) {
      return (
        <PurchaseDateFilter
          from={itemFrom}
          to={itemTo}
          onFromChange={setItemFrom}
          onToChange={setItemTo}
          onApply={applyItemFilter}
          onClear={clearItemFilter}
          loading={loading}
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 px-2 py-2 sm:px-3">
      <div className="mx-auto w-full max-w-[1500px]">
        {/* ===================================================
            TOP ACTION
        =================================================== */}

        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => navigate("/dashboard/purchase")}
            className="inline-flex h-8 items-center rounded-md bg-slate-900 px-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + New Purchase
          </button>
        </div>

        {/* ===================================================
            TITLE
        =================================================== */}

        <div className="mb-2 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Purchase History
            </h1>

            <p className="mt-0.5 text-xs text-slate-500">
              Purchase records and summaries
            </p>
          </div>

          {activeTab === "all" && (
            <div className="text-xs font-medium text-slate-500">
              {filteredPurchases.length}{" "}
              {filteredPurchases.length === 1 ? "record" : "records"}
            </div>
          )}
        </div>

        {/* ===================================================
            TABS + DATE FILTER
        =================================================== */}

        <div className="mb-2 flex w-full items-start justify-between gap-8 rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
          {/* LEFT: Tabs */}

          <div className="shrink-0">
            <PurchaseHistoryTabs
              activeTab={activeTab}
              onChange={handleTabChange}
            />
          </div>

          {/* RIGHT: Date Filter */}

          <div className="shrink-0">{renderActiveDateFilter()}</div>
        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="mb-2 flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={clearError}
              className="font-bold text-red-800 hover:text-red-950"
            >
              ×
            </button>
          </div>
        )}

        {/* ===================================================
            ALL PURCHASES
        =================================================== */}

        {activeTab === "all" && (
          <section>
            {/* Search */}

            <div className="mb-2 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search buyer or purchase number..."
                  className="h-8 w-full rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
                />
              </div>

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="h-8 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Loading */}

            {loading ? (
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-xs text-slate-500">
                Loading purchase history...
              </div>
            ) : filteredPurchases.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center">
                <h2 className="text-sm font-semibold text-slate-700">
                  No Purchases Found
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  No purchases match the current filter.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-300 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                        <th className="w-[105px] border-r border-slate-200 px-2.5 py-2 text-left">
                          Date
                        </th>

                        <th className="min-w-[150px] border-r border-slate-200 px-2.5 py-2 text-left">
                          Buyer
                        </th>

                        <th className="min-w-[170px] border-r border-slate-200 px-2.5 py-2 text-left">
                          Purchase No.
                        </th>

                        <th className="w-[65px] border-r border-slate-200 px-2.5 py-2 text-right">
                          Items
                        </th>

                        <th className="w-[120px] border-r border-slate-200 px-2.5 py-2 text-right">
                          Items Total
                        </th>

                        <th className="w-[105px] border-r border-slate-200 px-2.5 py-2 text-right">
                          Carriage
                        </th>

                        <th className="w-[125px] border-r border-slate-200 px-2.5 py-2 text-right">
                          Grand Total
                        </th>

                        <th className="w-[75px] px-2 py-2 text-center">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredPurchases.map((purchase, index) => (
                        <tr
                          key={purchase._id}
                          className={`h-9 border-b border-slate-200 transition last:border-b-0 hover:bg-blue-50/50 ${
                            index % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                          }`}
                        >
                          <td className="whitespace-nowrap border-r border-slate-100 px-2.5 py-1.5 text-slate-700">
                            {formatDate(purchase.purchaseDate)}
                          </td>

                          <td className="border-r border-slate-100 px-2.5 py-1.5">
                            <span className="font-medium text-slate-900">
                              {purchase.buyerName || "—"}
                            </span>
                          </td>

                          <td className="whitespace-nowrap border-r border-slate-100 px-2.5 py-1.5 font-mono text-[10px] text-slate-600">
                            {purchase.purchaseNumber || "—"}
                          </td>

                          <td className="border-r border-slate-100 px-2.5 py-1.5 text-right tabular-nums text-slate-700">
                            {purchase.items?.length || 0}
                          </td>

                          <td className="border-r border-slate-100 px-2.5 py-1.5 text-right tabular-nums text-slate-700">
                            ₹{Number(purchase.itemsTotal || 0).toFixed(2)}
                          </td>

                          <td className="border-r border-slate-100 px-2.5 py-1.5 text-right tabular-nums text-slate-600">
                            ₹{Number(purchase.carriage || 0).toFixed(2)}
                          </td>

                          <td className="border-r border-slate-100 px-2.5 py-1.5 text-right font-semibold tabular-nums text-slate-900">
                            ₹{Number(purchase.grandTotal || 0).toFixed(2)}
                          </td>

                          <td className="px-1.5 py-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleViewPurchase(purchase)}
                              className="inline-flex h-6 items-center rounded border border-slate-300 bg-white px-2 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex h-7 items-center justify-between border-t border-slate-200 bg-slate-50 px-2.5 text-[10px] text-slate-500">
                  <span>
                    Showing{" "}
                    <span className="font-semibold text-slate-700">
                      {filteredPurchases.length}
                    </span>{" "}
                    record
                    {filteredPurchases.length === 1 ? "" : "s"}
                  </span>

                  <span>Purchase History</span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ===================================================
            BY BUYER
        =================================================== */}

        {activeTab === "buyer" && (
          <section>
            {!selectedBuyer && (
              <BuyerPurchaseSummary
                buyers={buyerSummaries}
                onSelect={handleBuyerSelect}
                selectedBuyerId={selectedBuyer?._id}
              />
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

        {/* ===================================================
            BY ITEM
        =================================================== */}

        {activeTab === "item" && (
          <section>
            {!selectedItem && (
              <ItemPurchaseSummary
                items={itemSummaries}
                onSelect={handleItemSelect}
                selectedItemId={selectedItem?._id}
              />
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

      {/* =====================================================
          PURCHASE DETAILS MODAL
      ===================================================== */}

      <PurchaseDetails
        purchase={selectedPurchase}
        onClose={closePurchaseDetails}
      />
    </div>
  );
}

export default PurchaseHistory;
