import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types";
import { authAPI, API_BASE_URL } from "./api";

export const login = async (
  email: string,
  password: string,
): Promise<User | null> => {
  try {
    const { user, token, refreshToken } = await authAPI.login(email, password);
    if (refreshToken) {
      await AsyncStorage.setItem("refreshToken", refreshToken);
    }
    return user;
  } catch (error) {
    return null;
  }
};

export const register = async (
  name: string,
  email: string,
  phone: string,
  password: string,
): Promise<User | null> => {
  try {
    const { user, token, refreshToken } = await authAPI.register(
      name,
      email,
      phone,
      password,
    );
    if (refreshToken) {
      await AsyncStorage.setItem("refreshToken", refreshToken);
    }
    return user;
  } catch (error) {
    return null;
  }
};

export const logout = async (): Promise<void> => {
  try {
    const refreshToken = await AsyncStorage.getItem("refreshToken");
    if (refreshToken) {
      const baseUrl = API_BASE_URL.replace("/api", "");
      await fetch(`${baseUrl}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    await AsyncStorage.multiRemove(["user", "cart", "token", "refreshToken"]);
  } catch (error) {
    console.error("Logout error:", error);
  }
};

export const refreshAccessToken = async (): Promise<string | null> => {
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
  } catch (error) {
    return null;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userStr = await AsyncStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    return null;
  }
};
