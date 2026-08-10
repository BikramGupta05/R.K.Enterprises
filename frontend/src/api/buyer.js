import api from "./auth.js";

/* ---------------- Get Buyers ---------------- */

export const getBuyers = async () => {
  const response = await api.get("/buyers");
  return response.data;
};

/* ---------------- Create Buyer ---------------- */

export const createBuyer = async (buyerData) => {
  const response = await api.post("/buyers", buyerData);
  return response.data;
};

/* ---------------- Update Buyer ---------------- */

export const updateBuyer = async (id, buyerData) => {
  const response = await api.put(`/buyers/${id}`, buyerData);
  return response.data;
};

/* ---------------- Delete Buyer ---------------- */

export const deleteBuyer = async (id) => {
  const response = await api.delete(`/buyers/${id}`);
  return response.data;
};
