const express = require("express");
const router = express.Router();
const axios = require("axios");
const verifyToken = require("../middleware/auth");

const PAYPAL_API = "https://api-m.sandbox.paypal.com";

const getAccessToken = async () => {
  const response = await axios.post(
    `${PAYPAL_API}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_CLIENT_SECRET,
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 10000,
    },
  );
  return response.data.access_token;
};

router.post("/create-order", verifyToken, async (req, res) => {
  try {
    const { amount, currency = "EUR" } = req.body;
    console.log("Getting access token");
    const accessToken = await getAccessToken();
    console.log("Got token creating order");

    const response = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: Number(amount).toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: "freshcart://payment-success",
          cancel_url: "freshcart://payment-cancel",
          user_action: "PAY_NOW",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    console.log("Order created", response.data.id);
    const approvalUrl = response.data.links?.find(
      (l) => l.rel === "approve",
    )?.href;
    res.json({ orderId: response.data.id, approvalUrl });
  } catch (error) {
    console.error("PayPal error", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post("/capture-order", verifyToken, async (req, res) => {
  try {
    const { orderId } = req.body;
    const accessToken = await getAccessToken();

    const response = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    res.json({ status: response.data.status, paymentId: response.data.id });
  } catch (error) {
    console.error("PayPal capture error", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
