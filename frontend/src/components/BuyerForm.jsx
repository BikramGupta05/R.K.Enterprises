import { useEffect, useState } from "react";

function BuyerForm({ isOpen, onClose, onSubmit, initialData, loading }) {
  const [shopName, setShopName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gstNumber, setGstNumber] = useState("");

  useEffect(() => {
    if (initialData) {
      setShopName(initialData.shopName);
      setCity(initialData.city);
      setAddress(initialData.address);
      setPhone(initialData.phone);
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
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit({
      shopName,
      city,
      address,
      phone,
      email,
      gstNumber,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8">
        <h2 className="mb-6 text-2xl font-bold">
          {initialData ? "Edit Buyer" : "Add Buyer"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Shop Name"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            required
            className="w-full rounded-lg border px-4 py-3"
          />

          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="w-full rounded-lg border px-4 py-3"
          />

          <textarea
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            rows={3}
            className="w-full rounded-lg border px-4 py-3"
          />

          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full rounded-lg border px-4 py-3"
          />

          <input
            type="email"
            placeholder="Email (Optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-4 py-3"
          />

          <input
            type="text"
            placeholder="GST Number (Optional)"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            className="w-full rounded-lg border px-4 py-3"
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-5 py-2"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-5 py-2 text-white hover:bg-slate-800"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BuyerForm;
