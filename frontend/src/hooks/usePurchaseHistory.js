import { useCallback, useState } from "react";

import {
  getPurchases,
  getPurchaseById,
  getPurchaseSummaryByBuyer,
  getPurchaseHistoryByBuyer,
  getPurchaseSummaryByItem,
  getPurchaseHistoryByItem,
} from "../api/purchase.js";

function usePurchaseHistory() {
  /* =========================================================
     State
  ========================================================= */

  const [purchases, setPurchases] = useState([]);

  const [buyerSummaries, setBuyerSummaries] = useState([]);

  const [itemSummaries, setItemSummaries] = useState([]);

  const [buyerHistory, setBuyerHistory] = useState([]);

  const [itemHistory, setItemHistory] = useState([]);

  const [selectedBuyer, setSelectedBuyer] = useState(null);

  const [selectedItem, setSelectedItem] = useState(null);

  const [buyerDetails, setBuyerDetails] = useState(null);

  const [itemDetails, setItemDetails] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  /* =========================================================
     Clear Error
  ========================================================= */

  const clearError = useCallback(() => {
    setError("");
  }, []);

  /* =========================================================
     Get All Purchases
  ========================================================= */

  const loadPurchases = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError("");

      const response = await getPurchases(params);

      const purchaseData = Array.isArray(response.purchases)
        ? response.purchases
        : [];

      setPurchases(purchaseData);

      return purchaseData;
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to load purchases.";

      setError(message);

      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================================================
     Get Single Purchase
  ========================================================= */

  const loadPurchaseById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError("");

      const response = await getPurchaseById(id);

      return response.purchase || null;
    } catch (err) {
      const message = err.response?.data?.message || "Unable to load purchase.";

      setError(message);

      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================================================
     Get Buyer Summary
  ========================================================= */

  const loadBuyerSummaries = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError("");

      const response = await getPurchaseSummaryByBuyer(params);

      const data = Array.isArray(response.buyers) ? response.buyers : [];

      setBuyerSummaries(data);

      return data;
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to load buyer purchase summary.";

      setError(message);

      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================================================
     Get Specific Buyer History
  ========================================================= */

  const loadBuyerHistory = useCallback(async (buyerId, params = {}) => {
    try {
      setLoading(true);
      setError("");

      const response = await getPurchaseHistoryByBuyer(buyerId, params);

      setSelectedBuyer(response.buyer || null);

      setBuyerDetails(response.summary || null);

      const data = Array.isArray(response.purchases) ? response.purchases : [];

      setBuyerHistory(data);

      return {
        buyer: response.buyer || null,

        summary: response.summary || null,

        purchases: data,
      };
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to load buyer purchase history.";

      setError(message);

      return {
        buyer: null,
        summary: null,
        purchases: [],
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================================================
     Get Item Summary
  ========================================================= */

  const loadItemSummaries = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError("");

      const response = await getPurchaseSummaryByItem(params);

      const data = Array.isArray(response.items) ? response.items : [];

      setItemSummaries(data);

      return data;
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to load item purchase summary.";

      setError(message);

      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================================================
     Get Specific Item History
  ========================================================= */

  const loadItemHistory = useCallback(async (itemId, params = {}) => {
    try {
      setLoading(true);
      setError("");

      const response = await getPurchaseHistoryByItem(itemId, params);

      setSelectedItem(response.item || null);

      setItemDetails(response.summary || null);

      const data = Array.isArray(response.history) ? response.history : [];

      setItemHistory(data);

      return {
        item: response.item || null,

        summary: response.summary || null,

        history: data,
      };
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to load item purchase history.";

      setError(message);

      return {
        item: null,
        summary: null,
        history: [],
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================================================
     Reset Buyer Details
  ========================================================= */

  const clearBuyerHistory = useCallback(() => {
    setSelectedBuyer(null);
    setBuyerDetails(null);
    setBuyerHistory([]);
  }, []);

  /* =========================================================
     Reset Item Details
  ========================================================= */

  const clearItemHistory = useCallback(() => {
    setSelectedItem(null);
    setItemDetails(null);
    setItemHistory([]);
  }, []);

  /* =========================================================
     Return
  ========================================================= */

  return {
    purchases,

    buyerSummaries,
    buyerHistory,

    itemSummaries,
    itemHistory,

    selectedBuyer,
    selectedItem,

    buyerDetails,
    itemDetails,

    loading,
    error,

    loadPurchases,
    loadPurchaseById,

    loadBuyerSummaries,
    loadBuyerHistory,

    loadItemSummaries,
    loadItemHistory,

    clearBuyerHistory,
    clearItemHistory,

    clearError,
  };
}

export default usePurchaseHistory;
