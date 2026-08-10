import { useCallback, useEffect, useState } from "react";

import {
  getSellers,
  createSeller,
  updateSeller,
  deleteSeller,
} from "../api/seller.js";

function useSellers() {
  const [sellers, setSellers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  /* =========================================================
     Load Sellers
  ========================================================= */

  const loadSellers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getSellers();

      const sellerData = Array.isArray(response.sellers)
        ? response.sellers
        : [];

      sellerData.sort((a, b) =>
        (a.shopName || "").localeCompare(b.shopName || "", undefined, {
          sensitivity: "base",
        }),
      );

      setSellers(sellerData);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load sellers.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================================================
     Initial Load
  ========================================================= */

  useEffect(() => {
    loadSellers();
  }, [loadSellers]);

  /* =========================================================
     Add Seller
  ========================================================= */

  const addSeller = async (sellerData) => {
    try {
      setSaving(true);
      setError("");

      const response = await createSeller(sellerData);

      if (response.seller) {
        setSellers((current) =>
          [...current, response.seller].sort((a, b) =>
            (a.shopName || "").localeCompare(b.shopName || "", undefined, {
              sensitivity: "base",
            }),
          ),
        );
      }

      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create seller.");

      return false;
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     Edit Seller
  ========================================================= */

  const editSeller = async (id, sellerData) => {
    try {
      setSaving(true);
      setError("");

      const response = await updateSeller(id, sellerData);

      if (response.seller) {
        setSellers((current) =>
          current
            .map((seller) => (seller._id === id ? response.seller : seller))
            .sort((a, b) =>
              (a.shopName || "").localeCompare(b.shopName || "", undefined, {
                sensitivity: "base",
              }),
            ),
        );
      }

      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update seller.");

      return false;
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     Delete Seller
  ========================================================= */

  const removeSeller = async (id) => {
    try {
      setError("");

      await deleteSeller(id);

      setSellers((current) => current.filter((seller) => seller._id !== id));

      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete seller.");

      return false;
    }
  };

  return {
    sellers,
    loading,
    saving,
    error,
    loadSellers,
    addSeller,
    editSeller,
    removeSeller,
  };
}

export default useSellers;
