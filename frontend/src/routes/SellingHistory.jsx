import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import useSellingHistory from "../hooks/useSellingHistory.js";

import SaleSummary from "../components/SaleSummary.jsx";
import SellerSaleSummary from "../components/SellerSaleSummary.jsx";
import ItemSaleSummary from "../components/ItemSaleSummary.jsx";

import SellingHistoryTabs from "../components/SellingHistoryTabs.jsx";
import SellingDateFilter from "../components/SellingDateFilter.jsx";

import SaleDetails from "../components/SaleDetails.jsx";
import SellerSaleDetails from "../components/SellerSaleDetails.jsx";
import ItemSaleDetails from "../components/ItemSaleDetails.jsx";

function SellingHistory() {
  const navigate = useNavigate();

  /*
   * ============================================================
   * HISTORY HOOK
   * ============================================================
   */

  const {
    sales,

    sellerSummaries,
    selectedSeller,
    sellerHistory,

    itemSummaries,
    selectedItem,
    itemHistory,

    loading,
    error,

    loadSales,
    loadSellerSummaries,
    loadItemSummaries,

    loadSalesBySeller,
    loadSalesByItem,

    clearSellerHistory,
    clearItemHistory,
    clearError,
  } = useSellingHistory();

  /*
   * ============================================================
   * ACTIVE TAB
   * ============================================================
   */

  const [activeTab, setActiveTab] = useState("all");

  /*
   * ============================================================
   * SELECTED SALE
   * ============================================================
   */

  const [selectedSale, setSelectedSale] = useState(null);

  /*
   * ============================================================
   * SEARCH
   * ============================================================
   */

  const [search, setSearch] = useState("");

  /*
   * ============================================================
   * DATE FILTERS
   * ============================================================
   */

  const [allFrom, setAllFrom] = useState("");

  const [allTo, setAllTo] = useState("");

  const [sellerFrom, setSellerFrom] = useState("");

  const [sellerTo, setSellerTo] = useState("");

  const [itemFrom, setItemFrom] = useState("");

  const [itemTo, setItemTo] = useState("");

  /*
   * ============================================================
   * INITIAL LOAD
   * ============================================================
   */

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  /*
   * ============================================================
   * CHANGE TAB
   * ============================================================
   */

  const handleTabChange = async (tab) => {
    setActiveTab(tab);

    setSearch("");

    setSelectedSale(null);

    clearError();

    if (tab === "all") {
      await loadSales({
        from: allFrom || undefined,

        to: allTo || undefined,
      });

      return;
    }

    if (tab === "seller") {
      clearSellerHistory();

      await loadSellerSummaries({
        from: sellerFrom || undefined,

        to: sellerTo || undefined,
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

  /*
   * ============================================================
   * ALL SALES FILTER
   * ============================================================
   */

  const applyAllFilter = async () => {
    setSelectedSale(null);

    await loadSales({
      from: allFrom || undefined,

      to: allTo || undefined,
    });
  };

  const clearAllFilter = async () => {
    setAllFrom("");
    setAllTo("");
    setSearch("");

    await loadSales();
  };

  /*
   * ============================================================
   * SELLER FILTER
   * ============================================================
   */

  const applySellerFilter = async () => {
    clearSellerHistory();

    await loadSellerSummaries({
      from: sellerFrom || undefined,

      to: sellerTo || undefined,
    });
  };

  const clearSellerFilter = async () => {
    setSellerFrom("");
    setSellerTo("");

    clearSellerHistory();

    await loadSellerSummaries();
  };

  /*
   * ============================================================
   * ITEM FILTER
   * ============================================================
   */

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

  /*
   * ============================================================
   * SELECT SELLER
   * ============================================================
   */

  const handleSellerSelect = async (seller) => {
    setSelectedSale(null);

    await loadSalesBySeller(seller, {
      from: sellerFrom || undefined,

      to: sellerTo || undefined,
    });
  };

  /*
   * ============================================================
   * SELECT ITEM
   * ============================================================
   */

  const handleItemSelect = async (item) => {
    setSelectedSale(null);

    await loadSalesByItem(item, {
      from: itemFrom || undefined,

      to: itemTo || undefined,
    });
  };

  /*
   * ============================================================
   * SEARCH ALL SALES
   * ============================================================
   */

  const filteredSales = sales.filter((sale) => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return true;
    }

    return (
      sale.sellerName?.toLowerCase().includes(value) ||
      sale.saleNumber?.toLowerCase().includes(value)
    );
  });

  /*
   * ============================================================
   * SALE DETAILS
   * ============================================================
   */

  const handleViewSale = (sale) => {
    setSelectedSale(sale);
  };

  const closeSaleDetails = () => {
    setSelectedSale(null);
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-7xl">
        {/* ==================================================
            HEADER
        ================================================== */}

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

        {/* ==================================================
            TITLE
        ================================================== */}

        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900">Selling History</h1>

          <p className="mt-2 text-slate-500">
            View and analyse all your previous sales.
          </p>
        </div>

        {/* ==================================================
            TABS
        ================================================== */}

        <SellingHistoryTabs activeTab={activeTab} onChange={handleTabChange} />

        {/* ==================================================
            ERROR
        ================================================== */}

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

        {/* ==================================================
            ALL SALES
        ================================================== */}

        {activeTab === "all" && (
          <section>
            <SellingDateFilter
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
                placeholder="Search by seller name or sale number..."
                className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                Loading selling history...
              </div>
            ) : (
              <SaleSummary sales={filteredSales} onSelect={handleViewSale} />
            )}
          </section>
        )}

        {/* ==================================================
            BY SELLER
        ================================================== */}

        {activeTab === "seller" && (
          <section>
            {!selectedSeller && (
              <>
                <SellingDateFilter
                  from={sellerFrom}
                  to={sellerTo}
                  onFromChange={setSellerFrom}
                  onToChange={setSellerTo}
                  onApply={applySellerFilter}
                  onClear={clearSellerFilter}
                  loading={loading}
                />

                {loading ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                    Loading seller sales...
                  </div>
                ) : (
                  <SellerSaleSummary
                    sellers={sellerSummaries}
                    onSelect={handleSellerSelect}
                  />
                )}
              </>
            )}

            {selectedSeller && (
              <SellerSaleDetails
                seller={selectedSeller}
                sales={sellerHistory}
                loading={loading}
                onBack={clearSellerHistory}
                onViewSale={handleViewSale}
              />
            )}
          </section>
        )}

        {/* ==================================================
            BY ITEM
        ================================================== */}

        {activeTab === "item" && (
          <section>
            {!selectedItem && (
              <>
                <SellingDateFilter
                  from={itemFrom}
                  to={itemTo}
                  onFromChange={setItemFrom}
                  onToChange={setItemTo}
                  onApply={applyItemFilter}
                  onClear={clearItemFilter}
                  loading={loading}
                />

                {loading ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                    Loading item sales...
                  </div>
                ) : (
                  <ItemSaleSummary
                    items={itemSummaries}
                    onSelect={handleItemSelect}
                  />
                )}
              </>
            )}

            {selectedItem && (
              <ItemSaleDetails
                item={selectedItem}
                sales={itemHistory}
                loading={loading}
                onBack={clearItemHistory}
                onViewSale={handleViewSale}
              />
            )}
          </section>
        )}
      </div>

      {/* ==================================================
          SALE DETAILS
      ================================================== */}

      <SaleDetails sale={selectedSale} onClose={closeSaleDetails} />
    </div>
  );
}

export default SellingHistory;
