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

export const fetchProductByBarcode = async (barcode: string): Promise<OpenFoodFactsProduct | null> => {
  try {
    const fields = 'code,product_name,brands,image_url,categories,nutriscore_grade,nutriments,quantity,ingredients_text';
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${fields}`, {
      headers: {
        'User-Agent': 'TrinityApp - React Native - Version 1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.status === 1) {
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching from OpenFoodFacts:', error);
    return null;
  }
};

export const searchProducts = async (query: string, type: 'name' | 'category' = 'name'): Promise<any[]> => {
  try {
    let url = '';
    // 只请求我们需要的字段，这会极大地减少返回的数据量并加快响应速度
    const fields = 'code,product_name,brands,image_url,categories,nutriscore_grade,nutriments,quantity,ingredients_text';
    
    if (type === 'name') {
      url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=${fields}`;
    } else {
      url = `https://world.openfoodfacts.org/category/${encodeURIComponent(query)}.json?page_size=20&fields=${fields}`;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TrinityApp - React Native - Version 1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn('OpenFoodFacts API error:', response.status, text.substring(0, 200));
      return [];
    }

    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.warn('OpenFoodFacts API returned invalid JSON:', text.substring(0, 200));
      return [];
    }
    
    if (data.products && data.products.length > 0) {
      return data.products;
    }
    return [];
  } catch (error) {
    console.error('Error searching OpenFoodFacts:', error);
    return [];
  }
};
