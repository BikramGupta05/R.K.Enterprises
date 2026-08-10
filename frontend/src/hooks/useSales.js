import { useCallback, useEffect, useState } from "react";

import {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  getSalesBySeller,
  getSalesByItem,
  getSellerSalesSummary,
  getItemSalesSummary,
} from "../api/sale.js";

import { useAuth } from "../contexts/AuthContext.jsx";

/* =========================================================
   Default Summary
========================================================= */

const DEFAULT_SUMMARY = {
  totalSales: 0,
  totalAmount: 0,
  totalPaid: 0,
  totalCredit: 0,
};

/* =========================================================
   Error Helper
========================================================= */

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

/* =========================================================
   useSales
========================================================= */

function useSales() {
  /* =======================================================
     Authentication
  ======================================================= */

  const { accessToken, loading: authLoading } = useAuth();

  /* =======================================================
     State
  ======================================================= */

  const [sales, setSales] = useState([]);

  const [sellerSummary, setSellerSummary] = useState([]);

  const [itemSummary, setItemSummary] = useState([]);

  const [summary, setSummary] = useState(DEFAULT_SUMMARY);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     Calculate Summary
  ======================================================= */

  const calculateSummary = useCallback((salesList) => {
    if (!Array.isArray(salesList) || salesList.length === 0) {
      return {
        ...DEFAULT_SUMMARY,
      };
    }

    return salesList.reduce(
      (result, sale) => {
        result.totalSales += 1;

        result.totalAmount += Number(sale?.grandTotal) || 0;

        result.totalPaid += Number(sale?.paidAmount) || 0;

        result.totalCredit += Number(sale?.creditAmount) || 0;

        return result;
      },
      {
        ...DEFAULT_SUMMARY,
      },
    );
  }, []);

  /* =======================================================
     Fetch All Sales
  ======================================================= */

  const fetchSales = useCallback(
    async (filters = {}) => {
      /*
       * Wait for AuthProvider.
       */
      if (authLoading) {
        return {
          success: false,
          skipped: true,
          sales: [],
        };
      }

      /*
       * No session.
       */
      if (!accessToken) {
        setSales([]);
        setSummary(DEFAULT_SUMMARY);
        setLoading(false);

        return {
          success: false,
          skipped: true,
          sales: [],
          error: "Authentication required.",
        };
      }

      try {
        setLoading(true);
        setError("");

        const response = await getSales(filters);

        const salesData = Array.isArray(response?.sales) ? response.sales : [];

        setSales(salesData);

        setSummary(calculateSummary(salesData));

        return {
          success: true,
          sales: salesData,
          summary: calculateSummary(salesData),
        };
      } catch (err) {
        console.error("Failed to fetch sales:", err);

        const message = getErrorMessage(err, "Failed to load sales.");

        setError(message);

        return {
          success: false,
          sales: [],
          error: message,
        };
      } finally {
        setLoading(false);
      }
    },
    [accessToken, authLoading, calculateSummary],
  );

  /* =======================================================
     Initial Load
  ======================================================= */

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!accessToken) {
      setSales([]);
      setSummary(DEFAULT_SUMMARY);
      setLoading(false);
      return;
    }

    fetchSales();
  }, [authLoading, accessToken, fetchSales]);

  /* =======================================================
     Create Sale
  ======================================================= */

  const addSale = async (saleData) => {
    if (authLoading || !accessToken) {
      const message = "Authentication required.";

      setError(message);

      return {
        success: false,
        error: message,
      };
    }

    try {
      setSaving(true);
      setError("");

      const response = await createSale(saleData);

      await fetchSales();

      return {
        success: true,
        sale: response?.sale || null,
        message: response?.message || "Sale created successfully.",
      };
    } catch (err) {
      console.error("Failed to create sale:", err);

      const message = getErrorMessage(err, "Failed to create sale.");

      setError(message);

      return {
        success: false,
        error: message,
      };
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     Get Sale By ID
  ======================================================= */

  const fetchSaleById = useCallback(
    async (id) => {
      if (!id) {
        const message = "Sale ID is required.";

        setError(message);

        return {
          success: false,
          sale: null,
          error: message,
        };
      }

      if (authLoading || !accessToken) {
        return {
          success: false,
          sale: null,
          error: "Authentication required.",
        };
      }

      try {
        setLoading(true);
        setError("");

        const response = await getSaleById(id);

        return {
          success: true,
          sale: response?.sale || null,
        };
      } catch (err) {
        console.error("Failed to fetch sale:", err);

        const message = getErrorMessage(err, "Failed to load sale.");

        setError(message);

        return {
          success: false,
          sale: null,
          error: message,
        };
      } finally {
        setLoading(false);
      }
    },
    [accessToken, authLoading],
  );

  /* =======================================================
     Update Sale
  ======================================================= */

  const editSale = async (id, saleData) => {
    if (!id) {
      const message = "Sale ID is required.";

      setError(message);

      return {
        success: false,
        error: message,
      };
    }

    if (authLoading || !accessToken) {
      return {
        success: false,
        error: "Authentication required.",
      };
    }

    try {
      setSaving(true);
      setError("");

      const response = await updateSale(id, saleData);

      await fetchSales();

      return {
        success: true,
        sale: response?.sale || null,
        message: response?.message || "Sale updated successfully.",
      };
    } catch (err) {
      console.error("Failed to update sale:", err);

      const message = getErrorMessage(err, "Failed to update sale.");

      setError(message);

      return {
        success: false,
        error: message,
      };
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     Delete Sale
  ======================================================= */

  const removeSale = async (id) => {
    if (!id) {
      const message = "Sale ID is required.";

      setError(message);

      return {
        success: false,
        error: message,
      };
    }

    if (authLoading || !accessToken) {
      return {
        success: false,
        error: "Authentication required.",
      };
    }

    try {
      setSaving(true);
      setError("");

      const response = await deleteSale(id);

      await fetchSales();

      return {
        success: true,
        message: response?.message || "Sale deleted successfully.",
      };
    } catch (err) {
      console.error("Failed to delete sale:", err);

      const message = getErrorMessage(err, "Failed to delete sale.");

      setError(message);

      return {
        success: false,
        error: message,
      };
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     Sales By Seller
  ======================================================= */

  const fetchSalesBySeller = useCallback(
    async (sellerId, filters = {}) => {
      if (!sellerId) {
        return {
          success: false,
          sales: [],
          error: "Seller ID is required.",
        };
      }

      if (authLoading || !accessToken) {
        return {
          success: false,
          sales: [],
          error: "Authentication required.",
        };
      }

      try {
        setLoading(true);
        setError("");

        const response = await getSalesBySeller(sellerId, filters);

        const sellerSales = Array.isArray(response)
          ? response
          : response?.sales || [];

        return {
          success: true,
          sales: sellerSales,
        };
      } catch (err) {
        console.error("Failed to fetch seller sales:", err);

        const message = getErrorMessage(err, "Failed to load seller sales.");

        setError(message);

        return {
          success: false,
          sales: [],
          error: message,
        };
      } finally {
        setLoading(false);
      }
    },
    [authLoading, accessToken],
  );

  /* =======================================================
     Sales By Item
  ======================================================= */

  const fetchSalesByItem = useCallback(
    async (itemId, filters = {}) => {
      if (!itemId) {
        return {
          success: false,
          sales: [],
          error: "Item ID is required.",
        };
      }

      if (authLoading || !accessToken) {
        return {
          success: false,
          sales: [],
          error: "Authentication required.",
        };
      }

      try {
        setLoading(true);
        setError("");

        const response = await getSalesByItem(itemId, filters);

        const itemSales = Array.isArray(response)
          ? response
          : response?.sales || [];

        return {
          success: true,
          sales: itemSales,
        };
      } catch (err) {
        console.error("Failed to fetch item sales:", err);

        const message = getErrorMessage(err, "Failed to load item sales.");

        setError(message);

        return {
          success: false,
          sales: [],
          error: message,
        };
      } finally {
        setLoading(false);
      }
    },
    [authLoading, accessToken],
  );

  /* =======================================================
     Seller Summary
  ======================================================= */

  const fetchSellerSummary = useCallback(
    async (filters = {}) => {
      if (authLoading || !accessToken) {
        return {
          success: false,
          summary: [],
          error: "Authentication required.",
        };
      }

      try {
        setLoading(true);
        setError("");

        const response = await getSellerSalesSummary(filters);

        const result = Array.isArray(response)
          ? response
          : response?.data || [];

        setSellerSummary(result);

        return {
          success: true,
          summary: result,
        };
      } catch (err) {
        console.error("Failed to fetch seller summary:", err);

        const message = getErrorMessage(err, "Failed to load seller summary.");

        setError(message);

        setSellerSummary([]);

        return {
          success: false,
          summary: [],
          error: message,
        };
      } finally {
        setLoading(false);
      }
    },
    [authLoading, accessToken],
  );

  /* =======================================================
     Item Summary
  ======================================================= */

  const fetchItemSummary = useCallback(
    async (filters = {}) => {
      if (authLoading || !accessToken) {
        return {
          success: false,
          summary: [],
          error: "Authentication required.",
        };
      }

      try {
        setLoading(true);
        setError("");

        const response = await getItemSalesSummary(filters);

        const result = Array.isArray(response)
          ? response
          : response?.data || [];

        setItemSummary(result);

        return {
          success: true,
          summary: result,
        };
      } catch (err) {
        console.error("Failed to fetch item summary:", err);

        const message = getErrorMessage(err, "Failed to load item summary.");

        setError(message);

        setItemSummary([]);

        return {
          success: false,
          summary: [],
          error: message,
        };
      } finally {
        setLoading(false);
      }
    },
    [authLoading, accessToken],
  );

  /* =======================================================
     Refresh Summary
  ======================================================= */

  const refreshSummary = useCallback(() => {
    const result = calculateSummary(sales);

    setSummary(result);

    return result;
  }, [sales, calculateSummary]);

  /* =======================================================
     Return
  ======================================================= */

  return {
    sales,

    sellerSummary,

    itemSummary,

    summary,

    loading,

    saving,

    error,

    authenticated: Boolean(accessToken),

    authLoading,

    fetchSales,

    addSale,

    fetchSaleById,

    editSale,

    removeSale,

    fetchSalesBySeller,

    fetchSalesByItem,

    fetchSellerSummary,

    fetchItemSummary,

    refreshSummary,

    calculateSummary,
  };
}

export default useSales;
