import api from "./auth.js";

/* -------------------- Get All Stock -------------------- */

export const getStock = async () => {
  const response = await api.get("/stock");

  return response.data;
};

/* -------------------- Get Stock By ID -------------------- */

export const getStockById = async (id) => {
  const response = await api.get(`/stock/${id}`);

  return response.data;
};

/* -------------------- Get Stock By Item -------------------- */

export const getStockByItem = async (itemId) => {
  const response = await api.get(`/stock/item/${itemId}`);

  return response.data;
};

export default {
  getStock,
  getStockById,
  getStockByItem,
};
