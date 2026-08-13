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
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

const getSaleDate = (sale) => {
  return sale?.saleDate || sale?.createdAt || null;
};

const getPaymentDate = (payment) => {
  return payment?.paymentDate || payment?.createdAt || null;
};

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

const getCreatedTimestamp = (entry) => {
  const createdAt = entry?.raw?.createdAt
    ? new Date(entry.raw.createdAt).getTime()
    : 0;

  return Number.isFinite(createdAt) ? createdAt : 0;
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

/* =========================================================
   COMPONENT
========================================================= */

function KhatabookSeller() {
  const navigate = useNavigate();

  const { sellerId } = useParams();

  /* =======================================================
     AUTH
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
     LEDGER FILTERS
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
     LOAD DATA
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
     KHATABOOK PAYMENTS
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

    const salePayments = sellerSales.reduce(
      (total, sale) => total + (Number(sale?.paidAmount) || 0),
      0,
    );

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
     PAYMENT DATE
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
     ADD PAYMENT
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
     EDIT PAYMENT
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
     CHRONOLOGICAL LEDGER
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

        credit: Math.min(Math.max(paidDuringSale, 0), Math.max(saleAmount, 0)),

        raw: sale,
      };
    });

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
  ======================================================= */

  const ledgerWithBalance = useMemo(() => {
    let balance = 0;

    return chronologicalLedger.map((entry) => {
      balance += Number(entry.debit || 0) - Number(entry.credit || 0);

      balance = Math.max(balance, 0);

      return {
        ...entry,
        balance,
      };
    });
  }, [chronologicalLedger]);

  /* =======================================================
     FILTERED LEDGER
  ======================================================= */

  const filteredLedger = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    const startDate = createLocalDate(fromDate, false);

    const endDate = createLocalDate(toDate, true);

    if (startDate && endDate && startDate > endDate) {
      return [];
    }

    const filtered = ledgerWithBalance.filter((entry) => {
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
      <div className="min-h-screen bg-slate-50 p-3">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex h-12 items-center justify-center border border-slate-300 bg-white">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
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
      <div className="min-h-screen bg-slate-50 p-3">
        <div className="mx-auto max-w-[700px]">
          <div className="border border-slate-300 bg-white p-6 text-center">
            <h1 className="text-lg font-bold text-slate-900">
              Authentication Required
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Please log in again to open Khatabook.
            </p>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-4 h-8 rounded border border-slate-800 bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
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
      <div className="min-h-screen bg-slate-50 p-3">
        <div className="mx-auto max-w-[1000px]">
          <button
            type="button"
            onClick={() => navigate("/dashboard/khatabook")}
            className="mb-2 h-7 rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            ← Back
          </button>

          <div className="border border-slate-300 bg-white p-8 text-center">
            <h1 className="text-lg font-bold text-slate-900">
              Seller Not Found
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              The requested seller could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE LOADING
  ======================================================= */

  if (loading || !seller) {
    return (
      <div className="min-h-screen bg-slate-50 p-3">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex h-12 items-center justify-center border border-slate-300 bg-white">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />

            <span className="ml-2 text-xs text-slate-500">
              Loading seller account...
            </span>
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
      <div className="mx-auto w-full max-w-[1400px]">
        {/* =================================================
            SELLER HEADER
        ================================================= */}

        <div className="mb-2 flex min-h-10 flex-col gap-2 border border-slate-300 bg-white px-2 py-1.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/dashboard/khatabook")}
              className="h-7 shrink-0 rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              ← Back
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-bold text-slate-900">
                  {seller.shopName || seller.name || "Seller Account"}
                </h1>

                {seller.name && seller.shopName && (
                  <span className="hidden truncate text-[10px] text-slate-400 sm:inline">
                    {seller.name}
                  </span>
                )}
              </div>

              <div className="truncate text-[9px] text-slate-400">
                {seller.phone}

                {seller.phone && seller.city ? " • " : ""}

                {seller.city}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddPayment}
            disabled={Number(displayAccount.outstanding) <= 0}
            className="h-7 shrink-0 rounded border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Payment
          </button>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {pageError && (
          <div className="mb-2 border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700">
            {pageError}
          </div>
        )}

        {/* =================================================
            ACCOUNT SUMMARY
        ================================================= */}

        <div className="mb-2 overflow-hidden border border-slate-300 bg-white">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-4 sm:divide-y-0">
            <div className="px-3 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Total Sale
              </p>

              <p className="text-sm font-bold tabular-nums text-slate-900">
                {formatCurrency(displayAccount.totalSaleValue)}
              </p>
            </div>

            <div className="px-3 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Paid at Sale
              </p>

              <p className="text-sm font-bold tabular-nums text-slate-700">
                {formatCurrency(displayAccount.salePayments)}
              </p>
            </div>

            <div className="px-3 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Later Paid
              </p>

              <p className="text-sm font-bold tabular-nums text-emerald-600">
                {formatCurrency(displayAccount.khatabookPayments)}
              </p>
            </div>

            <div className="px-3 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Outstanding
              </p>

              <p
                className={`text-sm font-bold tabular-nums ${
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
          <div className="mb-2 border border-slate-300 bg-white">
            <div className="flex items-center justify-between border-b border-slate-300 bg-slate-100 px-2 py-1.5">
              <div>
                <h2 className="text-xs font-bold text-slate-800">
                  {editingPayment ? "Edit Payment" : "Record Payment"}
                </h2>

                <p className="text-[9px] text-slate-500">
                  Outstanding:{" "}
                  <span className="font-bold text-red-600">
                    {formatCurrency(displayAccount.outstanding)}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={resetPaymentForm}
                className="h-6 rounded border border-slate-300 bg-white px-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-2">
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-5">
                <div>
                  <label className="mb-1 block text-[9px] font-bold uppercase text-slate-500">
                    Amount
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                    placeholder="0.00"
                    className="h-7 w-full rounded border border-slate-300 px-2 text-xs outline-none focus:border-slate-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[9px] font-bold uppercase text-slate-500">
                    Method
                  </label>

                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-xs outline-none focus:border-slate-500"
                  >
                    <option value="cash">Cash</option>

                    <option value="upi">UPI</option>

                    <option value="netbanking">Net Banking</option>

                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[9px] font-bold uppercase text-slate-500">
                    Date
                  </label>

                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(event) => setPaymentDate(event.target.value)}
                    className="h-7 w-full rounded border border-slate-300 px-2 text-xs outline-none focus:border-slate-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[9px] font-bold uppercase text-slate-500">
                    Reference
                  </label>

                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(event) =>
                      setPaymentReference(event.target.value)
                    }
                    placeholder="Optional"
                    className="h-7 w-full rounded border border-slate-300 px-2 text-xs outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[9px] font-bold uppercase text-slate-500">
                    Note
                  </label>

                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(event) => setPaymentNote(event.target.value)}
                    placeholder="Optional"
                    className="h-7 w-full rounded border border-slate-300 px-2 text-xs outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              {actionError && (
                <div className="mt-2 border border-red-200 bg-red-50 px-2 py-1.5 text-[10px] text-red-700">
                  {actionError}
                </div>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetPaymentForm}
                  className="h-7 rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || saving}
                  className="h-7 rounded border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {submitting || saving
                    ? "Saving..."
                    : editingPayment
                      ? "Update"
                      : "Save"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =================================================
            FILTER BAR
        ================================================= */}

        <div className="mb-2 border border-slate-300 bg-white">
          <div className="flex flex-col gap-2 p-2 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1 lg:max-w-[420px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search transaction, reference, note..."
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs outline-none focus:border-slate-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-[9px] font-bold uppercase text-slate-500">
                From
              </label>

              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="h-7 w-[135px] rounded border border-slate-300 px-2 text-[11px] outline-none focus:border-slate-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-[9px] font-bold uppercase text-slate-500">
                To
              </label>

              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                className="h-7 w-[135px] rounded border border-slate-300 px-2 text-[11px] outline-none focus:border-slate-500"
              />
            </div>

            <div className="ml-auto whitespace-nowrap text-[10px] text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-700">
                {filteredLedger.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-700">
                {ledgerWithBalance.length}
              </span>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-7 rounded border border-slate-300 bg-white px-2.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* =================================================
            LEDGER TABLE
        ================================================= */}

        <div className="overflow-hidden border border-slate-300 bg-white">
          <div className="flex h-8 items-center justify-between border-b border-slate-300 bg-slate-100 px-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-800">Ledger</h2>

              <span className="text-[9px] text-slate-400">Newest first</span>
            </div>

            <span className="text-[9px] text-slate-500">
              {filteredLedger.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-xs">
              <thead>
                <tr className="h-8 border-b border-slate-300 bg-slate-50">
                  <th className="w-[110px] border-r border-slate-300 px-2 text-left text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Date
                  </th>

                  <th className="w-[85px] border-r border-slate-300 px-2 text-left text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Type
                  </th>

                  <th className="w-[150px] border-r border-slate-300 px-2 text-left text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Reference
                  </th>

                  <th className="border-r border-slate-300 px-2 text-left text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Description
                  </th>

                  <th className="w-[130px] border-r border-slate-300 px-2 text-right text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Debit
                  </th>

                  <th className="w-[130px] border-r border-slate-300 px-2 text-right text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Credit
                  </th>

                  <th className="w-[140px] border-r border-slate-300 px-2 text-right text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Balance
                  </th>

                  <th className="w-[125px] px-2 text-center text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center">
                      <p className="text-xs font-semibold text-slate-600">
                        {hasFilters
                          ? "No matching transactions"
                          : "No transactions found"}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        {hasFilters
                          ? "Try changing the search or date range."
                          : "Sales and payments will appear here."}
                      </p>

                      {hasFilters && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="mt-2 h-7 rounded border border-slate-300 bg-white px-3 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Clear
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((entry) => (
                    <tr
                      key={entry.id}
                      className="h-9 border-b border-slate-200 last:border-b-0 hover:bg-slate-50"
                    >
                      {/* Date */}

                      <td className="border-r border-slate-200 px-2 whitespace-nowrap text-[10px] text-slate-600">
                        {formatDate(entry.date)}
                      </td>

                      {/* Type */}

                      <td className="border-r border-slate-200 px-2">
                        {entry.type === "sale" ? (
                          <span className="inline-flex rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-600">
                            Sale
                          </span>
                        ) : (
                          <span className="inline-flex rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">
                            Payment
                          </span>
                        )}
                      </td>

                      {/* Reference */}

                      <td className="border-r border-slate-200 px-2 text-[10px] text-slate-500">
                        <span title={String(entry.reference || "—")}>
                          {String(entry.reference || "—").slice(0, 24)}
                        </span>
                      </td>

                      {/* Description */}

                      <td className="border-r border-slate-200 px-2">
                        <span className="block max-w-[350px] truncate text-[10px] text-slate-700">
                          {entry.description}
                        </span>
                      </td>

                      {/* Debit */}

                      <td className="border-r border-slate-200 px-2 text-right font-semibold tabular-nums text-red-600">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : "—"}
                      </td>

                      {/* Credit */}

                      <td className="border-r border-slate-200 px-2 text-right font-semibold tabular-nums text-emerald-600">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : "—"}
                      </td>

                      {/* Balance */}

                      <td className="border-r border-slate-200 px-2 text-right font-bold tabular-nums text-slate-900">
                        {formatCurrency(entry.balance)}
                      </td>

                      {/* Actions */}

                      <td className="px-2 text-center">
                        {entry.type === "payment" && (
                          <div className="flex justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditPayment(entry.raw)}
                              className="h-6 rounded border border-slate-300 bg-white px-2 text-[9px] font-semibold text-slate-600 hover:bg-slate-100"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePayment(entry.raw)}
                              className="h-6 rounded border border-red-200 bg-red-50 px-2 text-[9px] font-semibold text-red-600 hover:bg-red-100"
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

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="flex h-6 items-center justify-between border-t border-slate-300 bg-slate-50 px-2 text-[9px] text-slate-400">
            <span>Seller Ledger</span>

            <span>
              {displayAccount.totalSales} sales
              {" • "}
              {sellerPayments.length} payments
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KhatabookSeller;
