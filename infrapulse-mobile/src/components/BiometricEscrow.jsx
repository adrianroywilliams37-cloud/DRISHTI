import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { getWebServerUrl } from '../utils/network';
export default function BiometricEscrow({ projectId, onBack }) {
  const [hasHardware, setHasHardware] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(true);
  const [payload, setPayload] = useState(null);
  const [status, setStatus] = useState('IDLE'); // IDLE, SUCCESS, FAILURE

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      setHasHardware(compatible);
      setIsEnrolled(enrolled);
    })();
  }, []);

  const handleAuthentication = async () => {
    if (!hasHardware || !isEnrolled) {
      Alert.alert('Hardware Error', 'Biometric hardware is not available or not configured.');
      return;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'PAIMANA DBT Escrow Authorization',
        disableDeviceFallback: true,
      });

      if (result.success) {
        setStatus('SUCCESS');
        setPayload({
          timestamp: new Date().toISOString(),
          hardware_mac: '00:1B:44:11:3A:B7', // Mocked
          liveness_coefficient: 0.98,
          worker_id_hash: 'SHA256:8f4c...3b1a',
          escrow_status: 'TRANCHE_UNLOCKED'
        });
      } else {
        setStatus('FAILURE');
        setPayload({
          timestamp: new Date().toISOString(),
          hardware_mac: '00:1B:44:11:3A:B7', // Mocked
          liveness_coefficient: 0.14,
          worker_id_hash: 'REJECTED',
          escrow_status: 'FROZEN_PENDING_REVIEW'
        });
      }
    } catch (e) {
      console.error(e);
      setStatus('FAILURE');
      setPayload({
        timestamp: new Date().toISOString(),
        error: e.message || 'Authentication error',
        escrow_status: 'FROZEN_PENDING_REVIEW'
      });
    }
  };

  const simulateFraudCheckin = async () => {
    try {
      const response = await fetch(`${getWebServerUrl()}/api/biometric/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_id: 'W-8891',
          project_id: projectId,
          timestamp: new Date().toISOString()
        })
      });
      const data = await response.json();
      if (!data.success && data.fraud_detected) {
        Alert.alert('SYBIL ATTACK DETECTED', data.details);
      } else {
        Alert.alert('CHECK-IN SUCCESS', 'Worker W-8891 checked in.');
      }
    } catch (e) {
      console.error('Failed to trigger fraud check-in', e);
      Alert.alert('Error', 'Failed to trigger fraud check. Please ensure the server is running.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>[X] ABORT ESCROW</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>BIOMETRIC ESCROW: {projectId}</Text>
      </View>

      {(!hasHardware || !isEnrolled) ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            CRITICAL: NO SECURE ENCLAVE BIOMETRICS DETECTED ON DEVICE.
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.authButton} 
            onPress={handleAuthentication}
          >
            <Text style={styles.authButtonText}>[ INITIALIZE BIOMETRIC HANDSHAKE ]</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.authButton, { borderColor: '#8a3324', backgroundColor: 'rgba(138, 51, 36, 0.1)' }]} 
            onPress={simulateFraudCheckin}
          >
            <Text style={[styles.authButtonText, { color: '#8a3324' }]}>[ SIMULATE SYBIL FRAUD ]</Text>
          </TouchableOpacity>

          {status !== 'IDLE' && (
            <View style={[
              styles.statusBanner, 
              status === 'SUCCESS' ? styles.statusSuccess : styles.statusFailure
            ]}>
              <Text style={[
                styles.statusBannerText,
                status === 'SUCCESS' ? styles.textSuccess : styles.textFailure
              ]}>
                {status === 'SUCCESS' 
                  ? 'DBT WAGE ESCROW UNLOCKED' 
                  : 'LIVENESS FAILURE: BIOMETRIC REJECTED'}
              </Text>
            </View>
          )}

          {payload && (
            <View style={styles.terminal}>
              <Text style={styles.terminalHeader}>--- SECURE ENCLAVE PAYLOAD ---</Text>
              <Text style={styles.terminalText}>
                {JSON.stringify(payload, null, 2)}
              </Text>
              <Text style={styles.terminalFooter}>--- END OF TRANSMISSION ---</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Slate-950
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    marginBottom: 16,
    padding: 8,
    backgroundColor: 'rgba(138, 51, 36, 0.2)', // Mahogany tint
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#8a3324',
  },
  backButtonText: {
    color: '#8a3324',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 12,
  },
  headerText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: 16,
  },
  errorContainer: {
    padding: 24,
    backgroundColor: 'rgba(138, 51, 36, 0.1)',
    borderWidth: 1,
    borderColor: '#8a3324',
    margin: 16,
  },
  errorText: {
    color: '#8a3324',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  authButton: {
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  authButtonText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusBanner: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: 'center',
  },
  statusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  statusFailure: {
    backgroundColor: 'rgba(138, 51, 36, 0.1)',
    borderColor: '#8a3324',
  },
  statusBannerText: {
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  textSuccess: {
    color: '#10b981',
  },
  textFailure: {
    color: '#8a3324',
  },
  terminal: {
    backgroundColor: '#000',
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    flex: 1,
  },
  terminalHeader: {
    color: '#64748b',
    fontFamily: 'monospace',
    fontSize: 10,
    marginBottom: 12,
  },
  terminalFooter: {
    color: '#64748b',
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: 12,
  },
  terminalText: {
    color: '#10b981',
    fontFamily: 'monospace',
    fontSize: 12,
  }
});
