import api from "./auth.js";

/* -------------------- Get All Purchases -------------------- */

export const getPurchases = async () => {
  const response = await api.get("/purchases");

  return response.data;
};

/* -------------------- Get Purchase By ID -------------------- */

export const getPurchaseById = async (id) => {
  const response = await api.get(`/purchases/${id}`);

  return response.data;
};

/* -------------------- Create Purchase -------------------- */

export const createPurchase = async (purchaseData) => {
  const response = await api.post("/purchases", purchaseData);

  return response.data;
};

/* -------------------- Update Purchase -------------------- */

export const updatePurchase = async (id, purchaseData) => {
  const response = await api.put(`/purchases/${id}`, purchaseData);

  return response.data;
};

/* -------------------- Delete Purchase -------------------- */

export const deletePurchase = async (id) => {
  const response = await api.delete(`/purchases/${id}`);

  return response.data;
};
