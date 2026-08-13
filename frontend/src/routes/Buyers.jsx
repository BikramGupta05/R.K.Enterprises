import { useState } from "react";

import BuyerForm from "../components/BuyerForm";
import useBuyers from "../hooks/useBuyers";

function Buyers() {
  const { buyers, loading, saving, error, addBuyer, editBuyer, removeBuyer } =
    useBuyers();

  const [open, setOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [search, setSearch] = useState("");

  /* =========================================================
     CREATE
  ========================================================= */

  const openCreateModal = () => {
    setSelectedBuyer(null);
    setOpen(true);
  };

  /* =========================================================
     EDIT
  ========================================================= */

  const openEditModal = (buyer) => {
    setSelectedBuyer(buyer);
    setOpen(true);
  };

  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  const closeModal = () => {
    setSelectedBuyer(null);
    setOpen(false);
  };

  /* =========================================================
     SAVE
  ========================================================= */

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

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this buyer?",
    );

    if (!confirmDelete) {
      return;
    }

    await removeBuyer(id);
  };

  /* =========================================================
     SEARCH + SORT
  ========================================================= */

  const searchValue = search.trim().toLowerCase();

  const filteredBuyers = [...buyers]
    .filter((buyer) => {
      const shopName = String(buyer.shopName || "").toLowerCase();
      const city = String(buyer.city || "").toLowerCase();
      const phone = String(buyer.phone || "").toLowerCase();

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

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-[1500px]">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Buyers
            </h1>

            <p className="mt-1 text-xs text-slate-500">Manage your buyers</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-medium text-slate-500">
              {filteredBuyers.length}{" "}
              {filteredBuyers.length === 1 ? "buyer" : "buyers"}
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-8 items-center rounded-md bg-slate-900 px-3.5 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              + Add Buyer
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
              placeholder="Search shop, city or phone..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
            CONTENT
        ===================================================== */}

        {loading ? (
          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
            <div className="flex h-12 items-center justify-center text-xs text-slate-500">
              Loading buyers...
            </div>
          </div>
        ) : filteredBuyers.length === 0 ? (
          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <h2 className="text-sm font-semibold text-slate-700">
                {search ? "No buyers found" : "No buyers yet"}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {search
                  ? "No buyer matches your search."
                  : "Add your first buyer."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-3 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  + Add Buyer
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ===================================================
             BUYER TABLE
          =================================================== */

          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="h-9 border-b border-slate-300 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    {/* Number */}

                    <th className="w-12 border-r border-slate-200 px-2 text-center">
                      #
                    </th>

                    {/* Shop */}

                    <th className="px-3 text-left">Shop / Buyer</th>

                    {/* Phone */}

                    <th className="w-40 border-l border-slate-200 px-3 text-left">
                      Phone
                    </th>

                    {/* City */}

                    <th className="w-40 border-l border-slate-200 px-3 text-left">
                      City
                    </th>

                    {/* Actions */}

                    <th className="w-36 border-l border-slate-200 px-2 text-center">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBuyers.map((buyer, index) => (
                    <tr
                      key={buyer._id}
                      className={`h-9 border-b border-slate-200 transition last:border-b-0 hover:bg-blue-50/50 ${
                        index % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                      }`}
                    >
                      {/* Number */}

                      <td className="border-r border-slate-100 px-2 text-center tabular-nums text-slate-400">
                        {index + 1}
                      </td>

                      {/* Shop / Buyer */}

                      <td className="px-3">
                        <span className="font-semibold text-slate-900">
                          {buyer.shopName || "N/A"}
                        </span>
                      </td>

                      {/* Phone */}

                      <td className="border-l border-slate-100 px-3 tabular-nums text-slate-700">
                        {buyer.phone || "—"}
                      </td>

                      {/* City */}

                      <td className="border-l border-slate-100 px-3 text-slate-700">
                        {buyer.city || "—"}
                      </td>

                      {/* Actions */}

                      <td className="border-l border-slate-100 px-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(buyer)}
                            className="inline-flex h-6 items-center rounded border border-slate-300 bg-white px-2.5 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(buyer._id)}
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
                TABLE FOOTER
            ================================================= */}

            <div className="flex h-7 items-center justify-between border-t border-slate-200 bg-slate-50 px-3 text-[10px] text-slate-500">
              <span>
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredBuyers.length}
                </span>{" "}
                {filteredBuyers.length === 1 ? "buyer" : "buyers"}
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
            BUYER FORM
        ===================================================== */}

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
