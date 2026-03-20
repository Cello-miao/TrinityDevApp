import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { NativeModules, Platform } from "react-native";
import { Order, Product, User } from "../types";

const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const hostFromExpo = hostUri?.split(":")[0];
  if (hostFromExpo) {
    return `http://${hostFromExpo}:3000/api`;
  }

  const scriptURL = NativeModules.SourceCode?.scriptURL as string | undefined;
  const hostMatch = scriptURL?.match(/^(?:https?|exp):\/\/([^/:]+)(?::\d+)?/);

  if (hostMatch?.[1]) {
    return `http://${hostMatch[1]}:3000/api`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000/api";
  }

  return "http://localhost:3000/api";
};

const API_BASE_URL = getApiBaseUrl();

const transformProduct = (dbProduct: any): Product => {
  return {
    id: dbProduct.id?.toString() || "",
    name: dbProduct.name || "",
    price: parseFloat(dbProduct.price) || 0,
    category: dbProduct.category || "",
    image: dbProduct.picture || dbProduct.image || "",
    description: dbProduct.description || "",
    barcode: dbProduct.barcode || "",
    stock: dbProduct.quantity || 0,
    discount: parseFloat(dbProduct.discount_percentage) || 0,
    brand: dbProduct.brand || dbProduct.brands || "",
    nutritionalInfo: dbProduct.nutritional_info || dbProduct.nutritionalInfo || null,
  };
};

const transformUser = (dbUser: any): User => {
  return {
    id: dbUser.id?.toString() || "",
    username: dbUser.username || "",
    name:
      dbUser.username ||
      `${dbUser.first_name || ""} ${dbUser.last_name || ""}`.trim(),
    email: dbUser.email || "",
    phone: dbUser.phone_number || "",
    phone_number: dbUser.phone_number || "",
    first_name: dbUser.first_name || "",
    last_name: dbUser.last_name || "",
    billing_address: dbUser.billing_address || "",
    billing_zip_code: dbUser.billing_zip_code || "",
    billing_city: dbUser.billing_city || "",
    billing_country: dbUser.billing_country || "",
    role: dbUser.role === "admin" ? "admin" : "user",
  };
};

const transformOrder = (dbOrder: any): Order => {
  const items = Array.isArray(dbOrder.items)
    ? dbOrder.items.map((item: any) => ({
        quantity: Number(item.quantity) || 0,
        product: {
          id: item.product_id?.toString() || "",
          name: item.product_name || "Unknown Product",
          price: parseFloat(item.unit_price) || 0,
          category: "",
          image: item.product_picture || "",
          description: "",
          stock: 0,
        },
      }))
    : [];

  return {
    id: dbOrder.order_number || dbOrder.id?.toString() || "",
    userId: dbOrder.user_id?.toString() || "",
    items,
    total: parseFloat(dbOrder.total_amount) || 0,
    status: dbOrder.status || "completed",
    createdAt: dbOrder.created_at || new Date().toISOString(),
    deliveryAddress: dbOrder.delivery_address || "",
    paymentMethod: dbOrder.payment_method || "N/A",
    customerName: dbOrder.customer_name || "",
    customerEmail: dbOrder.customer_email || "",
  };
};

// Internal refresh function to avoid circular dependency
const refreshTokenRequest = async (): Promise<string | null> => {
  try {
    const refreshToken = await AsyncStorage.getItem("refreshToken");
    if (!refreshToken) return null;

    const baseUrl = API_BASE_URL.replace("/api", "");
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      await AsyncStorage.multiRemove(["user", "cart", "token", "refreshToken"]);
      return null;
    }

    const data = await response.json();
    await AsyncStorage.setItem("token", data.token);
    await AsyncStorage.setItem("refreshToken", data.refreshToken);
    return data.token;
  } catch {
    return null;
  }
};

