import { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import useSellers from "../hooks/useSellers.js";
import useSales from "../hooks/useSales.js";
import usePayments from "../hooks/usePayments.js";

import { useAuth } from "../contexts/AuthContext.jsx";

/* =========================================================
   Helpers
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

const getSaleDate = (sale) => {
  return sale?.saleDate || sale?.purchaseDate || sale?.createdAt || null;
};

const getPaymentDate = (payment) => {
  return payment?.paymentDate || payment?.date || payment?.createdAt || null;
};

/* =========================================================
   Component
========================================================= */

function KhatabookSeller() {
  const navigate = useNavigate();

  const { sellerId } = useParams();

  /* =======================================================
     Authentication

     We DO NOT modify AuthContext.
     We only wait for it to finish.
  ======================================================= */

  const { accessToken, loading: authLoading } = useAuth();

  /* =======================================================
     Hooks
  ======================================================= */

  const {
    sellers,
    loading: sellersLoading,
    error: sellersError,
    loadSellers,
  } = useSellers();

  const {
    sales,
    loading: salesLoading,
    error: salesError,
    fetchSales,
  } = useSales();

  const {
    payments,
    account,
    loading: paymentsLoading,
    saving,
    error: paymentsError,
    fetchPaymentsBySeller,
    addPayment,
    editPayment,
    removePayment,
  } = usePayments();

  /* =======================================================
     UI State
  ======================================================= */

  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const [editingPayment, setEditingPayment] = useState(null);

  const [paymentAmount, setPaymentAmount] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [paymentNote, setPaymentNote] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [actionError, setActionError] = useState("");

  /* =======================================================
     Find Seller
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
     Load Seller Data

     IMPORTANT:
     Do NOT make API requests until AuthProvider
     has finished restoring the token.
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

    /*
     * These functions now also check authentication.
     *
     * We intentionally run them sequentially here.
     * This avoids a burst of requests while the
     * authentication session is being restored.
     */

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
     Seller Sales
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
      .sort(
        (a, b) => new Date(getSaleDate(b) || 0) - new Date(getSaleDate(a) || 0),
      );
  }, [sales, sellerId]);

  /* =======================================================
     Seller Payments
  ======================================================= */

  const sellerPayments = useMemo(() => {
    if (!Array.isArray(payments)) {
      return [];
    }

    return [...payments].sort(
      (a, b) =>
        new Date(getPaymentDate(b) || 0) - new Date(getPaymentDate(a) || 0),
    );
  }, [payments]);

  /* =======================================================
     Local Account Calculation
  ======================================================= */

  const calculatedAccount = useMemo(() => {
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
     Display Account

     IMPORTANT:
     This page uses the local calculation as the single
     source of truth. The backend account response is not
     used for the displayed totals because it can represent
     sale-time payments and Khatabook payments together.

     Correct calculation:

     Total Sale Value
       - Amount Paid During Sale
       - Later Khatabook Payments
       = Outstanding
  ======================================================= */

  const displayAccount = calculatedAccount;

  /* =======================================================
     Payment Date
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

    return date.toISOString().split("T")[0];
  }, []);

  /* =======================================================
     Reset Payment Form
  ======================================================= */

  const resetPaymentForm = useCallback(() => {
    setPaymentAmount("");

    setPaymentMethod("cash");

    setPaymentDate(new Date().toISOString().split("T")[0]);

    setPaymentNote("");

    setEditingPayment(null);

    setShowPaymentForm(false);

    setActionError("");
  }, []);

  /* =======================================================
     Open Add Payment
  ======================================================= */

  const openAddPayment = useCallback(() => {
    setEditingPayment(null);

    setPaymentAmount("");

    setPaymentMethod("cash");

    setPaymentDate(new Date().toISOString().split("T")[0]);

    setPaymentNote("");

    setActionError("");

    setShowPaymentForm(true);
  }, []);

  /* =======================================================
     Open Edit Payment
  ======================================================= */

  const openEditPayment = useCallback(
    (payment) => {
      setEditingPayment(payment);

      setPaymentAmount(String(payment?.amount || ""));

      setPaymentMethod(payment?.paymentMethod || payment?.method || "cash");

      setPaymentDate(paymentDateValue(payment));

      setPaymentNote(payment?.note || payment?.remarks || "");

      setActionError("");

      setShowPaymentForm(true);
    },
    [paymentDateValue],
  );

  /* =======================================================
     Submit Payment
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

    /*
     * For a new payment, the maximum is the current
     * outstanding balance.
     *
     * For an edit, the old payment is temporarily added
     * back because the new amount replaces the old amount.
     */
    const existingPaymentAmount = editingPayment
      ? Number(editingPayment?.amount) || 0
      : 0;

    const maximumAllowedPayment =
      Number(displayAccount.outstanding || 0) + existingPaymentAmount;

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

      const paymentData = {
        seller: sellerId,
        amount,
        paymentMethod,
        paymentDate,
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
       * VERY IMPORTANT
       *
       * After payment:
       *
       * 1. Reload seller account
       * 2. Reload sales
       *
       * Therefore outstanding is recalculated
       * from fresh server data.
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
     Delete Payment
  ======================================================= */

  const handleDeletePayment = async (payment) => {
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
     Combined Ledger

     SALE ENTRY
       Debit  = complete sale value
       Credit = amount already paid during the sale

     LATER PAYMENT ENTRY
       Debit  = 0
       Credit = amount paid later through Khatabook

     Example:
       Sale = ₹1000
       Paid during sale = ₹300

       Sale ledger entry:
         Debit  ₹1000
         Credit ₹300
         Balance ₹700

       Later payment = ₹200

       Payment ledger entry:
         Debit  ₹0
         Credit ₹200
         Balance ₹500
  ======================================================= */

  const ledger = useMemo(() => {
    const saleEntries = sellerSales.map((sale) => {
      const saleAmount = Number(sale?.grandTotal) || 0;
      const paidDuringSale = Number(sale?.paidAmount) || 0;

      return {
        id: `sale-${sale._id}`,

        type: "sale",

        date: getSaleDate(sale),

        reference: sale?.invoiceNumber || sale?.saleNumber || sale?._id,

        description: sale?.items?.length
          ? `${sale.items.length} item${sale.items.length !== 1 ? "s" : ""}`
          : "Sale",

        debit: saleAmount,

        // Amount received at the time of this sale.
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

        reference:
          payment?.paymentNumber || payment?.receiptNumber || payment?._id,

        description: payment?.note || payment?.remarks || "Payment received",

        debit: 0,

        credit: Math.max(paymentAmount, 0),

        raw: payment,
      };
    });

    return [...saleEntries, ...paymentEntries].sort((a, b) => {
      const dateDifference = new Date(b.date || 0) - new Date(a.date || 0);

      if (dateDifference !== 0) {
        return dateDifference;
      }

      // For transactions on exactly the same timestamp,
      // process the sale before the later payment.
      if (a.type === "sale" && b.type === "payment") {
        return -1;
      }

      if (a.type === "payment" && b.type === "sale") {
        return 1;
      }

      return 0;
    });
  }, [sellerSales, sellerPayments]);

  /* =======================================================
     Running Balance

     Debit increases the seller's outstanding amount.
     Credit decreases the seller's outstanding amount.
  ======================================================= */

  const ledgerWithBalance = useMemo(() => {
    const chronological = [...ledger].sort((a, b) => {
      const dateDifference = new Date(a.date || 0) - new Date(b.date || 0);

      if (dateDifference !== 0) {
        return dateDifference;
      }

      if (a.type === "sale" && b.type === "payment") {
        return -1;
      }

      if (a.type === "payment" && b.type === "sale") {
        return 1;
      }

      return 0;
    });

    let balance = 0;

    const result = chronological.map((entry) => {
      balance += Number(entry.debit || 0) - Number(entry.credit || 0);

      balance = Math.max(balance, 0);

      return {
        ...entry,
        balance,
      };
    });

    return result.reverse();
  }, [ledger]);

  /* =======================================================
     Loading
  ======================================================= */

  const loading =
    authLoading || sellersLoading || salesLoading || paymentsLoading;

  /* =======================================================
     Error
  ======================================================= */

  const pageError = actionError || sellersError || salesError || paymentsError;

  /* =======================================================
     Authentication Loading
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
     Not Authenticated
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
     Missing Seller

     Only after authentication + seller loading
     have finished.
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
     Loading
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
     Main UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">
        {/* =================================================
            Header
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
            Error
        ================================================= */}

        {pageError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{pageError}</p>
          </div>
        )}

        {/* =================================================
            Account Summary
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
                Sale Payments
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(displayAccount.salePayments)}
              </p>
            </div>

            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Later Payments
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
            Payment Form
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
              <div className="grid gap-4 md:grid-cols-4">
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

                    <option value="bank">Bank Transfer</option>

                    <option value="cheque">Cheque</option>

                    <option value="other">Other</option>
                  </select>
                </div>

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
            Ledger
        ================================================= */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Khatabook Ledger</h2>

            <p className="mt-1 text-xs text-slate-500">
              Complete history of sales and payments.
            </p>
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
                {ledgerWithBalance.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center">
                      <p className="text-sm font-medium text-slate-600">
                        No transactions found
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Sales and payments will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  ledgerWithBalance.map((entry) => (
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
                        {String(entry.reference || "—").slice(0, 18)}
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
