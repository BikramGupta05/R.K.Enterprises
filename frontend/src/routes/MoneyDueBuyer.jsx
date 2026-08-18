import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import useMoneyDue from "../hooks/useMoneyDue.js";
import useBuyers from "../hooks/useBuyers.js";

const PURCHASE_SOURCE = "PURCHASE";
const KHATABOOK_SOURCE = "KHATABOOK";

const PAYMENT_METHODS = {
  cash: "Cash",
  upi: "UPI",
  netbanking: "Net Banking",
  other: "Other",
};

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

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getPurchaseDate = (purchase) => {
  return purchase?.purchaseDate || purchase?.createdAt || null;
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

const isDateInRange = (value, fromValue, toValue) => {
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
};

const getPurchaseReference = (purchase) => {
  return purchase?.purchaseNumber || purchase?._id || "—";
};

const getPaymentReference = (payment) => {
  return payment?.paymentNumber || payment?._id || "—";
};

const getPaymentSourceLabel = (payment) => {
  if (payment?.source === PURCHASE_SOURCE) {
    return "Purchase Payment";
  }

  return "Khatabook Payment";
};

function MoneyDueBuyer() {
  const navigate = useNavigate();
  const { buyerId } = useParams();

  const { buyers, loading: buyersLoading } = useBuyers();

  const {
    buyerAccount,
    buyerPurchases,
    buyerPayments,
    loading,
    saving,
    error,
    fetchBuyerAccount,
    addBuyerPayment,
    editBuyerPayment,
    removeBuyerPayment,
  } = useMoneyDue();

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDate, setPaymentDate] = useState(getToday());
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [actionError, setActionError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [purchaseDateSort, setPurchaseDateSort] = useState("newest");

  const buyer = useMemo(() => {
    return (
      buyers.find((item) => String(item._id) === String(buyerId)) ||
      buyerAccount?.buyer ||
      null
    );
  }, [buyers, buyerAccount, buyerId]);

  const loadAccount = useCallback(async () => {
    if (!buyerId) {
      return;
    }

    await fetchBuyerAccount(buyerId);
  }, [buyerId, fetchBuyerAccount]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const resetPaymentForm = useCallback(() => {
    setPaymentAmount("");
    setPaymentMethod("cash");
    setPaymentDate(getToday());
    setPaymentReference("");
    setPaymentNote("");
    setEditingPayment(null);
    setShowPaymentForm(false);
    setActionError("");
  }, []);

  const openCreatePayment = useCallback(() => {
    setEditingPayment(null);
    setPaymentAmount("");
    setPaymentMethod("cash");
    setPaymentDate(getToday());
    setPaymentReference("");
    setPaymentNote("");
    setActionError("");
    setShowPaymentForm(true);
  }, []);

  const openEditPayment = useCallback((payment) => {
    if (payment?.source === PURCHASE_SOURCE) {
      return;
    }

    setEditingPayment(payment);
    setPaymentAmount(String(payment?.amount ?? ""));

    const backendMethod = payment?.paymentMethod || "Cash";
    const frontendMethod =
      Object.entries(PAYMENT_METHODS).find(
        ([, value]) => value === backendMethod,
      )?.[0] || "other";

    setPaymentMethod(frontendMethod);
    setPaymentDate(
      payment?.paymentDate
        ? getLocalDateString(payment.paymentDate)
        : getToday(),
    );
    setPaymentReference(payment?.referenceNumber || "");
    setPaymentNote(payment?.note || "");
    setActionError("");
    setShowPaymentForm(true);
  }, []);

  /* =========================================================
     FIFO ACCOUNT ALLOCATION

     Purchase payments created during the purchase stay attached
     to their own purchase. Later Khatabook payments are applied
     to the oldest remaining purchase due first.
  ========================================================= */
  const allocationData = useMemo(() => {
    const chronologicalPurchases = [...buyerPurchases].sort((a, b) => {
      const dateA = new Date(getPurchaseDate(a) || 0).getTime();
      const dateB = new Date(getPurchaseDate(b) || 0).getTime();

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

    const chronologicalLaterPayments = buyerPayments
      .filter((payment) => payment?.source === KHATABOOK_SOURCE)
      .sort((a, b) => {
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

    const purchaseRows = chronologicalPurchases.map((purchase) => {
      const total = Math.max(Number(purchase?.grandTotal) || 0, 0);
      const paidAtPurchase = Math.min(
        Math.max(Number(purchase?.paidAtPurchase) || 0, 0),
        total,
      );

      return {
        purchase,
        total,
        paidAtPurchase,
        laterPaid: 0,
        totalPaid: paidAtPurchase,
        due: Math.max(total - paidAtPurchase, 0),
        applications: [],
      };
    });

    const paymentRows = chronologicalLaterPayments.map((payment) => ({
      payment,
      amount: Math.max(Number(payment?.amount) || 0, 0),
      appliedAmount: 0,
      unallocatedAmount: 0,
      applications: [],
    }));

    let purchaseIndex = 0;

    for (const paymentRow of paymentRows) {
      let remainingPayment = paymentRow.amount;

      while (remainingPayment > 0.005 && purchaseIndex < purchaseRows.length) {
        while (
          purchaseIndex < purchaseRows.length &&
          purchaseRows[purchaseIndex].due <= 0.005
        ) {
          purchaseIndex += 1;
        }

        if (purchaseIndex >= purchaseRows.length) {
          break;
        }

        const purchaseRow = purchaseRows[purchaseIndex];
        const appliedAmount = Math.min(remainingPayment, purchaseRow.due);

        if (appliedAmount <= 0) {
          purchaseIndex += 1;
          continue;
        }

        purchaseRow.laterPaid += appliedAmount;
        purchaseRow.totalPaid = purchaseRow.paidAtPurchase + purchaseRow.laterPaid;
        purchaseRow.due = Math.max(
          purchaseRow.total - purchaseRow.totalPaid,
          0,
        );

        const application = {
          purchaseId: purchaseRow.purchase?._id,
          purchaseNumber: getPurchaseReference(purchaseRow.purchase),
          amount: appliedAmount,
        };

        purchaseRow.applications.push({
          paymentId: paymentRow.payment?._id,
          paymentNumber: getPaymentReference(paymentRow.payment),
          amount: appliedAmount,
        });

        paymentRow.applications.push(application);
        paymentRow.appliedAmount += appliedAmount;
        remainingPayment -= appliedAmount;

        if (purchaseRow.due <= 0.005) {
          purchaseRow.due = 0;
          purchaseIndex += 1;
        }
      }

      paymentRow.unallocatedAmount = Math.max(remainingPayment, 0);
    }

    return {
      purchaseRows,
      paymentRows,
    };
  }, [buyerPayments, buyerPurchases]);

  const displayAccount = useMemo(() => {
    const totalPurchased = allocationData.purchaseRows.reduce(
      (total, row) => total + row.total,
      0,
    );

    const paidAtPurchase = allocationData.purchaseRows.reduce(
      (total, row) => total + row.paidAtPurchase,
      0,
    );

    const laterPaid = allocationData.purchaseRows.reduce(
      (total, row) => total + row.laterPaid,
      0,
    );

    const totalPaid = paidAtPurchase + laterPaid;
    const currentDue = Math.max(totalPurchased - totalPaid, 0);
    const clearedPurchases = allocationData.purchaseRows.filter(
      (row) => row.due <= 0.005,
    ).length;

    return {
      totalPurchases: allocationData.purchaseRows.length,
      totalPurchased,
      paidAtPurchase,
      laterPaid,
      totalPaid,
      currentDue,
      clearedPurchases,
      duePurchases: allocationData.purchaseRows.length - clearedPurchases,
    };
  }, [allocationData]);

  const handleSubmitPayment = async (event) => {
    event.preventDefault();
    setActionError("");

    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError("Enter a valid payment amount greater than zero.");
      return;
    }

    const existingPaymentAmount = editingPayment
      ? Number(editingPayment?.amount) || 0
      : 0;

    const maximumAllowedPayment =
      Number(displayAccount.currentDue) + existingPaymentAmount;

    if (amount > maximumAllowedPayment + 0.005) {
      setActionError(
        `Payment cannot be greater than the outstanding balance of ${formatCurrency(
          maximumAllowedPayment,
        )}.`,
      );
      return;
    }

    if (!paymentDate) {
      setActionError("Select a payment date.");
      return;
    }

    const payload = {
      buyerId,
      paymentDate,
      amount,
      paymentMethod: PAYMENT_METHODS[paymentMethod] || "Other",
      referenceNumber: paymentReference.trim(),
      note: paymentNote.trim(),
    };

    const result = editingPayment
      ? await editBuyerPayment(editingPayment._id, payload)
      : await addBuyerPayment(payload);

    if (!result.success) {
      setActionError(result.error || "Unable to save payment.");
      return;
    }

    resetPaymentForm();
    await loadAccount();
  };

  const handleDeletePayment = async (payment) => {
    if (!payment || payment.source === PURCHASE_SOURCE) {
      return;
    }

    const confirmed = window.confirm(
      `Delete this payment of ${formatCurrency(payment.amount)}?`,
    );

    if (!confirmed) {
      return;
    }

    setActionError("");

    const result = await removeBuyerPayment(payment._id);

    if (!result.success) {
      setActionError(result.error || "Unable to delete payment.");
      return;
    }

    await loadAccount();
  };

  const filteredPurchaseRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const startDate = createLocalDate(fromDate, false);
    const endDate = createLocalDate(toDate, true);

    if (startDate && endDate && startDate > endDate) {
      return [];
    }

    const filteredRows = allocationData.purchaseRows.filter((row) => {
      const purchase = row.purchase;

      if (!isDateInRange(getPurchaseDate(purchase), fromDate, toDate)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        purchase?.purchaseNumber,
        purchase?._id,
        buyer?.shopName,
        buyer?.name,
        row.total,
        row.paidAtPurchase,
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
      const dateA = new Date(getPurchaseDate(a.purchase) || 0).getTime();
      const dateB = new Date(getPurchaseDate(b.purchase) || 0).getTime();

      if (dateA !== dateB) {
        return purchaseDateSort === "newest"
          ? dateB - dateA
          : dateA - dateB;
      }

      const createdA = new Date(a.purchase?.createdAt || 0).getTime();
      const createdB = new Date(b.purchase?.createdAt || 0).getTime();

      return purchaseDateSort === "newest"
        ? createdB - createdA
        : createdA - createdB;
    });
  }, [
    allocationData.purchaseRows,
    searchTerm,
    fromDate,
    toDate,
    buyer,
    purchaseDateSort,
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
        .map((application) => application.purchaseNumber)
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
  }, [allocationData.paymentRows, searchTerm, fromDate, toDate]);

  const ledgerEntries = useMemo(() => {
    const purchaseEntries = buyerPurchases.map((purchase) => ({
      id: `purchase-${purchase._id}`,
      date: getPurchaseDate(purchase),
      createdAt: purchase.createdAt,
      type: "purchase",
      title: `Purchase ${getPurchaseReference(purchase)}`,
      description: `${purchase.items?.length || 0} item(s) purchased`,
      amount: Number(purchase.grandTotal || 0),
      raw: purchase,
    }));

    const paymentEntries = buyerPayments.map((payment) => ({
      id: `payment-${payment._id}`,
      date: getPaymentDate(payment),
      createdAt: payment.createdAt,
      type: "payment",
      title: getPaymentSourceLabel(payment),
      description: payment.paymentMethod || "Payment",
      amount: Number(payment.amount || 0),
      raw: payment,
    }));

    const chronologicalEntries = [...purchaseEntries, ...paymentEntries].sort(
      (a, b) => {
        const dateDifference =
          new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();

        if (dateDifference !== 0) {
          return dateDifference;
        }

        if (a.type !== b.type) {
          return a.type === "purchase" ? -1 : 1;
        }

        return (
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
        );
      },
    );

    let runningBalance = 0;

    const entriesWithBalance = chronologicalEntries.map((entry) => {
      if (entry.type === "purchase") {
        runningBalance += entry.amount;
      } else {
        runningBalance -= entry.amount;
      }

      return {
        ...entry,
        runningBalance: Math.max(runningBalance, 0),
      };
    });

    return entriesWithBalance.reverse();
  }, [buyerPayments, buyerPurchases]);

  const currentLedgerBalance = useMemo(() => {
    if (ledgerEntries.length === 0) {
      return 0;
    }

    return Number(ledgerEntries[0]?.runningBalance || 0);
  }, [ledgerEntries]);

  const hasFilters = Boolean(searchTerm.trim() || fromDate || toDate);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFromDate("");
    setToDate("");
  }, []);

  const getApplicationText = useCallback((paymentRow) => {
    if (!paymentRow.applications.length) {
      return "Not applied";
    }

    return paymentRow.applications
      .map(
        (application) =>
          `${application.purchaseNumber} • ${formatCurrency(application.amount)}`,
      )
      .join("  |  ");
  }, []);

  if (!buyerId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-2 sm:p-3">
      <div className="mx-auto w-full max-w-[1500px]">
        {/* BUYER HEADER */}
        <div className="mb-2 flex min-h-10 flex-col gap-2 border border-slate-300 bg-white px-2 py-1.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/dashboard/money-due")}
              className="h-7 shrink-0 rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              ← Back
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-slate-900">
                {buyer?.shopName || buyer?.name || "Buyer Account"}
              </h1>

              <div className="truncate text-[9px] text-slate-400">
                {buyer?.phone || buyer?.email || buyer?.city || "Buyer Ledger"}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadAccount}
              disabled={loading}
              className="h-7 rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={openCreatePayment}
              disabled={Number(displayAccount.currentDue) <= 0 || saving}
              className="h-7 rounded border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              + Payment
            </button>
          </div>
        </div>

        {(error || actionError) && (
          <div className="mb-2 border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700">
            {actionError || error}
          </div>
        )}

        {/* ACCOUNT SUMMARY */}
        <div className="mb-2 overflow-hidden border border-slate-300 bg-white">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
            <div className="px-3 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Total Purchase
              </p>
              <p className="text-sm font-bold tabular-nums text-slate-900">
                {formatCurrency(displayAccount.totalPurchased)}
              </p>
            </div>

            <div className="px-3 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Paid at Purchase
              </p>
              <p className="text-sm font-bold tabular-nums text-slate-700">
                {formatCurrency(displayAccount.paidAtPurchase)}
              </p>
            </div>

            <div className="px-3 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Later Paid
              </p>
              <p className="text-sm font-bold tabular-nums text-emerald-600">
                {formatCurrency(displayAccount.laterPaid)}
              </p>
            </div>

            <div className="px-3 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Total Paid
              </p>
              <p className="text-sm font-bold tabular-nums text-emerald-600">
                {formatCurrency(displayAccount.totalPaid)}
              </p>
            </div>

            <div className="px-3 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Current Due
              </p>
              <p
                className={`text-sm font-bold tabular-nums ${
                  displayAccount.currentDue > 0
                    ? "text-red-600"
                    : "text-emerald-600"
                }`}
              >
                {formatCurrency(displayAccount.currentDue)}
              </p>
            </div>
          </div>
        </div>

        {/* PAYMENT FORM */}
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
                    {formatCurrency(displayAccount.currentDue)}
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

            <form onSubmit={handleSubmitPayment} className="p-2">
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
                    {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
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

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetPaymentForm}
                  disabled={saving}
                  className="h-7 rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="h-7 rounded border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingPayment
                      ? "Update"
                      : "Save"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FILTER BAR */}
        <div className="mb-2 border border-slate-300 bg-white">
          <div className="flex flex-col gap-2 p-2 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1 lg:max-w-[420px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search purchase, payment, reference, note..."
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
              Purchases{" "}
              <span className="font-bold text-slate-700">
                {filteredPurchaseRows.length}
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

        {/* PURCHASES / DUE */}
        <div className="mb-2 overflow-hidden border border-slate-300 bg-white">
          <div className="flex min-h-8 items-center justify-between border-b border-slate-300 bg-slate-100 px-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-800">
                Purchases & Due
              </h2>
              <span className="text-[9px] text-slate-400">
                Oldest due is cleared first
              </span>
            </div>

            <div className="text-[9px] text-slate-500">
              {displayAccount.clearedPurchases} cleared • {displayAccount.duePurchases} due
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-xs">
              <thead>
                <tr className="h-8 border-b border-slate-300 bg-slate-50">
                  <th className="w-[105px] border-r border-slate-300 px-2 text-left text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    <button
                      type="button"
                      onClick={() =>
                        setPurchaseDateSort((current) =>
                          current === "newest" ? "oldest" : "newest",
                        )
                      }
                      className="inline-flex items-center gap-1 rounded px-1 py-0.5 transition hover:bg-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      title={`Sort by date: ${
                        purchaseDateSort === "newest"
                          ? "oldest first"
                          : "newest first"
                      }`}
                      aria-label={`Sort purchases by date: ${
                        purchaseDateSort === "newest"
                          ? "oldest first"
                          : "newest first"
                      }`}
                    >
                      <span>Date</span>
                      <span className="text-[8px] text-slate-400">
                        {purchaseDateSort === "newest" ? "↓" : "↑"}
                      </span>
                    </button>
                  </th>
                  <th className="w-[185px] border-r border-slate-300 px-2 text-left text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Purchase Reference
                  </th>
                  <th className="w-[125px] border-r border-slate-300 px-2 text-right text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Purchase Amount
                  </th>
                  <th className="w-[125px] border-r border-slate-300 px-2 text-right text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Paid at Purchase
                  </th>
                  <th className="w-[125px] border-r border-slate-300 px-2 text-right text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Later Paid
                  </th>
                  <th className="w-[125px] border-r border-slate-300 px-2 text-right text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Total Paid
                  </th>
                  <th className="w-[125px] border-r border-slate-300 px-2 text-right text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Due
                  </th>
                  <th className="w-[125px] border-r border-slate-300 px-2 text-center text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Status
                  </th>
                  <th className="w-[100px] px-2 text-center text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading && buyerPurchases.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center">
                      <p className="text-xs text-slate-500">Loading purchases...</p>
                    </td>
                  </tr>
                ) : filteredPurchaseRows.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center">
                      <p className="text-xs font-semibold text-slate-600">
                        {hasFilters ? "No matching purchases" : "No purchases found"}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {hasFilters
                          ? "Try changing the search or date range."
                          : "Purchases for this buyer will appear here."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPurchaseRows.map((row) => {
                    const cleared = row.due <= 0.005;
                    const partiallyPaid = row.totalPaid > 0 && !cleared;

                    return (
                      <tr
                        key={row.purchase?._id}
                        className={`h-10 border-b border-slate-200 last:border-b-0 ${
                          cleared ? "bg-emerald-50/70" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="border-r border-slate-200 px-2 whitespace-nowrap text-[10px] text-slate-600">
                          {formatDate(getPurchaseDate(row.purchase))}
                        </td>

                        <td className="border-r border-slate-200 px-2 text-[10px] font-semibold text-slate-700">
                          {getPurchaseReference(row.purchase)}
                        </td>

                        <td className="border-r border-slate-200 px-2 text-right font-semibold tabular-nums text-slate-900">
                          {formatCurrency(row.total)}
                        </td>

                        <td className="border-r border-slate-200 px-2 text-right font-semibold tabular-nums text-slate-700">
                          {formatCurrency(row.paidAtPurchase)}
                        </td>

                        <td className="border-r border-slate-200 px-2 text-right font-semibold tabular-nums text-emerald-600">
                          {row.laterPaid > 0
                            ? formatCurrency(row.laterPaid)
                            : "—"}
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

                        <td className="border-r border-slate-200 px-2 text-center">
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

                        <td className="px-2 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/dashboard/purchase/${row.purchase?._id}/edit`,
                              )
                            }
                            className="h-6 rounded border border-slate-300 bg-white px-2 text-[9px] font-semibold text-slate-600 hover:bg-slate-100"
                          >
                            View / Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex h-7 items-center justify-between border-t border-slate-300 bg-slate-50 px-2 text-[9px] text-slate-500">
            <span>Purchase-wise payment allocation</span>
            <span>Total Due: {formatCurrency(displayAccount.currentDue)}</span>
          </div>
        </div>

        {/* PAYMENT HISTORY */}
        <div className="mb-2 overflow-hidden border border-slate-300 bg-white">
          <div className="flex min-h-8 items-center justify-between border-b border-slate-300 bg-slate-100 px-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-800">
                Payment History
              </h2>
              <span className="text-[9px] text-slate-400">
                Every purchase and later payment is shown here
              </span>
            </div>

            <span className="text-[9px] text-slate-500">
              {buyerPayments.length} payments
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-xs">
              <thead>
                <tr className="h-8 border-b border-slate-300 bg-slate-50">
                  <th className="w-[105px] border-r border-slate-300 px-2 text-left text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    Date
                  </th>
                  <th className="w-[175px] border-r border-slate-300 px-2 text-left text-[9px] font-bold uppercase tracking-wide text-slate-600">
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
                  <th className="w-[125px] border-r border-slate-300 px-2 text-center text-[9px] font-bold uppercase tracking-wide text-slate-600">
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
                        {hasFilters ? "No matching payments" : "No later payments found"}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        Later Khatabook payments recorded for this buyer will appear here.
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
                          {getPaymentReference(row.payment)}
                        </td>

                        <td className="border-r border-slate-200 px-2 text-right font-bold tabular-nums text-emerald-600">
                          {formatCurrency(row.amount)}
                        </td>

                        <td className="border-r border-slate-200 px-2 text-[10px] text-slate-600">
                          {row.payment?.paymentMethod || "—"}
                        </td>

                        <td className="border-r border-slate-200 px-2">
                          <div
                            className="max-w-[600px] truncate text-[10px] text-slate-700"
                            title={getApplicationText(row)}
                          >
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
                              disabled={saving}
                              className="h-6 rounded border border-red-200 bg-red-50 px-2 text-[9px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
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
            <span>Later Paid: {formatCurrency(displayAccount.laterPaid)}</span>
          </div>
        </div>

        {/* ACCOUNT LEDGER */}
        <section className="overflow-hidden border border-slate-300 bg-white">
          <div className="flex min-h-8 items-center justify-between border-b border-slate-300 bg-slate-100 px-2">
            <div>
              <h2 className="text-xs font-bold text-slate-800">Account Ledger</h2>
              <p className="mt-0.5 text-[9px] text-slate-400">
                Purchases increase the amount owed. Payments reduce it. Running balance shows the outstanding amount after each entry.
              </p>
            </div>

            <div className="text-right">
              <p className="text-[8px] font-bold uppercase tracking-wide text-slate-500">
                Current Balance
              </p>
              <p
                className={`text-sm font-bold tabular-nums ${
                  currentLedgerBalance > 0 ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {formatCurrency(currentLedgerBalance)}
              </p>
            </div>
          </div>

          {ledgerEntries.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No ledger entries found for this buyer.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-slate-50 text-[9px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Date</th>
                    <th className="px-3 py-2.5 font-semibold">Entry</th>
                    <th className="px-3 py-2.5 font-semibold">Description</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Debit</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Credit</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Balance</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {ledgerEntries.map((entry) => {
                    const isPurchase = entry.type === "purchase";

                    return (
                      <tr key={entry.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 text-[10px] text-slate-500">
                          {formatDate(entry.date)}
                        </td>

                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex rounded px-2 py-1 text-[9px] font-semibold ${
                              isPurchase
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {isPurchase ? "Purchase" : "Payment"}
                          </span>
                        </td>

                        <td className="px-3 py-2.5">
                          <p className="text-[10px] font-semibold text-slate-900">
                            {entry.title}
                          </p>
                          <p className="mt-0.5 text-[9px] text-slate-400">
                            {entry.description}
                          </p>
                        </td>

                        <td className="px-3 py-2.5 text-right text-[10px] font-semibold text-red-600">
                          {isPurchase ? formatCurrency(entry.amount) : "—"}
                        </td>

                        <td className="px-3 py-2.5 text-right text-[10px] font-semibold text-emerald-700">
                          {!isPurchase ? formatCurrency(entry.amount) : "—"}
                        </td>

                        <td className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-900">
                          {formatCurrency(entry.runningBalance)}
                        </td>

                        <td className="px-3 py-2.5 text-right">
                          {isPurchase ? (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/dashboard/purchase/${entry.raw._id}/edit`,
                                )
                              }
                              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-[9px] font-semibold text-slate-700 hover:bg-white"
                            >
                              View / Edit
                            </button>
                          ) : entry.raw?.source !== PURCHASE_SOURCE ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditPayment(entry.raw)}
                                className="rounded-md border border-slate-300 px-2.5 py-1.5 text-[9px] font-semibold text-slate-700 hover:bg-white"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeletePayment(entry.raw)}
                                disabled={saving}
                                className="rounded-md border border-red-200 px-2.5 py-1.5 text-[9px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-400">
                              Purchase linked
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default MoneyDueBuyer;
