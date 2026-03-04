const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");

const PAYPAL_API = "https://api-m.sandbox.paypal.com";
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

const getAccessToken = async () => {
  console.log("Getting PayPal access token");
  console.log("Client ID:", CLIENT_ID ? "exists" : "MISSING");
  console.log("Client Secret:", CLIENT_SECRET ? "exists" : "MISSING");

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    "base64",
  );
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  console.log("PayPal token response:", data);
  return data.access_token;
};

router.post("/create-order", verifyToken, async (req, res) => {
  try {
    const { amount, currency = "EUR" } = req.body;
    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount.toFixed(2),
            },
            description: "Order",
          },
        ],
        application_context: {
          return_url: "freshcart://payment-success",
          cancel_url: "freshcart://payment-cancel",
        },
      }),
    });

    const order = await response.json();
    const approvalUrl = order.links.find((l) => l.rel === "approve")?.href;

    res.json({ orderId: order.id, approvalUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/capture-order", verifyToken, async (req, res) => {
  try {
    const { orderId } = req.body;
    const accessToken = await getAccessToken();

    const response = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
