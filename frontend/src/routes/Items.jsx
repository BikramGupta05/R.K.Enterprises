import { useState } from "react";
import { useNavigate } from "react-router-dom";

import ItemForm from "../components/ItemForm";
import useItems from "../hooks/useItems";

function Items() {
  const navigate = useNavigate();

  const { items, loading, saving, error, addItem, editItem, removeItem } =
    useItems();

  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [search, setSearch] = useState("");

  /* =========================================================
     CREATE
  ========================================================= */

  const openCreateModal = () => {
    setSelectedItem(null);
    setOpen(true);
  };

  /* =========================================================
     EDIT
  ========================================================= */

  const openEditModal = (item) => {
    setSelectedItem(item);
    setOpen(true);
  };

  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  const closeModal = () => {
    setSelectedItem(null);
    setOpen(false);
  };

  /* =========================================================
     SAVE
  ========================================================= */

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

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this item?",
    );

    if (!confirmDelete) {
      return;
    }

    await removeItem(id);
  };

  /* =========================================================
     SEARCH + SORT
  ========================================================= */

  const filteredItems = [...items]
    .filter((item) =>
      item.title.toLowerCase().includes(search.trim().toLowerCase()),
    )
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="min-h-screen bg-slate-50 px-2 py-2 sm:px-3">
      <div className="mx-auto w-full max-w-[1500px]">
        {/* =====================================================
            TOP BAR
        ===================================================== */}

        <div className="mb-2 flex h-8 items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-8 items-center rounded-md bg-slate-900 px-3.5 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            + Add Item
          </button>
        </div>

        {/* =====================================================
            TITLE BAR
        ===================================================== */}

        <div className="mb-2 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Items
            </h1>

            <p className="mt-0.5 text-xs text-slate-500">
              Manage your item list
            </p>
          </div>

          <div className="text-xs font-medium text-slate-500">
            {filteredItems.length}{" "}
            {filteredItems.length === 1 ? "item" : "items"}
          </div>
        </div>

        {/* =====================================================
            SEARCH BAR
        ===================================================== */}

        <div className="mb-2 flex gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              🔍
            </span>

            <input
              type="text"
              placeholder="Search item..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-8 w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-200"
            />
          </div>

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="h-8 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Clear
            </button>
          )}
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mb-2 flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
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
            <div className="flex h-10 items-center justify-center text-xs text-slate-500">
              Loading items...
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <h2 className="text-sm font-semibold text-slate-700">
                {search ? "No items found" : "No items yet"}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {search
                  ? "No items match your search."
                  : "Add a new item to your list."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-3 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  + Add Item
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ===================================================
             EXCEL STYLE TABLE
          =================================================== */

          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                {/* Header */}

                <thead>
                  <tr className="h-9 border-b border-slate-300 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    <th className="w-14 border-r border-slate-200 px-2 text-center">
                      #
                    </th>

                    <th className="px-3 text-left">Item Name</th>

                    <th className="w-36 border-l border-slate-200 px-3 text-center">
                      Action
                    </th>
                  </tr>
                </thead>

                {/* Rows */}

                <tbody>
                  {filteredItems.map((item, index) => (
                    <tr
                      key={item._id}
                      className={`h-9 border-b border-slate-200 transition last:border-b-0 hover:bg-blue-50/50 ${
                        index % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                      }`}
                    >
                      {/* Number */}

                      <td className="border-r border-slate-100 px-2 text-center tabular-nums text-slate-400">
                        {index + 1}
                      </td>

                      {/* Item */}

                      <td className="px-3">
                        <span className="font-medium text-slate-900">
                          {item.title}
                        </span>
                      </td>

                      {/* Actions */}

                      <td className="border-l border-slate-100 px-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="inline-flex h-6 items-center rounded border border-slate-300 bg-white px-2.5 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item._id)}
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

            {/* Footer */}

            <div className="flex h-7 items-center justify-between border-t border-slate-200 bg-slate-50 px-3 text-[10px] text-slate-500">
              <span>
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredItems.length}
                </span>{" "}
                {filteredItems.length === 1 ? "item" : "items"}
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
            ITEM FORM
        ===================================================== */}

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
