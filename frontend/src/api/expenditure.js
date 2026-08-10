import api from "./auth.js";

/* =========================================================
   GET ALL EXPENDITURES
========================================================= */

export const getExpenditures = async (params = {}) => {
  const response = await api.get("/expenditures", {
    params,
  });

  return response.data;
};

/* =========================================================
   GET BY ID
========================================================= */

export const getExpenditureById = async (id) => {
  const response = await api.get(`/expenditures/${id}`);

  return response.data;
};

/* =========================================================
   CREATE
========================================================= */

export const createExpenditure = async (data) => {
  const response = await api.post("/expenditures", data);

  return response.data;
};

/* =========================================================
   UPDATE
========================================================= */

export const updateExpenditure = async (id, data) => {
  const response = await api.put(`/expenditures/${id}`, data);

  return response.data;
};

/* =========================================================
   DELETE
========================================================= */

export const deleteExpenditure = async (id) => {
  const response = await api.delete(`/expenditures/${id}`);

  return response.data;
};

/* =========================================================
   SUMMARY
========================================================= */

export const getExpenditureSummary = async (params = {}) => {
  const response = await api.get("/expenditures/summary", {
    params,
  });

  return response.data;
};

/* =========================================================
   CATEGORY SUMMARY
========================================================= */

export const getExpenditureByCategory = async (params = {}) => {
  const response = await api.get("/expenditures/categories", {
    params,
  });

  return response.data;
};
