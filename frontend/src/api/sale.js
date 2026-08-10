import api from "./auth.js";

/*
 * ============================================================
 * GET ALL SALES
 * ============================================================
 *
 * Used by:
 *
 * Selling History
 *      ↓
 * All Sales
 *
 * Optional:
 *
 * getSales({
 *   from: "2026-08-01",
 *   to: "2026-08-10"
 * })
 */

export const getSales = async (params = {}) => {
  const response = await api.get("/sales", {
    params,
  });

  return response.data;
};

/*
 * ============================================================
 * GET SALE BY ID
 * ============================================================
 */

export const getSaleById = async (id) => {
  const response = await api.get(`/sales/${id}`);

  return response.data;
};

/*
 * ============================================================
 * CREATE SALE
 * ============================================================
 *
 * IMPORTANT:
 * This keeps your existing selling functionality.
 */

export const createSale = async (saleData) => {
  const response = await api.post("/sales", saleData);

  return response.data;
};

/*
 * ============================================================
 * UPDATE SALE
 * ============================================================
 */

export const updateSale = async (id, saleData) => {
  const response = await api.put(`/sales/${id}`, saleData);

  return response.data;
};

/*
 * ============================================================
 * DELETE SALE
 * ============================================================
 */

export const deleteSale = async (id) => {
  const response = await api.delete(`/sales/${id}`);

  return response.data;
};

/*
 * ============================================================
 * SELLER SUMMARY
 * ============================================================
 *
 * Used by:
 *
 * Selling History
 *      ↓
 * By Seller
 *
 * Returns one row per seller.
 */

export const getSellerSalesSummary = async (params = {}) => {
  const response = await api.get("/sales/summary/sellers", {
    params,
  });

  return response.data;
};

/*
 * ============================================================
 * ITEM SUMMARY
 * ============================================================
 *
 * Used by:
 *
 * Selling History
 *      ↓
 * By Item
 *
 * Returns one row per item.
 */

export const getItemSalesSummary = async (params = {}) => {
  const response = await api.get("/sales/summary/items", {
    params,
  });

  return response.data;
};

/*
 * ============================================================
 * SALES BY SELLER
 * ============================================================
 *
 * Used when the user clicks a seller
 * inside the "By Seller" section.
 *
 * Optional:
 *
 * getSalesBySeller(
 *   sellerId,
 *   {
 *     from: "2026-08-01",
 *     to: "2026-08-10"
 *   }
 * )
 */

export const getSalesBySeller = async (sellerId, params = {}) => {
  const response = await api.get(`/sales/seller/${sellerId}`, {
    params,
  });

  return response.data;
};

/*
 * ============================================================
 * SALES BY ITEM
 * ============================================================
 *
 * Used when the user clicks an item
 * inside the "By Item" section.
 *
 * Optional:
 *
 * getSalesByItem(
 *   itemId,
 *   {
 *     from: "2026-08-01",
 *     to: "2026-08-10"
 *   }
 * )
 */

export const getSalesByItem = async (itemId, params = {}) => {
  const response = await api.get(`/sales/item/${itemId}`, {
    params,
  });

  return response.data;
};
