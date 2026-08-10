import { useEffect, useState } from "react";

function SellerForm({ isOpen, onClose, onSubmit, initialData, loading }) {
  const [shopName, setShopName] = useState("");

  const [city, setCity] = useState("");

  const [address, setAddress] = useState("");

  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");

  const [gstNumber, setGstNumber] = useState("");

  const [formError, setFormError] = useState("");

  /* =========================================================
     Load Existing Seller
  ========================================================= */

  useEffect(() => {
    if (initialData) {
      setShopName(initialData.shopName || "");

      setCity(initialData.city || "");

      setAddress(initialData.address || "");

      setPhone(initialData.phone || "");

      setEmail(initialData.email || "");

      setGstNumber(initialData.gstNumber || "");
    } else {
      setShopName("");
      setCity("");
      setAddress("");
      setPhone("");
      setEmail("");
      setGstNumber("");
    }

    setFormError("");
  }, [initialData, isOpen]);

  if (!isOpen) {
    return null;
  }

  /* =========================================================
     Submit
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");

    if (!shopName.trim()) {
      setFormError("Shop name is required.");

      return;
    }

    if (!city.trim()) {
      setFormError("City is required.");

      return;
    }

    if (!address.trim()) {
      setFormError("Address is required.");

      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      setFormError("Phone number must be 10 digits.");

      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError("Please enter a valid email.");

      return;
    }

    const sellerData = {
      shopName: shopName.trim(),

      city: city.trim(),

      address: address.trim(),

      phone: phone.trim(),

      email: email.trim() || "",

      gstNumber: gstNumber.trim() || "",
    };

    await onSubmit(sellerData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        {/* Header */}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {initialData ? "Edit Seller" : "Add Seller"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter seller shop details.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            ×
          </button>
        </div>

        {/* Error */}

        {formError && (
          <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Shop Name */}

          <div>
            <label
              htmlFor="seller-shop-name"
              className="text-sm font-medium text-slate-700"
            >
              Shop Name *
            </label>

            <input
              id="seller-shop-name"
              type="text"
              value={shopName}
              onChange={(event) => setShopName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="Enter shop name"
            />
          </div>

          {/* City */}

          <div>
            <label
              htmlFor="seller-city"
              className="text-sm font-medium text-slate-700"
            >
              City *
            </label>

            <input
              id="seller-city"
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="Enter city"
            />
          </div>

          {/* Address */}

          <div>
            <label
              htmlFor="seller-address"
              className="text-sm font-medium text-slate-700"
            >
              Address *
            </label>

            <textarea
              id="seller-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="Enter shop address"
            />
          </div>

          {/* Phone */}

          <div>
            <label
              htmlFor="seller-phone"
              className="text-sm font-medium text-slate-700"
            >
              Phone Number *
            </label>

            <input
              id="seller-phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value.replace(/\D/g, ""))
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="10 digit phone number"
            />
          </div>

          {/* Email */}

          <div>
            <label
              htmlFor="seller-email"
              className="text-sm font-medium text-slate-700"
            >
              Gmail / Email
              <span className="ml-1 text-slate-400">(Optional)</span>
            </label>

            <input
              id="seller-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="example@gmail.com"
            />
          </div>

          {/* GST */}

          <div>
            <label
              htmlFor="seller-gst"
              className="text-sm font-medium text-slate-700"
            >
              GST Number
              <span className="ml-1 text-slate-400">(Optional)</span>
            </label>

            <input
              id="seller-gst"
              type="text"
              value={gstNumber}
              onChange={(event) =>
                setGstNumber(event.target.value.toUpperCase())
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 uppercase outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="Enter GST number"
            />
          </div>

          {/* Buttons */}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : initialData
                  ? "Update Seller"
                  : "Add Seller"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SellerForm;
