import { useState } from "react";
import { useNavigate } from "react-router-dom";

import BuyerCard from "../components/BuyerCard";
import BuyerForm from "../components/BuyerForm";
import useBuyers from "../hooks/useBuyers";

function Buyers() {
  const navigate = useNavigate();

  const { buyers, loading, saving, error, addBuyer, editBuyer, removeBuyer } =
    useBuyers();

  const [open, setOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [search, setSearch] = useState("");

  const openCreateModal = () => {
    setSelectedBuyer(null);
    setOpen(true);
  };

  const openEditModal = (buyer) => {
    setSelectedBuyer(buyer);
    setOpen(true);
  };

  const closeModal = () => {
    setSelectedBuyer(null);
    setOpen(false);
  };

  const handleSubmit = async (data) => {
    let success = false;

    if (selectedBuyer) {
      success = await editBuyer(selectedBuyer._id, data);
    } else {
      success = await addBuyer(data);
    }

    if (success) {
      closeModal();
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this buyer?",
    );

    if (!confirmDelete) return;

    await removeBuyer(id);
  };

  const filteredBuyers = [...buyers]
    .filter((buyer) => {
      const searchText = search.toLowerCase();

      return (
        buyer.shopName.toLowerCase().includes(searchText) ||
        buyer.city.toLowerCase().includes(searchText) ||
        buyer.phone.includes(searchText)
      );
    })
    .sort((a, b) => a.shopName.localeCompare(b.shopName));

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}

        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2 font-medium hover:bg-slate-100"
          >
            ← Back
          </button>

          <button
            onClick={openCreateModal}
            className="rounded-lg bg-slate-900 px-5 py-2 font-medium text-white hover:bg-slate-800"
          >
            + Add Buyer
          </button>
        </div>

        {/* Title */}

        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900">Buyers</h1>

          <p className="mt-2 text-slate-500">Manage your buyers.</p>
        </div>

        {/* Search */}

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search buyers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-slate-500"
          />
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-100 p-4 text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            Loading buyers...
          </div>
        ) : filteredBuyers.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <h2 className="text-xl font-semibold">No buyers found</h2>

            <p className="mt-2 text-slate-500">Add your first buyer.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBuyers.map((buyer) => (
              <BuyerCard
                key={buyer._id}
                buyer={buyer}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        <BuyerForm
          isOpen={open}
          onClose={closeModal}
          onSubmit={handleSubmit}
          initialData={selectedBuyer}
          loading={saving}
        />
      </div>
    </div>
  );
}

export default Buyers;
