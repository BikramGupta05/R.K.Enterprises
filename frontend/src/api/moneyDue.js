import api from "./auth.js";

/* =========================================================
   MONEY DUE SUMMARY
========================================================= */

export const getMoneyDueSummary = async () => {
  const response = await api.get("/buyer-payments/summary");

  return response.data;
};

/* =========================================================
   MONEY DUE BY BUYER
========================================================= */

export const getMoneyDueByBuyer = async (buyerId) => {
  const response = await api.get(`/buyer-payments/buyer/${buyerId}`);

  return response.data;
};

/* =========================================================
   ALL BUYER PAYMENTS
========================================================= */

export const getBuyerPayments = async (filters = {}) => {
  const response = await api.get("/buyer-payments", {
    params: filters,
  });

  return response.data;
};

/* =========================================================
   BUYER PAYMENT BY ID
========================================================= */

export const getBuyerPaymentById = async (id) => {
  const response = await api.get(`/buyer-payments/${id}`);

  return response.data;
};

/* =========================================================
   CREATE BUYER PAYMENT
========================================================= */

export const createBuyerPayment = async (paymentData) => {
  const response = await api.post("/buyer-payments", paymentData);

  return response.data;
};

/* =========================================================
   UPDATE BUYER PAYMENT
========================================================= */

export const updateBuyerPayment = async (id, paymentData) => {
  const response = await api.put(`/buyer-payments/${id}`, paymentData);

  return response.data;
};

/* =========================================================
   DELETE BUYER PAYMENT
========================================================= */

export const deleteBuyerPayment = async (id) => {
  const response = await api.delete(`/buyer-payments/${id}`);

  return response.data;
};
