import { useCallback, useState } from "react";

import {
  getMoneyDueSummary,
  getMoneyDueByBuyer,
  getBuyerPayments,
  getBuyerPaymentById,
  createBuyerPayment,
  updateBuyerPayment,
  deleteBuyerPayment,
} from "../api/moneyDue.js";

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

function useMoneyDue() {
  const [accounts, setAccounts] = useState([]);
  const [totals, setTotals] = useState({
    totalPurchased: 0,
    totalPaid: 0,
    totalDue: 0,
    totalBuyers: 0,
  });

  const [buyerAccount, setBuyerAccount] = useState(null);
  const [buyerPurchases, setBuyerPurchases] = useState([]);
  const [buyerPayments, setBuyerPayments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMoneyDueSummary();

      setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
      setTotals(
        data.totals || {
          totalPurchased: 0,
          totalPaid: 0,
          totalDue: 0,
          totalBuyers: 0,
        },
      );

      return data;
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load money due."));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBuyerAccount = useCallback(async (buyerId) => {
    if (!buyerId) {
      return null;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getMoneyDueByBuyer(buyerId);

      setBuyerAccount(data.account || null);
      setBuyerPurchases(Array.isArray(data.purchases) ? data.purchases : []);
      setBuyerPayments(Array.isArray(data.payments) ? data.payments : []);

      return data;
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load buyer account."));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllBuyerPayments = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError("");

      const data = await getBuyerPayments(filters);
      return data.payments || [];
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load buyer payments."));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBuyerPayment = useCallback(async (id) => {
    try {
      setError("");

      const data = await getBuyerPaymentById(id);
      return data.payment || null;
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load buyer payment."));
      return null;
    }
  }, []);

  const addBuyerPayment = useCallback(async (paymentData) => {
    try {
      setSaving(true);
      setError("");

      const data = await createBuyerPayment(paymentData);

      if (data.account) {
        setBuyerAccount(data.account);
      }

      if (data.payment) {
        setBuyerPayments((prev) => [data.payment, ...prev]);
      }

      return {
        success: true,
        data,
      };
    } catch (err) {
      const message = getErrorMessage(
        err,
        "Unable to record buyer payment.",
      );

      setError(message);

      return {
        success: false,
        error: message,
      };
    } finally {
      setSaving(false);
    }
  }, []);

  const editBuyerPayment = useCallback(async (id, paymentData) => {
    try {
      setSaving(true);
      setError("");

      const data = await updateBuyerPayment(id, paymentData);

      if (data.payment) {
        setBuyerPayments((prev) =>
          prev.map((payment) =>
            payment._id === id ? data.payment : payment,
          ),
        );
      }

      if (data.account) {
        setBuyerAccount(data.account);
      }

      return {
        success: true,
        data,
      };
    } catch (err) {
      const message = getErrorMessage(
        err,
        "Unable to update buyer payment.",
      );

      setError(message);

      return {
        success: false,
        error: message,
      };
    } finally {
      setSaving(false);
    }
  }, []);

  const removeBuyerPayment = useCallback(async (id) => {
    try {
      setSaving(true);
      setError("");

      const data = await deleteBuyerPayment(id);

      setBuyerPayments((prev) =>
        prev.filter((payment) => payment._id !== id),
      );

      if (data.account) {
        setBuyerAccount(data.account);
      }

      return {
        success: true,
        data,
      };
    } catch (err) {
      const message = getErrorMessage(
        err,
        "Unable to delete buyer payment.",
      );

      setError(message);

      return {
        success: false,
        error: message,
      };
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    accounts,
    totals,

    buyerAccount,
    buyerPurchases,
    buyerPayments,

    loading,
    saving,
    error,

    fetchSummary,
    fetchBuyerAccount,
    fetchAllBuyerPayments,
    fetchBuyerPayment,

    addBuyerPayment,
    editBuyerPayment,
    removeBuyerPayment,
  };
}

export default useMoneyDue;
