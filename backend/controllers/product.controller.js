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

const getRecommendedProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 6;

    // Get products from user's purchase history with purchase count
    const purchaseHistory = await pool.query(
      `SELECT p.*, COUNT(oi.id) as purchase_count
       FROM products p
       INNER JOIN order_items oi ON p.id = oi.product_id
       INNER JOIN orders o ON oi.order_id = o.id
       WHERE o.user_id = $1
       GROUP BY p.id
       ORDER BY purchase_count DESC`,
      [userId]
    );

    // Get user's favorite products
    const favorites = await pool.query(
      `SELECT p.* 
       FROM products p
       INNER JOIN favorites f ON p.id = f.product_id
       WHERE f.user_id = $1`,
      [userId]
    );

    // Combine purchase history and favorites
    const recommendedMap = new Map();
    
    // Add products from purchase history (with higher priority based on purchase count)
    purchaseHistory.rows.forEach(product => {
      recommendedMap.set(product.id, {
        ...product,
        score: parseInt(product.purchase_count) * 10 // Purchase count weighted heavily
      });
    });

    // Add favorite products (if not already in map, give them a good score)
    favorites.rows.forEach(product => {
      if (!recommendedMap.has(product.id)) {
        recommendedMap.set(product.id, {
          ...product,
          score: 5 // Favorites get a baseline score
        });
      } else {
        // If already in map (purchased AND favorited), boost the score
        const existing = recommendedMap.get(product.id);
        existing.score += 5;
      }
    });

    // Get products from same categories as purchased/favorited items
    if (recommendedMap.size > 0) {
      const categories = [...new Set(
        Array.from(recommendedMap.values()).map(p => p.category)
      )].filter(c => c);

      if (categories.length > 0) {
        const similarProducts = await pool.query(
          `SELECT * FROM products 
           WHERE category = ANY($1) 
           AND id NOT IN (SELECT product_id FROM order_items oi 
                          INNER JOIN orders o ON oi.order_id = o.id 
                          WHERE o.user_id = $2)
           LIMIT $3`,
          [categories, userId, limit * 2]
        );

        similarProducts.rows.forEach(product => {
          if (!recommendedMap.has(product.id)) {
            recommendedMap.set(product.id, {
              ...product,
              score: 3 // Similar category products get medium score
            });
          }
        });
      }
    }

    // If we have enough recommendations, sort and return
    if (recommendedMap.size >= limit) {
      const recommended = Array.from(recommendedMap.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ score, purchase_count, ...product }) => product);
      
      return res.status(200).json(recommended);
    }

    // If not enough recommendations, fill with random popular products
    // (products with low stock = high demand/popular)
    const randomProducts = await pool.query(
      `SELECT * FROM products 
       WHERE id NOT IN (${recommendedMap.size > 0 ? 
         'SELECT unnest(ARRAY[' + Array.from(recommendedMap.keys()).join(',') + '])' : 
         'SELECT 0'})
       ORDER BY quantity ASC, RANDOM()
       LIMIT $1`,
      [limit - recommendedMap.size]
    );

    const finalRecommendations = [
      ...Array.from(recommendedMap.values())
        .sort((a, b) => b.score - a.score)
        .map(({ score, purchase_count, ...product }) => product),
      ...randomProducts.rows
    ];

    res.status(200).json(finalRecommendations.slice(0, limit));
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getRecommendedProducts,
};
