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

  /* =========================================================
     STATE
  ========================================================= */

  const [activeTab, setActiveTab] = useState("all");

  const [selectedSale, setSelectedSale] = useState(null);

  const [search, setSearch] = useState("");

  const [allFrom, setAllFrom] = useState("");
  const [allTo, setAllTo] = useState("");

  const [sellerFrom, setSellerFrom] = useState("");
  const [sellerTo, setSellerTo] = useState("");

  const [itemFrom, setItemFrom] = useState("");
  const [itemTo, setItemTo] = useState("");

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  /* =========================================================
     TAB CHANGE
  ========================================================= */

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

  /* =========================================================
     ALL SALES FILTER
  ========================================================= */

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
    setSelectedSale(null);

    await loadSales();
  };

  /* =========================================================
     SELLER FILTER
  ========================================================= */

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
     SELLER SELECTION
  ========================================================= */

  const handleSellerSelect = async (seller) => {
    setSelectedSale(null);

    await loadSalesBySeller(seller, {
      from: sellerFrom || undefined,
      to: sellerTo || undefined,
    });
  };

  /* =========================================================
     ITEM SELECTION
  ========================================================= */

  const handleItemSelect = async (item) => {
    setSelectedSale(null);

    await loadSalesByItem(item, {
      from: itemFrom || undefined,
      to: itemTo || undefined,
    });
  };

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredSales = sales.filter((sale) => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return true;
    }

    return (
      sale.sellerName?.toLowerCase().includes(searchValue) ||
      sale.saleNumber?.toLowerCase().includes(searchValue)
    );
  });

  /* =========================================================
     SALE DETAILS
  ========================================================= */

  const handleViewSale = (sale) => {
    setSelectedSale(sale);
  };

  const closeSaleDetails = () => {
    setSelectedSale(null);
  };

  /* =========================================================
     DATE FILTER
  ========================================================= */

  const renderDateFilter = () => {
    if (activeTab === "all") {
      return (
        <SellingDateFilter
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

    if (activeTab === "seller") {
      return (
        <SellingDateFilter
          from={sellerFrom}
          to={sellerTo}
          onFromChange={setSellerFrom}
          onToChange={setSellerTo}
          onApply={applySellerFilter}
          onClear={clearSellerFilter}
          loading={loading}
        />
      );
    }

    return (
      <SellingDateFilter
        from={itemFrom}
        to={itemTo}
        onFromChange={setItemFrom}
        onToChange={setItemTo}
        onApply={applyItemFilter}
        onClear={clearItemFilter}
        loading={loading}
      />
    );
  };

  /* =========================================================
     COUNT
  ========================================================= */

  const getCount = () => {
    if (activeTab === "all") {
      return filteredSales.length;
    }

    if (activeTab === "seller" && !selectedSeller) {
      return sellerSummaries.length;
    }

    if (activeTab === "item" && !selectedItem) {
      return itemSummaries.length;
    }

    return null;
  };

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50 p-2">
      <div className="mx-auto w-full max-w-[1400px]">
        {/* =====================================================
            TOP BAR
        ===================================================== */}

        <div className="mb-1 flex h-9 items-center justify-between border border-slate-300 bg-white px-2">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="h-7 rounded border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={() => navigate("/selling")}
            className="h-7 rounded bg-slate-900 px-3 text-[11px] font-semibold text-white transition hover:bg-slate-800"
          >
            + New Sale
          </button>
        </div>

        {/* =====================================================
            TITLE
        ===================================================== */}

        <div className="mb-1 flex h-9 items-center justify-between border border-slate-300 bg-white px-3">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base">
              Selling History
            </h1>

            <span className="hidden text-[10px] text-slate-400 sm:inline">
              Sales records
            </span>
          </div>

          {getCount() !== null && (
            <span className="shrink-0 text-[10px] font-medium text-slate-400">
              {getCount()}{" "}
              {activeTab === "all"
                ? "sales"
                : activeTab === "seller"
                  ? "sellers"
                  : "items"}
            </span>
          )}
        </div>

        {/* =====================================================
            TABS
        ===================================================== */}

        <div className="mb-1 overflow-hidden border border-slate-300 bg-white">
          <SellingHistoryTabs
            activeTab={activeTab}
            onChange={handleTabChange}
          />
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mb-1 flex h-7 items-center justify-between border border-red-200 bg-red-50 px-2 text-[10px] text-red-700">
            <span className="truncate">{error}</span>

            <button
              type="button"
              onClick={clearError}
              className="ml-2 shrink-0 font-bold text-red-800 hover:underline"
            >
              ×
            </button>
          </div>
        )}

        {/* =====================================================
            ALL SALES
        ===================================================== */}

        {activeTab === "all" && (
          <section>
            {/* Compact Toolbar */}

            <div className="mb-1 flex min-h-[36px] flex-col gap-1 border border-slate-300 bg-white p-1 sm:flex-row sm:items-center">
              {/* Search */}

              <div className="w-full sm:w-[270px] sm:shrink-0">
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search seller or sale no..."
                  className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-[10px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
                />
              </div>

              {/* Date Filter */}

              <div className="min-w-0 flex-1">{renderDateFilter()}</div>
            </div>

            {/* Table */}

            {loading ? (
              <div className="flex h-10 items-center justify-center border border-slate-300 bg-white text-[10px] text-slate-500">
                Loading selling history...
              </div>
            ) : (
              <SaleSummary sales={filteredSales} onSelect={handleViewSale} />
            )}
          </section>
        )}

        {/* =====================================================
            BY SELLER
        ===================================================== */}

        {activeTab === "seller" && (
          <section>
            {!selectedSeller ? (
              <>
                {/* Compact Date Filter */}

                <div className="mb-1 flex h-9 items-center border border-slate-300 bg-white px-2">
                  {renderDateFilter()}
                </div>

                {/* Seller Table */}

                {loading ? (
                  <div className="flex h-10 items-center justify-center border border-slate-300 bg-white text-[10px] text-slate-500">
                    Loading seller sales...
                  </div>
                ) : (
                  <SellerSaleSummary
                    sellers={sellerSummaries}
                    onSelect={handleSellerSelect}
                  />
                )}
              </>
            ) : (
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

        {/* =====================================================
            BY ITEM
        ===================================================== */}

        {activeTab === "item" && (
          <section>
            {!selectedItem ? (
              <>
                {/* Compact Date Filter */}

                <div className="mb-1 flex h-9 items-center border border-slate-300 bg-white px-2">
                  {renderDateFilter()}
                </div>

                {/* Item Table */}

                {loading ? (
                  <div className="flex h-10 items-center justify-center border border-slate-300 bg-white text-[10px] text-slate-500">
                    Loading item sales...
                  </div>
                ) : (
                  <ItemSaleSummary
                    items={itemSummaries}
                    onSelect={handleItemSelect}
                  />
                )}
              </>
            ) : (
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

      {/* =====================================================
          SALE DETAILS MODAL
      ===================================================== */}

      <SaleDetails sale={selectedSale} onClose={closeSaleDetails} />
    </div>
  );
}

export default SellingHistory;
