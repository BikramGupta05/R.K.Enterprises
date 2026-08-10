import { useEffect, useState } from "react";

import { getBuyers, createBuyer, updateBuyer, deleteBuyer } from "../api/buyer";

function useBuyers() {
  const [buyers, setBuyers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  /* ---------------- Load Buyers ---------------- */

  const loadBuyers = async () => {
    try {
      setLoading(true);

      const data = await getBuyers();

      setBuyers(data.buyers);

      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load buyers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuyers();
  }, []);

  /* ---------------- Add Buyer ---------------- */

  const addBuyer = async (buyerData) => {
    try {
      setSaving(true);

      const data = await createBuyer(buyerData);

      setBuyers((prev) =>
        [...prev, data.buyer].sort((a, b) =>
          a.shopName.localeCompare(b.shopName),
        ),
      );

      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create buyer.");

      return false;
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- Edit Buyer ---------------- */

  const editBuyer = async (id, buyerData) => {
    try {
      setSaving(true);

      const data = await updateBuyer(id, buyerData);

      setBuyers((prev) =>
        prev
          .map((buyer) => (buyer._id === id ? data.buyer : buyer))
          .sort((a, b) => a.shopName.localeCompare(b.shopName)),
      );

      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update buyer.");

      return false;
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- Delete Buyer ---------------- */

  const removeBuyer = async (id) => {
    try {
      await deleteBuyer(id);

      setBuyers((prev) => prev.filter((buyer) => buyer._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete buyer.");
    }
  };

  return {
    buyers,
    loading,
    saving,
    error,

    addBuyer,
    editBuyer,
    removeBuyer,
  };
}

export default useBuyers;
