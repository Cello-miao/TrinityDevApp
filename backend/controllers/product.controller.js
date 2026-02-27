const pool = require("../config/db");

const getAllProducts = async (req, res) => {
  try {
    const products = await pool.query("SELECT * FROM products");
    res.status(200).json(products.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await pool.query("SELECT * FROM products WHERE id = $1", [
      id,
    ]);
    if (product.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      brand,
      picture,
      category,
      barcode,
      nutrition_grade,
      nutritional_info,
      quantity,
    } = req.body;
    const newProduct = await pool.query(
      `INSERT INTO products (name, price, description, brand, picture, category, barcode, nutrition_grade, nutritional_info, quantity)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        name,
        price,
        description,
        brand,
        picture,
        category,
        barcode,
        nutrition_grade,
        nutritional_info,
        quantity,
      ],
    );
    res.status(201).json(newProduct.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      description,
      brand,
      picture,
      category,
      barcode,
      nutrition_grade,
      nutritional_info,
      quantity,
    } = req.body;
    const updatedProduct = await pool.query(
      `UPDATE products SET name=$1, price=$2, description=$3, brand=$4, picture=$5, 
      category=$6, barcode=$7, nutrition_grade=$8, nutritional_info=$9, quantity=$10,
      updated_at=CURRENT_TIMESTAMP WHERE id=$11 RETURNING *`,
      [
        name,
        price,
        description,
        brand,
        picture,
        category,
        barcode,
        nutrition_grade,
        nutritional_info,
        quantity,
        id,
      ],
    );
    if (updatedProduct.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(updatedProduct.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await pool.query(
      "DELETE FROM products WHERE id=$1 RETURNING *",
      [id],
    );
    if (deleted.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
