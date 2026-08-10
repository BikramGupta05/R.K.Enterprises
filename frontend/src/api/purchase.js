import api from "./auth.js";

/* =========================================================
   GET ALL PURCHASES
========================================================= */

export const getPurchases = async (params = {}) => {
  const response = await api.get("/purchases", {
    params,
  });

  return response.data;
};

/* =========================================================
   GET PURCHASE BY ID
========================================================= */

export const getPurchaseById = async (id) => {
  const response = await api.get(`/purchases/${id}`);

  return response.data;
};

/* =========================================================
   CREATE PURCHASE
========================================================= */

export const createPurchase = async (purchaseData) => {
  const response = await api.post("/purchases", purchaseData);

  return response.data;
};

/* =========================================================
   UPDATE PURCHASE
========================================================= */

export const updatePurchase = async (id, purchaseData) => {
  const response = await api.put(`/purchases/${id}`, purchaseData);

  return response.data;
};

/* =========================================================
   DELETE PURCHASE
========================================================= */

export const deletePurchase = async (id) => {
  const response = await api.delete(`/purchases/${id}`);

  return response.data;
};

/* =========================================================
   PURCHASE SUMMARY BY BUYER
========================================================= */

export const getPurchaseSummaryByBuyer = async (params = {}) => {
  const response = await api.get("/purchases/summary/buyers", {
    params,
  });

  return response.data;
};

/* =========================================================
   PURCHASE HISTORY BY BUYER
========================================================= */

export const getPurchaseHistoryByBuyer = async (buyerId, params = {}) => {
  const response = await api.get(`/purchases/buyer/${buyerId}`, {
    params,
  });

  return response.data;
};

/* =========================================================
   PURCHASE SUMMARY BY ITEM
========================================================= */

export const getPurchaseSummaryByItem = async (params = {}) => {
  const response = await api.get("/purchases/summary/items", {
    params,
  });

  return response.data;
};

/* =========================================================
   PURCHASE HISTORY BY ITEM
========================================================= */

export const getPurchaseHistoryByItem = async (itemId, params = {}) => {
  const response = await api.get(`/purchases/item/${itemId}`, {
    params,
  });

  return response.data;
};
