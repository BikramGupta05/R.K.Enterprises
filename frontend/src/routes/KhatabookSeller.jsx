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

  const [saleDateSort, setSaleDateSort] = useState("newest");

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
     DATE FILTER HELPER
  ======================================================= */

  const isDateInRange = useCallback((value, fromValue, toValue) => {
    if (!value) {
      return false;
    }

    const transactionDate = new Date(value);

    if (Number.isNaN(transactionDate.getTime())) {
      return false;
    }

    const startDate = createLocalDate(fromValue, false);
    const endDate = createLocalDate(toValue, true);

    if (startDate && transactionDate < startDate) {
      return false;
    }

    if (endDate && transactionDate > endDate) {
      return false;
    }

    return true;
  }, []);

  /* =======================================================
     PAYMENT APPLICATION / FIFO ALLOCATION

     Later Khatabook payments are always applied to the
     oldest unpaid sale first.

     Example:

     Sale 1 = ₹500, paid at sale ₹100, due ₹400
     Sale 2 = ₹1,000, paid at sale ₹100, due ₹900

     Later payment = ₹450

     Allocation:
     Sale 1 -> ₹400 -> CLEARED
     Sale 2 -> ₹50
     Sale 2 remaining due -> ₹850
  ======================================================= */

  const allocationData = useMemo(() => {
    const chronologicalSales = [...sellerSales].sort((a, b) => {
      const dateA = new Date(getSaleDate(a) || 0).getTime();
      const dateB = new Date(getSaleDate(b) || 0).getTime();

      if (dateA !== dateB) {
        return dateA - dateB;
      }

      const createdA = new Date(a?.createdAt || 0).getTime();
      const createdB = new Date(b?.createdAt || 0).getTime();

      if (createdA !== createdB) {
        return createdA - createdB;
      }

      return String(a?._id || "").localeCompare(String(b?._id || ""));
    });

    const chronologicalPayments = [...sellerPayments].sort((a, b) => {
      const dateA = new Date(getPaymentDate(a) || 0).getTime();
      const dateB = new Date(getPaymentDate(b) || 0).getTime();

      if (dateA !== dateB) {
        return dateA - dateB;
      }

      const createdA = new Date(a?.createdAt || 0).getTime();
      const createdB = new Date(b?.createdAt || 0).getTime();

      if (createdA !== createdB) {
        return createdA - createdB;
      }

      return String(a?._id || "").localeCompare(String(b?._id || ""));
    });

    const saleRows = chronologicalSales.map((sale) => {
      const total = Math.max(Number(sale?.grandTotal) || 0, 0);
      const paidAtSale = Math.min(
        Math.max(Number(sale?.paidAmount) || 0, 0),
        total,
      );

      return {
        sale,
        total,
        paidAtSale,
        laterPaid: 0,
        totalPaid: paidAtSale,
        due: Math.max(total - paidAtSale, 0),
        applications: [],
      };
    });

    const paymentRows = chronologicalPayments.map((payment) => ({
      payment,
      amount: Math.max(Number(payment?.amount) || 0, 0),
      appliedAmount: 0,
      unallocatedAmount: 0,
      applications: [],
    }));

    let saleIndex = 0;

    for (const paymentRow of paymentRows) {
      let remainingPayment = paymentRow.amount;

      while (remainingPayment > 0.005 && saleIndex < saleRows.length) {
        while (
          saleIndex < saleRows.length &&
          saleRows[saleIndex].due <= 0.005
        ) {
          saleIndex += 1;
        }

        if (saleIndex >= saleRows.length) {
          break;
        }

        const saleRow = saleRows[saleIndex];

        const appliedAmount = Math.min(remainingPayment, saleRow.due);

        if (appliedAmount <= 0) {
          saleIndex += 1;
          continue;
        }

        saleRow.laterPaid += appliedAmount;
        saleRow.totalPaid = saleRow.paidAtSale + saleRow.laterPaid;
        saleRow.due = Math.max(saleRow.total - saleRow.totalPaid, 0);

        const application = {
          saleId: saleRow.sale?._id,
          saleNumber: saleRow.sale?.saleNumber || saleRow.sale?._id,
          amount: appliedAmount,
        };

        saleRow.applications.push({
          paymentId: paymentRow.payment?._id,
          paymentNumber:
            paymentRow.payment?.paymentNumber || paymentRow.payment?._id,
          amount: appliedAmount,
        });

        paymentRow.applications.push(application);
        paymentRow.appliedAmount += appliedAmount;
        remainingPayment -= appliedAmount;

        if (saleRow.due <= 0.005) {
          saleRow.due = 0;
          saleIndex += 1;
        }
      }

      paymentRow.unallocatedAmount = Math.max(remainingPayment, 0);
    }

    return {
      saleRows,
      paymentRows,
    };
  }, [sellerSales, sellerPayments]);

  /* =======================================================
     DISPLAY ACCOUNT
  ======================================================= */

  const displayAccountWithAllocation = useMemo(() => {
    const totalSaleValue = allocationData.saleRows.reduce(
      (total, row) => total + row.total,
      0,
    );

    const paidAtSale = allocationData.saleRows.reduce(
      (total, row) => total + row.paidAtSale,
      0,
    );

    const laterPaid = allocationData.saleRows.reduce(
      (total, row) => total + row.laterPaid,
      0,
    );

    const totalPaid = paidAtSale + laterPaid;

    const currentDue = Math.max(totalSaleValue - totalPaid, 0);

    const clearedSales = allocationData.saleRows.filter(
      (row) => row.due <= 0.005,
    ).length;

    return {
      totalSales: allocationData.saleRows.length,
      totalSaleValue,
      paidAtSale,
      laterPaid,
      totalPaid,
      currentDue,
      clearedSales,
      dueSales: allocationData.saleRows.length - clearedSales,
    };
  }, [allocationData]);

  /* =======================================================
     FILTERED SALE / PAYMENT ROWS
  ======================================================= */

  const filteredSaleRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const startDate = createLocalDate(fromDate, false);
    const endDate = createLocalDate(toDate, true);

    if (startDate && endDate && startDate > endDate) {
      return [];
    }

    const filteredRows = allocationData.saleRows.filter((row) => {
      const sale = row.sale;

      if (!isDateInRange(getSaleDate(sale), fromDate, toDate)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        sale?.saleNumber,
        sale?._id,
        sale?.sellerName,
        sale?.items?.length,
        row.total,
        row.paidAtSale,
        row.laterPaid,
        row.totalPaid,
        row.due,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });

    return filteredRows.sort((a, b) => {
      const dateA = new Date(getSaleDate(a.sale) || 0).getTime();
      const dateB = new Date(getSaleDate(b.sale) || 0).getTime();

      if (dateA !== dateB) {
        return saleDateSort === "newest" ? dateB - dateA : dateA - dateB;
      }

      const createdA = new Date(a.sale?.createdAt || 0).getTime();
      const createdB = new Date(b.sale?.createdAt || 0).getTime();

      return saleDateSort === "newest"
        ? createdB - createdA
        : createdA - createdB;
    });
  }, [
    allocationData.saleRows,
    searchTerm,
    fromDate,
    toDate,
    isDateInRange,
    saleDateSort,
  ]);

  const filteredPaymentRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const startDate = createLocalDate(fromDate, false);
    const endDate = createLocalDate(toDate, true);

    if (startDate && endDate && startDate > endDate) {
      return [];
    }

    return allocationData.paymentRows.filter((row) => {
      const payment = row.payment;

      if (!isDateInRange(getPaymentDate(payment), fromDate, toDate)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const appliedTo = row.applications
        .map((application) => application.saleNumber)
        .join(" ");

      const searchableText = [
        payment?.paymentNumber,
        payment?._id,
        payment?.paymentMethod,
        payment?.referenceNumber,
        payment?.note,
        row.amount,
        row.appliedAmount,
        row.unallocatedAmount,
        appliedTo,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [
    allocationData.paymentRows,
    searchTerm,
    fromDate,
    toDate,
    isDateInRange,
  ]);

  const hasFilters = Boolean(searchTerm.trim() || fromDate || toDate);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFromDate("");
    setToDate("");
  }, []);

  /* =======================================================
     RECENT PAYMENT APPLICATION TEXT
  ======================================================= */

  const getApplicationText = useCallback((paymentRow) => {
    if (!paymentRow.applications.length) {
      return "Not applied";
    }

    return paymentRow.applications
      .map(
        (application) =>
          `${application.saleNumber} • ${formatCurrency(application.amount)}`,
      )
      .join("  |  ");
  }, []);

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
      <div className="mx-auto w-full max-w-[1500px]">
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
            disabled={Number(displayAccountWithAllocation.currentDue) <= 0}
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
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
            <div className="px-3 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Total Sale
              </p>
              <p className="text-sm font-bold tabular-nums text-slate-900">
                {formatCurrency(displayAccountWithAllocation.totalSaleValue)}
              </p>
            </div>

            <div className="px-3 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Paid at Sale
              </p>
              <p className="text-sm font-bold tabular-nums text-slate-700">
                {formatCurrency(displayAccountWithAllocation.paidAtSale)}
              </p>
            </div>

            <div className="px-3 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Later Paid
              </p>
              <p className="text-sm font-bold tabular-nums text-emerald-600">
                {formatCurrency(displayAccountWithAllocation.laterPaid)}
              </p>
            </div>

            <div className="px-3 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Total Paid
              </p>
              <p className="text-sm font-bold tabular-nums text-emerald-600">
                {formatCurrency(displayAccountWithAllocation.totalPaid)}
              </p>
            </div>

            <div className="px-3 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Current Due
              </p>
              <p
                className={`text-sm font-bold tabular-nums ${
                  Number(displayAccountWithAllocation.currentDue) > 0
                    ? "text-red-600"
                    : "text-emerald-600"
                }`}
              >
                {formatCurrency(displayAccountWithAllocation.currentDue)}
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
                  Current Due:{" "}
                  <span className="font-bold text-red-600">
                    {formatCurrency(displayAccountWithAllocation.currentDue)}
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
                    onChange={(event) => setPaymentReference(event.target.value)}
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
                placeholder="Search sale, payment, reference, note..."
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
                min={fromDate || undefined}
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="h-7 w-[135px] rounded border border-slate-300 px-2 text-[11px] outline-none focus:border-slate-500"
              />
            </div>

            <div className="ml-auto whitespace-nowrap text-[10px] text-slate-500">
              Sales{" "}
              <span className="font-bold text-slate-700">
                {filteredSaleRows.length}
              </span>
              {" • "}Payments{" "}
              <span className="font-bold text-slate-700">
                {filteredPaymentRows.length}
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
            SALES / DUE TABLE
        ================================================= */}

        <div className="mb-2 overflow-hidden border border-slate-300 bg-white">
          <div className="flex min-h-8 items-center justify-between border-b border-slate-300 bg-slate-100 px-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-slate-800">
                  Sales & Due
                </h2>
                <span className="text-[9px] text-slate-400">
                  Oldest due is cleared first
                </span>
              </div>
            </div>

            <div className="text-[9px] text-slate-500">
              {displayAccountWithAllocation.clearedSales} cleared •{" "}
              {displayAccountWithAllocation.dueSales} due
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-xs">
              <thead>
                <tr className="h-8 border-b border-slate-300 bg-slate-50">
                  <th className="w-[105px] border-r border-slate-300 px-2 text-left text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    <button
                      type="button"
                      onClick={() =>
                        setSaleDateSort((current) =>
                          current === "newest" ? "oldest" : "newest",
                        )
                      }
                      className="inline-flex items-center gap-1 rounded px-1 py-0.5 transition hover:bg-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      title={`Sort by date: ${
                        saleDateSort === "newest" ? "oldest first" : "newest first"
                      }`}
                      aria-label={`Sort sales by date: ${
                        saleDateSort === "newest" ? "oldest first" : "newest first"
                      }`}
                    >
                      <span>Date</span>
                      <span className="text-[8px] text-slate-400">
                        {saleDateSort === "newest" ? "↓" : "↑"}
                      </span>
                    </button>
                  </th>
                  <th className="w-[155px] border-r border-slate-300 px-2 text-left text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Sale Reference
                  </th>
                  <th className="w-[130px] border-r border-slate-300 px-2 text-right text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Sale Amount
                  </th>
                  <th className="w-[130px] border-r border-slate-300 px-2 text-right text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Paid at Sale
                  </th>
                  <th className="w-[130px] border-r border-slate-300 px-2 text-right text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Later Paid
                  </th>
                  <th className="w-[130px] border-r border-slate-300 px-2 text-right text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Total Paid
                  </th>
                  <th className="w-[130px] border-r border-slate-300 px-2 text-right text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Due
                  </th>
                  <th className="w-[125px] px-2 text-center text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSaleRows.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center">
                      <p className="text-xs font-semibold text-slate-600">
                        {hasFilters ? "No matching sales" : "No sales found"}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {hasFilters
                          ? "Try changing the search or date range."
                          : "Sales for this seller will appear here."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSaleRows.map((row) => {
                    const cleared = row.due <= 0.005;
                    const partiallyPaid = row.totalPaid > 0 && !cleared;

                    return (
                      <tr
                        key={row.sale?._id}
                        className={`h-10 border-b border-slate-200 last:border-b-0 ${
                          cleared ? "bg-emerald-50/70" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="border-r border-slate-200 px-2 whitespace-nowrap text-[10px] text-slate-600">
                          {formatDate(getSaleDate(row.sale))}
                        </td>

                        <td className="border-r border-slate-200 px-2 text-[10px] font-semibold text-slate-700">
                          {row.sale?.saleNumber || row.sale?._id || "—"}
                        </td>

                        <td className="border-r border-slate-200 px-2 text-right font-semibold tabular-nums text-slate-900">
                          {formatCurrency(row.total)}
                        </td>

                        <td className="border-r border-slate-200 px-2 text-right font-semibold tabular-nums text-slate-700">
                          {formatCurrency(row.paidAtSale)}
                        </td>

                        <td className="border-r border-slate-200 px-2 text-right font-semibold tabular-nums text-emerald-600">
                          {row.laterPaid > 0 ? formatCurrency(row.laterPaid) : "—"}
                        </td>

                        <td className="border-r border-slate-200 px-2 text-right font-bold tabular-nums text-emerald-600">
                          {formatCurrency(row.totalPaid)}
                        </td>

                        <td className="border-r border-slate-200 px-2 text-right font-bold tabular-nums">
                          <span
                            className={
                              cleared ? "text-emerald-600" : "text-red-600"
                            }
                          >
                            {formatCurrency(row.due)}
                          </span>
                        </td>

                        <td className="px-2 text-center">
                          {cleared ? (
                            <span className="inline-flex rounded border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                              Cleared
                            </span>
                          ) : partiallyPaid ? (
                            <span className="inline-flex rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                              Partially Paid
                            </span>
                          ) : (
                            <span className="inline-flex rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-600">
                              Due
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex h-7 items-center justify-between border-t border-slate-300 bg-slate-50 px-2 text-[9px] text-slate-500">
            <span>Sale-wise payment allocation</span>
            <span>
              Total Due: {formatCurrency(displayAccountWithAllocation.currentDue)}
            </span>
          </div>
        </div>

        {/* =================================================
            PAYMENT HISTORY TABLE
        ================================================= */}

        <div className="overflow-hidden border border-slate-300 bg-white">
          <div className="flex min-h-8 items-center justify-between border-b border-slate-300 bg-slate-100 px-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-800">
                Payment History
              </h2>
              <span className="text-[9px] text-slate-400">
                Every later payment is shown here
              </span>
            </div>

            <span className="text-[9px] text-slate-500">
              {filteredPaymentRows.length} payments
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse text-xs">
              <thead>
                <tr className="h-8 border-b border-slate-300 bg-slate-50">
                  <th className="w-[105px] border-r border-slate-300 px-2 text-left text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Date
                  </th>
                  <th className="w-[155px] border-r border-slate-300 px-2 text-left text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Payment Reference
                  </th>
                  <th className="w-[125px] border-r border-slate-300 px-2 text-right text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Amount Paid
                  </th>
                  <th className="w-[115px] border-r border-slate-300 px-2 text-left text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Method
                  </th>
                  <th className="min-w-[350px] border-r border-slate-300 px-2 text-left text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Applied To Oldest Due First
                  </th>
                  <th className="w-[120px] border-r border-slate-300 px-2 text-center text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Status
                  </th>
                  <th className="w-[125px] px-2 text-center text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPaymentRows.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center">
                      <p className="text-xs font-semibold text-slate-600">
                        {hasFilters
                          ? "No matching payments"
                          : "No later payments found"}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        Payments recorded from this Khatabook will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  [...filteredPaymentRows].reverse().map((row) => {
                    const fullyApplied = row.unallocatedAmount <= 0.005;

                    return (
                      <tr
                        key={row.payment?._id}
                        className={`h-10 border-b border-slate-200 last:border-b-0 ${
                          fullyApplied ? "bg-emerald-50/50" : "bg-red-50/60"
                        }`}
                      >
                        <td className="border-r border-slate-200 px-2 whitespace-nowrap text-[10px] text-slate-600">
                          {formatDate(getPaymentDate(row.payment))}
                        </td>

                        <td className="border-r border-slate-200 px-2 text-[10px] font-semibold text-slate-700">
                          {row.payment?.paymentNumber || row.payment?._id || "—"}
                        </td>

                        <td className="border-r border-slate-200 px-2 text-right font-bold tabular-nums text-emerald-600">
                          {formatCurrency(row.amount)}
                        </td>

                        <td className="border-r border-slate-200 px-2 text-[10px] text-slate-600">
                          {row.payment?.paymentMethod || "—"}
                        </td>

                        <td className="border-r border-slate-200 px-2">
                          <div className="max-w-[600px] truncate text-[10px] text-slate-700" title={getApplicationText(row)}>
                            {getApplicationText(row)}
                          </div>
                        </td>

                        <td className="border-r border-slate-200 px-2 text-center">
                          {fullyApplied ? (
                            <span className="inline-flex rounded border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                              Fully Applied
                            </span>
                          ) : (
                            <div>
                              <span className="inline-flex rounded border border-red-200 bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
                                Unapplied
                              </span>
                              <div className="mt-0.5 text-[8px] text-red-600">
                                {formatCurrency(row.unallocatedAmount)} left
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="px-2 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditPayment(row.payment)}
                              className="h-6 rounded border border-slate-300 bg-white px-2 text-[9px] font-semibold text-slate-600 hover:bg-slate-100"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePayment(row.payment)}
                              className="h-6 rounded border border-red-200 bg-red-50 px-2 text-[9px] font-semibold text-red-600 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex h-7 items-center justify-between border-t border-slate-300 bg-slate-50 px-2 text-[9px] text-slate-500">
            <span>Later Khatabook payments</span>
            <span>
              Later Paid: {formatCurrency(displayAccountWithAllocation.laterPaid)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KhatabookSeller;
