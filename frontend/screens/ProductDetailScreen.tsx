import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';
import { cartAPI } from '../lib/api';

export default function ProductDetailScreen({ route, navigation }: any) {
  const { product } = route.params as { product: Product };
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    checkFavoriteStatus();
  }, []);

  const checkFavoriteStatus = async () => {
    try {
      const favoritesStr = await AsyncStorage.getItem('favorites');
      if (favoritesStr) {
        const favorites = JSON.parse(favoritesStr);
        setIsFavorite(favorites.some((p: Product) => p.id === product.id));
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const favoritesStr = await AsyncStorage.getItem('favorites');
      let favorites = favoritesStr ? JSON.parse(favoritesStr) : [];
      
      if (isFavorite) {
        favorites = favorites.filter((p: Product) => p.id !== product.id);
      } else {
        favorites.push(product);
      }
      
      await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleAddToCart = async () => {
    try {
      await cartAPI.addToCart(product.id, quantity);
      Alert.alert('Success', 'Added to cart', [
        { text: 'Continue Shopping', onPress: () => navigation.goBack() },
        { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add to cart');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.image} />
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={toggleFavorite}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={28} 
              color={isFavorite ? "#ef4444" : "#1e293b"} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.category}>{product.category}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>€{product.price.toFixed(2)}</Text>
            {product.discount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{product.discount}%</Text>
              </View>
            )}
          </View>

          <View style={styles.stockContainer}>
            <Ionicons
              name={product.stock > 0 ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={product.stock > 0 ? '#22c55e' : '#ef4444'}
            />
            <Text style={[
              styles.stockText,
              { color: product.stock > 0 ? '#22c55e' : '#ef4444' }
            ]}>
              {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Product Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          {product.brand && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Brand:</Text>
              <Text style={styles.infoValue}>{product.brand}</Text>
            </View>
          )}

          {product.nutritionalInfo && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Nutritional Information</Text>
              {product.nutritionalInfo.nutriscore_grade && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nutri-Score:</Text>
                  <Text style={[styles.infoValue, { textTransform: 'uppercase', fontWeight: 'bold' }]}>
                    {product.nutritionalInfo.nutriscore_grade}
                  </Text>
                </View>
              )}
              {product.nutritionalInfo.energy_100g && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Energy (100g):</Text>
                  <Text style={styles.infoValue}>{product.nutritionalInfo.energy_100g} kcal</Text>
                </View>
              )}
            </>
          )}

          {product.barcode && (
            <>
              <View style={styles.divider} />
              <View style={styles.barcodeContainer}>
                <Ionicons name="barcode-outline" size={20} color="#64748b" />
                <Text style={styles.barcode}>Barcode: {product.barcode}</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Ionicons name="remove" size={20} color="#475569" />
          </TouchableOpacity>
          <Text style={styles.quantity}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
          >
            <Ionicons name="add" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.addButton, product.stock === 0 && styles.addButtonDisabled]}
          onPress={handleAddToCart}
          disabled={product.stock === 0}
        >
          <Ionicons name="cart" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#f1f5f9',
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  category: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#475569',
    marginRight: 12,
  },
  discountBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stockText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barcode: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
    gap: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    paddingHorizontal: 16,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#475569',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
