import { useState } from "react";
import { useNavigate } from "react-router-dom";

import ItemCard from "../components/ItemCard";
import ItemForm from "../components/ItemForm";
import useItems from "../hooks/useItems";

function Items() {
  const navigate = useNavigate();

  const { items, loading, saving, error, addItem, editItem, removeItem } =
    useItems();

  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [search, setSearch] = useState("");

  const openCreateModal = () => {
    setSelectedItem(null);
    setOpen(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setOpen(true);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setOpen(false);
  };

  const handleSubmit = async (data) => {
    let success = false;

    if (selectedItem) {
      success = await editItem(selectedItem._id, data);
    } else {
      success = await addItem(data);
    }

    if (success) {
      closeModal();
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this item?",
    );

    if (!confirmDelete) return;

    await removeItem(id);
  };

  const filteredItems = [...items]
    .filter((item) => item.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2 font-medium transition hover:bg-slate-100"
          >
            ← Back
          </button>

          <button
            onClick={openCreateModal}
            className="rounded-lg bg-slate-900 px-5 py-2 font-medium text-white transition hover:bg-slate-800"
          >
            + Add Item
          </button>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900">Your Items</h1>

          <p className="mt-2 text-slate-500">Manage your personal item list.</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 outline-none transition focus:border-slate-500"
          />
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-100 p-4 text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            Loading items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <h2 className="text-xl font-semibold text-slate-700">
              No items found
            </h2>

            <p className="mt-2 text-slate-500">Add a new item to your list.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <ItemCard
                key={item._id}
                item={item}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        <ItemForm
          isOpen={open}
          onClose={closeModal}
          onSubmit={handleSubmit}
          initialData={selectedItem}
          loading={saving}
        />
      </div>
    </div>
  );
}

export default Items;
