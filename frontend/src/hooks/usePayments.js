import { useCallback, useState } from "react";

import {
  createPayment,
  getPayments,
  getPaymentById,
  getPaymentsBySeller,
  updatePayment,
  deletePayment,
} from "../api/payment.js";

import { useAuth } from "../contexts/AuthContext.jsx";

/* =========================================================
   Default Account
========================================================= */

const DEFAULT_ACCOUNT = {
  totalSales: 0,
  salePayments: 0,
  khatabookPayments: 0,
  totalPaid: 0,
  outstanding: 0,
};

/* =========================================================
   Error Helper
========================================================= */

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

/* =========================================================
   usePayments
========================================================= */

function usePayments() {
  /* =======================================================
     Authentication
  ======================================================= */

  const { accessToken, loading: authLoading } = useAuth();

  /* =======================================================
     State
  ======================================================= */

  const [payments, setPayments] = useState([]);

  const [account, setAccount] = useState(DEFAULT_ACCOUNT);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     Get All Payments
  ======================================================= */

  const fetchPayments = useCallback(
    async (filters = {}) => {
      if (authLoading) {
        return {
          success: false,
          skipped: true,
          payments: [],
        };
      }

      if (!accessToken) {
        setPayments([]);

        return {
          success: false,
          skipped: true,
          payments: [],
          error: "Authentication required.",
        };
      }

      try {
        setLoading(true);
        setError("");

        const response = await getPayments(filters);

        const paymentList = Array.isArray(response?.payments)
          ? response.payments
          : [];

        setPayments(paymentList);

        return {
          success: true,
          payments: paymentList,
        };
      } catch (err) {
        console.error("Failed to fetch payments:", err);

        const message = getErrorMessage(err, "Failed to load payments.");

        setError(message);

        return {
          success: false,
          payments: [],
          error: message,
        };
      } finally {
        setLoading(false);
      }
    },
    [accessToken, authLoading],
  );

  /* =======================================================
     Get Payments By Seller
  ======================================================= */

  const fetchPaymentsBySeller = useCallback(
    async (sellerId, filters = {}) => {
      if (!sellerId) {
        const message = "Seller ID is required.";

        setError(message);

        return {
          success: false,
          payments: [],
          account: DEFAULT_ACCOUNT,
          error: message,
        };
      }

      if (authLoading) {
        return {
          success: false,
          skipped: true,
          payments: [],
          account: DEFAULT_ACCOUNT,
        };
      }

      if (!accessToken) {
        return {
          success: false,
          skipped: true,
          payments: [],
          account: DEFAULT_ACCOUNT,
          error: "Authentication required.",
        };
      }

      try {
        setLoading(true);
        setError("");

        const response = await getPaymentsBySeller(sellerId, filters);

        const paymentList = Array.isArray(response?.payments)
          ? response.payments
          : [];

        const sellerAccount = response?.account || DEFAULT_ACCOUNT;

        const normalizedAccount = {
          ...DEFAULT_ACCOUNT,
          ...sellerAccount,
        };

        setPayments(paymentList);

        setAccount(normalizedAccount);

        return {
          success: true,
          payments: paymentList,
          account: normalizedAccount,
        };
      } catch (err) {
        console.error("Failed to fetch seller payments:", err);

        const message = getErrorMessage(err, "Failed to load seller payments.");

        setError(message);

        setPayments([]);

        setAccount(DEFAULT_ACCOUNT);

        return {
          success: false,
          payments: [],
          account: DEFAULT_ACCOUNT,
          error: message,
        };
      } finally {
        setLoading(false);
      }
    },
    [accessToken, authLoading],
  );

  /* =======================================================
     Get Payment By ID
  ======================================================= */

  const fetchPaymentById = useCallback(
    async (id) => {
      if (!id) {
        const message = "Payment ID is required.";

        setError(message);

        return {
          success: false,
          payment: null,
          error: message,
        };
      }

      if (authLoading || !accessToken) {
        return {
          success: false,
          payment: null,
          error: "Authentication required.",
        };
      }

      try {
        setLoading(true);
        setError("");

        const response = await getPaymentById(id);

        return {
          success: true,
          payment: response?.payment || null,
        };
      } catch (err) {
        console.error("Failed to fetch payment:", err);

        const message = getErrorMessage(err, "Failed to load payment.");

        setError(message);

        return {
          success: false,
          payment: null,
          error: message,
        };
      } finally {
        setLoading(false);
      }
    },
    [accessToken, authLoading],
  );

  /* =======================================================
     Add Payment
  ======================================================= */

  const addPayment = useCallback(
    async (paymentData) => {
      if (authLoading || !accessToken) {
        const message = "Authentication required.";

        setError(message);

        return {
          success: false,
          error: message,
        };
      }

      try {
        setSaving(true);
        setError("");

        const response = await createPayment(paymentData);

        if (response?.payment) {
          setPayments((current) => [response.payment, ...current]);
        }

        if (response?.account) {
          setAccount({
            ...DEFAULT_ACCOUNT,
            ...response.account,
          });
        }

        return {
          success: true,

          payment: response?.payment || null,

          account: response?.account
            ? {
                ...DEFAULT_ACCOUNT,
                ...response.account,
              }
            : null,

          message: response?.message || "Payment recorded successfully.",
        };
      } catch (err) {
        console.error("Failed to create payment:", err);

        const message = getErrorMessage(err, "Failed to record payment.");

        setError(message);

        return {
          success: false,
          error: message,
        };
      } finally {
        setSaving(false);
      }
    },
    [accessToken, authLoading],
  );

  /* =======================================================
     Edit Payment
  ======================================================= */

  const editPayment = useCallback(
    async (id, paymentData) => {
      if (!id) {
        const message = "Payment ID is required.";

        setError(message);

        return {
          success: false,
          error: message,
        };
      }

      if (authLoading || !accessToken) {
        const message = "Authentication required.";

        setError(message);

        return {
          success: false,
          error: message,
        };
      }

      try {
        setSaving(true);
        setError("");

        const response = await updatePayment(id, paymentData);

        if (response?.payment) {
          setPayments((current) =>
            current.map((payment) =>
              String(payment._id) === String(id) ? response.payment : payment,
            ),
          );
        }

        if (response?.account) {
          setAccount({
            ...DEFAULT_ACCOUNT,
            ...response.account,
          });
        }

        return {
          success: true,

          payment: response?.payment || null,

          account: response?.account
            ? {
                ...DEFAULT_ACCOUNT,
                ...response.account,
              }
            : null,

          message: response?.message || "Payment updated successfully.",
        };
      } catch (err) {
        console.error("Failed to update payment:", err);

        const message = getErrorMessage(err, "Failed to update payment.");

        setError(message);

        return {
          success: false,
          error: message,
        };
      } finally {
        setSaving(false);
      }
    },
    [accessToken, authLoading],
  );

  /* =======================================================
     Delete Payment
  ======================================================= */

  const removePayment = useCallback(
    async (id) => {
      if (!id) {
        const message = "Payment ID is required.";

        setError(message);

        return {
          success: false,
          error: message,
        };
      }

      if (authLoading || !accessToken) {
        const message = "Authentication required.";

        setError(message);

        return {
          success: false,
          error: message,
        };
      }

      try {
        setSaving(true);
        setError("");

        const response = await deletePayment(id);

        setPayments((current) =>
          current.filter((payment) => String(payment._id) !== String(id)),
        );

        if (response?.account) {
          setAccount({
            ...DEFAULT_ACCOUNT,
            ...response.account,
          });
        }

        return {
          success: true,

          account: response?.account
            ? {
                ...DEFAULT_ACCOUNT,
                ...response.account,
              }
            : null,

          message: response?.message || "Payment deleted successfully.",
        };
      } catch (err) {
        console.error("Failed to delete payment:", err);

        const message = getErrorMessage(err, "Failed to delete payment.");

        setError(message);

        return {
          success: false,
          error: message,
        };
      } finally {
        setSaving(false);
      }
    },
    [accessToken, authLoading],
  );

  /* =======================================================
     Clear Error
  ======================================================= */

  const clearError = useCallback(() => {
    setError("");
  }, []);

  /* =======================================================
     Return
  ======================================================= */

  return {
    payments,

    account,

    loading,

    saving,

    error,

    authenticated: Boolean(accessToken),

    authLoading,

    fetchPayments,

    fetchPaymentsBySeller,

    fetchPaymentById,

    addPayment,

    editPayment,

    removePayment,

    clearError,
  };
}

export default usePayments;
