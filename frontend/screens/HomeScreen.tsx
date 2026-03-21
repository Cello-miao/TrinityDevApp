import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ImageBackground,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product } from "../types";
import { productAPI, cartAPI } from "../lib/api";
import { useTheme } from "../lib/theme";

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [products, setProducts] = useState<Product[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Guest");
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [cartItemIds, setCartItemIds] = useState<Record<string, string>>({});
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<
    { id: string; title: string; message: string; type: string }[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        await loadProducts();
        await loadUserName();
        await loadCart();
      };
      load();
    }, []),
  );

  useEffect(() => {
    if (products.length > 0) {
      if (recommendedProducts.length === 0) loadRecommendations();
      generateDynamicCategories();
      generateNotifications();
    }
  }, [products]);

  const generateNotifications = () => {
    const notifs: {
      id: string;
      title: string;
      message: string;
      type: string;
    }[] = [];

    const discounted = products.filter((p) => Number(p.discount) > 0);
    if (discounted.length > 0) {
      notifs.push({
        id: "promo1",
        title: "Special Offers Available",
        message: `${discounted.length} product${discounted.length > 1 ? "s" : ""} on sale right now. Don't miss out!`,
        type: "promo",
      });
    }

    const lowStock = products.filter((p) => p.stock > 0 && p.stock < 10);
    if (lowStock.length > 0) {
      notifs.push({
        id: "stock1",
        title: "Limited Stock Alert",
        message: `${lowStock.length} item${lowStock.length > 1 ? "s" : ""} running low. Order before they sell out!`,
        type: "stock",
      });
    }

    notifs.push({
      id: "welcome1",
      title: "Welcome to FreshCart",
      message:
        "Scan products, shop smart, and enjoy fresh groceries delivered to you.",
      type: "info",
    });

    setNotifications(notifs);
    setUnreadCount(notifs.length);
  };

  const generateDynamicCategories = () => {
    const CATEGORY_META: Record<string, { emoji: string; image: string }> = {
      "Fresh Produce": {
        emoji: "🥕",
        image:
          "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300",
      },
      Bakery: {
        emoji: "🥖",
        image:
          "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300",
      },
      "Dairy & Eggs": {
        emoji: "🧀",
        image:
          "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300",
      },
      "Meat & Seafood": {
        emoji: "🥩",
        image:
          "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300",
      },
      Beverages: {
        emoji: "☕",
        image:
          "https://images.unsplash.com/photo-1546171753-97d7676e4602?w=300",
      },
      Snacks: {
        emoji: "🍿",
        image:
          "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300",
      },
      "Health & Beauty": {
        emoji: "💄",
        image:
          "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=300",
      },
      Household: {
        emoji: "🧹",
        image:
          "https://images.unsplash.com/photo-1584820927498-cafe5c152964?w=300",
      },
      Frozen: {
        emoji: "🧊",
        image:
          "https://images.unsplash.com/photo-1588964895597-cfccd6e2a009?w=300",
      },
      Pantry: {
        emoji: "🥫",
        image:
          "https://images.unsplash.com/photo-1606859191214-25806e8e2423?w=300",
      },
      Chocolates: {
        emoji: "🍫",
        image:
          "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300",
      },
      Spreads: {
        emoji: "🍯",
        image:
          "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300",
      },
      Breakfast: {
        emoji: "🥣",
        image:
          "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=300",
      },
      Groceries: {
        emoji: "🛒",
        image:
          "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300",
      },
    };

    const categoryMap = new Map();
    products.forEach((p) => {
      if (p.category && !categoryMap.has(p.category)) {
        const meta = CATEGORY_META[p.category] || {
          emoji: "📦",
          image:
            p.image ||
            "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300",
        };
        categoryMap.set(p.category, { name: p.category, ...meta });
      }
    });

    setDynamicCategories(Array.from(categoryMap.values()));
  };

  const loadUserName = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name || user.email?.split("@")[0] || "Guest");
      }
    } catch {}
  };

  const loadCart = async () => {
    try {
      const cartData = await cartAPI.getCart();
      const cartMap: Record<string, number> = {};
      const cartIds: Record<string, string> = {};

      if (Array.isArray(cartData)) {
        cartData.forEach((item: any) => {
          const productId = item.product_id?.toString();
          const cartItemId = item.id?.toString();
          if (productId && cartItemId) {
            cartMap[productId] =
              (cartMap[productId] || 0) + (item.quantity || 0);
            cartIds[productId] = cartItemId;
          }
        });
      }

      setCartItems(cartMap);
      setCartItemIds(cartIds);
    } catch {
      setCartItems({});
      setCartItemIds({});
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productAPI.getAllProducts();
      setProducts(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const refreshRecommendations = async () => {
    setIsLoadingRecommendations(true);
    await loadRecommendations();
    setIsLoadingRecommendations(false);
  };

  const loadRecommendations = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        try {
          const recommendations = await productAPI.getRecommendations(6);
          setRecommendedProducts(recommendations);
          return;
        } catch {}
      }

      const ordersStr = await AsyncStorage.getItem("orders");
      if (ordersStr) {
        const orders = JSON.parse(ordersStr);
        const purchasedCategories = new Set<string>();
        const purchasedProductIds = new Set<string>();

        orders.forEach((order: any) => {
          order.items?.forEach((item: any) => {
            if (item.product) {
              purchasedCategories.add(item.product.category);
              purchasedProductIds.add(item.product.id);
            }
          });
        });

        const recommendations = products.filter(
          (product) =>
            purchasedCategories.has(product.category) &&
            !purchasedProductIds.has(product.id),
        );

        if (recommendations.length < 6) {
          const popularProducts = products
            .filter((p) => !purchasedProductIds.has(p.id))
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 6 - recommendations.length);
          setRecommendedProducts(
            [...recommendations, ...popularProducts].slice(0, 6),
          );
        } else {
          setRecommendedProducts(recommendations.slice(0, 6));
        }
      } else {
        setRecommendedProducts(
          products.sort((a, b) => a.stock - b.stock).slice(0, 6),
        );
      }
    } catch {
      setRecommendedProducts(products.slice(0, 6));
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await cartAPI.addToCart(product.id, 1);
      await loadCart();
    } catch {}
  };

  const handleDecreaseQuantity = async (product: Product) => {
    try {
      const currentQuantity = cartItems[product.id] || 0;
      const cartItemId = cartItemIds[product.id];
      if (currentQuantity <= 1) {
        if (cartItemId) await cartAPI.removeFromCart(cartItemId);
      } else {
        if (cartItemId)
          await cartAPI.updateCartItem(cartItemId, currentQuantity - 1);
      }
      await loadCart();
    } catch {}
  };

  const getNotifIcon = (type: string) => {
    if (type === "promo") return { name: "pricetag", color: "#ef4444" };
    if (type === "stock") return { name: "alert-circle", color: "#f59e0b" };
    return { name: "information-circle", color: theme.primary };
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Ionicons name="person-circle-outline" size={20} color="#64748b" />
            <Text style={styles.greeting}>Hello, {userName}</Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => {
              setShowNotifications(true);
              setUnreadCount(0);
            }}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={theme.text}
            />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate("Scanner")}
            accessibilityRole="button"
            accessibilityLabel="Scan a product"
          >
            <View style={[styles.quickIcon, { backgroundColor: theme.border }]}>
              <Ionicons name="scan-outline" size={24} color={theme.primaryDark} />
            </View>
            <Text style={styles.quickLabel}>Scan Product</Text>
            <Text style={styles.quickHint}>Find a product instantly by barcode</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
    
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("PromoProducts")}
          >
            <ImageBackground
              source={{
                uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
              }}
              style={styles.mainPromo}
              imageStyle={{ borderRadius: 12 }}
            >
              <View style={styles.promoOverlay}>
                <Text style={styles.promoTitle}>Promotional Products</Text>
                <Text style={styles.promoDescription}>
                  Tap to view discounted items
                </Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderWithAction}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Search")}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.categoriesGrid}>
            {dynamicCategories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryCard}
                onPress={() =>
                  navigation.navigate("CategoryProducts", { category })
                }
              >
                <ImageBackground
                  source={{ uri: category.image }}
                  style={styles.categoryImage}
                  imageStyle={{ borderRadius: 12 }}
                >
                  <View style={styles.categoryOverlay}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderWithAction}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended for You</Text>
            </View>
            <TouchableOpacity
              onPress={refreshRecommendations}
              disabled={isLoadingRecommendations}
            >
              <Ionicons
                name="refresh"
                size={20}
                color={isLoadingRecommendations ? "#cbd5e1" : "#64748b"}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.productsGrid}>
            {recommendedProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() =>
                  navigation.navigate("ProductDetail", { product })
                }
              >
                {product.stock < 20 && (
                  <View style={styles.hotBadge}>
                    <Text style={styles.hotBadgeText}>Hot</Text>
                  </View>
                )}
                {Number(product.discount) > 0 && (
                  <View style={styles.discountBadge}>
                    <Ionicons name="flash" size={10} color="#fff" />
                    <Text
                      style={styles.discountBadgeText}
                    >{`${Math.round(product.discount || 0)}%`}</Text>
                  </View>
                )}
                <Image
                  source={{ uri: product.image }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productVendor}>Farm Direct</Text>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <View style={styles.productFooter}>
                    <View style={styles.priceBlock}>
                      {Number(product.discount) > 0 ? (
                        <>
                          <Text style={styles.originalPrice}>
                            €{product.price.toFixed(2)}
                          </Text>
                          <Text style={styles.productPrice}>
                            €
                            {(
                              product.price *
                              (1 - (product.discount || 0) / 100)
                            ).toFixed(2)}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text
                            style={[
                              styles.originalPrice,
                              styles.originalPricePlaceholder,
                            ]}
                          >
                            €0.00
                          </Text>
                          <Text style={styles.productPrice}>
                            €{product.price.toFixed(2)}
                          </Text>
                        </>
                      )}
                      <Text style={styles.stockText}>
                        Stock {product.stock}
                      </Text>
                    </View>
                    {cartItems[product.id] ? (
                      <View style={styles.quantityControl}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleDecreaseQuantity(product)}
                        >
                          <Ionicons
                            name="remove"
                            size={16}
                            color={theme.text}
                          />
                        </TouchableOpacity>
                        <View style={styles.quantityDisplay}>
                          <Text style={styles.quantityText}>
                            {cartItems[product.id]}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleAddToCart(product)}
                        >
                          <Ionicons name="add" size={16} color={theme.text} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addToCartButton}
                        onPress={() => handleAddToCart(product)}
                      >
                        <Ionicons name="add" size={20} color={theme.text} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowNotifications(false)}
        >
          <View style={styles.notifPanel}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>
            {notifications.length === 0 ? (
              <View style={styles.notifEmpty}>
                <Ionicons
                  name="notifications-off-outline"
                  size={40}
                  color={theme.textTertiary}
                />
                <Text style={styles.notifEmptyText}>No notifications</Text>
              </View>
            ) : (
              notifications.map((notif) => {
                const icon = getNotifIcon(notif.type);
                return (
                  <TouchableOpacity
                    key={notif.id}
                    style={styles.notifItem}
                    onPress={() => {
                      setShowNotifications(false);
                      if (notif.type === "promo" || notif.type === "stock") {
                        navigation.navigate("PromoProducts");
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.notifIconWrap,
                        { backgroundColor: icon.color + "20" },
                      ]}
                    >
                      <Ionicons
                        name={icon.name as any}
                        size={20}
                        color={icon.color}
                      />
                    </View>
                    <View style={styles.notifContent}>
                      <Text style={styles.notifItemTitle}>{notif.title}</Text>
                      <Text style={styles.notifItemMessage}>
                        {notif.message}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={theme.textTertiary}
                    />
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
      backgroundColor: theme.headerBackground,
      paddingHorizontal: 16,
      paddingTop: Platform.OS === "ios" ? 56 : 40,
      paddingBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    greetingContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
    greeting: { fontSize: 16, color: theme.text, fontWeight: "400" },
    bellButton: { padding: 4 },
    bellBadge: {
      position: "absolute",
      top: 0,
      right: 0,
      backgroundColor: "#ef4444",
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    bellBadgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
    quickActions: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    quickBtn: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 9,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
    quickIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    quickLabel: {
      fontSize: 15,
      color: theme.text,
      fontWeight: "700",
    },
    quickHint: {
      fontSize: 12,
      color: theme.textSecondary,
      flex: 1,
    },
    section: { marginTop: 24, paddingHorizontal: 16 },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      gap: 6,
    },
    sectionHeaderWithAction: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionTitle: { fontSize: 18, fontWeight: "700", color: theme.text },
    viewAllText: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: "500",
    },
    mainPromo: {
      height: 160,
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 12,
    },
    promoOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      padding: 20,
      justifyContent: "center",
    },
    promoTitle: {
      color: "#fff",
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 4,
    },
    promoDescription: { color: "#e2e8f0", fontSize: 14 },
    categoriesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    categoryCard: { width: (width - 44) / 2, aspectRatio: 0.95 },
    categoryImage: { flex: 1, justifyContent: "flex-end" },
    categoryOverlay: {
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      padding: 10,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
    },
    categoryName: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
    },
    productsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginHorizontal: -4,
    },
    productCard: {
      width: (width - 44) / 2,
      backgroundColor: theme.card,
      borderRadius: 12,
      overflow: "hidden",
      position: "relative",
    },
    hotBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      backgroundColor: theme.badgeBackground,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 4,
      zIndex: 10,
    },
    hotBadgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
    discountBadge: {
      position: "absolute",
      top: 8,
      left: 8,
      backgroundColor: "#f59e0b",
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    discountBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
    productImage: {
      width: "100%",
      height: 140,
      backgroundColor: theme.inputBackground,
    },
    productInfo: { padding: 12 },
    productVendor: {
      fontSize: 11,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    productName: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 8,
    },
    productFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    priceBlock: { minHeight: 48, justifyContent: "flex-end" },
    productPrice: { fontSize: 16, fontWeight: "bold", color: theme.priceText },
    originalPrice: {
      fontSize: 12,
      color: theme.textTertiary,
      textDecorationLine: "line-through",
      marginBottom: 2,
    },
    originalPricePlaceholder: { opacity: 0 },
    stockText: { fontSize: 10, color: theme.textTertiary, marginTop: 2 },
    addToCartButton: {
      backgroundColor: theme.searchBackground,
      borderWidth: 1,
      borderColor: theme.border,
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    quantityControl: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.searchBackground,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 18,
      paddingHorizontal: 4,
      gap: 4,
    },
    quantityButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    quantityDisplay: {
      minWidth: 24,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    quantityText: { color: theme.text, fontSize: 14, fontWeight: "bold" },
    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
    notifPanel: {
      position: "absolute",
      top: Platform.OS === "ios" ? 100 : 80,
      right: 16,
      left: 16,
      backgroundColor: theme.card,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      overflow: "hidden",
    },
    notifHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    notifTitle: { fontSize: 16, fontWeight: "700", color: theme.text },
    notifEmpty: { alignItems: "center", padding: 32, gap: 8 },
    notifEmptyText: { fontSize: 14, color: theme.textTertiary },
    notifItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      gap: 12,
    },
    notifIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    notifContent: { flex: 1 },
    notifItemTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 2,
    },
    notifItemMessage: {
      fontSize: 12,
      color: theme.textSecondary,
      lineHeight: 16,
    },
  });
