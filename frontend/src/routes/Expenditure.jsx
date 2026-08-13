import { useMemo, useState } from "react";

import useExpenditures from "../hooks/useExpenditures";

function Expenditure() {
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
  const [search, setSearch] = useState("");

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
    if (!date) return "N/A";

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
     NORMALIZE TEXT
  ========================================================= */

  const normalizeText = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase();
  };

  /* =========================================================
     MODAL
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

  const closeModal = () => {
    if (saving) return;

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

    if (!confirmDelete) return;

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
    setSearch("");

    clearFilters();
  };

  /* =========================================================
     CATEGORY OPTIONS
  ========================================================= */

  const categoryOptions = useMemo(() => {
    const categorySet = new Set();

    if (Array.isArray(categories)) {
      categories.forEach((category) => {
        const categoryName =
          typeof category === "string"
            ? category
            : category?.category || category?.name;

        if (categoryName?.trim()) {
          categorySet.add(categoryName.trim());
        }
      });
    }

    if (Array.isArray(expenditures)) {
      expenditures.forEach((expenditure) => {
        if (expenditure?.category?.trim()) {
          categorySet.add(expenditure.category.trim());
        }
      });
    }

    return Array.from(categorySet).sort((a, b) =>
      a.localeCompare(b, undefined, {
        sensitivity: "base",
      }),
    );
  }, [categories, expenditures]);

  /* =========================================================
     DISPLAYED EXPENDITURES

     IMPORTANT:
     Category filtering is also performed here.
     This guarantees the UI remains correct even if the
     backend returns unfiltered data.
  ========================================================= */

  const displayedExpenditures = useMemo(() => {
    const data = Array.isArray(expenditures) ? expenditures : [];

    const selectedCategory = normalizeText(categoryFilter);

    const searchValue = normalizeText(search);

    return data.filter((expenditure) => {
      /* -------------------------
         CATEGORY FILTER
      ------------------------- */

      const expenditureCategory = normalizeText(expenditure.category);

      const categoryMatches =
        !selectedCategory || expenditureCategory === selectedCategory;

      if (!categoryMatches) {
        return false;
      }

      /* -------------------------
         SEARCH FILTER
      ------------------------- */

      if (!searchValue) {
        return true;
      }

      const description = normalizeText(expenditure.description);

      const category = normalizeText(expenditure.category);

      const paymentMethod = normalizeText(expenditure.paymentMethod);

      const notes = normalizeText(expenditure.notes);

      return (
        description.includes(searchValue) ||
        category.includes(searchValue) ||
        paymentMethod.includes(searchValue) ||
        notes.includes(searchValue)
      );
    });
  }, [expenditures, categoryFilter, search]);

  /* =========================================================
     FALLBACK SUMMARY
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

  /* =========================================================
     EFFECTIVE SUMMARY
  ========================================================= */

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
     CATEGORY SUMMARY
  ========================================================= */

  const effectiveCategories = useMemo(() => {
    /*
      Do not blindly use backend categories here.

      Build the category summary from the records currently
      visible after category/search filtering.
    */

    const categoryMap = new Map();

    displayedExpenditures.forEach((expenditure) => {
      const category = expenditure.category?.trim() || "Other";

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
  }, [displayedExpenditures]);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50 px-2 py-2 sm:px-3">
      <div className="mx-auto w-full max-w-[1500px]">
        {/* =================================================
            TOP BAR
        ================================================= */}

        <div className="mb-2 flex h-9 items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Expenditure
            </h1>

            <p className="hidden text-[10px] text-slate-500 sm:block">
              Business expense ledger
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-8 items-center rounded-md bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            + Add
          </button>
        </div>

        {/* =================================================
            MAIN CONTAINER
        ================================================= */}

        <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
          {/* =================================================
              FILTER BAR
          ================================================= */}

          <div className="border-b border-slate-300 bg-slate-50 p-2">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
              {/* FROM */}

              <div className="flex items-center gap-2">
                <label
                  htmlFor="from-date"
                  className="w-10 text-[10px] font-bold uppercase tracking-wide text-slate-500"
                >
                  From
                </label>

                <input
                  id="from-date"
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="h-8 w-[145px] rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
                />
              </div>

              {/* TO */}

              <div className="flex items-center gap-2">
                <label
                  htmlFor="to-date"
                  className="w-10 text-[10px] font-bold uppercase tracking-wide text-slate-500"
                >
                  To
                </label>

                <input
                  id="to-date"
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="h-8 w-[145px] rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
                />
              </div>

              {/* CATEGORY */}

              <div className="flex items-center gap-2">
                <label
                  htmlFor="category-filter"
                  className="text-[10px] font-bold uppercase tracking-wide text-slate-500"
                >
                  Category
                </label>

                <select
                  id="category-filter"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="h-8 min-w-[150px] rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
                >
                  <option value="">All Categories</option>

                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* APPLY */}

              <button
                type="button"
                onClick={handleFilter}
                disabled={loading}
                className="h-8 rounded-md bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "..." : "Apply"}
              </button>

              {/* CLEAR */}

              <button
                type="button"
                onClick={handleClearFilter}
                disabled={
                  loading ||
                  (!fromDate && !toDate && !categoryFilter && !search)
                }
                className="h-8 rounded-md border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear
              </button>

              {/* SEARCH */}

              <div className="flex min-w-0 flex-1 items-center gap-2 lg:ml-auto lg:max-w-[320px]">
                <span className="text-sm">🔍</span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search description, category..."
                  className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
                />
              </div>
            </div>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="border-b border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* =================================================
              SUMMARY
          ================================================= */}

          <div className="overflow-x-auto border-b border-slate-300">
            <table className="w-full min-w-[700px] border-collapse text-xs">
              <thead>
                <tr className="h-7 border-b border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  <th className="border-r border-slate-200 px-3 text-left">
                    Total
                  </th>

                  <th className="border-r border-slate-200 px-3 text-right">
                    Transactions
                  </th>

                  <th className="border-r border-slate-200 px-3 text-right">
                    Average
                  </th>

                  <th className="border-r border-slate-200 px-3 text-right">
                    Highest
                  </th>

                  <th className="px-3 text-right">Lowest</th>
                </tr>
              </thead>

              <tbody>
                <tr className="h-9">
                  <td className="border-r border-slate-200 px-3 text-left text-sm font-bold tabular-nums text-slate-900">
                    {formatMoney(calculatedSummary.totalAmount)}
                  </td>

                  <td className="border-r border-slate-200 px-3 text-right font-semibold tabular-nums text-slate-800">
                    {calculatedSummary.totalExpenditures}
                  </td>

                  <td className="border-r border-slate-200 px-3 text-right font-semibold tabular-nums text-slate-800">
                    {formatMoney(calculatedSummary.averageAmount)}
                  </td>

                  <td className="border-r border-slate-200 px-3 text-right font-semibold tabular-nums text-slate-800">
                    {formatMoney(calculatedSummary.highestAmount)}
                  </td>

                  <td className="px-3 text-right font-semibold tabular-nums text-slate-800">
                    {formatMoney(calculatedSummary.lowestAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* =================================================
              EXPENDITURE HISTORY
          ================================================= */}

          <div>
            <div className="flex h-9 items-center justify-between border-b border-slate-300 bg-white px-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                  Expenditure History
                </h2>

                <span className="text-[10px] text-slate-400">
                  {displayedExpenditures.length} records
                </span>
              </div>

              {(fromDate || toDate || categoryFilter || search) && (
                <span className="text-[10px] font-semibold text-slate-400">
                  Filtered
                </span>
              )}
            </div>

            {loading ? (
              <div className="px-4 py-10 text-center text-xs text-slate-500">
                Loading expenditures...
              </div>
            ) : displayedExpenditures.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  No expenditures found
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Add an expenditure or change your filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-xs">
                  <thead>
                    <tr className="h-8 border-b border-slate-300 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                      <th className="w-[110px] border-r border-slate-200 px-3 text-left">
                        Date
                      </th>

                      <th className="w-[150px] border-r border-slate-200 px-3 text-left">
                        Category
                      </th>

                      <th className="border-r border-slate-200 px-3 text-left">
                        Description
                      </th>

                      <th className="w-[120px] border-r border-slate-200 px-3 text-left">
                        Payment
                      </th>

                      <th className="w-[130px] border-r border-slate-200 px-3 text-right">
                        Amount
                      </th>

                      <th className="w-[120px] px-3 text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {displayedExpenditures.map((expenditure) => (
                      <tr
                        key={expenditure._id}
                        className="h-9 border-b border-slate-100 transition hover:bg-slate-50 last:border-b-0"
                      >
                        <td className="whitespace-nowrap border-r border-slate-100 px-3 font-medium tabular-nums text-slate-700">
                          {formatDate(expenditure.expenditureDate)}
                        </td>

                        <td className="border-r border-slate-100 px-3 font-semibold text-slate-800">
                          {expenditure.category}
                        </td>

                        <td className="border-r border-slate-100 px-3">
                          <div className="flex items-center gap-2">
                            <span className="max-w-[500px] truncate text-slate-700">
                              {expenditure.description}
                            </span>

                            {expenditure.notes && (
                              <span
                                title={expenditure.notes}
                                className="cursor-help text-[10px] text-slate-400"
                              >
                                •
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="border-r border-slate-100 px-3 text-slate-600">
                          {expenditure.paymentMethod}
                        </td>

                        <td className="border-r border-slate-100 px-3 text-right font-bold tabular-nums text-slate-900">
                          {formatMoney(expenditure.amount)}
                        </td>

                        <td className="px-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(expenditure)}
                              className="h-6 rounded border border-slate-300 bg-white px-2 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(expenditure._id)}
                              className="h-6 rounded border border-red-200 bg-white px-2 text-[10px] font-semibold text-red-600 transition hover:bg-red-50"
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
            )}
          </div>

          {/* =================================================
              CATEGORY ANALYSIS
          ================================================= */}

          <div className="border-t border-slate-300">
            <div className="flex h-9 items-center justify-between bg-white px-3">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                Category Analysis
              </h2>

              <span className="text-[10px] text-slate-400">
                {effectiveCategories.length} categories
              </span>
            </div>

            {effectiveCategories.length === 0 ? (
              <div className="border-t border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                No category data available.
              </div>
            ) : (
              <div className="overflow-x-auto border-t border-slate-300">
                <table className="w-full min-w-[500px] border-collapse text-xs">
                  <thead>
                    <tr className="h-8 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                      <th className="border-r border-slate-200 px-3 text-left">
                        Category
                      </th>

                      <th className="w-[150px] border-r border-slate-200 px-3 text-right">
                        Transactions
                      </th>

                      <th className="w-[180px] px-3 text-right">
                        Total Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {effectiveCategories.map((category) => (
                      <tr
                        key={category.category}
                        className="h-8 border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                      >
                        <td className="border-r border-slate-100 px-3 font-semibold text-slate-800">
                          {category.category}
                        </td>

                        <td className="border-r border-slate-100 px-3 text-right font-medium tabular-nums text-slate-700">
                          {category.totalExpenditures}
                        </td>

                        <td className="px-3 text-right font-bold tabular-nums text-slate-900">
                          {formatMoney(category.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
          <div className="w-full max-w-xl overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xl">
            <div className="flex h-11 items-center justify-between border-b border-slate-300 bg-slate-50 px-3">
              <h2 className="text-sm font-bold text-slate-900">
                {selectedExpenditure ? "Edit Expenditure" : "Add Expenditure"}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="h-7 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="form-expenditure-date"
                    className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500"
                  >
                    Date
                  </label>

                  <input
                    id="form-expenditure-date"
                    type="date"
                    name="expenditureDate"
                    value={formData.expenditureDate}
                    onChange={handleChange}
                    required
                    className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="form-category"
                    className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500"
                  >
                    Category
                  </label>

                  <select
                    id="form-category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
                  >
                    <option value="">Select Category</option>

                    {[
                      "Transport",
                      "Electricity",
                      "Rent",
                      "Salary",
                      "Repair",
                      "Packaging",
                      "Maintenance",
                      "Office",
                      "Marketing",
                      "Fuel",
                      "Internet",
                      "Phone",
                      "Other",
                    ].map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="form-description"
                    className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500"
                  >
                    Description
                  </label>

                  <input
                    id="form-description"
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Example: Truck transportation"
                    required
                    maxLength={500}
                    className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="form-amount"
                    className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500"
                  >
                    Amount
                  </label>

                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      ₹
                    </span>

                    <input
                      id="form-amount"
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      required
                      className="h-8 w-full rounded-md border border-slate-300 pl-6 pr-2 text-xs outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="form-payment"
                    className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500"
                  >
                    Payment
                  </label>

                  <select
                    id="form-payment"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
                  >
                    <option value="Cash">Cash</option>

                    <option value="UPI">UPI</option>

                    <option value="Bank">Bank</option>

                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="form-notes"
                    className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500"
                  >
                    Notes
                    <span className="ml-1 font-normal text-slate-400">
                      Optional
                    </span>
                  </label>

                  <textarea
                    id="form-notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional information..."
                    rows={2}
                    maxLength={1000}
                    className="w-full resize-none rounded-md border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
                  />
                </div>
              </div>

              <div className="mt-3 flex justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-8 rounded-md border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="h-8 rounded-md bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : selectedExpenditure
                      ? "Update"
                      : "Add"}
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
