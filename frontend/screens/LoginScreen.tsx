import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { showAppAlert } from '../lib/styledAlert';


export default function LoginScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Clear old data
  useEffect(() => {
    const clearOldData = async () => {
      try {
        await AsyncStorage.multiRemove(['user', 'token', 'cart']);
      } catch (error) {
        console.error('Failed to clear old data:', error);
      }
    };
    clearOldData();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      showAppAlert('Error', 'Please fill in all fields');
      return;
    }

    const user = await login(email, password);
    if (user) {
      if (user.role === 'admin') {
        navigation.replace('AdminDashboard');
      } else {
        navigation.replace('Main');
      }
    } else {
      showAppAlert('Error', 'Login failed, please check your credentials');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Trinity Shop</Text>
          <Text style={styles.subtitle}>Welcome Back</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#94a3b8"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#94a3b8"
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.adminHint}>
            <Text style={styles.adminHintText}>
              Admin login: admin@trinity.com / admin123
            </Text>
          </View>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerLinkText}>
              Don't have an account? <Text style={styles.registerLinkBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.text,
  },
  loginButton: {
    backgroundColor: theme.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminHint: {
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  adminHintText: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
  },
  registerLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  registerLinkText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  registerLinkBold: {
    color: theme.primary,
    fontWeight: 'bold',
  },
});
