const API_BASE = "http://localhost:3000/api/openfoodfacts";

export interface OpenFoodFactsProduct {
  code: string;
  product: {
    product_name?: string;
    brands?: string;
    image_url?: string;
    categories?: string;
    nutriscore_grade?: string;
    nutriments?: any;
    quantity?: string;
    ingredients_text?: string;
  };
  status: number;
  status_verbose: string;
}

export const fetchProductByBarcode = async (
  barcode: string,
): Promise<OpenFoodFactsProduct | null> => {
  try {
    const response = await fetch(`${API_BASE}/barcode/${barcode}`);
    const data = await response.json();
    if (data.status === 1) return data;
    return null;
  } catch (error) {
    console.error("Error fetching from OpenFoodFacts:", error);
    return null;
  }
};

export const searchProducts = async (
  query: string,
  type: "name" | "category" = "name",
): Promise<any[]> => {
  try {
    const response = await fetch(
      `${API_BASE}/search?q=${encodeURIComponent(query)}&type=${type}`,
    );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error searching OpenFoodFacts:", error);
    return [];
  }
};
