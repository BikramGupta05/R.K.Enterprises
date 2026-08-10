import api from "./auth.js";

/* =========================================================
   Create Payment
========================================================= */

export const createPayment = async (paymentData) => {
  const response = await api.post("/payments", paymentData);

  return response.data;
};

/* =========================================================
   Get All Payments
========================================================= */

export const getPayments = async (filters = {}) => {
  const response = await api.get("/payments", {
    params: filters,
  });

  return response.data;
};

/* =========================================================
   Get Payment By ID
========================================================= */

export const getPaymentById = async (id) => {
  const response = await api.get(`/payments/${id}`);

  return response.data;
};

/* =========================================================
   Get Payments By Seller
========================================================= */

export const getPaymentsBySeller = async (sellerId, filters = {}) => {
  const response = await api.get(`/payments/seller/${sellerId}`, {
    params: filters,
  });

  return response.data;
};

/* =========================================================
   Update Payment
========================================================= */

export const updatePayment = async (id, paymentData) => {
  const response = await api.put(`/payments/${id}`, paymentData);

  return response.data;
};

/* =========================================================
   Delete Payment
========================================================= */

export const deletePayment = async (id) => {
  const response = await api.delete(`/payments/${id}`);

  return response.data;
};
