import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { getWebServerUrl } from '../utils/network';
import * as DocumentPicker from 'expo-document-picker';

export default function NodalOfflineForm({ projectId, onBack }) {
  const [progress, setProgress] = useState('');
  const [cost, setCost] = useState('');
  const [remarks, setRemarks] = useState('');
  const [document, setDocument] = useState(null);
  
  const { isOnline, queueCount, enqueueData, flushQueue } = useOfflineSync(`${getWebServerUrl()}/api/sync`);

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDocument(result.assets[0]);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to pick document.');
    }
  };

  const handleSubmit = async () => {
    if (!progress || !cost) {
      Alert.alert('Error', 'Please fill out physical progress and anticipated cost.');
      return;
    }

    const payload = {
      project_id: projectId,
      type: 'telemetry_update',
      data: {
        physical_progress_pct: parseFloat(progress),
        anticipated_cost: parseFloat(cost),
        remarks,
        document_uri: document ? document.uri : null,
        document_name: document ? document.name : null,
        timestamp: new Date().toISOString()
      }
    };

    const success = await enqueueData(payload);
    if (success) {
      Alert.alert(isOnline ? 'Synced' : 'Saved Offline', 
        isOnline ? 'Telemetry successfully uploaded to Command Center.' : 'Telemetry saved to Dark Zone cache. Will auto-sync when uplink is restored.'
      );
      setProgress('');
      setCost('');
      setRemarks('');
      setDocument(null);
      if (onBack) onBack();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>{'< BACK'}</Text>
        </TouchableOpacity>
        <View style={[styles.statusBadge, isOnline ? styles.badgeOnline : styles.badgeOffline]}>
          <Text style={styles.badgeText}>{isOnline ? 'UPLINK SECURE' : `DARK ZONE (${queueCount})`}</Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.title}>UPDATE TELEMETRY</Text>
        <Text style={styles.subtitle}>{projectId}</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>PHYSICAL PROGRESS (%)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={progress}
            onChangeText={setProgress}
            placeholder="e.g. 45.5"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>ANTICIPATED COST (₹ Cr)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={cost}
            onChangeText={setCost}
            placeholder="e.g. 1500"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>NODAL OFFICER REMARKS</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Log specific on-site details..."
          />
        </View>

        <TouchableOpacity 
          style={styles.uploadBtn}
          onPress={handleDocumentPick}
        >
          <Text style={styles.uploadBtnText}>
            {document ? `[ATTACHED] ${document.name}` : '[ ATTACH DOCUMENT (PDF/DOCX) ]'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.submitBtn, isOnline ? styles.submitOnline : styles.submitOffline]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>
            {isOnline ? 'SUBMIT TELEMETRY' : 'SAVE DRAFT (OFFLINE)'}
          </Text>
        </TouchableOpacity>
        
        {!isOnline && (
          <Text style={styles.offlineHint}>
            No network detected. Data will be encrypted and saved locally until connection is restored.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef1f0', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backButton: { padding: 8 },
  backText: { fontFamily: 'monospace', color: '#14253a', fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  badgeOnline: { backgroundColor: 'rgba(63,110,100,0.1)', borderColor: '#3f6e64' },
  badgeOffline: { backgroundColor: 'rgba(164,56,32,0.1)', borderColor: '#a43820' },
  badgeText: { fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold' },
  formCard: { backgroundColor: '#fff', padding: 20, borderWidth: 1, borderColor: '#d0d5d2' },
  title: { fontFamily: 'serif', fontSize: 18, color: '#14253a', fontWeight: 'bold' },
  subtitle: { fontFamily: 'monospace', fontSize: 12, color: '#6b7f5b', marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontFamily: 'monospace', fontSize: 10, color: '#14253a', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d0d5d2', padding: 12, fontFamily: 'monospace', fontSize: 14 },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitBtn: { padding: 16, alignItems: 'center', marginTop: 8 },
  submitOnline: { backgroundColor: '#14253a' },
  submitOffline: { backgroundColor: '#a43820' },
  submitText: { color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' },
  uploadBtn: { padding: 14, borderWidth: 1, borderColor: '#14253a', borderStyle: 'dashed', alignItems: 'center', marginBottom: 16 },
  uploadBtnText: { fontFamily: 'monospace', fontSize: 10, color: '#14253a', fontWeight: 'bold' },
  offlineHint: { fontFamily: 'monospace', fontSize: 10, color: '#a43820', marginTop: 12, textAlign: 'center' }
});
