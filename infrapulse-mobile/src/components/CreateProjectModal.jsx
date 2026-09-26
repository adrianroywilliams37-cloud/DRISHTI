import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ActivityIndicator } from 'react-native';

export default function CreateProjectModal({ visible, onClose, onSubmit }) {
  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [stateName, setStateName] = useState('');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password) {
      setError('Password is required for authorization');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit({
        id: projectId,
        name,
        sector,
        state: stateName,
        sanctioned_cost_cr: parseFloat(cost),
        original_completion_date: date,
      }, password);
    } catch (err) {
      setError(err.message || 'Failed to create project');
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Create New Project</Text>
          
          <TextInput style={styles.input} placeholder="Project ID (e.g. RAIL-TEST-01)" value={projectId} onChangeText={setProjectId} />
          <TextInput style={styles.input} placeholder="Project Name" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Sector" value={sector} onChangeText={setSector} />
          <TextInput style={styles.input} placeholder="State" value={stateName} onChangeText={setStateName} />
          <TextInput style={styles.input} placeholder="Sanctioned Cost (Cr)" value={cost} onChangeText={setCost} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Completion Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
          
          <View style={styles.separator} />
          <Text style={styles.authLabel}>Authorization Password</Text>
          <TextInput 
            style={[styles.input, styles.passwordInput]} 
            placeholder="Enter Apex Password" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
          />
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create Project</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 8, elevation: 5 },
  title: { fontFamily: 'serif', fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 10, marginBottom: 12, fontSize: 14 },
  separator: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 10 },
  authLabel: { fontSize: 12, fontWeight: 'bold', color: '#b91c1c', marginBottom: 5 },
  passwordInput: { borderColor: '#fca5a5' },
  errorText: { color: '#ef4444', fontSize: 12, marginBottom: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelButton: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#f1f5f9', borderRadius: 6 },
  cancelText: { color: '#475569', fontWeight: 'bold' },
  submitButton: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#4f46e5', borderRadius: 6, minWidth: 120, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: 'bold' }
});
