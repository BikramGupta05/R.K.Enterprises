import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import useSellers from "../hooks/useSellers.js";
import useSales from "../hooks/useSales.js";
import usePayments from "../hooks/usePayments.js";

import { useAuth } from "../contexts/AuthContext.jsx";

/* =========================================================
   CONSTANTS
========================================================= */

const KHATABOOK_SOURCE = "KHATABOOK";

const PAYMENT_METHODS = {
  cash: "Cash",
  upi: "UPI",
  netbanking: "Net Banking",
  other: "Other",
};

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (value) => {
  return `₹${Number(value || 0).toFixed(2)}`;
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/*
 * Return the date used by a sale.
 */
const getSaleDate = (sale) => {
  return sale?.saleDate || sale?.createdAt || null;
};

/*
 * Return the date used by a payment.
 */
const getPaymentDate = (payment) => {
  return payment?.paymentDate || payment?.createdAt || null;
};

/*
 * Convert a backend date into YYYY-MM-DD
 * using the user's local timezone.
 */
const getLocalDateString = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/*
 * Safely get the timestamp used for ordering.
 *
 * Important:
 *
 * 1. First use the actual transaction date.
 * 2. If two transactions have the same date,
 *    use createdAt as the tie breaker.
 *
 * This is important when two payments happen
 * on the same day.
 */
const getEntryTimestamp = (entry) => {
  const transactionDate = entry?.date ? new Date(entry.date).getTime() : 0;

  if (Number.isFinite(transactionDate) && transactionDate > 0) {
    return transactionDate;
  }

  const createdAt = entry?.raw?.createdAt
    ? new Date(entry.raw.createdAt).getTime()
    : 0;

  if (Number.isFinite(createdAt) && createdAt > 0) {
    return createdAt;
  }

  return 0;
};

/*
 * Get the creation timestamp.
 *
 * This is used when two transactions have exactly
 * the same payment/sale date.
 */
const getCreatedTimestamp = (entry) => {
  const createdAt = entry?.raw?.createdAt
    ? new Date(entry.raw.createdAt).getTime()
    : 0;

  return Number.isFinite(createdAt) ? createdAt : 0;
};

/*
 * Create a local Date from YYYY-MM-DD.
 *
 * This avoids UTC date conversion problems.
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

/* =========================================================
   COMPONENT
========================================================= */

function KhatabookSeller() {
  const navigate = useNavigate();

  const { sellerId } = useParams();

  /* =======================================================
     AUTHENTICATION
  ======================================================= */

  const { accessToken, loading: authLoading } = useAuth();

  /* =======================================================
     SELLERS
  ======================================================= */

  const {
    sellers,
    loading: sellersLoading,
    error: sellersError,
    loadSellers,
  } = useSellers();

  /* =======================================================
     SALES
  ======================================================= */

  const {
    sales,
    loading: salesLoading,
    error: salesError,
    fetchSales,
  } = useSales();

  /* =======================================================
     PAYMENTS
  ======================================================= */

  const {
    payments,
    loading: paymentsLoading,
    saving,
    error: paymentsError,
    fetchPaymentsBySeller,
    addPayment,
    editPayment,
    removePayment,
  } = usePayments();

  /* =======================================================
     PAYMENT FORM STATE
  ======================================================= */

  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const [editingPayment, setEditingPayment] = useState(null);

  const [paymentAmount, setPaymentAmount] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [paymentReference, setPaymentReference] = useState("");

  const [paymentNote, setPaymentNote] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [actionError, setActionError] = useState("");

  /* =======================================================
     LEDGER FILTER STATE
  ======================================================= */

  const [searchTerm, setSearchTerm] = useState("");

  const [fromDate, setFromDate] = useState("");

  const [toDate, setToDate] = useState("");

  /* =======================================================
     FIND SELLER
  ======================================================= */

  const seller = useMemo(() => {
    if (!sellerId || !Array.isArray(sellers)) {
      return null;
    }

    return (
      sellers.find(
        (currentSeller) => String(currentSeller?._id) === String(sellerId),
      ) || null
    );
  }, [sellers, sellerId]);

  /* =======================================================
     LOAD SELLER DATA
  ======================================================= */

  const loadSellerData = useCallback(async () => {
    if (!sellerId) {
      return;
    }

    if (authLoading) {
      return;
    }

    if (!accessToken) {
      return;
    }

    await loadSellers();

    await fetchSales();

    await fetchPaymentsBySeller(sellerId);
  }, [
    sellerId,
    authLoading,
    accessToken,
    loadSellers,
    fetchSales,
    fetchPaymentsBySeller,
  ]);

  useEffect(() => {
    if (authLoading || !accessToken) {
      return;
    }

    loadSellerData();
  }, [authLoading, accessToken, loadSellerData]);

  /* =======================================================
     SELLER SALES
  ======================================================= */

  const sellerSales = useMemo(() => {
    if (!Array.isArray(sales)) {
      return [];
    }

    return sales
      .filter((sale) => {
        const saleSellerId =
          sale?.seller?._id || sale?.sellerId || sale?.seller;

        return String(saleSellerId) === String(sellerId);
      })
      .sort((a, b) => {
        const dateA = new Date(getSaleDate(a) || 0).getTime();

        const dateB = new Date(getSaleDate(b) || 0).getTime();

        if (dateB !== dateA) {
          return dateB - dateA;
        }

        const createdA = new Date(a?.createdAt || 0).getTime();

        const createdB = new Date(b?.createdAt || 0).getTime();

        return createdB - createdA;
      });
  }, [sales, sellerId]);

  /* =======================================================
     KHATABOOK PAYMENTS ONLY
  ======================================================= */

  const sellerPayments = useMemo(() => {
    if (!Array.isArray(payments)) {
      return [];
    }

    return payments
      .filter((payment) => payment?.source === KHATABOOK_SOURCE)
      .sort((a, b) => {
        const dateA = new Date(getPaymentDate(a) || 0).getTime();

        const dateB = new Date(getPaymentDate(b) || 0).getTime();

        if (dateB !== dateA) {
          return dateB - dateA;
        }

        const createdA = new Date(a?.createdAt || 0).getTime();

        const createdB = new Date(b?.createdAt || 0).getTime();

        return createdB - createdA;
      });
  }, [payments]);

  /* =======================================================
     ACCOUNT CALCULATION
  ======================================================= */

  const displayAccount = useMemo(() => {
    const totalSaleValue = sellerSales.reduce(
      (total, sale) => total + (Number(sale?.grandTotal) || 0),
      0,
    );

    /*
     * Amount already received while making
     * the original sale.
     */
    const salePayments = sellerSales.reduce(
      (total, sale) => total + (Number(sale?.paidAmount) || 0),
      0,
    );

    /*
     * Payments created from the Khatabook
     * Add Payment section only.
     */
    const khatabookPayments = sellerPayments.reduce(
      (total, payment) => total + (Number(payment?.amount) || 0),
      0,
    );

    const totalPaid = salePayments + khatabookPayments;

    const outstanding = Math.max(totalSaleValue - totalPaid, 0);

    return {
      totalSales: sellerSales.length,

      totalSaleValue,

      salePayments,

      khatabookPayments,

      totalPaid,

      outstanding,
    };
  }, [sellerSales, sellerPayments]);

  /* =======================================================
     PAYMENT DATE VALUE
  ======================================================= */

  const paymentDateValue = useCallback((payment) => {
    const value = getPaymentDate(payment);

    if (!value) {
      return new Date().toISOString().split("T")[0];
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return new Date().toISOString().split("T")[0];
    }

    return getLocalDateString(date);
  }, []);

  /* =======================================================
     RESET PAYMENT FORM
  ======================================================= */

  const resetPaymentForm = useCallback(() => {
    setPaymentAmount("");

    setPaymentMethod("cash");

    setPaymentDate(new Date().toISOString().split("T")[0]);

    setPaymentReference("");

    setPaymentNote("");

    setEditingPayment(null);

    setShowPaymentForm(false);

    setActionError("");
  }, []);

  /* =======================================================
     OPEN ADD PAYMENT
  ======================================================= */

  const openAddPayment = useCallback(() => {
    setEditingPayment(null);

    setPaymentAmount("");

    setPaymentMethod("cash");

    setPaymentDate(new Date().toISOString().split("T")[0]);

    setPaymentReference("");

    setPaymentNote("");

    setActionError("");

    setShowPaymentForm(true);
  }, []);

  /* =======================================================
     OPEN EDIT PAYMENT
  ======================================================= */

  const openEditPayment = useCallback(
    (payment) => {
      setEditingPayment(payment);

      setPaymentAmount(String(payment?.amount || ""));

      const backendMethod = payment?.paymentMethod || "Cash";

      const frontendMethod =
        Object.entries(PAYMENT_METHODS).find(
          ([, value]) => value === backendMethod,
        )?.[0] || "other";

      setPaymentMethod(frontendMethod);

      setPaymentDate(paymentDateValue(payment));

      setPaymentReference(payment?.referenceNumber || "");

      setPaymentNote(payment?.note || "");

      setActionError("");

      setShowPaymentForm(true);
    },
    [paymentDateValue],
  );

  /* =======================================================
     SUBMIT PAYMENT
  ======================================================= */

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();

    setActionError("");

    if (authLoading || !accessToken) {
      setActionError("Authentication is still initializing. Please try again.");

      return;
    }

    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError("Enter a valid payment amount.");

      return;
    }

    if (!sellerId) {
      setActionError("Seller ID is missing.");

      return;
    }

    const existingPaymentAmount = editingPayment
      ? Number(editingPayment?.amount) || 0
      : 0;

    const maximumAllowedPayment =
      Number(displayAccount.outstanding) + existingPaymentAmount;

    if (amount > maximumAllowedPayment) {
      setActionError(
        `Payment cannot be greater than the outstanding balance of ${formatCurrency(
          maximumAllowedPayment,
        )}.`,
      );

      return;
    }

    try {
      setSubmitting(true);

      const normalizedPaymentMethod = PAYMENT_METHODS[paymentMethod] || "Other";

      const paymentData = {
        sellerId,

        amount,

        paymentMethod: normalizedPaymentMethod,

        paymentDate,

        referenceNumber: paymentReference.trim(),

        note: paymentNote.trim(),
      };

      let result;

      if (editingPayment) {
        result = await editPayment(editingPayment._id, paymentData);
      } else {
        result = await addPayment(paymentData);
      }

      if (!result?.success) {
        setActionError(result?.error || "Unable to save payment.");

        return;
      }

      /*
       * Refresh both datasets so the ledger
       * and summary always use backend data.
       */
      await fetchPaymentsBySeller(sellerId);

      await fetchSales();

      resetPaymentForm();
    } catch (error) {
      console.error("Payment operation failed:", error);

      setActionError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save payment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     DELETE PAYMENT
  ======================================================= */

  const handleDeletePayment = async (payment) => {
    if (payment?.source !== KHATABOOK_SOURCE) {
      setActionError("Only Khatabook payments can be deleted here.");

      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this payment?",
    );

    if (!confirmed) {
      return;
    }

    setActionError("");

    try {
      const result = await removePayment(payment._id);

      if (!result?.success) {
        setActionError(result?.error || "Unable to delete payment.");

        return;
      }

      await fetchPaymentsBySeller(sellerId);

      await fetchSales();
    } catch (error) {
      console.error("Failed to delete payment:", error);

      setActionError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to delete payment.",
      );
    }
  };

  /* =======================================================
     COMBINED LEDGER
     
     IMPORTANT:
     
     This creates the ledger in chronological order.
     
     We MUST calculate balance from oldest
     transaction to newest transaction.
     
     The UI will reverse this later.
  ======================================================= */

  const chronologicalLedger = useMemo(() => {
    const saleEntries = sellerSales.map((sale) => {
      const saleAmount = Number(sale?.grandTotal) || 0;

      const paidDuringSale = Number(sale?.paidAmount) || 0;

      return {
        id: `sale-${sale._id}`,

        type: "sale",

        date: getSaleDate(sale),

        reference: sale?.saleNumber || sale?._id,

        description: sale?.items?.length
          ? `${sale.items.length} item${sale.items.length !== 1 ? "s" : ""}`
          : "Sale",

        debit: Math.max(saleAmount, 0),

        /*
         * IMPORTANT:
         *
         * Payment made while creating
         * the sale is credit here.
         *
         * It is NOT also treated as a
         * Khatabook Payment.
         */
        credit: Math.min(Math.max(paidDuringSale, 0), Math.max(saleAmount, 0)),

        raw: sale,
      };
    });

    /*
     * Only KHATABOOK payments are added
     * as separate ledger credit entries.
     */
    const paymentEntries = sellerPayments.map((payment) => {
      const paymentAmount = Number(payment?.amount) || 0;

      return {
        id: `payment-${payment._id}`,

        type: "payment",

        date: getPaymentDate(payment),

        reference: payment?.paymentNumber || payment?._id,

        description: payment?.note || "Payment received",

        debit: 0,

        credit: Math.max(paymentAmount, 0),

        raw: payment,
      };
    });

    /*
     * Chronological order:
     *
     * oldest -> newest
     *
     * First sort by transaction date.
     * Then createdAt for same-date entries.
     */
    return [...saleEntries, ...paymentEntries].sort((a, b) => {
      const timeA = getEntryTimestamp(a);

      const timeB = getEntryTimestamp(b);

      if (timeA !== timeB) {
        return timeA - timeB;
      }

      const createdA = getCreatedTimestamp(a);

      const createdB = getCreatedTimestamp(b);

      if (createdA !== createdB) {
        return createdA - createdB;
      }

      /*
       * If both timestamps are exactly
       * the same, keep sale before payment.
       */
      if (a.type === "sale" && b.type === "payment") {
        return -1;
      }

      if (a.type === "payment" && b.type === "sale") {
        return 1;
      }

      return String(a.id).localeCompare(String(b.id));
    });
  }, [sellerSales, sellerPayments]);

  /* =======================================================
     RUNNING BALANCE
     
     ALWAYS calculate from oldest -> newest.
  ======================================================= */

  const ledgerWithBalance = useMemo(() => {
    let balance = 0;

    return chronologicalLedger.map((entry) => {
      balance += Number(entry.debit || 0) - Number(entry.credit || 0);

      /*
       * Outstanding should never become
       * negative.
       */
      balance = Math.max(balance, 0);

      return {
        ...entry,
        balance,
      };
    });
  }, [chronologicalLedger]);

  /* =======================================================
     FILTERED LEDGER
     
     Search + Date Range
  ======================================================= */

  const filteredLedger = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    const startDate = createLocalDate(fromDate, false);

    const endDate = createLocalDate(toDate, true);

    /*
     * If user enters an invalid range,
     * return no results rather than showing
     * confusing data.
     */
    if (startDate && endDate && startDate > endDate) {
      return [];
    }

    const filtered = ledgerWithBalance.filter((entry) => {
      /*
       * SEARCH
       */
      if (search) {
        const searchableText = [
          entry.type,
          entry.reference,
          entry.description,

          entry?.raw?.sellerName,

          entry?.raw?.paymentNumber,

          entry?.raw?.saleNumber,

          entry?.raw?.referenceNumber,

          entry?.raw?.note,

          entry.debit,
          entry.credit,
          entry.balance,
        ]
          .filter((value) => value !== null && value !== undefined)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(search)) {
          return false;
        }
      }

      /*
       * DATE RANGE
       */
      const entryDate = entry.date ? new Date(entry.date) : null;

      if (entryDate && !Number.isNaN(entryDate.getTime())) {
        if (startDate && entryDate < startDate) {
          return false;
        }

        if (endDate && entryDate > endDate) {
          return false;
        }
      }

      return true;
    });

    /*
     * IMPORTANT:
     *
     * The balance was calculated above
     * chronologically.
     *
     * Now ONLY reverse the display order.
     *
     * Therefore:
     *
     * newest -> oldest
     *
     * while balance remains correct.
     */
    return [...filtered].reverse();
  }, [ledgerWithBalance, searchTerm, fromDate, toDate]);

  /* =======================================================
     FILTER ACTIONS
  ======================================================= */

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFromDate("");
    setToDate("");
  }, []);

  const hasFilters = Boolean(searchTerm.trim() || fromDate || toDate);

  /* =======================================================
     LOADING
  ======================================================= */

  const loading =
    authLoading || sellersLoading || salesLoading || paymentsLoading;

  /* =======================================================
     ERROR
  ======================================================= */

  const pageError = actionError || sellersError || salesError || paymentsError;

  /* =======================================================
     AUTH LOADING
  ======================================================= */

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />

            <p className="mt-4 text-sm text-slate-500">
              Restoring your session...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     NOT AUTHENTICATED
  ======================================================= */

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">
              Authentication Required
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Please log in again to open Khatabook.
            </p>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-6 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     SELLER NOT FOUND
  ======================================================= */

  if (!loading && !seller && !sellersError && sellerId) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => navigate("/khatabook")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            ← Back to Khatabook
          </button>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">
              Seller Not Found
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              The requested seller could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading || !seller) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />

            <p className="mt-4 text-sm text-slate-500">
              Loading seller account...
            </p>
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
            <button
              type="button"
              onClick={() => navigate("/khatabook")}
              className="mb-3 text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              ← Back to Khatabook
            </button>

            <h1 className="text-2xl font-bold text-slate-900">
              {seller.shopName || seller.name || "Seller Account"}
            </h1>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
              {seller.name && seller.shopName && (
                <span>Contact: {seller.name}</span>
              )}

              {seller.phone && <span>Phone: {seller.phone}</span>}

              {seller.city && <span>City: {seller.city}</span>}
            </div>
          </div>

          <button
            type="button"
            onClick={openAddPayment}
            disabled={Number(displayAccount.outstanding) <= 0}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Add Payment
          </button>
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
            ACCOUNT SUMMARY
        ================================================= */}

        <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 md:grid-cols-4 md:divide-y-0">
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Sale
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(displayAccount.totalSaleValue)}
              </p>
            </div>

            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Paid During Sale
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(displayAccount.salePayments)}
              </p>
            </div>

            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Khatabook Payments
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {formatCurrency(displayAccount.khatabookPayments)}
              </p>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-5 md:border-t-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Outstanding
              </p>

              <p
                className={`mt-2 text-2xl font-bold ${
                  Number(displayAccount.outstanding) > 0
                    ? "text-red-600"
                    : "text-emerald-600"
                }`}
              >
                {formatCurrency(displayAccount.outstanding)}
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            PAYMENT FORM
        ================================================= */}

        {showPaymentForm && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {editingPayment ? "Edit Payment" : "Record Payment"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Outstanding balance:{" "}
                    <span className="font-semibold text-red-600">
                      {formatCurrency(displayAccount.outstanding)}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetPaymentForm}
                  className="text-sm font-medium text-slate-500 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-5">
              <div className="grid gap-4 md:grid-cols-5">
                {/* Amount */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Amount
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    required
                  />
                </div>

                {/* Method */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Payment Method
                  </label>

                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="cash">Cash</option>

                    <option value="upi">UPI</option>

                    <option value="netbanking">Net Banking</option>

                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Date */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Payment Date
                  </label>

                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(event) => setPaymentDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    required
                  />
                </div>

                {/* Reference */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Reference
                  </label>

                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(event) =>
                      setPaymentReference(event.target.value)
                    }
                    placeholder="Optional"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {/* Note */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Note
                  </label>

                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(event) => setPaymentNote(event.target.value)}
                    placeholder="Optional note"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              {actionError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">{actionError}</p>
                </div>
              )}

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetPaymentForm}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || saving}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting || saving
                    ? "Saving..."
                    : editingPayment
                      ? "Update Payment"
                      : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =================================================
            LEDGER FILTERS
        ================================================= */}

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="font-semibold text-slate-900">Search & Filter</h2>

            <p className="text-xs text-slate-500">
              Search transactions or filter the ledger by date range.
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
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search reference, description, payment..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filteredLedger.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {ledgerWithBalance.length}
              </span>{" "}
              transactions
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* =================================================
            LEDGER
        ================================================= */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Khatabook Ledger
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Complete history of sales and Khatabook payments.
                </p>
              </div>

              <span className="text-xs font-medium text-slate-500">
                Newest first
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reference
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Debit
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Credit
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Balance
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center">
                      <p className="text-sm font-medium text-slate-600">
                        {hasFilters
                          ? "No transactions match your filters"
                          : "No transactions found"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {hasFilters
                          ? "Try changing the search or date range."
                          : "Sales and payments will appear here."}
                      </p>

                      {hasFilters && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Clear Filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatDate(entry.date)}
                      </td>

                      <td className="px-4 py-4">
                        {entry.type === "sale" ? (
                          <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                            Sale
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                            Payment
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-xs text-slate-500">
                        {String(entry.reference || "—").slice(0, 30)}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {entry.description}
                      </td>

                      <td className="px-4 py-4 text-right text-sm font-medium text-red-600">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : "—"}
                      </td>

                      <td className="px-4 py-4 text-right text-sm font-medium text-emerald-600">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : "—"}
                      </td>

                      <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">
                        {formatCurrency(entry.balance)}
                      </td>

                      <td className="px-4 py-4 text-right">
                        {entry.type === "payment" && (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditPayment(entry.raw)}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePayment(entry.raw)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        )}
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

export default KhatabookSeller;
