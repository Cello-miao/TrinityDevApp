import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Product } from '../types';
import { addToCart } from '../lib/cartUtils';
import { favoritesAPI } from '../lib/api';
import { useTheme } from '../lib/theme';

const { width } = Dimensions.get('window');

export default function FavoritesScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [favorites, setFavorites] = useState<Product[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (token) {
        // User is logged in, load from backend
        try {
          const favs = await favoritesAPI.getFavorites();
          setFavorites(favs);
          return;
        } catch (error) {
          console.log('Failed to load backend favorites, using local storage:', error);
        }
      }

      // Fallback to local storage for guests or if backend fails
      const favoritesStr = await AsyncStorage.getItem('favorites');
      if (favoritesStr) {
        setFavorites(JSON.parse(favoritesStr));
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product, 1);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    }
  };

  const removeFavorite = async (product: Product) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (token) {
        // User is logged in, remove from backend
        try {
          await favoritesAPI.removeFavorite(product.id);
          const newFavorites = favorites.filter(p => p.id !== product.id);
          setFavorites(newFavorites);
          return;
        } catch (error) {
          console.log('Failed to remove from backend, using local storage:', error);
        }
      }

      // Fallback to local storage for guests or if backend fails
      const newFavorites = favorites.filter(p => p.id !== product.id);
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <View style={{ width: 24 }} />
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyText}>No favorites yet</Text>
          <Text style={styles.emptySubtext}>Items you favorite will appear here</Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.countContainer}>
            <Text style={styles.countText}>{favorites.length} items</Text>
          </View>

          <View style={styles.productsGrid}>
            {favorites.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => navigation.navigate('ProductDetail', { product })}
              >
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    removeFavorite(product);
                  }}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
                
                <Image
                  source={{ uri: product.image }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <View style={styles.productFooter}>
                    <View>
                      <Text style={styles.productPrice}>€{product.price.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.addToCartButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      <Ionicons name="add" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  shopButton: {
    marginTop: 24,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: theme.primaryDark,
    fontSize: 16,
    fontWeight: '600',
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  countText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    gap: 12,
  },
  productCard: {
    width: (width - 44) / 2,
    backgroundColor: theme.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 4,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  productImage: {
    width: '100%',
    height: 160,
    backgroundColor: theme.inputBackground,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
    minHeight: 36,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
  },
  addToCartButton: {
    backgroundColor: theme.primaryDark,
    padding: 6,
    borderRadius: 6,
  },
});
