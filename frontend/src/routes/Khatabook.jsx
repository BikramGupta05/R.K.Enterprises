import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import useSellers from "../hooks/useSellers.js";
import useSales from "../hooks/useSales.js";
import usePayments from "../hooks/usePayments.js";

/* =========================================================
   CONSTANTS
========================================================= */

const KHATABOOK_SOURCE = "KHATABOOK";

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (date) => {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getSaleDate = (sale) => {
  return sale?.saleDate || sale?.purchaseDate || sale?.createdAt || null;
};

const getPaymentDate = (payment) => {
  return payment?.paymentDate || payment?.date || payment?.createdAt || null;
};

const createLocalDate = (dateString, endOfDay = false) => {
  if (!dateString) {
    return null;
  }

  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  if (endOfDay) {
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }

  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const isDateInRange = (value, fromDate, toDate) => {
  if (!value) {
    return false;
  }

  const transactionDate = new Date(value);

  if (Number.isNaN(transactionDate.getTime())) {
    return false;
  }

  const startDate = createLocalDate(fromDate, false);

  const endDate = createLocalDate(toDate, true);

  if (startDate && transactionDate < startDate) {
    return false;
  }

  if (endDate && transactionDate > endDate) {
    return false;
  }

  return true;
};

const getSaleSellerId = (sale) => {
  return sale?.seller?._id || sale?.sellerId || sale?.seller || null;
};

const getPaymentSellerId = (payment) => {
  return payment?.seller?._id || payment?.sellerId || payment?.seller || null;
};

/* =========================================================
   COMPONENT
========================================================= */

function Khatabook() {
  const navigate = useNavigate();

  /* =======================================================
     HOOKS
  ======================================================= */

  const {
    sellers,
    loading: sellersLoading,
    error: sellersError,
  } = useSellers();

  const {
    sales,
    loading: salesLoading,
    error: salesError,
    fetchSales,
  } = useSales();

  const {
    payments,
    loading: paymentsLoading,
    error: paymentsError,
    fetchPayments,
  } = usePayments();

  /* =======================================================
     STATE
  ======================================================= */

  const [search, setSearch] = useState("");

  const [fromDate, setFromDate] = useState("");

  const [toDate, setToDate] = useState("");

  const [outstandingSort, setOutstandingSort] = useState(null);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    fetchSales();
    fetchPayments();
  }, [fetchSales, fetchPayments]);

  /* =======================================================
     LOADING
  ======================================================= */

  const loading = sellersLoading || salesLoading || paymentsLoading;

  /* =======================================================
     SELLER ACCOUNTS
  ======================================================= */

  const sellerAccounts = useMemo(() => {
    if (!Array.isArray(sellers)) {
      return [];
    }

    const startDate = createLocalDate(fromDate, false);

    const endDate = createLocalDate(toDate, true);

    const invalidDateRange = startDate && endDate && startDate > endDate;

    if (invalidDateRange) {
      return sellers.map((seller) => ({
        ...seller,
        totalSales: 0,
        totalAmount: 0,
        salePayments: 0,
        khatabookPayments: 0,
        totalPaid: 0,
        outstandingAmount: 0,
        lastSaleDate: null,
        lastPaymentDate: null,
      }));
    }

    return sellers.map((seller) => {
      const sellerId = String(seller._id);

      /* =================================================
         SELLER SALES
      ================================================= */

      const sellerSales = Array.isArray(sales)
        ? sales.filter((sale) => {
            const saleSellerId = getSaleSellerId(sale);

            if (String(saleSellerId) !== sellerId) {
              return false;
            }

            return isDateInRange(getSaleDate(sale), fromDate, toDate);
          })
        : [];

      /* =================================================
         KHATABOOK PAYMENTS

         Sale-time payments are already included
         in sale.paidAmount, so only KHATABOOK
         payment documents are counted here.
      ================================================= */

      const sellerPayments = Array.isArray(payments)
        ? payments.filter((payment) => {
            const paymentSellerId = getPaymentSellerId(payment);

            if (String(paymentSellerId) !== sellerId) {
              return false;
            }

            if (payment?.source !== KHATABOOK_SOURCE) {
              return false;
            }

            return isDateInRange(getPaymentDate(payment), fromDate, toDate);
          })
        : [];

      /* =================================================
         TOTAL SALE VALUE
      ================================================= */

      const totalAmount = sellerSales.reduce(
        (total, sale) => total + (Number(sale?.grandTotal) || 0),
        0,
      );

      /* =================================================
         SALE PAYMENTS
      ================================================= */

      const salePayments = sellerSales.reduce(
        (total, sale) => total + (Number(sale?.paidAmount) || 0),
        0,
      );

      /* =================================================
         LATER KHATABOOK PAYMENTS
      ================================================= */

      const khatabookPayments = sellerPayments.reduce(
        (total, payment) => total + (Number(payment?.amount) || 0),
        0,
      );

      /* =================================================
         TOTAL PAID
      ================================================= */

      const totalPaid = salePayments + khatabookPayments;

      /* =================================================
         OUTSTANDING
      ================================================= */

      const outstandingAmount = Math.max(totalAmount - totalPaid, 0);

      /* =================================================
         LAST SALE
      ================================================= */

      const sortedSales = [...sellerSales].sort((a, b) => {
        const dateA = new Date(getSaleDate(a) || 0).getTime();

        const dateB = new Date(getSaleDate(b) || 0).getTime();

        if (dateB !== dateA) {
          return dateB - dateA;
        }

        const createdA = new Date(a?.createdAt || 0).getTime();

        const createdB = new Date(b?.createdAt || 0).getTime();

        return createdB - createdA;
      });

      /* =================================================
         LAST PAYMENT
      ================================================= */

      const sortedPayments = [...sellerPayments].sort((a, b) => {
        const dateA = new Date(getPaymentDate(a) || 0).getTime();

        const dateB = new Date(getPaymentDate(b) || 0).getTime();

        if (dateB !== dateA) {
          return dateB - dateA;
        }

        const createdA = new Date(a?.createdAt || 0).getTime();

        const createdB = new Date(b?.createdAt || 0).getTime();

        return createdB - createdA;
      });

      return {
        ...seller,

        totalSales: sellerSales.length,

        totalAmount,

        salePayments,

        khatabookPayments,

        totalPaid,

        outstandingAmount,

        lastSaleDate: sortedSales[0] ? getSaleDate(sortedSales[0]) : null,

        lastPaymentDate: sortedPayments[0]
          ? getPaymentDate(sortedPayments[0])
          : null,
      };
    });
  }, [sellers, sales, payments, fromDate, toDate]);

  /* =======================================================
     SEARCH
  ======================================================= */

  const searchedSellers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return sellerAccounts;
    }

    return sellerAccounts.filter((seller) => {
      const shopName = seller?.shopName?.toLowerCase().includes(query);

      const name = seller?.name?.toLowerCase().includes(query);

      const phone = seller?.phone?.toLowerCase().includes(query);

      const city = seller?.city?.toLowerCase().includes(query);

      return shopName || name || phone || city;
    });
  }, [sellerAccounts, search]);

  /* =======================================================
     SORT
  ======================================================= */

  const filteredSellers = useMemo(() => {
    const result = [...searchedSellers];

    if (outstandingSort === "asc") {
      result.sort((a, b) => {
        const outstandingA = Number(a?.outstandingAmount) || 0;

        const outstandingB = Number(b?.outstandingAmount) || 0;

        if (outstandingA !== outstandingB) {
          return outstandingA - outstandingB;
        }

        return String(a?.shopName || a?.name || "").localeCompare(
          String(b?.shopName || b?.name || ""),
          undefined,
          {
            sensitivity: "base",
          },
        );
      });
    }

    if (outstandingSort === "desc") {
      result.sort((a, b) => {
        const outstandingA = Number(a?.outstandingAmount) || 0;

        const outstandingB = Number(b?.outstandingAmount) || 0;

        if (outstandingA !== outstandingB) {
          return outstandingB - outstandingA;
        }

        return String(a?.shopName || a?.name || "").localeCompare(
          String(b?.shopName || b?.name || ""),
          undefined,
          {
            sensitivity: "base",
          },
        );
      });
    }

    return result;
  }, [searchedSellers, outstandingSort]);

  /* =======================================================
     OVERALL TOTALS
  ======================================================= */

  const overall = useMemo(() => {
    return searchedSellers.reduce(
      (result, seller) => {
        result.totalSales += Number(seller?.totalSales) || 0;

        result.totalAmount += Number(seller?.totalAmount) || 0;

        result.totalPaid += Number(seller?.totalPaid) || 0;

        result.outstanding += Number(seller?.outstandingAmount) || 0;

        return result;
      },
      {
        totalSales: 0,
        totalAmount: 0,
        totalPaid: 0,
        outstanding: 0,
      },
    );
  }, [searchedSellers]);

  /* =======================================================
     OUTSTANDING SORT HANDLER
  ======================================================= */

  const handleOutstandingSort = () => {
    setOutstandingSort((currentSort) => {
      if (currentSort === null) {
        return "asc";
      }

      if (currentSort === "asc") {
        return "desc";
      }

      return null;
    });
  };

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setOutstandingSort(null);
  };

  const hasFilters = Boolean(search.trim() || fromDate || toDate);

  /* =======================================================
     SORT ICON
  ======================================================= */

  const outstandingSortIcon =
    outstandingSort === "asc" ? "↑" : outstandingSort === "desc" ? "↓" : "↕";

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const openSeller = (sellerId) => {
    if (!sellerId) {
      return;
    }

    navigate(`/dashboard/khatabook/${sellerId}`);
  };

  /* =======================================================
     LAST ACTIVITY

     Instead of showing both:
       Last Sale
       Last Payment

     show only the latest date.
  ======================================================= */

  const getLastActivity = (seller) => {
    const saleTime = seller?.lastSaleDate
      ? new Date(seller.lastSaleDate).getTime()
      : 0;

    const paymentTime = seller?.lastPaymentDate
      ? new Date(seller.lastPaymentDate).getTime()
      : 0;

    if (!saleTime && !paymentTime) {
      return null;
    }

    return saleTime >= paymentTime
      ? seller.lastSaleDate
      : seller.lastPaymentDate;
  };

  /* =======================================================
     ERROR
  ======================================================= */

  const pageError = sellersError || salesError || paymentsError;

  /* =======================================================
     LOADING UI
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-3">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex h-12 items-center justify-between border border-slate-300 bg-white px-3">
            <div>
              <h1 className="text-base font-bold text-slate-900">Khatabook</h1>

              <p className="text-[10px] text-slate-400">Loading...</p>
            </div>

            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 p-2 sm:p-3">
      <div className="mx-auto w-full max-w-[1500px]">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-2 flex h-10 items-center justify-between border border-slate-300 bg-white px-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">Khatabook</h1>

              <span className="hidden text-[10px] text-slate-400 sm:inline">
                Seller ledger
              </span>
            </div>
          </div>

          <span className="text-[10px] text-slate-500">
            {filteredSellers.length} sellers
          </span>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {pageError && (
          <div className="mb-2 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {pageError}
          </div>
        )}

        {/* =================================================
            SUMMARY

            Single compact Excel-style row
        ================================================= */}

        <div className="mb-2 overflow-hidden border border-slate-300 bg-white">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-4 sm:divide-y-0">
            <div className="px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Sales
              </p>

              <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900">
                {overall.totalSales}
              </p>
            </div>

            <div className="px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Sale Value
              </p>

              <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900">
                {formatCurrency(overall.totalAmount)}
              </p>
            </div>

            <div className="px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Paid
              </p>

              <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-600">
                {formatCurrency(overall.totalPaid)}
              </p>
            </div>

            <div className="px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Outstanding
              </p>

              <p className="mt-0.5 text-sm font-bold tabular-nums text-red-600">
                {formatCurrency(overall.outstanding)}
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            FILTER BAR

            Compact single-line Excel style
        ================================================= */}

        <div className="mb-2 overflow-hidden border border-slate-300 bg-white">
          <div className="flex flex-col gap-2 p-2 lg:flex-row lg:items-center">
            {/* Search */}

            <div className="min-w-0 flex-1 lg:max-w-[400px]">
              <div className="relative">
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  🔍
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search seller, shop, phone or city..."
                  className="h-8 w-full rounded border border-slate-300 bg-white pl-7 pr-2 text-xs text-slate-800 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
                />
              </div>
            </div>

            {/* From */}

            <div className="flex items-center gap-1.5">
              <label
                htmlFor="from-date"
                className="text-[9px] font-bold uppercase text-slate-500"
              >
                From
              </label>

              <input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="h-8 w-[140px] rounded border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-slate-500"
              />
            </div>

            {/* To */}

            <div className="flex items-center gap-1.5">
              <label
                htmlFor="to-date"
                className="text-[9px] font-bold uppercase text-slate-500"
              >
                To
              </label>

              <input
                id="to-date"
                type="date"
                min={fromDate || undefined}
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="h-8 w-[140px] rounded border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-slate-500"
              />
            </div>

            {/* Result count */}

            <div className="ml-auto whitespace-nowrap text-[10px] text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-700">
                {filteredSellers.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-700">
                {sellerAccounts.length}
              </span>
            </div>

            {/* Clear */}

            {(hasFilters || outstandingSort !== null) && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-8 rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* =================================================
            SELLER TABLE
        ================================================= */}

        <div className="overflow-hidden border border-slate-300 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-xs">
              {/* =================================================
                  TABLE HEADER
              ================================================= */}

              <thead>
                <tr className="h-8 border-b border-slate-300 bg-slate-100">
                  <th className="border-r border-slate-300 px-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    Seller
                  </th>

                  <th className="w-[70px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    Sales
                  </th>

                  <th className="w-[140px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    Total Sale
                  </th>

                  <th className="w-[140px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    Paid
                  </th>

                  <th className="w-[150px] border-r border-slate-300 px-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    <button
                      type="button"
                      onClick={handleOutstandingSort}
                      className="ml-auto inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-slate-200"
                      title={
                        outstandingSort === null
                          ? "Sort outstanding"
                          : outstandingSort === "asc"
                            ? "Sort highest outstanding first"
                            : "Reset sort"
                      }
                    >
                      <span>Outstanding</span>

                      <span className="text-xs">{outstandingSortIcon}</span>
                    </button>
                  </th>

                  <th className="w-[125px] border-r border-slate-300 px-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    Last Activity
                  </th>

                  <th className="w-[105px] px-2 text-center text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>

              {/* =================================================
                  TABLE BODY
              ================================================= */}

              <tbody>
                {filteredSellers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-10 text-center">
                      <p className="text-sm font-semibold text-slate-600">
                        No sellers found
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        Try another search or date range.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSellers.map((seller) => (
                    <tr
                      key={seller._id}
                      className="h-10 border-b border-slate-200 last:border-b-0 hover:bg-slate-50"
                    >
                      {/* Seller */}

                      <td className="border-r border-slate-200 px-2">
                        <button
                          type="button"
                          onClick={() => openSeller(seller._id)}
                          className="block max-w-full text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="truncate font-semibold text-slate-900 hover:underline">
                              {seller.shopName ||
                                seller.name ||
                                "Unnamed Seller"}
                            </span>

                            {seller.name && seller.shopName && (
                              <span className="shrink-0 text-[10px] text-slate-400">
                                {seller.name}
                              </span>
                            )}
                          </div>

                          {(seller.phone || seller.city) && (
                            <div className="mt-0.5 truncate text-[9px] text-slate-400">
                              {seller.phone}

                              {seller.phone && seller.city ? " • " : ""}

                              {seller.city}
                            </div>
                          )}
                        </button>
                      </td>

                      {/* Sales */}

                      <td className="border-r border-slate-200 px-2 text-right font-medium tabular-nums text-slate-700">
                        {seller.totalSales}
                      </td>

                      {/* Total Sale */}

                      <td className="border-r border-slate-200 px-2 text-right font-semibold tabular-nums text-slate-900">
                        {formatCurrency(seller.totalAmount)}
                      </td>

                      {/* Paid */}

                      <td className="border-r border-slate-200 px-2 text-right font-semibold tabular-nums text-emerald-600">
                        {formatCurrency(seller.totalPaid)}
                      </td>

                      {/* Outstanding */}

                      <td className="border-r border-slate-200 px-2 text-right">
                        <span
                          className={
                            Number(seller.outstandingAmount) > 0
                              ? "font-bold tabular-nums text-red-600"
                              : "font-bold tabular-nums text-emerald-600"
                          }
                        >
                          {formatCurrency(seller.outstandingAmount)}
                        </span>
                      </td>

                      {/* Last Activity */}

                      <td className="border-r border-slate-200 px-2 whitespace-nowrap text-slate-600">
                        {formatDate(getLastActivity(seller))}
                      </td>

                      {/* Action */}

                      <td className="px-2 text-center">
                        <button
                          type="button"
                          onClick={() => openSeller(seller._id)}
                          className="h-6 rounded border border-slate-300 bg-white px-2.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          View Ledger
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              TABLE FOOTER
          ================================================= */}

          <div className="flex h-7 items-center justify-between border-t border-slate-300 bg-slate-50 px-2 text-[9px] text-slate-500">
            <span>Khatabook Ledger</span>

            <span>{filteredSellers.length} records</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Khatabook;
