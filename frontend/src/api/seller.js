import api from "./auth.js";

/* -------------------- Get All Sellers -------------------- */

export const getSellers = async () => {
  const response = await api.get("/sellers");

  return response.data;
};

/* -------------------- Get Seller By ID -------------------- */

export const getSellerById = async (id) => {
  const response = await api.get(`/sellers/${id}`);

  return response.data;
};

/* -------------------- Create Seller -------------------- */

export const createSeller = async (sellerData) => {
  const response = await api.post("/sellers", sellerData);

  return response.data;
};

/* -------------------- Update Seller -------------------- */

export const updateSeller = async (id, sellerData) => {
  const response = await api.put(`/sellers/${id}`, sellerData);

  return response.data;
};

/* -------------------- Delete Seller -------------------- */

export const deleteSeller = async (id) => {
  const response = await api.delete(`/sellers/${id}`);

  return response.data;
};