const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
): Promise<any> => {
  try {
    const token = await AsyncStorage.getItem("token");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    // Token expired — try to refresh
    if (response.status === 401) {
      const newToken = await refreshTokenRequest();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        const retryResponse = await fetch(url, { ...options, headers });
        const retryData = await retryResponse.json();
        if (!retryResponse.ok) {
          throw new Error(
            retryData.message ||
              `API request failed with status ${retryResponse.status}`,
          );
        }
        return retryData;
      }
    }

    if (!response.ok) {
      throw new Error(
        data.message || `API request failed with status ${response.status}`,
      );
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Authentication API
export const authAPI = {
  login: async (
    email: string,
    password: string,
  ): Promise<{ token: string; refreshToken: string; user: User }> => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (data.token) {
      await AsyncStorage.setItem("token", data.token);
      if (data.refreshToken) {
        await AsyncStorage.setItem("refreshToken", data.refreshToken);
      }

      let user: User;
      try {
        const profileData = await apiRequest("/users/profile", {
          method: "GET",
        });
        user = transformUser(profileData);
      } catch {
        user = { id: "temp", name: email.split("@")[0], email, role: "user" };
      }

      await AsyncStorage.setItem("user", JSON.stringify(user));
      return { token: data.token, refreshToken: data.refreshToken, user };
    }

    throw new Error("Login failed");
  },

  register: async (
    name: string,
    email: string,
    phone: string,
    password: string,
  ): Promise<{ token: string; refreshToken: string; user: User }> => {
    const requestBody = {
      username: email.split("@")[0],
      email,
      phone_number: phone,
      password,
      first_name: name.split(" ")[0] || name,
      last_name: name.split(" ")[1] || "",
    };

    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    if (data.user) {
      const loginData = await authAPI.login(email, password);
      return loginData;
    }

    throw new Error(data.message || "Registration failed");
  },
};

export const productAPI = {
  getAllProducts: async (): Promise<Product[]> => {
    const data = await apiRequest("/products", { method: "GET" });
    return data.map(transformProduct);
  },

  getProductById: async (id: string): Promise<Product> => {
    const data = await apiRequest(`/products/${id}`, { method: "GET" });
    return transformProduct(data);
  },

  createProduct: async (product: Partial<Product>): Promise<Product> => {
    const dbProduct = {
      name: product.name,
      price: product.price,
      description: product.description,
      brand: product.brand,
      picture: product.image,
      category: product.category,
      barcode: product.barcode,
      nutritional_info: product.nutritionalInfo,
      quantity: product.stock,
      discount_percentage: product.discount || 0,
    };
    const data = await apiRequest("/products", {
      method: "POST",
      body: JSON.stringify(dbProduct),
    });
    return transformProduct(data);
  },

  updateProduct: async (
    id: string,
    product: Partial<Product>,
  ): Promise<Product> => {
    const dbProduct = {
      name: product.name,
      price: product.price,
      description: product.description,
      brand: product.brand,
      picture: product.image,
      category: product.category,
      barcode: product.barcode,
      nutritional_info: product.nutritionalInfo,
      quantity: product.stock,
      discount_percentage: product.discount || 0,
    };
    const data = await apiRequest(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(dbProduct),
    });
    return transformProduct(data);
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiRequest(`/products/${id}`, { method: "DELETE" });
  },

  getRecommendations: async (limit: number = 6): Promise<Product[]> => {
    const data = await apiRequest(`/products/recommendations?limit=${limit}`, {
      method: "GET",
    });
    return data.map(transformProduct);
  },

  getDiscountedProducts: async (): Promise<Product[]> => {
    const data = await apiRequest("/products/discounted/list", {
      method: "GET",
    });
    return data.map(transformProduct);
  },
};

export const cartAPI = {
  getCart: async (): Promise<any> => {
    const data = await apiRequest("/cart", { method: "GET" });
    return data;
  },

  addToCart: async (productId: string, quantity: number): Promise<any> => {
    const productIdNum = Number(productId);
    const data = await apiRequest("/cart/add", {
      method: "POST",
      body: JSON.stringify({ product_id: productIdNum, quantity }),
    });
    return data;
  },

  updateCartItem: async (
    cartItemId: string,
    quantity: number,
  ): Promise<any> => {
    const data = await apiRequest(`/cart/update/${cartItemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
    return data;
  },

  removeFromCart: async (cartItemId: string): Promise<void> => {
    await apiRequest(`/cart/remove/${cartItemId}`, { method: "DELETE" });
  },

  clearCart: async (): Promise<void> => {
    await apiRequest("/cart/clear", { method: "DELETE" });
  },
};

export const orderAPI = {
  createOrder: async (payload: {
    items: Array<{ product_id: number; quantity: number }>;
    payment_method: string;
    delivery_address?: string;
    customer_name?: string;
    customer_email?: string;
    shipping_fee?: number;
    tax_rate?: number;
    tax_amount?: number;
    notes?: string;
  }): Promise<any> => {
    return apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getMyOrders: async (): Promise<Order[]> => {
    const data = await apiRequest("/orders/me", { method: "GET" });
    if (!Array.isArray(data)) return [];
    return data.map(transformOrder);
  },

  getAllOrders: async (): Promise<Order[]> => {
    const data = await apiRequest("/orders", { method: "GET" });
    if (!Array.isArray(data)) return [];
    return data.map(transformOrder);
  },
};

export const scannerAPI = {
  lookupByBarcode: async (barcode: string): Promise<Product> => {
    const data = await apiRequest("/scanner/lookup", {
      method: "POST",
      body: JSON.stringify({ barcode }),
    });
    return transformProduct(data.product);
  },
};

// User API
export const userAPI = {
  getProfile: async (): Promise<User> => {
    const data = await apiRequest("/users/profile", { method: "GET" });
    return transformUser(data);
  },

  updateProfile: async (userData: any): Promise<User> => {
    const data = await apiRequest("/users/profile", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
    return transformUser(data);
  },

  getAllUsers: async (): Promise<User[]> => {
    const data = await apiRequest("/users", { method: "GET" });
    return data.map(transformUser);
  },

  getUserById: async (id: string): Promise<User> => {
    const data = await apiRequest(`/users/${id}`, { method: "GET" });
    return transformUser(data);
  },

  updateUserRole: async (id: string, role: string): Promise<User> => {
    const data = await apiRequest(`/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
    return transformUser(data);
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiRequest(`/users/${id}`, { method: "DELETE" });
  },
};

export { API_BASE_URL };
