const express = require("express");
const router = express.Router();
const { repairTextEncodingDeep } = require("../utils/textEncoding");

router.get("/search", async (req, res) => {
  try {
    const { q, type } = req.query;
    const fields =
      "code,product_name,brands,image_url,categories,nutriscore_grade,nutriments,quantity,ingredients_text";

    let url = "";
    if (type === "category") {
      url = `https://world.openfoodfacts.org/category/${encodeURIComponent(q)}.json?page_size=20&fields=${fields}`;
    } else {
      url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20&fields=${fields}`;
    }

    const response = await fetch(url, {
      headers: { "User-Agent": "TrinityApp - Node.js - Version 1.0" },
    });

    const data = await response.json();
    res.json(repairTextEncodingDeep(data.products || []));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//
router.get("/barcode/:barcode", async (req, res) => {
  try {
    const { barcode } = req.params;
    const fields =
      "code,product_name,brands,image_url,categories,nutriscore_grade,nutriments,quantity,ingredients_text";

    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${fields}`,
      { headers: { "User-Agent": "DevApp" } },
    );

    const data = await response.json();
    res.json(repairTextEncodingDeep(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
