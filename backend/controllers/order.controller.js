const pool = require("../config/db");

const normalizeItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const productId = Number(item.product_id ?? item.productId);
      const quantity = Number(item.quantity);
      return {
        productId,
        quantity,
      };
    })
    .filter(
      (item) => Number.isInteger(item.productId) && item.productId > 0 && Number.isInteger(item.quantity) && item.quantity > 0,
    );
};

const generateOrderNumber = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const createOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      items,
      tax_rate,
      tax_amount,
      shipping_fee,
      payment_method,
      delivery_address,
      customer_name,
      customer_email,
      notes,
    } = req.body;

    if (!payment_method) {
      return res.status(400).json({ message: "payment_method is required" });
    }

    await client.query("BEGIN");

    const normalizedItems = normalizeItems(items);
    let resolvedItems = [];

    if (normalizedItems.length > 0) {
      const productIds = normalizedItems.map((item) => item.productId);
      const productsResult = await client.query(
        "SELECT id, name, picture, price, quantity FROM products WHERE id = ANY($1::int[])",
        [productIds],
      );

      const productMap = new Map(productsResult.rows.map((product) => [Number(product.id), product]));

      for (const item of normalizedItems) {
        const product = productMap.get(item.productId);

        if (!product) {
          await client.query("ROLLBACK");
          return res.status(404).json({ message: `Product ${item.productId} not found` });
        }

        if (Number(product.quantity) < item.quantity) {
          await client.query("ROLLBACK");
          return res.status(409).json({
            code: "INSUFFICIENT_STOCK",
            message: `Not enough stock for ${product.name}`,
          });
        }

        resolvedItems.push({
          productId: Number(product.id),
          quantity: item.quantity,
          name: product.name,
          picture: product.picture,
          unitPrice: Number(product.price),
        });
      }
    } else {
      const cartResult = await client.query(
        `SELECT c.product_id, c.quantity, p.name, p.picture, p.price, p.quantity AS stock_quantity
         FROM cart c
         JOIN products p ON p.id = c.product_id
         WHERE c.user_id = $1`,
        [req.user.id],
      );

      if (cartResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "No items provided and cart is empty" });
      }

      for (const row of cartResult.rows) {
        if (Number(row.stock_quantity) < Number(row.quantity)) {
          await client.query("ROLLBACK");
          return res.status(409).json({
            code: "INSUFFICIENT_STOCK",
            message: `Not enough stock for ${row.name}`,
          });
        }

        resolvedItems.push({
          productId: Number(row.product_id),
          quantity: Number(row.quantity),
          name: row.name,
          picture: row.picture,
          unitPrice: Number(row.price),
        });
      }
    }

    const subtotal = resolvedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const taxRate = Number(tax_rate) || 0;
    const taxAmount = Number(tax_amount) || 0;
    const shippingFee = Number(shipping_fee) || 0;
    const totalAmount = subtotal + taxAmount + shippingFee;
    const orderNumber = generateOrderNumber();

    const orderResult = await client.query(
      `INSERT INTO orders
      (user_id, order_number, subtotal, tax_rate, tax_amount, shipping_fee, total_amount, status, payment_method, delivery_address, customer_name, customer_email, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        req.user.id,
        orderNumber,
        subtotal,
        taxRate,
        taxAmount,
        shippingFee,
        totalAmount,
        payment_method,
        delivery_address || null,
        customer_name || null,
        customer_email || null,
        notes || null,
      ],
    );

    const order = orderResult.rows[0];
    const insertedItems = [];

    for (const item of resolvedItems) {
      const lineTotal = item.unitPrice * item.quantity;

      const itemResult = await client.query(
        `INSERT INTO order_items
        (order_id, product_id, quantity, unit_price, line_total, product_name, product_picture)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          order.id,
          item.productId,
          item.quantity,
          item.unitPrice,
          lineTotal,
          item.name,
          item.picture,
        ],
      );

      await client.query(
        `UPDATE products
         SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [item.quantity, item.productId],
      );

      insertedItems.push(itemResult.rows[0]);
    }

    await client.query("DELETE FROM cart WHERE user_id = $1", [req.user.id]);
    await client.query("COMMIT");

    return res.status(201).json({
      message: "Order created successfully",
      order,
      items: insertedItems,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    client.release();
  }
};

const getMyOrders = async (req, res) => {
  try {
    const ordersResult = await pool.query(
      `SELECT *
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id],
    );

    if (ordersResult.rows.length === 0) {
      return res.status(200).json([]);
    }

    const orderIds = ordersResult.rows.map((order) => order.id);
    const itemsResult = await pool.query(
      `SELECT *
       FROM order_items
       WHERE order_id = ANY($1::int[])
       ORDER BY created_at ASC`,
      [orderIds],
    );

    const itemsByOrderId = new Map();
    for (const item of itemsResult.rows) {
      if (!itemsByOrderId.has(item.order_id)) {
        itemsByOrderId.set(item.order_id, []);
      }
      itemsByOrderId.get(item.order_id).push(item);
    }

    const ordersWithItems = ordersResult.rows.map((order) => ({
      ...order,
      items: itemsByOrderId.get(order.id) || [],
    }));

    return res.status(200).json(ordersWithItems);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
};
