import { useCallback, useEffect, useState } from "react";

import {
  getExpenditures,
  createExpenditure,
  updateExpenditure,
  deleteExpenditure,
  getExpenditureSummary,
  getExpenditureByCategory,
} from "../api/expenditure.js";

const DEFAULT_SUMMARY = {
  totalAmount: 0,
  totalExpenditures: 0,
  averageAmount: 0,
  highestAmount: 0,
  lowestAmount: 0,
};

function useExpenditures() {
  const [expenditures, setExpenditures] = useState([]);

  const [summary, setSummary] = useState(DEFAULT_SUMMARY);

  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [filters, setFilters] = useState({});

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const fetchExpenditures = useCallback(async (activeFilters = {}) => {
    try {
      setLoading(true);
      setError("");

      const [expenditureResponse, summaryResponse, categoryResponse] =
        await Promise.all([
          getExpenditures(activeFilters),
          getExpenditureSummary(activeFilters),
          getExpenditureByCategory(activeFilters),
        ]);

      /* =====================================================
           EXPENDITURES
        ===================================================== */

      const expenditureData =
        expenditureResponse?.expenditures ??
        expenditureResponse?.data ??
        (Array.isArray(expenditureResponse) ? expenditureResponse : []);

      setExpenditures(Array.isArray(expenditureData) ? expenditureData : []);

      /* =====================================================
           SUMMARY

           Backend may return:

           {
             totalAmount: ...
           }

           OR:

           {
             summary: {
               totalAmount: ...
             }
           }

           We support both.
        ===================================================== */

      const summaryData =
        summaryResponse?.summary ?? summaryResponse?.data ?? summaryResponse;

      if (
        summaryData &&
        typeof summaryData === "object" &&
        !Array.isArray(summaryData)
      ) {
        setSummary({
          totalAmount: Number(summaryData.totalAmount) || 0,

          totalExpenditures: Number(summaryData.totalExpenditures) || 0,

          averageAmount: Number(summaryData.averageAmount) || 0,

          highestAmount: Number(summaryData.highestAmount) || 0,

          lowestAmount: Number(summaryData.lowestAmount) || 0,
        });
      } else {
        setSummary(DEFAULT_SUMMARY);
      }

      /* =====================================================
           CATEGORY DATA

           Backend may return:

           [
             {...},
             {...}
           ]

           OR:

           {
             categories: [
               {...}
             ]
           }

           OR:

           {
             data: [
               {...}
             ]
           }
        ===================================================== */

      const categoryData =
        categoryResponse?.categories ??
        categoryResponse?.data ??
        (Array.isArray(categoryResponse) ? categoryResponse : []);

      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (err) {
      console.error("Failed to fetch expenditures:", err);

      console.error("Expenditure API error response:", err.response?.data);

      setError(err.response?.data?.message || "Failed to load expenditures");

      setExpenditures([]);

      setSummary(DEFAULT_SUMMARY);

      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================================================
     INITIAL LOAD / FILTER LOAD
  ========================================================= */

  useEffect(() => {
    fetchExpenditures(filters);
  }, [fetchExpenditures, filters]);

  /* =========================================================
     ADD
  ========================================================= */

  const addExpenditure = async (data) => {
    try {
      setSaving(true);
      setError("");

      await createExpenditure(data);

      await fetchExpenditures(filters);

      return true;
    } catch (err) {
      console.error("Failed to create expenditure:", err);

      setError(err.response?.data?.message || "Failed to create expenditure");

      return false;
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     UPDATE
  ========================================================= */

  const editExpenditure = async (id, data) => {
    try {
      setSaving(true);
      setError("");

      await updateExpenditure(id, data);

      await fetchExpenditures(filters);

      return true;
    } catch (err) {
      console.error("Failed to update expenditure:", err);

      setError(err.response?.data?.message || "Failed to update expenditure");

      return false;
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const removeExpenditure = async (id) => {
    try {
      setSaving(true);
      setError("");

      await deleteExpenditure(id);

      await fetchExpenditures(filters);

      return true;
    } catch (err) {
      console.error("Failed to delete expenditure:", err);

      setError(err.response?.data?.message || "Failed to delete expenditure");

      return false;
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     APPLY FILTER
  ========================================================= */

  const filterExpenditures = (newFilters = {}) => {
    const cleanedFilters = {};

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        cleanedFilters[key] = value;
      }
    });

    setFilters(cleanedFilters);
  };

  /* =========================================================
     CLEAR FILTER
  ========================================================= */

  const clearFilters = () => {
    setFilters({});
  };

  /* =========================================================
     RETURN
  ========================================================= */

  return {
    expenditures,

    summary,

    categories,

    loading,

    saving,

    error,

    filters,

    fetchExpenditures,

    filterExpenditures,

    clearFilters,

    addExpenditure,

    editExpenditure,

    removeExpenditure,
  };
}

export default useExpenditures;
