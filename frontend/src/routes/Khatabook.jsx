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

/*
 * Format currency.
 */
const formatCurrency = (value) => {
  return `₹${Number(value || 0).toFixed(2)}`;
};

/*
 * Format date for display.
 */
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

/*
 * Get sale date.
 */
const getSaleDate = (sale) => {
  return sale?.saleDate || sale?.purchaseDate || sale?.createdAt || null;
};

/*
 * Get payment date.
 */
const getPaymentDate = (payment) => {
  return payment?.paymentDate || payment?.date || payment?.createdAt || null;
};

/*
 * Convert a YYYY-MM-DD input value
 * into a local Date.
 *
 * This prevents timezone issues.
 */
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

/*
 * Check whether a transaction belongs
 * to the selected date range.
 */
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

/*
 * Get seller ID safely.
 */
const getSaleSellerId = (sale) => {
  return sale?.seller?._id || sale?.sellerId || sale?.seller || null;
};

/*
 * Get payment seller ID safely.
 */
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
     UI STATE
  ======================================================= */

  /*
   * Seller search.
   */
  const [search, setSearch] = useState("");

  /*
   * Date range.
   */
  const [fromDate, setFromDate] = useState("");

  const [toDate, setToDate] = useState("");

  /*
   * Outstanding sorting.
   *
   * null = normal/default seller order
   * asc  = lowest outstanding first
   * desc = highest outstanding first
   *
   * Because this is React state, a browser
   * refresh automatically resets it to null.
   */
  const [outstandingSort, setOutstandingSort] = useState(null);

  /* =======================================================
     LOAD KHATABOOK DATA
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
     
     This is the main calculation.
  ======================================================= */

  const sellerAccounts = useMemo(() => {
    if (!Array.isArray(sellers)) {
      return [];
    }

    /*
     * If user selects an invalid range,
     * return no seller transactions.
     */
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
           SALES BELONGING TO SELLER
        ================================================= */

      const sellerSales = Array.isArray(sales)
        ? sales.filter((sale) => {
            const saleSellerId = getSaleSellerId(sale);

            if (String(saleSellerId) !== sellerId) {
              return false;
            }

            /*
             * Apply date range.
             */
            return isDateInRange(getSaleDate(sale), fromDate, toDate);
          })
        : [];

      /* =================================================
           KHATABOOK PAYMENTS
           
           IMPORTANT:
           
           Only Payment documents created
           through Khatabook Add Payment
           are counted here.
           
           Sale-time payment is already stored
           inside Sale.paidAmount.
        ================================================= */

      const sellerPayments = Array.isArray(payments)
        ? payments.filter((payment) => {
            const paymentSellerId = getPaymentSellerId(payment);

            if (String(paymentSellerId) !== sellerId) {
              return false;
            }

            /*
             * Do NOT count sale-time payment
             * as a separate Payment.
             */
            if (payment?.source !== KHATABOOK_SOURCE) {
              return false;
            }

            /*
             * Apply date range.
             */
            return isDateInRange(getPaymentDate(payment), fromDate, toDate);
          })
        : [];

      /* =================================================
           TOTAL SALE VALUE
        ================================================= */

      const totalAmount = sellerSales.reduce((total, sale) => {
        return total + (Number(sale?.grandTotal) || 0);
      }, 0);

      /* =================================================
           PAYMENTS MADE DURING SALE
        ================================================= */

      const salePayments = sellerSales.reduce((total, sale) => {
        return total + (Number(sale?.paidAmount) || 0);
      }, 0);

      /* =================================================
           LATER KHATABOOK PAYMENTS
        ================================================= */

      const khatabookPayments = sellerPayments.reduce((total, payment) => {
        return total + (Number(payment?.amount) || 0);
      }, 0);

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

        /*
         * If two sales have the
         * same date, newest created
         * document comes first.
         */
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

        /*
         * Same payment date:
         * newest created payment first.
         */
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
     OUTSTANDING SORT
     
     DEFAULT
       Original seller order
     
     ASC
       Lowest outstanding first
     
     DESC
       Highest outstanding first
  ======================================================= */

  const filteredSellers = useMemo(() => {
    /*
     * Always make a new array.
     *
     * We never mutate sellerAccounts.
     */
    const result = [...searchedSellers];

    if (outstandingSort === "asc") {
      result.sort((a, b) => {
        const outstandingA = Number(a?.outstandingAmount) || 0;

        const outstandingB = Number(b?.outstandingAmount) || 0;

        /*
         * Secondary alphabetical
         * ordering keeps equal values stable.
         */
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

    /*
     * If outstandingSort is null,
     * don't sort.
     *
     * Therefore refresh gives the
     * normal/default order again.
     */
    return result;
  }, [searchedSellers, outstandingSort]);

  /* =======================================================
     OVERALL TOTALS
     
     These totals respect:
     
     1. Search
     2. Date range
     3. Outstanding sorting does NOT affect totals
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
     
     Cycle:
     
     null → asc → desc → null
     
     However the user specifically wants
     refresh to return to normal.
     
     Since state starts as null,
     refresh automatically resets it.
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

    /*
     * Also return outstanding sorting
     * to normal.
     */
    setOutstandingSort(null);
  };

  /* =======================================================
     FILTER STATE
  ======================================================= */

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

    navigate(`/khatabook/${sellerId}`);
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
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />

            <p className="mt-4 text-sm text-slate-600">Loading Khatabook...</p>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Khatabook</h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage seller balances, payments and outstanding amounts.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {pageError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{pageError}</p>
          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 md:grid-cols-4 md:divide-y-0">
            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total Sales
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {overall.totalSales}
              </p>
            </div>

            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total Sale Value
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(overall.totalAmount)}
              </p>
            </div>

            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total Paid
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {formatCurrency(overall.totalPaid)}
              </p>
            </div>

            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Outstanding
              </p>

              <p className="mt-2 text-2xl font-bold text-red-600">
                {formatCurrency(overall.outstanding)}
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            SEARCH + DATE RANGE
        ================================================= */}

        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-900">Search & Filter</h2>

            <p className="mt-1 text-xs text-slate-500">
              Search sellers or filter their transactions by date.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search seller, shop, phone or city..."
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {/* From Date */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                From Date
              </label>

              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {/* To Date */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                To Date
              </label>

              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          {/* Filter information */}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filteredSellers.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {sellerAccounts.length}
              </span>{" "}
              sellers
            </p>

            {(hasFilters || outstandingSort !== null) && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* =================================================
            SELLER TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {/* Seller */}

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Seller
                  </th>

                  {/* Sales */}

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sales
                  </th>

                  {/* Total Sale */}

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total Sale
                  </th>

                  {/* Paid */}

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Paid
                  </th>

                  {/* Outstanding */}

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <button
                      type="button"
                      onClick={handleOutstandingSort}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                      title={
                        outstandingSort === null
                          ? "Sort outstanding"
                          : outstandingSort === "asc"
                            ? "Sort highest outstanding first"
                            : "Reset outstanding order"
                      }
                    >
                      Outstanding
                      <span className="text-sm font-bold">
                        {outstandingSortIcon}
                      </span>
                    </button>
                  </th>

                  {/* Last Sale */}

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Last Sale
                  </th>

                  {/* Last Payment */}

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Last Payment
                  </th>

                  {/* Action */}

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSellers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center">
                      <p className="text-sm font-medium text-slate-600">
                        No sellers found
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Try another search or date range.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSellers.map((seller) => (
                    <tr
                      key={seller._id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      {/* Seller */}

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => openSeller(seller._id)}
                          className="text-left"
                        >
                          <p className="font-semibold text-slate-900 hover:text-slate-600">
                            {seller.shopName || seller.name || "Unnamed Seller"}
                          </p>

                          {seller.name && seller.shopName && (
                            <p className="mt-1 text-xs text-slate-500">
                              {seller.name}
                            </p>
                          )}

                          {seller.phone && (
                            <p className="mt-1 text-xs text-slate-400">
                              {seller.phone}
                            </p>
                          )}
                        </button>
                      </td>

                      {/* Sales */}

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {seller.totalSales}
                      </td>

                      {/* Total Sale */}

                      <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                        {formatCurrency(seller.totalAmount)}
                      </td>

                      {/* Paid */}

                      <td className="px-4 py-4 text-right text-sm font-medium text-emerald-600">
                        {formatCurrency(seller.totalPaid)}
                      </td>

                      {/* Outstanding */}

                      <td className="px-4 py-4 text-right">
                        <span
                          className={
                            Number(seller.outstandingAmount) > 0
                              ? "font-semibold text-red-600"
                              : "font-semibold text-emerald-600"
                          }
                        >
                          {formatCurrency(seller.outstandingAmount)}
                        </span>
                      </td>

                      {/* Last Sale */}

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatDate(seller.lastSaleDate)}
                      </td>

                      {/* Last Payment */}

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatDate(seller.lastPaymentDate)}
                      </td>

                      {/* Action */}

                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openSeller(seller._id)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
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
        </div>
      </div>
    </div>
  );
}

export default Khatabook;
