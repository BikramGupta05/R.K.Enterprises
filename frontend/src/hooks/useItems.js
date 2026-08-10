import { useEffect, useState } from "react";
import { getItems, createItem, updateItem, deleteItem } from "../api/item";

export default function useItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await getItems();
      setItems(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const addItem = async (payload) => {
    try {
      setSaving(true);

      const response = await createItem(payload);

      setItems((prev) => [response.item, ...prev]);

      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create item.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const editItem = async (id, payload) => {
    try {
      setSaving(true);

      const response = await updateItem(id, payload);

      setItems((prev) =>
        prev.map((item) => (item._id === id ? response.item : item)),
      );

      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update item.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (id) => {
    try {
      await deleteItem(id);

      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete item.");
    }
  };

  return {
    items,
    loading,
    saving,
    error,
    addItem,
    editItem,
    removeItem,
  };
}
