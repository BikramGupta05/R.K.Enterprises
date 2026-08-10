import api from "./auth.js";

/* -------------------- Get All Sales -------------------- */

export const getSales = async () => {
  const response = await api.get("/sales");

  return response.data;
};

/* -------------------- Get Sale By ID -------------------- */

export const getSaleById = async (id) => {
  const response = await api.get(`/sales/${id}`);

  return response.data;
};

/* -------------------- Get Sales By Seller -------------------- */

export const getSalesBySeller = async (sellerId) => {
  const response = await api.get(`/sales/seller/${sellerId}`);

  return response.data;
};

/* -------------------- Get Sales By Item -------------------- */

export const getSalesByItem = async (itemId) => {
  const response = await api.get(`/sales/item/${itemId}`);

  return response.data;
};

/* -------------------- Create Sale -------------------- */

export const createSale = async (saleData) => {
  const response = await api.post("/sales", saleData);

  return response.data;
};
