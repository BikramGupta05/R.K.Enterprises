import { useCallback, useEffect, useState } from "react";

import {
  getSellers,
  createSeller,
  updateSeller,
  deleteSeller,
} from "../api/seller.js";

import { useAuth } from "../contexts/AuthContext.jsx";

/* =========================================================
   Default State
========================================================= */

const DEFAULT_SELLERS = [];

/* =========================================================
   Error Helper
========================================================= */

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

/* =========================================================
   Seller Sorting
========================================================= */

const sortSellers = (sellerList) => {
  if (!Array.isArray(sellerList)) {
    return [];
  }

  return [...sellerList].sort((a, b) =>
    (a?.shopName || "").localeCompare(b?.shopName || "", undefined, {
      sensitivity: "base",
    }),
  );
};

/* =========================================================
   useSellers
========================================================= */

function useSellers() {
  /* =======================================================
     Authentication

     IMPORTANT:
     We are only reading the existing AuthContext.
     auth.js and AuthContext.jsx are NOT changed.
  ======================================================= */

  const { accessToken, loading: authLoading } = useAuth();

  /* =======================================================
     State
  ======================================================= */

  const [sellers, setSellers] = useState(DEFAULT_SELLERS);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     Load Sellers
  ======================================================= */

  const loadSellers = useCallback(async () => {
    /*
     * Very important:
     * Never call the seller API while AuthProvider
     * is still trying to restore the session.
     */
    if (authLoading) {
      return {
        success: false,
        skipped: true,
        error: "Authentication is initializing.",
      };
    }

    /*
     * No authenticated user.
     */
    if (!accessToken) {
      setSellers([]);
      setLoading(false);

      return {
        success: false,
        skipped: true,
        error: "Authentication required.",
      };
    }

    try {
      setLoading(true);
      setError("");

      const response = await getSellers();

      const sellerData = Array.isArray(response?.sellers)
        ? response.sellers
        : [];

      const sortedSellers = sortSellers(sellerData);

      setSellers(sortedSellers);

      return {
        success: true,
        sellers: sortedSellers,
      };
    } catch (err) {
      console.error("Failed to fetch sellers:", err);

      const message = getErrorMessage(err, "Unable to load sellers.");

      setError(message);

      return {
        success: false,
        sellers: [],
        error: message,
      };
    } finally {
      setLoading(false);
    }
  }, [accessToken, authLoading]);

  /* =======================================================
     Initial Load

     This runs ONLY after authentication is ready.
  ======================================================= */

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!accessToken) {
      setSellers([]);
      setLoading(false);
      return;
    }

    loadSellers();
  }, [authLoading, accessToken, loadSellers]);

  /* =======================================================
     Add Seller
  ======================================================= */

  const addSeller = async (sellerData) => {
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

      const response = await createSeller(sellerData);

      const createdSeller = response?.seller || null;

      if (createdSeller) {
        setSellers((current) => sortSellers([...current, createdSeller]));
      } else {
        await loadSellers();
      }

      return {
        success: true,
        seller: createdSeller,
        message: response?.message || "Seller created successfully.",
      };
    } catch (err) {
      console.error("Failed to create seller:", err);

      const message = getErrorMessage(err, "Unable to create seller.");

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
     Edit Seller
  ======================================================= */

  const editSeller = async (id, sellerData) => {
    if (!id) {
      const message = "Seller ID is required.";

      setError(message);

      return {
        success: false,
        error: message,
      };
    }

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

      const response = await updateSeller(id, sellerData);

      const updatedSeller = response?.seller || null;

      if (updatedSeller) {
        setSellers((current) =>
          sortSellers(
            current.map((seller) =>
              String(seller._id) === String(id) ? updatedSeller : seller,
            ),
          ),
        );
      } else {
        await loadSellers();
      }

      return {
        success: true,
        seller: updatedSeller,
        message: response?.message || "Seller updated successfully.",
      };
    } catch (err) {
      console.error("Failed to update seller:", err);

      const message = getErrorMessage(err, "Unable to update seller.");

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
     Delete Seller
  ======================================================= */

  const removeSeller = async (id) => {
    if (!id) {
      const message = "Seller ID is required.";

      setError(message);

      return {
        success: false,
        error: message,
      };
    }

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

      const response = await deleteSeller(id);

      setSellers((current) =>
        current.filter((seller) => String(seller._id) !== String(id)),
      );

      return {
        success: true,
        message: response?.message || "Seller deleted successfully.",
      };
    } catch (err) {
      console.error("Failed to delete seller:", err);

      const message = getErrorMessage(err, "Unable to delete seller.");

      setError(message);

      await loadSellers();

      return {
        success: false,
        error: message,
      };
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     Clear Error
  ======================================================= */

  const clearError = useCallback(() => {
    setError("");
  }, []);

  /* =======================================================
     Return
  ======================================================= */

  return {
    sellers,

    loading,

    saving,

    error,

    authenticated: Boolean(accessToken),

    authLoading,

    loadSellers,

    addSeller,

    editSeller,

    removeSeller,

    clearError,
  };
}

export default useSellers;
