import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import useMoneyDue from "../hooks/useMoneyDue.js";

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

const getSearchableText = (account) => {
  return [
    account?.shopName,
    account?.phone,
    account?.email,
    account?.city,
    account?.address,
    account?.gstNumber,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

function SummaryCard({ title, value, subtitle }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>
    </div>
  );
}

function MoneyDue() {
  const navigate = useNavigate();

  const {
    accounts,
    totals,
    loading,
    error,
    fetchSummary,
  } = useMoneyDue();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("due");
  const [sortBy, setSortBy] = useState("due-desc");

  const loadData = useCallback(async () => {
    await fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAccounts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    const result = accounts.filter((account) => {
      if (statusFilter === "due" && Number(account.totalDue || 0) <= 0) {
        return false;
      }

      if (statusFilter === "paid" && Number(account.totalDue || 0) > 0) {
        return false;
      }

      if (search && !getSearchableText(account).includes(search)) {
        return false;
      }

      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return String(a.shopName || "").localeCompare(
            String(b.shopName || ""),
          );

        case "name-desc":
          return String(b.shopName || "").localeCompare(
            String(a.shopName || ""),
          );

        case "purchased-desc":
          return Number(b.totalPurchased || 0) - Number(a.totalPurchased || 0);

        case "paid-desc":
          return Number(b.totalPaid || 0) - Number(a.totalPaid || 0);

        case "due-asc":
          return Number(a.totalDue || 0) - Number(b.totalDue || 0);

        case "due-desc":
        default:
          return Number(b.totalDue || 0) - Number(a.totalDue || 0);
      }
    });

    return result;
  }, [accounts, searchTerm, statusFilter, sortBy]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Business
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-900">Money Due</h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-500">
            Track money owed to your business from purchases and record buyer
            payments like a Khatabook ledger.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Purchased"
          value={formatCurrency(totals.totalPurchased)}
          subtitle="Purchase value across buyers"
        />

        <SummaryCard
          title="Total Paid"
          value={formatCurrency(totals.totalPaid)}
          subtitle="Payments received so far"
        />

        <SummaryCard
          title="Total Due"
          value={formatCurrency(totals.totalDue)}
          subtitle="Outstanding buyer balance"
        />

        <SummaryCard
          title="Buyers With Purchases"
          value={totals.totalBuyers || 0}
          subtitle="Buyers with purchase activity"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="mt-5 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Buyer Accounts
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Open a buyer to view purchases, payments, and the complete due
              ledger.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search buyer..."
              className="h-9 rounded-md border border-slate-300 px-3 text-xs outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
            >
              <option value="due">Outstanding Only</option>
              <option value="all">All Buyers</option>
              <option value="paid">Fully Paid</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
            >
              <option value="due-desc">Highest Due</option>
              <option value="due-asc">Lowest Due</option>
              <option value="purchased-desc">Highest Purchased</option>
              <option value="paid-desc">Highest Paid</option>
              <option value="name-asc">Buyer A to Z</option>
              <option value="name-desc">Buyer Z to A</option>
            </select>
          </div>
        </div>

        {loading && accounts.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            Loading money due accounts...
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No buyer accounts found
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {statusFilter === "due"
                ? "There are currently no outstanding buyer balances matching your filters."
                : "Try changing your search or filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Buyer</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Purchases
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Purchased
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">Paid</th>
                  <th className="px-4 py-3 text-right font-semibold">Due</th>
                  <th className="px-4 py-3 font-semibold">Last Activity</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((account) => (
                  <tr
                    key={account._id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/dashboard/money-due/${account._id}`)
                        }
                        className="text-left"
                      >
                        <p className="text-xs font-semibold text-slate-900 hover:text-blue-600">
                          {account.shopName || "Unnamed Buyer"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {account.city || account.phone || "Buyer account"}
                        </p>
                      </button>
                    </td>

                    <td className="px-4 py-3 text-right text-xs text-slate-600">
                      {account.totalPurchases || 0}
                    </td>

                    <td className="px-4 py-3 text-right text-xs font-medium text-slate-800">
                      {formatCurrency(account.totalPurchased)}
                    </td>

                    <td className="px-4 py-3 text-right text-xs font-medium text-emerald-700">
                      {formatCurrency(account.totalPaid)}
                    </td>

                    <td className="px-4 py-3 text-right text-xs font-bold text-red-600">
                      {formatCurrency(account.totalDue)}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-500">
                      <div>
                        <span>Purchase: {formatDate(account.lastPurchaseDate)}</span>
                      </div>
                      <div className="mt-0.5">
                        <span>Payment: {formatDate(account.lastPaymentDate)}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/dashboard/money-due/${account._id}`)
                        }
                        className="rounded-md bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-slate-800"
                      >
                        View Account
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default MoneyDue;
