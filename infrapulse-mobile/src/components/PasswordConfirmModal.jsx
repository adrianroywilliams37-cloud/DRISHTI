import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ActivityIndicator } from 'react-native';

export default function PasswordConfirmModal({ visible, actionName, onClose, onConfirm }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onConfirm(password);
    } catch (err) {
      setError(err.message || 'Authorization failed');
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Authorize Action</Text>
          <Text style={styles.subtitle}>Please enter your password to confirm:</Text>
          <Text style={styles.actionName}>{actionName}</Text>
          
          <TextInput 
            style={styles.input} 
            placeholder="Enter password" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
            autoFocus
          />
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Confirm</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', padding: 20, borderRadius: 8, elevation: 5 },
  title: { fontFamily: 'serif', fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#475569', marginBottom: 2 },
  actionName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 10, fontSize: 14 },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 5 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  cancelButton: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#f1f5f9', borderRadius: 6 },
  cancelText: { color: '#475569', fontWeight: 'bold' },
  submitButton: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#dc2626', borderRadius: 6, minWidth: 100, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: 'bold' }
});
