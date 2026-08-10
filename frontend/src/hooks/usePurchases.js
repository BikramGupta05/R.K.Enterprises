import { useEffect, useState } from "react";

import {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
} from "../api/purchase.js";

function usePurchases() {
  const [purchases, setPurchases] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  /* -------------------- Load Purchases -------------------- */

  const loadPurchases = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getPurchases();

      setPurchases(data.purchases || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load purchases.");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- Initial Load -------------------- */

  useEffect(() => {
    loadPurchases();
  }, []);

  /* -------------------- Get Single Purchase -------------------- */

  const fetchPurchase = async (id) => {
    try {
      setError("");

      const data = await getPurchaseById(id);

      return data.purchase;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load purchase.");

      return null;
    }
  };

  /* -------------------- Add Purchase -------------------- */

  const addPurchase = async (purchaseData) => {
    try {
      setSaving(true);
      setError("");

      const data = await createPurchase(purchaseData);

      setPurchases((prev) => {
        const updated = [data.purchase, ...prev];

        return updated.sort(
          (a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate),
        );
      });

      return true;
    } catch (err) {
      const validationError = err.response?.data?.errors?.[0]?.message;

      setError(
        validationError ||
          err.response?.data?.message ||
          "Unable to create purchase.",
      );

      return false;
    } finally {
      setSaving(false);
    }
  };

  /* -------------------- Edit Purchase -------------------- */

  const editPurchase = async (id, purchaseData) => {
    try {
      setSaving(true);
      setError("");

      const data = await updatePurchase(id, purchaseData);

      setPurchases((prev) => {
        const updated = prev.map((purchase) =>
          purchase._id === id ? data.purchase : purchase,
        );

        return updated.sort(
          (a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate),
        );
      });

      return true;
    } catch (err) {
      const validationError = err.response?.data?.errors?.[0]?.message;

      setError(
        validationError ||
          err.response?.data?.message ||
          "Unable to update purchase.",
      );

      return false;
    } finally {
      setSaving(false);
    }
  };

  /* -------------------- Delete Purchase -------------------- */

  const removePurchase = async (id) => {
    try {
      setError("");

      await deletePurchase(id);

      setPurchases((prev) => prev.filter((purchase) => purchase._id !== id));

      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete purchase.");

      return false;
    }
  };

  return {
    purchases,
    loading,
    saving,
    error,

    loadPurchases,
    fetchPurchase,

    addPurchase,
    editPurchase,
    removePurchase,
  };
}

export default usePurchases;
