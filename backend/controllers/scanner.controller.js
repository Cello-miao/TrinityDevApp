const pool = require("../config/db");

const sanitizeBarcode = (barcode) => {
  if (typeof barcode !== "string") {
    return "";
  }
  return barcode.trim();
};

const validateBarcode = (barcode) => {
  if (!barcode) {
    return "BARCODE_REQUIRED";
  }

  if (barcode.length < 4 || barcode.length > 100) {
    return "BARCODE_INVALID_FORMAT";
  }

  if (!/^[A-Za-z0-9\-_.]+$/.test(barcode)) {
    return "BARCODE_INVALID_FORMAT";
  }

  return null;
};

const logScanEvent = async ({ userId = null, barcode, status, message = null }) => {
  try {
    await pool.query(
      "INSERT INTO scan_events (user_id, barcode, status, message) VALUES ($1, $2, $3, $4)",
      [userId, barcode, status, message],
    );
  } catch (error) {
    console.error("Failed to log scan event", error.message);
  }
};

const findProductByBarcode = async (req, res) => {
  try {
    const barcode = sanitizeBarcode(req.body?.barcode);
    const validationError = validateBarcode(barcode);

    if (validationError) {
      await logScanEvent({
        userId: req.user?.id || null,
        barcode,
        status: "invalid",
        message: validationError,
      });

      return res.status(400).json({
        code: validationError,
        message: "Invalid barcode. Please scan again.",
      });
    }

    const product = await pool.query(
      `SELECT id, name, picture, brand, category, nutritional_info, nutrition_grade, price, quantity, barcode
       FROM products
       WHERE barcode = $1
       LIMIT 1`,
      [barcode],
    );

    if (product.rows.length === 0) {
      await logScanEvent({
        userId: req.user?.id || null,
        barcode,
        status: "not_found",
        message: "PRODUCT_NOT_FOUND",
      });

      return res.status(404).json({
        code: "PRODUCT_NOT_FOUND",
        message: "No product found for this barcode.",
      });
    }

    await logScanEvent({
      userId: req.user?.id || null,
      barcode,
      status: "success",
      message: null,
    });

    return res.status(200).json({
      message: "Product found",
      product: product.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      code: "SCANNER_SERVER_ERROR",
      message: "Failed to process scanned barcode.",
      error: error.message,
    });
  }
};

const scanAndAddToCart = async (req, res) => {
  try {
    const barcode = sanitizeBarcode(req.body?.barcode);
    const quantity = req.body?.quantity === undefined ? 1 : Number(req.body.quantity);
    const validationError = validateBarcode(barcode);

    if (validationError) {
      await logScanEvent({
        userId: req.user?.id || null,
        barcode,
        status: "invalid",
        message: validationError,
      });

      return res.status(400).json({
        code: validationError,
        message: "Invalid barcode. Please scan again.",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        code: "INVALID_QUANTITY",
        message: "Quantity must be a positive integer.",
      });
    }

    const productQuery = await pool.query(
      "SELECT id, name, quantity, barcode FROM products WHERE barcode = $1 LIMIT 1",
      [barcode],
    );

    if (productQuery.rows.length === 0) {
      await logScanEvent({
        userId: req.user.id,
        barcode,
        status: "not_found",
        message: "PRODUCT_NOT_FOUND",
      });

      return res.status(404).json({
        code: "PRODUCT_NOT_FOUND",
        message: "No product found for this barcode.",
      });
    }

    const product = productQuery.rows[0];
    if (Number(product.quantity) < quantity) {
      return res.status(409).json({
        code: "INSUFFICIENT_STOCK",
        message: "Not enough stock available for this product.",
      });
    }

    const existingItem = await pool.query(
      "SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2",
      [req.user.id, product.id],
    );

    let cartItem;
    if (existingItem.rows.length > 0) {
      const updated = await pool.query(
        `UPDATE cart
         SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 AND product_id = $3
         RETURNING id, user_id, product_id, quantity`,
        [quantity, req.user.id, product.id],
      );
      cartItem = updated.rows[0];
    } else {
      const inserted = await pool.query(
        `INSERT INTO cart (user_id, product_id, quantity)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, product_id, quantity`,
        [req.user.id, product.id, quantity],
      );
      cartItem = inserted.rows[0];
    }

    await logScanEvent({
      userId: req.user.id,
      barcode,
      status: "added_to_cart",
      message: `quantity:${quantity}`,
    });

    return res.status(200).json({
      message: "Product added to cart from barcode scan",
      product: {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
      },
      cartItem,
    });
  } catch (error) {
    return res.status(500).json({
      code: "SCANNER_SERVER_ERROR",
      message: "Failed to add scanned product to cart.",
      error: error.message,
    });
  }
};

module.exports = {
  findProductByBarcode,
  scanAndAddToCart,
};
