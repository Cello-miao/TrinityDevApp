import React, { useState } from 'react';
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
import { Product } from '../types';
import { addToCart } from '../lib/cartUtils';

export default function ProductDetailScreen({ route, navigation }: any) {
  const { product } = route.params as { product: Product };
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = async () => {
    try {
      await addToCart(product, quantity);
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
        <Image source={{ uri: product.image }} style={styles.image} />
        
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
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#f1f5f9',
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
