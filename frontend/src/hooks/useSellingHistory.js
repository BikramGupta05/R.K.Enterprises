import { useCallback, useState } from "react";

import {
  getSales,
  getSellerSalesSummary,
  getItemSalesSummary,
  getSalesBySeller,
  getSalesByItem,
} from "../api/sale.js";

function useSellingHistory() {
  /*
   * ============================================================
   * ALL SALES
   * ============================================================
   */

  const [sales, setSales] = useState([]);

  /*
   * ============================================================
   * SELLER SUMMARY
   * ============================================================
   */

  const [sellerSummaries, setSellerSummaries] = useState([]);

  /*
   * ============================================================
   * ITEM SUMMARY
   * ============================================================
   */

  const [itemSummaries, setItemSummaries] = useState([]);

  /*
   * ============================================================
   * SELLER HISTORY
   * ============================================================
   */

  const [selectedSeller, setSelectedSeller] = useState(null);

  const [sellerHistory, setSellerHistory] = useState([]);

  /*
   * ============================================================
   * ITEM HISTORY
   * ============================================================
   */

  const [selectedItem, setSelectedItem] = useState(null);

  const [itemHistory, setItemHistory] = useState([]);

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  const [loading, setLoading] = useState(false);

  /*
   * ============================================================
   * ERROR
   * ============================================================
   */

  const [error, setError] = useState("");

  /*
   * ============================================================
   * LOAD ALL SALES
   * ============================================================
   */

  const loadSales = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError("");

      const data = await getSales(params);

      /*
       * Some APIs return:
       *
       * [ ... ]
       *
       * while others may return:
       *
       * { sales: [ ... ] }
       *
       * Handle both.
       */

      if (Array.isArray(data)) {
        setSales(data);
      } else {
        setSales(data?.sales || []);
      }

      return true;
    } catch (err) {
      console.error("Failed to load sales:", err);

      setError(
        err.response?.data?.message || "Unable to load selling history.",
      );

      setSales([]);

      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * ============================================================
   * LOAD SELLER SUMMARY
   * ============================================================
   */

  const loadSellerSummaries = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError("");

      const data = await getSellerSalesSummary(params);

      if (Array.isArray(data)) {
        setSellerSummaries(data);
      } else {
        setSellerSummaries(data?.sellers || []);
      }

      return true;
    } catch (err) {
      console.error("Failed to load seller summary:", err);

      setError(
        err.response?.data?.message || "Unable to load seller sales summary.",
      );

      setSellerSummaries([]);

      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * ============================================================
   * LOAD ITEM SUMMARY
   * ============================================================
   */

  const loadItemSummaries = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError("");

      const data = await getItemSalesSummary(params);

      if (Array.isArray(data)) {
        setItemSummaries(data);
      } else {
        setItemSummaries(data?.items || []);
      }

      return true;
    } catch (err) {
      console.error("Failed to load item summary:", err);

      setError(
        err.response?.data?.message || "Unable to load item sales summary.",
      );

      setItemSummaries([]);

      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * ============================================================
   * LOAD SALES BY SELLER
   * ============================================================
   */

  const loadSalesBySeller = useCallback(async (seller, params = {}) => {
    try {
      setLoading(true);
      setError("");

      /*
       * Accept either:
       *
       * seller ID
       *
       * OR
       *
       * complete seller summary object.
       */

      const sellerId = typeof seller === "object" ? seller?._id : seller;

      if (!sellerId) {
        throw new Error("Seller ID is required.");
      }

      const data = await getSalesBySeller(sellerId, params);

      setSelectedSeller(typeof seller === "object" ? seller : null);

      if (Array.isArray(data)) {
        setSellerHistory(data);
      } else {
        setSellerHistory(data?.sales || []);
      }

      return true;
    } catch (err) {
      console.error("Failed to load seller history:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load seller history.",
      );

      setSellerHistory([]);

      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * ============================================================
   * LOAD SALES BY ITEM
   * ============================================================
   */

  const loadSalesByItem = useCallback(async (item, params = {}) => {
    try {
      setLoading(true);
      setError("");

      /*
       * Accept either:
       *
       * item ID
       *
       * OR
       *
       * complete item summary object.
       */

      const itemId = typeof item === "object" ? item?._id : item;

      if (!itemId) {
        throw new Error("Item ID is required.");
      }

      const data = await getSalesByItem(itemId, params);

      setSelectedItem(typeof item === "object" ? item : null);

      if (Array.isArray(data)) {
        setItemHistory(data);
      } else {
        setItemHistory(data?.sales || []);
      }

      return true;
    } catch (err) {
      console.error("Failed to load item history:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load item history.",
      );

      setItemHistory([]);

      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * ============================================================
   * CLEAR SELLER HISTORY
   * ============================================================
   */

  const clearSellerHistory = useCallback(() => {
    setSelectedSeller(null);
    setSellerHistory([]);
    setError("");
  }, []);

  /*
   * ============================================================
   * CLEAR ITEM HISTORY
   * ============================================================
   */

  const clearItemHistory = useCallback(() => {
    setSelectedItem(null);
    setItemHistory([]);
    setError("");
  }, []);

  /*
   * ============================================================
   * CLEAR ERROR
   * ============================================================
   */

  const clearError = useCallback(() => {
    setError("");
  }, []);

  /*
   * ============================================================
   * RETURN
   * ============================================================
   */

  return {
    /*
     * All sales
     */
    sales,

    /*
     * Seller section
     */
    sellerSummaries,
    selectedSeller,
    sellerHistory,

    /*
     * Item section
     */
    itemSummaries,
    selectedItem,
    itemHistory,

    /*
     * State
     */
    loading,
    error,

    /*
     * Load functions
     */
    loadSales,
    loadSellerSummaries,
    loadItemSummaries,
    loadSalesBySeller,
    loadSalesByItem,

    /*
     * Clear functions
     */
    clearSellerHistory,
    clearItemHistory,
    clearError,
  };
}

export default useSellingHistory;
