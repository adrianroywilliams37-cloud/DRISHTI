import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useSession } from '../context/SessionContext';

export default function LoginScreen() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useSession();

  const handleLogin = async () => {
    if (!loginId || !password) {
      Alert.alert('Error', 'Please enter both Login ID and Password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(loginId, password);
    } catch (e) {
      Alert.alert('Authentication Failed', 'Invalid credentials or unable to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>DRISHTI</Text>
        <Text style={styles.subtitle}>Secure Field Access</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Login ID</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. user_nodal_1"
          placeholderTextColor="#94a3b8"
          value={loginId}
          onChangeText={setLoginId}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Secure Login</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Unauthorised access is strictly prohibited.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  form: {
    backgroundColor: '#1e293b',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  label: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#1d4ed8',
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
  },
});
