import { useCallback, useEffect, useState } from "react";

import {
  getSales,
  getSaleById,
  getSalesBySeller,
  getSalesByItem,
  createSale,
} from "../api/sale.js";

function useSales() {
  const [sales, setSales] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  /* =========================================================
     Load All Sales
  ========================================================= */

  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getSales();

      const salesData = Array.isArray(response.sales) ? response.sales : [];

      setSales(salesData);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load sales.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================================================
     Initial Load
  ========================================================= */

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  /* =========================================================
     Create Sale
  ========================================================= */

  const addSale = async (saleData) => {
    try {
      setSaving(true);
      setError("");

      const response = await createSale(saleData);

      if (response.sale) {
        setSales((current) => [response.sale, ...current]);
      }

      return {
        success: true,
        sale: response.sale,
      };
    } catch (err) {
      const message = err.response?.data?.message || "Unable to create sale.";

      setError(message);

      return {
        success: false,
        sale: null,
        error: message,
      };
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     Get Sale By ID
  ========================================================= */

  const fetchSaleById = async (id) => {
    try {
      const response = await getSaleById(id);

      return response.sale;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load sale.");

      return null;
    }
  };

  /* =========================================================
     Get Sales By Seller
  ========================================================= */

  const fetchSalesBySeller = async (sellerId) => {
    try {
      const response = await getSalesBySeller(sellerId);

      return Array.isArray(response.sales) ? response.sales : [];
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load seller sales.");

      return [];
    }
  };

  /* =========================================================
     Get Sales By Item
  ========================================================= */

  const fetchSalesByItem = async (itemId) => {
    try {
      const response = await getSalesByItem(itemId);

      return Array.isArray(response.sales) ? response.sales : [];
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load item sales.");

      return [];
    }
  };

  return {
    sales,
    loading,
    saving,
    error,
    loadSales,
    addSale,
    fetchSaleById,
    fetchSalesBySeller,
    fetchSalesByItem,
  };
}

export default useSales;
