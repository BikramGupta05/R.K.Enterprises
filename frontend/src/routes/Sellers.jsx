import { useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import SellerCard from "../components/SellerCard.jsx";
import SellerForm from "../components/SellerForm.jsx";
import useSellers from "../hooks/useSellers.js";

function Sellers() {
  const navigate = useNavigate();

  const {
    sellers,
    loading,
    saving,
    error,
    addSeller,
    editSeller,
    removeSeller,
  } = useSellers();

  const [open, setOpen] = useState(false);

  const [selectedSeller, setSelectedSeller] = useState(null);

  const [search, setSearch] = useState("");

  /* =========================================================
     Modal
  ========================================================= */

  const openCreateModal = () => {
    setSelectedSeller(null);
    setOpen(true);
  };

  const openEditModal = (seller) => {
    setSelectedSeller(seller);
    setOpen(true);
  };

  const closeModal = () => {
    setSelectedSeller(null);
    setOpen(false);
  };

  /* =========================================================
     Submit
  ========================================================= */

  const handleSubmit = async (data) => {
    let success = false;

    if (selectedSeller) {
      success = await editSeller(selectedSeller._id, data);
    } else {
      success = await addSeller(data);
    }

    if (success) {
      closeModal();
    }
  };

  /* =========================================================
     Delete
  ========================================================= */

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this seller?",
    );

    if (!confirmDelete) {
      return;
    }

    await removeSeller(id);
  };

  /* =========================================================
     Search
  ========================================================= */

  const filteredSellers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return sellers
      .filter((seller) => {
        return (
          seller.shopName?.toLowerCase().includes(searchValue) ||
          seller.city?.toLowerCase().includes(searchValue) ||
          seller.phone?.toLowerCase().includes(searchValue)
        );
      })
      .sort((a, b) =>
        (a.shopName || "").localeCompare(b.shopName || "", undefined, {
          sensitivity: "base",
        }),
      );
  }, [sellers, search]);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}

        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-slate-900 px-5 py-2 font-medium text-white transition hover:bg-slate-800"
          >
            + Add Seller
          </button>
        </div>

        {/* Title */}

        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900">Sellers</h1>

          <p className="mt-2 text-slate-500">Manage your seller list.</p>
        </div>

        {/* Search */}

        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by shop name, city or phone..."
            className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-base outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        {/* Error */}

        {error && (
          <div className="mb-6 rounded-xl bg-red-100 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}

        {loading ? (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            Loading sellers...
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <h2 className="text-xl font-semibold text-slate-700">
              {search ? "No Matching Sellers" : "No Sellers Found"}
            </h2>

            <p className="mt-2 text-slate-500">
              {search
                ? `No seller matches "${search}".`
                : 'Click "+ Add Seller" to create your first seller.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSellers.map((seller) => (
              <SellerCard
                key={seller._id}
                seller={seller}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Form */}

        <SellerForm
          isOpen={open}
          onClose={closeModal}
          onSubmit={handleSubmit}
          initialData={selectedSeller}
          loading={saving}
        />
      </div>
    </div>
  );
}

export default Sellers;
