import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import useMoneyDue from "../hooks/useMoneyDue.js";
import useBuyers from "../hooks/useBuyers.js";

const PAYMENT_METHODS = ["Cash", "UPI", "Net Banking", "Other"];

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

const getPaymentSourceLabel = (payment) => {
  if (payment?.source === "PURCHASE") {
    return "Purchase Payment";
  }

  return "Khatabook Payment";
};

function StatCard({ label, value, tone = "default" }) {
  const toneClass = {
    default: "text-slate-900",
    paid: "text-emerald-700",
    due: "text-red-600",
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-lg font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

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
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState(getToday());
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [actionError, setActionError] = useState("");

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

  const resetPaymentForm = () => {
    setPaymentAmount("");
    setPaymentMethod("Cash");
    setPaymentDate(getToday());
    setPaymentReference("");
    setPaymentNote("");
    setEditingPayment(null);
    setShowPaymentForm(false);
    setActionError("");
  };

  const openCreatePayment = () => {
    setEditingPayment(null);
    setPaymentAmount("");
    setPaymentMethod("Cash");
    setPaymentDate(getToday());
    setPaymentReference("");
    setPaymentNote("");
    setActionError("");
    setShowPaymentForm(true);
  };

  const openEditPayment = (payment) => {
    if (payment?.source === "PURCHASE") {
      return;
    }

    setEditingPayment(payment);
    setPaymentAmount(String(payment.amount ?? ""));
    setPaymentMethod(payment.paymentMethod || "Cash");
    setPaymentDate(
      payment.paymentDate
        ? new Date(payment.paymentDate).toISOString().split("T")[0]
        : getToday(),
    );
    setPaymentReference(payment.referenceNumber || "");
    setPaymentNote(payment.note || "");
    setActionError("");
    setShowPaymentForm(true);
  };

  const handleSubmitPayment = async (event) => {
    event.preventDefault();
    setActionError("");

    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError("Enter a valid payment amount greater than zero.");
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
      paymentMethod,
      referenceNumber: paymentReference,
      note: paymentNote,
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
    if (!payment || payment.source === "PURCHASE") {
      return;
    }

    const confirmed = window.confirm(
      `Delete this payment of ${formatCurrency(payment.amount)}?`,
    );

    if (!confirmed) {
      return;
    }

    const result = await removeBuyerPayment(payment._id);

    if (!result.success) {
      setActionError(result.error || "Unable to delete payment.");
      return;
    }

    await loadAccount();
  };

  /*
   * Build the ledger in chronological order first.
   *
   * A purchase increases the buyer's outstanding balance.
   * A payment decreases it.
   *
   * We calculate the running balance from transactions rather
   * than trusting a stored balance so the UI remains consistent
   * with the backend account totals.
   */
  const ledgerEntries = useMemo(() => {
    const purchaseEntries = buyerPurchases.map((purchase) => ({
      id: `purchase-${purchase._id}`,
      date: purchase.purchaseDate || purchase.createdAt,
      createdAt: purchase.createdAt,
      type: "purchase",
      title: `Purchase ${purchase.purchaseNumber || ""}`.trim(),
      description: `${purchase.items?.length || 0} item(s) purchased`,
      amount: Number(purchase.grandTotal || 0),
      raw: purchase,
    }));

    const paymentEntries = buyerPayments.map((payment) => ({
      id: `payment-${payment._id}`,
      date: payment.paymentDate || payment.createdAt,
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

        /*
         * If a purchase and its initial payment have the same date,
         * always apply the purchase first and payment second.
         */
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

    /*
     * Display newest transaction first, while preserving the
     * balance that existed immediately after each transaction.
     */
    return entriesWithBalance.reverse();
  }, [buyerPayments, buyerPurchases]);

  const currentLedgerBalance = useMemo(() => {
    if (ledgerEntries.length === 0) {
      return 0;
    }

    /*
     * ledgerEntries is newest-first, so the last entry contains
     * the final chronological running balance.
     */
    return Number(ledgerEntries[0]?.runningBalance || 0);
  }, [ledgerEntries]);

  if (!buyerId) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/money-due")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            ← Back to Money Due
          </button>

          <h1 className="mt-2 text-xl font-bold text-slate-900">
            {buyer?.shopName || "Buyer Account"}
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            {buyer?.phone || buyer?.email || buyer?.city || "Buyer ledger"}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadAccount}
            disabled={loading}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={openCreatePayment}
            disabled={Number(buyerAccount?.totalDue || 0) <= 0 || saving}
            className="h-9 rounded-md bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Make Payment
          </button>
        </div>
      </div>

      {error && !actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Purchased"
          value={formatCurrency(buyerAccount?.totalPurchased)}
        />
        <StatCard
          label="Total Paid"
          value={formatCurrency(buyerAccount?.totalPaid)}
          tone="paid"
        />
        <StatCard
          label="Amount Due"
          value={formatCurrency(buyerAccount?.totalDue)}
          tone="due"
        />
      </div>

      {showPaymentForm && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              {editingPayment ? "Edit Payment" : "Record Payment"}
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Current outstanding balance: {formatCurrency(buyerAccount?.totalDue)}
            </p>
          </div>

          <form onSubmit={handleSubmitPayment} className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-600">
                Amount
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={paymentAmount}
                onChange={(event) => {
                  const value = event.target.value;
                  if (/^\d*(\.\d{0,2})?$/.test(value)) {
                    setPaymentAmount(value);
                  }
                }}
                placeholder="0.00"
                className="h-9 w-full rounded-md border border-slate-300 px-3 text-xs outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-600">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-600">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
                className="h-9 w-full rounded-md border border-slate-300 px-3 text-xs outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-600">
                Reference Number
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                placeholder="Optional"
                className="h-9 w-full rounded-md border border-slate-300 px-3 text-xs outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-600">
                Note
              </label>
              <input
                type="text"
                value={paymentNote}
                onChange={(event) => setPaymentNote(event.target.value)}
                placeholder="Optional"
                className="h-9 w-full rounded-md border border-slate-300 px-3 text-xs outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
              />
            </div>

            <div className="flex gap-2 sm:col-span-2 lg:col-span-5 lg:justify-end">
              <button
                type="button"
                onClick={resetPaymentForm}
                disabled={saving}
                className="h-9 rounded-md border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="h-9 rounded-md bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingPayment
                    ? "Update Payment"
                    : "Record Payment"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Purchases</h2>
            <p className="mt-1 text-[11px] text-slate-500">
              All purchases contributing to this buyer's account.
            </p>
          </div>

          {buyersLoading || loading ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Loading account...
            </div>
          ) : buyerPurchases.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No purchases found for this buyer.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Purchase</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 text-right font-semibold">Items</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                    <th className="px-4 py-3 text-right font-semibold">Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {buyerPurchases.map((purchase) => (
                    <tr key={purchase._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs font-semibold text-slate-900">
                        {purchase.purchaseNumber || "Purchase"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDate(purchase.purchaseDate)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-600">
                        {purchase.items?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-slate-900">
                        {formatCurrency(purchase.grandTotal)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-emerald-700">
                        {formatCurrency(purchase.paidAtPurchase)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Payment History</h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Purchase payments and later Khatabook payments.
            </p>
          </div>

          {buyerPayments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No payments recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {buyerPayments.map((payment) => (
                <div key={payment._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        {getPaymentSourceLabel(payment)}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {formatDate(payment.paymentDate)} · {payment.paymentMethod || "—"}
                      </p>
                    </div>

                    <p className="text-sm font-bold text-emerald-700">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>

                  {(payment.referenceNumber || payment.note) && (
                    <div className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                      {payment.referenceNumber && (
                        <div>Reference: {payment.referenceNumber}</div>
                      )}
                      {payment.note && <div>Note: {payment.note}</div>}
                    </div>
                  )}

                  {payment.source !== "PURCHASE" && (
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditPayment(payment)}
                        className="rounded-md border border-slate-300 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePayment(payment)}
                        disabled={saving}
                        className="rounded-md border border-red-200 px-2.5 py-1.5 text-[10px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-5 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Account Ledger
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Purchases increase the amount owed. Payments reduce it.
                Running balance shows the outstanding amount after each entry.
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 px-3 py-2 text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Current Balance
              </p>
              <p className="mt-0.5 text-sm font-bold text-red-600">
                {formatCurrency(currentLedgerBalance)}
              </p>
            </div>
          </div>
        </div>

        {ledgerEntries.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No ledger entries found for this buyer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Entry</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Debit
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Credit
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {ledgerEntries.map((entry) => {
                  const isPurchase = entry.type === "purchase";

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDate(entry.date)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
                            isPurchase
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {isPurchase ? "Purchase" : "Payment"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-slate-900">
                          {entry.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {entry.description}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-right text-xs font-semibold text-red-600">
                        {isPurchase
                          ? formatCurrency(entry.amount)
                          : "—"}
                      </td>

                      <td className="px-4 py-3 text-right text-xs font-semibold text-emerald-700">
                        {!isPurchase
                          ? formatCurrency(entry.amount)
                          : "—"}
                      </td>

                      <td className="px-4 py-3 text-right text-xs font-bold text-slate-900">
                        {formatCurrency(entry.runningBalance)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {isPurchase ? (
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/dashboard/purchase/${entry.raw._id}/edit`,
                              )
                            }
                            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-white"
                          >
                            View / Edit
                          </button>
                        ) : entry.raw?.source !== "PURCHASE" ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditPayment(entry.raw)}
                              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-white"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePayment(entry.raw)}
                              disabled={saving}
                              className="rounded-md border border-red-200 px-2.5 py-1.5 text-[10px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">
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
  );
}

export default MoneyDueBuyer;
