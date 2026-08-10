import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import useSellers from "../hooks/useSellers.js";
import useSales from "../hooks/useSales.js";
import usePayments from "../hooks/usePayments.js";

function Khatabook() {
  const navigate = useNavigate();

  /* =========================================================
     Hooks
  ========================================================= */

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

  /* =========================================================
     UI State
  ========================================================= */

  const [search, setSearch] = useState("");

  /* =========================================================
     Load Khatabook Data
  ========================================================= */

  useEffect(() => {
    fetchSales();
    fetchPayments();
  }, [fetchSales, fetchPayments]);

  /* =========================================================
     Loading
  ========================================================= */

  const loading = sellersLoading || salesLoading || paymentsLoading;

  /* =========================================================
     Seller Accounts
  ========================================================= */

  const sellerAccounts = useMemo(() => {
    if (!Array.isArray(sellers)) {
      return [];
    }

    return sellers.map((seller) => {
      const sellerId = String(seller._id);

      /* -----------------------------------------------------
         Sales belonging to this seller
      ----------------------------------------------------- */

      const sellerSales = Array.isArray(sales)
        ? sales.filter((sale) => {
            const saleSellerId =
              sale?.seller?._id || sale?.sellerId || sale?.seller;

            return String(saleSellerId) === sellerId;
          })
        : [];

      /* -----------------------------------------------------
         Khatabook payments belonging to this seller
      ----------------------------------------------------- */

      const sellerPayments = Array.isArray(payments)
        ? payments.filter((payment) => {
            const paymentSellerId =
              payment?.seller?._id || payment?.sellerId || payment?.seller;

            return String(paymentSellerId) === sellerId;
          })
        : [];

      /* -----------------------------------------------------
         Total Sale Value
      ----------------------------------------------------- */

      const totalAmount = sellerSales.reduce((total, sale) => {
        return total + (Number(sale?.grandTotal) || 0);
      }, 0);

      /* -----------------------------------------------------
         Payments Made During Sale
      ----------------------------------------------------- */

      const salePayments = sellerSales.reduce((total, sale) => {
        return total + (Number(sale?.paidAmount) || 0);
      }, 0);

      /* -----------------------------------------------------
         Later Khatabook Payments
      ----------------------------------------------------- */

      const khatabookPayments = sellerPayments.reduce((total, payment) => {
        return total + (Number(payment?.amount) || 0);
      }, 0);

      /* -----------------------------------------------------
         Total Paid
      ----------------------------------------------------- */

      const totalPaid = salePayments + khatabookPayments;

      /* -----------------------------------------------------
         Outstanding
      ----------------------------------------------------- */

      const outstandingAmount = Math.max(totalAmount - totalPaid, 0);

      /* -----------------------------------------------------
         Last Sale
      ----------------------------------------------------- */

      const sortedSales = [...sellerSales].sort(
        (a, b) =>
          new Date(b?.saleDate || b?.purchaseDate || b?.createdAt || 0) -
          new Date(a?.saleDate || a?.purchaseDate || a?.createdAt || 0),
      );

      /* -----------------------------------------------------
         Last Payment
      ----------------------------------------------------- */

      const sortedPayments = [...sellerPayments].sort(
        (a, b) =>
          new Date(b?.paymentDate || b?.date || b?.createdAt || 0) -
          new Date(a?.paymentDate || a?.date || a?.createdAt || 0),
      );

      return {
        ...seller,

        totalSales: sellerSales.length,

        totalAmount,

        salePayments,

        khatabookPayments,

        totalPaid,

        outstandingAmount,

        lastSaleDate:
          sortedSales[0]?.saleDate ||
          sortedSales[0]?.purchaseDate ||
          sortedSales[0]?.createdAt ||
          null,

        lastPaymentDate:
          sortedPayments[0]?.paymentDate ||
          sortedPayments[0]?.date ||
          sortedPayments[0]?.createdAt ||
          null,
      };
    });
  }, [sellers, sales, payments]);

  /* =========================================================
     Search
  ========================================================= */

  const filteredSellers = useMemo(() => {
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

  /* =========================================================
     Overall Totals
  ========================================================= */

  const overall = useMemo(() => {
    return filteredSellers.reduce(
      (result, seller) => {
        result.totalSales += seller.totalSales;

        result.totalAmount += seller.totalAmount;

        result.totalPaid += seller.totalPaid;

        result.outstanding += seller.outstandingAmount;

        return result;
      },
      {
        totalSales: 0,
        totalAmount: 0,
        totalPaid: 0,
        outstanding: 0,
      },
    );
  }, [filteredSellers]);

  /* =========================================================
     Format Currency
  ========================================================= */

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toFixed(2)}`;
  };

  /* =========================================================
     Format Date
  ========================================================= */

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

  /* =========================================================
     Navigation
  ========================================================= */

  const openSeller = (sellerId) => {
    if (!sellerId) {
      return;
    }

    navigate(`/khatabook/${sellerId}`);
  };

  /* =========================================================
     Error
  ========================================================= */

  const pageError = sellersError || salesError || paymentsError;

  /* =========================================================
     Loading UI
  ========================================================= */

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

  /* =========================================================
     Main UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">
        {/* =================================================
            Header
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Khatabook</h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage seller balances, payments and outstanding amounts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Back to Dashboard
          </button>
        </div>

        {/* =================================================
            Error
        ================================================= */}

        {pageError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{pageError}</p>
          </div>
        )}

        {/* =================================================
            Summary
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
            Search
        ================================================= */}

        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search seller, shop, phone or city..."
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <p className="text-sm text-slate-500">
            {filteredSellers.length} seller
            {filteredSellers.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* =================================================
            Seller Table
        ================================================= */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Seller
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sales
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total Sale
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Paid
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Outstanding
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Last Sale
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Last Payment
                  </th>

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
                        Try another search.
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
                            seller.outstandingAmount > 0
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
