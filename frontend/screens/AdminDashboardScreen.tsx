import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Product } from '../types';
import { productAPI } from '../lib/api';
import { fetchProductByBarcode, searchProducts } from '../lib/openfoodfacts';
import { useTheme } from '../lib/theme';

export default function AdminDashboardScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Import Modal State
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importQuery, setImportQuery] = useState('');
  const [importType, setImportType] = useState<'name' | 'category'>('name');
  const [importResults, setImportResults] = useState<any[]>([]);
  const [isSearchingImport, setIsSearchingImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Add Product Modal State
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isFetchingBarcode, setIsFetchingBarcode] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    category: 'produce',
    barcode: '',
    image: '',
    stock: '100',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productAPI.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (product: Product) => {
    setEditingProductId(product.id);
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      category: product.category,
      barcode: product.barcode || '',
      image: product.image || '',
      stock: product.stock.toString(),
    });
    setIsAddModalVisible(true);
  };

  const handleDelete = async (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete ${product.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await productAPI.deleteProduct(product.id);
              Alert.alert('Success', 'Product deleted successfully');
              loadProducts(); // Reload products
            } catch (error) {
              console.error('Failed to delete product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const getCategoryName = (category: string) => {
    if (!category) return 'Uncategorized';
    
    const categories: { [key: string]: string } = {
      'produce': 'Fresh Produce',
      'bakery': 'Bakery',
      'dairy': 'Dairy & Eggs',
      'meat': 'Meat & Seafood',
    };
    
    // If it's a known short code, return the mapped name
    if (categories[category.toLowerCase()]) {
      return categories[category.toLowerCase()];
    }
    
    // Otherwise, just return the category string as is (useful for OpenFoodFacts categories)
    return category;
  };

  const handleFetchBarcode = async () => {
    if (!newProduct.barcode) {
      Alert.alert('Error', 'Please enter a barcode first');
      return;
    }

    setIsFetchingBarcode(true);
    try {
      const data = await fetchProductByBarcode(newProduct.barcode);
      if (data && data.product) {
        setNewProduct(prev => {
          // Extract the first category from the comma-separated list if available
          let fetchedCategory = prev.category;
          if (data.product.categories) {
            const categoriesList = data.product.categories.split(',');
            if (categoriesList.length > 0) {
              fetchedCategory = categoriesList[0].trim();
            }
          }

          return {
            ...prev,
            name: data.product.product_name || prev.name,
            image: data.product.image_url || prev.image,
            description: data.product.ingredients_text || prev.description,
            category: fetchedCategory,
          };
        });
        Alert.alert('Success', 'Product data fetched from OpenFoodFacts');
      } else {
        Alert.alert('Not Found', 'Product not found in OpenFoodFacts database');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch product data');
    } finally {
      setIsFetchingBarcode(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'You need to allow access to your photos to upload an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setNewProduct({ ...newProduct, image: base64Image });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      Alert.alert('Error', 'Name and price are required');
      return;
    }

    setIsSavingProduct(true);
    try {
      const productData = {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        description: newProduct.description,
        category: newProduct.category,
        barcode: newProduct.barcode,
        image: newProduct.image || 'https://via.placeholder.com/150',
        stock: parseInt(newProduct.stock) || 0,
      };

      if (editingProductId) {
        await productAPI.updateProduct(editingProductId, productData);
        Alert.alert('Success', 'Product updated successfully');
      } else {
        await productAPI.createProduct(productData);
        Alert.alert('Success', 'Product added successfully');
      }
      
      setIsAddModalVisible(false);
      setEditingProductId(null);
      setNewProduct({
        name: '',
        price: '',
        description: '',
        category: 'produce',
        barcode: '',
        image: '',
        stock: '100',
      });
      loadProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
      Alert.alert('Error', 'Failed to save product');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleSearchImport = async () => {
    if (!importQuery) {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }

    setIsSearchingImport(true);
    try {
      const results = await searchProducts(importQuery, importType);
      setImportResults(results);
      if (results.length === 0) {
        Alert.alert('Not Found', 'No products found matching your query');
      }
    } catch (error) {
      console.error('Failed to search products:', error);
      Alert.alert('Error', 'Failed to search products');
    } finally {
      setIsSearchingImport(false);
    }
  };

  const handleImportProduct = async (product: any) => {
    setIsImporting(true);
    try {
      let fetchedCategory = 'produce';
      if (product.categories) {
        const categoriesList = product.categories.split(',');
        if (categoriesList.length > 0) {
          fetchedCategory = categoriesList[0].trim();
        }
      }

      const productData = {
        name: product.product_name || 'Unknown Product',
        price: 0, // Default price, admin can edit later
        description: product.ingredients_text || '',
        category: fetchedCategory,
        barcode: product.code || '',
        image: product.image_url || 'https://via.placeholder.com/150',
        stock: 100, // Default stock
      };

      await productAPI.createProduct(productData);
      Alert.alert('Success', `${productData.name} imported successfully`);
      loadProducts();
    } catch (error) {
      console.error('Failed to import product:', error);
      Alert.alert('Error', 'Failed to import product');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.importButton}
            onPress={() => {
              setImportQuery('');
              setImportResults([]);
              setIsImportModalVisible(true);
            }}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            <Text style={styles.importButtonText}>Import</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              setEditingProductId(null);
              setNewProduct({
                name: '',
                price: '',
                description: '',
                category: 'produce',
                barcode: '',
                image: '',
                stock: '100',
              });
              setIsAddModalVisible(true);
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>

        {/* Products List */}
        {filteredProducts.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <Image
              source={{ uri: product.image || 'https://via.placeholder.com/150' }}
              style={styles.productImage}
            />
            <View style={styles.productContent}>
              <View style={styles.productHeader}>
                <View style={styles.productLeft}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{getCategoryName(product.category)}</Text>
                  </View>
                  <Text style={styles.productPrice}>€{product.price.toFixed(2)}</Text>
                  <Text style={styles.productBarcode}>
                    {product.barcode || 'No barcode'}
                  </Text>
                </View>
                <View style={styles.productRight}>
                  <Text style={styles.stockText}>Stock: {product.stock}</Text>
                </View>
              </View>
              
              <View style={styles.productActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEdit(product)}
                >
                  <Ionicons name="pencil-outline" size={16} color="#475569" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(product)}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconContainer}>
            <Ionicons name="cube" size={24} color="#475569" />
          </View>
          <Text style={styles.navText}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('AdminOrders')}
        >
          <View style={styles.navIconContainer}>
            <Ionicons name="receipt-outline" size={24} color="#94a3b8" />
          </View>
          <Text style={[styles.navText, styles.navTextInactive]}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('AdminCustomers')}
        >
          <View style={styles.navIconContainer}>
            <Ionicons name="people-outline" size={24} color="#94a3b8" />
          </View>
          <Text style={[styles.navText, styles.navTextInactive]}>Customers</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('AdminProfile')}
        >
          <View style={styles.navIconContainer}>
            <Ionicons name="person-outline" size={24} color="#94a3b8" />
          </View>
          <Text style={[styles.navText, styles.navTextInactive]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Add Product Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProductId ? 'Edit Product' : 'Add New Product'}</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <Ionicons name="close" size={24} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Barcode</Text>
                <View style={styles.barcodeInputContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="Enter barcode"
                    value={newProduct.barcode}
                    onChangeText={(text) => setNewProduct({ ...newProduct, barcode: text })}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity 
                    style={styles.fetchButton}
                    onPress={handleFetchBarcode}
                    disabled={isFetchingBarcode}
                  >
                    {isFetchingBarcode ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.fetchButtonText}>Fetch Data</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.helpText}>Fetch product details from OpenFoodFacts</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter product name"
                  value={newProduct.name}
                  onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Price (€) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={newProduct.price}
                  onChangeText={(text) => setNewProduct({ ...newProduct, price: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. produce, bakery, dairy, meat"
                  value={newProduct.category}
                  onChangeText={(text) => setNewProduct({ ...newProduct, category: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Stock Quantity</Text>
                <TextInput
                  style={styles.input}
                  placeholder="100"
                  value={newProduct.stock}
                  onChangeText={(text) => setNewProduct({ ...newProduct, stock: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Image</Text>
                <View style={styles.imageInputContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="https://... or pick local image"
                    value={newProduct.image}
                    onChangeText={(text) => setNewProduct({ ...newProduct, image: text })}
                  />
                  <TouchableOpacity 
                    style={styles.imagePickerButton}
                    onPress={pickImage}
                  >
                    <Ionicons name="image-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                {newProduct.image ? (
                  <Image 
                    source={{ uri: newProduct.image }} 
                    style={styles.imagePreview} 
                  />
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Product description or ingredients..."
                  value={newProduct.description}
                  onChangeText={(text) => setNewProduct({ ...newProduct, description: text })}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setIsAddModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveProduct}
                disabled={isSavingProduct}
              >
                {isSavingProduct ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>{editingProductId ? 'Update Product' : 'Save Product'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Import Modal */}
      <Modal
        visible={isImportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsImportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Import Products</Text>
              <TouchableOpacity onPress={() => setIsImportModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.importTypeContainer}>
              <TouchableOpacity
                style={[styles.importTypeButton, importType === 'name' && styles.importTypeButtonActive]}
                onPress={() => setImportType('name')}
              >
                <Text style={[styles.importTypeText, importType === 'name' && styles.importTypeTextActive]}>By Name</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.importTypeButton, importType === 'category' && styles.importTypeButtonActive]}
                onPress={() => setImportType('category')}
              >
                <Text style={[styles.importTypeText, importType === 'category' && styles.importTypeTextActive]}>By Category</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.importSearchContainer}>
              <TextInput
                style={styles.importSearchInput}
                placeholder={importType === 'name' ? "e.g. Nutella" : "e.g. en:chocolates"}
                value={importQuery}
                onChangeText={setImportQuery}
                onSubmitEditing={handleSearchImport}
              />
              <TouchableOpacity 
                style={styles.importSearchButton}
                onPress={handleSearchImport}
                disabled={isSearchingImport}
              >
                {isSearchingImport ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="search" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.importResultsList}>
              {importResults.map((item, index) => (
                <View key={item.code || index} style={styles.importResultItem}>
                  <Image
                    source={{ uri: item.image_url || 'https://via.placeholder.com/50' }}
                    style={styles.importResultImage}
                  />
                  <View style={styles.importResultInfo}>
                    <Text style={styles.importResultName} numberOfLines={2}>
                      {item.product_name || 'Unknown Product'}
                    </Text>
                    <Text style={styles.importResultBrand} numberOfLines={1}>
                      {item.brands || 'Unknown Brand'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.importResultButton}
                    onPress={() => handleImportProduct(item)}
                    disabled={isImporting}
                  >
                    <Ionicons name="download-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {importResults.length === 0 && !isSearchingImport && importQuery !== '' && (
                <Text style={styles.noResultsText}>No products found. Try another search.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.border,
    marginHorizontal: 16,
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.text,
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  importButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primaryDark,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primaryDark,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: theme.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: theme.inputBackground,
  },
  productContent: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productLeft: {
    flex: 1,
  },
  productRight: {
    alignItems: 'flex-end',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  productVendor: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: theme.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: '500',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  productBarcode: {
    fontSize: 13,
    color: theme.textTertiary,
  },
  stockText: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
  },
  productActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 10,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: '#fee2e2',
    paddingVertical: 10,
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navIconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: '500',
  },
  navTextInactive: {
    color: theme.textTertiary,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  barcodeInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  fetchButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    minWidth: 100,
  },
  fetchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  helpText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 6,
  },
  imageInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  imagePickerButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 12,
    backgroundColor: theme.inputBackground,
    resizeMode: 'contain',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Import Modal Styles
  importTypeContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  importTypeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: theme.border,
  },
  importTypeButtonActive: {
    backgroundColor: theme.primary,
  },
  importTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  importTypeTextActive: {
    color: '#fff',
  },
  importSearchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  importSearchInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  importSearchButton: {
    backgroundColor: '#475569',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  importResultsList: {
    flex: 1,
    padding: 16,
  },
  importResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  importResultImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 12,
  },
  importResultInfo: {
    flex: 1,
  },
  importSearchInput: {
    flex: 1,
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.text,
  },
  importSearchButton: {
    backgroundColor: theme.primary,
    width: 50,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  importResultsList: {
    flex: 1,
    padding: 16,
  },
  importResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.inputBackground,
    borderRadius: 8,
    marginBottom: 12,
  },
  importResultImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: theme.card,
  },
  importResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  importResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  importResultBrand: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  importResultButton: {
    backgroundColor: theme.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  noResultsText: {
    textAlign: 'center',
    color: theme.textSecondary,
    marginTop: 20,
    fontSize: 14,
  },
});
