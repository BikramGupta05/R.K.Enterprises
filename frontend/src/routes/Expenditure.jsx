import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import useExpenditures from "../hooks/useExpenditures";

function Expenditure() {
  const navigate = useNavigate();

  const {
    expenditures,
    summary,
    categories,
    loading,
    saving,
    error,
    addExpenditure,
    editExpenditure,
    removeExpenditure,
    filterExpenditures,
    clearFilters,
  } = useExpenditures();

  /* =========================================================
     MODAL
  ========================================================= */

  const [open, setOpen] = useState(false);

  const [selectedExpenditure, setSelectedExpenditure] = useState(null);

  /* =========================================================
     FILTERS
  ========================================================= */

  const [fromDate, setFromDate] = useState("");

  const [toDate, setToDate] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("");

  /* =========================================================
     FORM
  ========================================================= */

  const getToday = () => {
    return new Date().toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    expenditureDate: getToday(),
    category: "",
    description: "",
    amount: "",
    paymentMethod: "Cash",
    notes: "",
  });

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* =========================================================
     FORMAT MONEY
  ========================================================= */

  const formatMoney = (value) => {
    const number = Number(value || 0);

    return `₹${number.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  /* =========================================================
     OPEN CREATE MODAL
  ========================================================= */

  const openCreateModal = () => {
    setSelectedExpenditure(null);

    setFormData({
      expenditureDate: getToday(),
      category: "",
      description: "",
      amount: "",
      paymentMethod: "Cash",
      notes: "",
    });

    setOpen(true);
  };

  /* =========================================================
     OPEN EDIT MODAL
  ========================================================= */

  const openEditModal = (expenditure) => {
    setSelectedExpenditure(expenditure);

    setFormData({
      expenditureDate: expenditure.expenditureDate
        ? new Date(expenditure.expenditureDate).toISOString().split("T")[0]
        : "",

      category: expenditure.category || "",

      description: expenditure.description || "",

      amount: expenditure.amount ?? "",

      paymentMethod: expenditure.paymentMethod || "Cash",

      notes: expenditure.notes || "",
    });

    setOpen(true);
  };

  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  const closeModal = () => {
    if (saving) {
      return;
    }

    setOpen(false);

    setSelectedExpenditure(null);
  };

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const amount = Number(formData.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert("Please enter a valid expenditure amount.");

      return;
    }

    if (!formData.category.trim()) {
      window.alert("Please select a category.");

      return;
    }

    if (!formData.description.trim()) {
      window.alert("Please enter a description.");

      return;
    }

    const data = {
      expenditureDate: formData.expenditureDate,
      category: formData.category.trim(),
      description: formData.description.trim(),
      amount,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes.trim(),
    };

    let success = false;

    if (selectedExpenditure) {
      success = await editExpenditure(selectedExpenditure._id, data);
    } else {
      success = await addExpenditure(data);
    }

    if (success) {
      closeModal();
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this expenditure?",
    );

    if (!confirmDelete) {
      return;
    }

    await removeExpenditure(id);
  };

  /* =========================================================
     APPLY FILTER
  ========================================================= */

  const handleFilter = () => {
    if (fromDate && toDate && fromDate > toDate) {
      window.alert("From date cannot be greater than to date.");

      return;
    }

    const filters = {};

    if (fromDate) {
      filters.from = fromDate;
    }

    if (toDate) {
      filters.to = toDate;
    }

    if (categoryFilter) {
      filters.category = categoryFilter;
    }

    filterExpenditures(filters);
  };

  /* =========================================================
     CLEAR FILTER
  ========================================================= */

  const handleClearFilter = () => {
    setFromDate("");

    setToDate("");

    setCategoryFilter("");

    clearFilters();
  };

  /* =========================================================
     CATEGORY OPTIONS
     
     We first use backend category data.
     If backend category summary is empty, we generate
     category options from the expenditure records.
  ========================================================= */

  const categoryOptions = useMemo(() => {
    const categorySet = new Set();

    if (Array.isArray(categories)) {
      categories.forEach((category) => {
        const categoryName = category?.category || category?.name;

        if (categoryName) {
          categorySet.add(categoryName);
        }
      });
    }

    if (Array.isArray(expenditures)) {
      expenditures.forEach((expenditure) => {
        if (expenditure?.category) {
          categorySet.add(expenditure.category);
        }
      });
    }

    return Array.from(categorySet).sort((a, b) => a.localeCompare(b));
  }, [categories, expenditures]);

  /* =========================================================
     DISPLAYED EXPENDITURES
     
     Backend handles filters.
     This is therefore simply the current dataset.
  ========================================================= */

  const displayedExpenditures = Array.isArray(expenditures) ? expenditures : [];

  /* =========================================================
     FALLBACK SUMMARY
     
     If backend summary is unavailable or returns zeros
     while expenditures are present, calculate summary
     directly from the current records.
  ========================================================= */

  const calculatedSummary = useMemo(() => {
    if (!displayedExpenditures.length) {
      return {
        totalAmount: 0,
        totalExpenditures: 0,
        averageAmount: 0,
        highestAmount: 0,
        lowestAmount: 0,
      };
    }

    const amounts = displayedExpenditures
      .map((item) => Number(item.amount || 0))
      .filter((amount) => Number.isFinite(amount));

    if (!amounts.length) {
      return {
        totalAmount: 0,
        totalExpenditures: displayedExpenditures.length,
        averageAmount: 0,
        highestAmount: 0,
        lowestAmount: 0,
      };
    }

    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);

    return {
      totalAmount,

      totalExpenditures: displayedExpenditures.length,

      averageAmount: totalAmount / amounts.length,

      highestAmount: Math.max(...amounts),

      lowestAmount: Math.min(...amounts),
    };
  }, [displayedExpenditures]);

  const effectiveSummary = {
    totalAmount:
      Number(summary?.totalAmount) > 0 || calculatedSummary.totalAmount === 0
        ? Number(summary?.totalAmount || 0)
        : calculatedSummary.totalAmount,

    totalExpenditures:
      Number(summary?.totalExpenditures) > 0 ||
      calculatedSummary.totalExpenditures === 0
        ? Number(summary?.totalExpenditures || 0)
        : calculatedSummary.totalExpenditures,

    averageAmount:
      Number(summary?.averageAmount) > 0 ||
      calculatedSummary.averageAmount === 0
        ? Number(summary?.averageAmount || 0)
        : calculatedSummary.averageAmount,

    highestAmount:
      Number(summary?.highestAmount) > 0 ||
      calculatedSummary.highestAmount === 0
        ? Number(summary?.highestAmount || 0)
        : calculatedSummary.highestAmount,

    lowestAmount:
      Number(summary?.lowestAmount) > 0 || calculatedSummary.lowestAmount === 0
        ? Number(summary?.lowestAmount || 0)
        : calculatedSummary.lowestAmount,
  };

  /* =========================================================
     FALLBACK CATEGORY SUMMARY
     
     This guarantees category analysis works even if the
     category aggregation endpoint returns no data.
  ========================================================= */

  const effectiveCategories = useMemo(() => {
    if (Array.isArray(categories) && categories.length > 0) {
      return categories;
    }

    const categoryMap = new Map();

    displayedExpenditures.forEach((expenditure) => {
      const category = expenditure.category || "Other";

      const amount = Number(expenditure.amount || 0);

      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          totalExpenditures: 0,
          totalAmount: 0,
        });
      }

      const current = categoryMap.get(category);

      current.totalExpenditures += 1;

      current.totalAmount += amount;
    });

    return Array.from(categoryMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount,
    );
  }, [categories, displayedExpenditures]);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-fit rounded-lg border border-slate-300 bg-white px-5 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="w-fit rounded-lg bg-slate-900 px-5 py-2 font-medium text-white transition hover:bg-slate-800"
          >
            + Add Expenditure
          </button>
        </div>

        {/* =====================================================
            TITLE
        ===================================================== */}

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Expenditure</h1>

          <p className="mt-2 text-slate-500">
            Track and analyse your business expenses.
          </p>
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {/* =====================================================
            FILTER
        ===================================================== */}

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Filter Expenditures
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select a date range and category to analyse your expenses.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {/* FROM DATE */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                From Date
              </label>

              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none transition focus:border-slate-500"
              />
            </div>

            {/* TO DATE */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                To Date
              </label>

              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none transition focus:border-slate-500"
              />
            </div>

            {/* CATEGORY */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Category
              </label>

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none transition focus:border-slate-500"
              >
                <option value="">All Categories</option>

                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* BUTTONS */}

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleFilter}
                disabled={loading}
                className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Loading..." : "Apply"}
              </button>

              <button
                type="button"
                onClick={handleClearFilter}
                disabled={loading}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            SUMMARY
        ===================================================== */}

        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                    Total Expenditure
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                    Transactions
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                    Average
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                    Highest
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                    Lowest
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="px-6 py-5 text-xl font-bold text-slate-900">
                    {formatMoney(effectiveSummary.totalAmount)}
                  </td>

                  <td className="px-6 py-5 text-xl font-bold text-slate-900">
                    {effectiveSummary.totalExpenditures}
                  </td>

                  <td className="px-6 py-5 text-xl font-bold text-slate-900">
                    {formatMoney(effectiveSummary.averageAmount)}
                  </td>

                  <td className="px-6 py-5 text-xl font-bold text-slate-900">
                    {formatMoney(effectiveSummary.highestAmount)}
                  </td>

                  <td className="px-6 py-5 text-xl font-bold text-slate-900">
                    {formatMoney(effectiveSummary.lowestAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* =====================================================
            EXPENDITURE HISTORY
        ===================================================== */}

        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-900">
              Expenditure History
            </h2>

            <p className="mt-1 text-slate-500">
              All your recorded business expenses.
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              Loading expenditures...
            </div>
          ) : displayedExpenditures.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h3 className="text-xl font-semibold text-slate-700">
                No Expenditures Found
              </h3>

              <p className="mt-2 text-slate-500">
                Add your first expenditure using the button above.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                        Date
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                        Category
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                        Description
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                        Payment
                      </th>

                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                        Amount
                      </th>

                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {displayedExpenditures.map((expenditure) => (
                      <tr
                        key={expenditure._id}
                        className="border-b border-slate-100 transition hover:bg-slate-50 last:border-b-0"
                      >
                        <td className="whitespace-nowrap px-6 py-5 text-slate-700">
                          {formatDate(expenditure.expenditureDate)}
                        </td>

                        <td className="px-6 py-5 font-medium text-slate-900">
                          {expenditure.category}
                        </td>

                        <td className="max-w-[300px] px-6 py-5 text-slate-700">
                          {expenditure.description}

                          {expenditure.notes && (
                            <p className="mt-1 text-xs text-slate-400">
                              {expenditure.notes}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-5 text-slate-700">
                          {expenditure.paymentMethod}
                        </td>

                        <td className="px-6 py-5 text-right font-bold text-slate-900">
                          {formatMoney(expenditure.amount)}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(expenditure)}
                              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(expenditure._id)}
                              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* =====================================================
            CATEGORY ANALYSIS
        ===================================================== */}

        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-900">
              Expenditure by Category
            </h2>

            <p className="mt-1 text-slate-500">
              See where your money is being spent.
            </p>
          </div>

          {effectiveCategories.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-slate-500">No category data available.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                        Category
                      </th>

                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                        Transactions
                      </th>

                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                        Total Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {effectiveCategories.map((category) => (
                      <tr
                        key={category.category}
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <td className="px-6 py-5 font-medium text-slate-900">
                          {category.category}
                        </td>

                        <td className="px-6 py-5 text-right text-slate-700">
                          {category.totalExpenditures}
                        </td>

                        <td className="px-6 py-5 text-right font-bold text-slate-900">
                          {formatMoney(category.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =======================================================
          ADD / EDIT MODAL
      ======================================================= */}

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
          <div className="mx-auto my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {selectedExpenditure ? "Edit Expenditure" : "Add Expenditure"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Record your business expense.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>
            </div>

            {/* MODAL FORM */}

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {/* DATE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Date
                </label>

                <input
                  type="date"
                  name="expenditureDate"
                  value={formData.expenditureDate}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                />
              </div>

              {/* CATEGORY */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category
                </label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500"
                >
                  <option value="">Select Category</option>

                  <option value="Transport">Transport</option>

                  <option value="Electricity">Electricity</option>

                  <option value="Rent">Rent</option>

                  <option value="Salary">Salary</option>

                  <option value="Repair">Repair</option>

                  <option value="Packaging">Packaging</option>

                  <option value="Maintenance">Maintenance</option>

                  <option value="Office">Office</option>

                  <option value="Marketing">Marketing</option>

                  <option value="Fuel">Fuel</option>

                  <option value="Internet">Internet</option>

                  <option value="Phone">Phone</option>

                  <option value="Other">Other</option>
                </select>
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Example: Truck transportation"
                  required
                  maxLength={500}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                />
              </div>

              {/* AMOUNT */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Amount
                </label>

                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  min="0.01"
                  step="0.01"
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                />
              </div>

              {/* PAYMENT */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Payment Method
                </label>

                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500"
                >
                  <option value="Cash">Cash</option>

                  <option value="UPI">UPI</option>

                  <option value="Bank">Bank</option>

                  <option value="Other">Other</option>
                </select>
              </div>

              {/* NOTES */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Notes
                  <span className="ml-1 font-normal text-slate-400">
                    (Optional)
                  </span>
                </label>

                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional information..."
                  rows="3"
                  maxLength={1000}
                  className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                />
              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : selectedExpenditure
                      ? "Update Expenditure"
                      : "Add Expenditure"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Expenditure;
