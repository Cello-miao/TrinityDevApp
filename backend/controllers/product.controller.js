const pool = require("../config/db");
const { repairTextEncodingDeep } = require("../utils/textEncoding");

/**
 * Product controller
 *
 * Note: incoming product fields may originate from external sources
 * (OpenFoodFacts). To protect UI and DB from mojibake caused by
 * misconfigured deployment pipelines, we apply a conservative
 * encoding repair to textual fields both at write-time and
 * read-time. The repair is non-destructive and favors the original
 * value when uncertainty exists.
 */

const normalizeBarcode = (barcode) => {
  if (barcode === undefined || barcode === null) {
    return "";
  }
  return String(barcode).trim();
};

const getAllProducts = async (req, res) => {
  try {
    const products = await pool.query("SELECT * FROM products");
    res.status(200).json(repairTextEncodingDeep(products.rows));
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
    res.status(200).json(repairTextEncodingDeep(product.rows[0]));
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

    const sanitizedProduct = repairTextEncodingDeep({
      name,
      description,
      brand,
      picture,
      category,
      nutrition_grade,
      nutritional_info,
    });

    const normalizedBarcode = normalizeBarcode(barcode);
    if (normalizedBarcode) {
      const existing = await pool.query(
        "SELECT id FROM products WHERE LOWER(barcode) = LOWER($1) LIMIT 1",
        [normalizedBarcode],
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({
          code: "DUPLICATE_BARCODE",
          message: "A product with this barcode already exists.",
        });
      }
    }

    const newProduct = await pool.query(
      `INSERT INTO products (name, price, description, brand, picture, category, barcode, nutrition_grade, nutritional_info, quantity)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        sanitizedProduct.name,
        price,
        sanitizedProduct.description,
        sanitizedProduct.brand,
        sanitizedProduct.picture,
        sanitizedProduct.category,
        normalizedBarcode,
        sanitizedProduct.nutrition_grade,
        sanitizedProduct.nutritional_info,
        quantity,
      ],
    );
    res.status(201).json(repairTextEncodingDeep(newProduct.rows[0]));
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

    const sanitizedProduct = repairTextEncodingDeep({
      name,
      description,
      brand,
      picture,
      category,
      nutrition_grade,
      nutritional_info,
    });

    const normalizedBarcode = normalizeBarcode(barcode);
    if (normalizedBarcode) {
      const existing = await pool.query(
        "SELECT id FROM products WHERE LOWER(barcode) = LOWER($1) AND id <> $2 LIMIT 1",
        [normalizedBarcode, id],
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({
          code: "DUPLICATE_BARCODE",
          message: "A product with this barcode already exists.",
        });
      }
    }

    const updatedProduct = await pool.query(
      `UPDATE products SET name=$1, price=$2, description=$3, brand=$4, picture=$5, 
      category=$6, barcode=$7, nutrition_grade=$8, nutritional_info=$9, quantity=$10,
      updated_at=CURRENT_TIMESTAMP WHERE id=$11 RETURNING *`,
      [
        sanitizedProduct.name,
        price,
        sanitizedProduct.description,
        sanitizedProduct.brand,
        sanitizedProduct.picture,
        sanitizedProduct.category,
        normalizedBarcode,
        sanitizedProduct.nutrition_grade,
        sanitizedProduct.nutritional_info,
        quantity,
        id,
      ],
    );
    if (updatedProduct.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(repairTextEncodingDeep(updatedProduct.rows[0]));
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
