import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';
import { userAPI } from '../lib/api';

export default function EditProfileScreen({ route, navigation }: any) {
  const { user: initialUser } = route.params as { user: User };
  
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState(initialUser.first_name || '');
  const [lastName, setLastName] = useState(initialUser.last_name || '');
  const [phone, setPhone] = useState(initialUser.phone_number || '');
  const [streetAddress, setStreetAddress] = useState(initialUser.billing_address || '');
  const [postalCode, setPostalCode] = useState(initialUser.billing_zip_code || '');
  const [city, setCity] = useState(initialUser.billing_city || '');
  const [country, setCountry] = useState(initialUser.billing_country || 'France');

  const handleSave = async () => {
    // Basic validation
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Validation Error', 'Please enter your first and last name');
      return;
    }

    setLoading(true);
    try {
      await userAPI.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phone.trim(),
        billing_address: streetAddress.trim(),
        billing_zip_code: postalCode.trim(),
        billing_city: city.trim(),
        billing_country: country.trim(),
      });

      Alert.alert(
        'Success',
        'Your profile has been updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Personal Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#1e293b" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.disabledInput}>
              <Text style={styles.disabledText}>{initialUser.email}</Text>
            </View>
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="John"
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Doe"
                value={lastName}
                onChangeText={setLastName}
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="+33 1 23 45 67 89"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>
        </View>

        {/* Delivery Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color="#1e293b" />
            <Text style={styles.sectionTitle}>Default Delivery Address</Text>
          </View>
          <Text style={styles.sectionDescription}>
            This address will be used automatically during checkout
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Street Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="123 Main Street, Apt 4B"
              value={streetAddress}
              onChangeText={setStreetAddress}
              multiline
              numberOfLines={2}
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.label}>Postal Code</Text>
              <TextInput
                style={styles.input}
                placeholder="75001"
                value={postalCode}
                onChangeText={setPostalCode}
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="Paris"
                value={city}
                onChangeText={setCity}
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Country</Text>
            <TextInput
              style={styles.input}
              placeholder="France"
              value={country}
              onChangeText={setCountry}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    marginTop: -8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  inputContainer: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 14,
    zIndex: 1,
  },
  inputWithIcon: {
    paddingLeft: 44,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#e2e8f0',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  disabledText: {
    fontSize: 15,
    color: '#64748b',
  },
  helperText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: '#64748b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
