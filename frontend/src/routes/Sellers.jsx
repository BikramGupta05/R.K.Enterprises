import { useMemo, useState } from "react";

import SellerForm from "../components/SellerForm.jsx";
import useSellers from "../hooks/useSellers.js";

function Sellers() {
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
     CREATE
  ========================================================= */

  const openCreateModal = () => {
    setSelectedSeller(null);
    setOpen(true);
  };

  /* =========================================================
     EDIT
  ========================================================= */

  const openEditModal = (seller) => {
    setSelectedSeller(seller);
    setOpen(true);
  };

  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  const closeModal = () => {
    setSelectedSeller(null);
    setOpen(false);
  };

  /* =========================================================
     SUBMIT
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
     DELETE
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
     SEARCH + SORT

     Existing seller search and sorting logic is preserved.
  ========================================================= */

  const filteredSellers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return [...sellers]
      .filter((seller) => {
        const shopName = String(seller.shopName || "").toLowerCase();
        const city = String(seller.city || "").toLowerCase();
        const phone = String(seller.phone || "").toLowerCase();

        return (
          shopName.includes(searchValue) ||
          city.includes(searchValue) ||
          phone.includes(searchValue)
        );
      })
      .sort((a, b) =>
        String(a.shopName || "").localeCompare(
          String(b.shopName || ""),
          undefined,
          {
            sensitivity: "base",
          },
        ),
      );
  }, [sellers, search]);

  /* =========================================================
     UI

     Sellers now renders inside Dashboard's <Outlet />.
     The fixed sidebar is handled by Dashboard.jsx.
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-[1500px]">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Sellers
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Manage your seller list
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-medium text-slate-500">
              {filteredSellers.length}{" "}
              {filteredSellers.length === 1 ? "seller" : "sellers"}
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-8 items-center rounded-md bg-slate-900 px-3.5 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              + Add Seller
            </button>
          </div>
        </div>

        {/* =====================================================
            SEARCH
        ===================================================== */}

        <div className="mb-3 flex gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              🔍
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search shop, city or phone..."
              className="h-9 w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
            />
          </div>

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Clear
            </button>
          )}
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="font-semibold text-red-800 hover:text-red-950"
            >
              ×
            </button>
          </div>
        )}

        {/* =====================================================
            TABLE / EMPTY / LOADING
        ===================================================== */}

        {loading ? (
          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
            <div className="flex h-10 items-center justify-center text-xs text-slate-500">
              Loading sellers...
            </div>
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <h2 className="text-sm font-semibold text-slate-700">
                {search ? "No Matching Sellers" : "No Sellers Found"}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {search
                  ? "No seller matches your search."
                  : 'Click "+ Add Seller" to create your first seller.'}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-3 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  + Add Seller
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                {/* =================================================
                    TABLE HEADER
                ================================================= */}

                <thead>
                  <tr className="h-9 border-b border-slate-300 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    <th className="w-12 border-r border-slate-200 px-2 text-center">
                      #
                    </th>

                    <th className="px-3 text-left">Shop / Seller</th>

                    <th className="w-40 border-l border-slate-200 px-3 text-left">
                      Phone
                    </th>

                    <th className="w-40 border-l border-slate-200 px-3 text-left">
                      City
                    </th>

                    <th className="w-36 border-l border-slate-200 px-2 text-center">
                      Action
                    </th>
                  </tr>
                </thead>

                {/* =================================================
                    TABLE BODY
                ================================================= */}

                <tbody>
                  {filteredSellers.map((seller, index) => (
                    <tr
                      key={seller._id}
                      className={`h-9 border-b border-slate-200 transition last:border-b-0 hover:bg-blue-50/50 ${
                        index % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                      }`}
                    >
                      {/* Number */}

                      <td className="border-r border-slate-100 px-2 text-center tabular-nums text-slate-400">
                        {index + 1}
                      </td>

                      {/* Shop */}

                      <td className="px-3">
                        <span className="font-semibold text-slate-900">
                          {seller.shopName || "N/A"}
                        </span>
                      </td>

                      {/* Phone */}

                      <td className="border-l border-slate-100 px-3 tabular-nums text-slate-700">
                        {seller.phone || "—"}
                      </td>

                      {/* City */}

                      <td className="border-l border-slate-100 px-3 text-slate-700">
                        {seller.city || "—"}
                      </td>

                      {/* Actions */}

                      <td className="border-l border-slate-100 px-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(seller)}
                            className="inline-flex h-6 items-center rounded border border-slate-300 bg-white px-2.5 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(seller._id)}
                            className="inline-flex h-6 items-center rounded border border-red-200 bg-white px-2.5 text-[10px] font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="flex h-7 items-center justify-between border-t border-slate-200 bg-slate-50 px-3 text-[10px] text-slate-500">
              <span>
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredSellers.length}
                </span>{" "}
                {filteredSellers.length === 1 ? "seller" : "sellers"}
              </span>

              {search && (
                <span>
                  Search:{" "}
                  <span className="font-medium text-slate-700">{search}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* =====================================================
            SELLER FORM
        ===================================================== */}

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
