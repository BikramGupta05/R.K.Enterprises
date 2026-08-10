import { useCallback, useEffect, useState } from "react";
import { getStock, getStockById, getStockByItem } from "../api/stock.js";

function useStock() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStock = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getStock();

      const stockData = Array.isArray(response.stocks) ? response.stocks : [];

      /*
       * Sort alphabetically by item name.
       */
      stockData.sort((a, b) =>
        (a.itemName || "").localeCompare(b.itemName || "", undefined, {
          sensitivity: "base",
        }),
      );

      setStocks(stockData);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load stock.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  const fetchStockById = async (id) => {
    try {
      const response = await getStockById(id);

      return response.stock;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load stock.");

      return null;
    }
  };

  const fetchStockByItem = async (itemId) => {
    try {
      const response = await getStockByItem(itemId);

      return response.stock;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load item stock.");

      return null;
    }
  };

  return {
    stocks,
    loading,
    error,
    loadStock,
    fetchStockById,
    fetchStockByItem,
  };
}

export default useStock;
