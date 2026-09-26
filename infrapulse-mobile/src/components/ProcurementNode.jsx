import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useProjects } from '../hooks/useProjects';

export default function ProcurementNode() {
  const { projects } = useProjects();
  const [overrideState, setOverrideState] = useState('IDLE'); // IDLE | PIN_REQUIRED | VERIFYING | SUCCESS | ERROR
  const [authPin, setAuthPin] = useState('');
  const [progress, setProgress] = useState(0);

  const selectedProject = projects && projects.length > 0 
    ? { project_id: projects[0].id, project_name: projects[0].name }
    : { project_id: '...', project_name: 'Loading...' };

  const initiateOverride = () => {
    setOverrideState('PIN_REQUIRED');
    setAuthPin('');
  };

  const cancelOverride = () => {
    setOverrideState('IDLE');
    setAuthPin('');
  };

  const executeCryptographicRelease = () => {
    if (authPin.length < 6) return;
    setOverrideState('VERIFYING');

    // Simulate Edge Function invocation
    setTimeout(() => {
      if (authPin === '123456') { // Mock success condition
        setOverrideState('SUCCESS');
        
        // Progress bar simulation
        let currentProgress = 0;
        const interval = setInterval(() => {
          currentProgress += 10;
          setProgress(currentProgress);
          if (currentProgress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setOverrideState('IDLE');
              setAuthPin('');
              setProgress(0);
            }, 1000);
          }
        }, 300);

      } else {
        setOverrideState('ERROR');
        setTimeout(() => setOverrideState('PIN_REQUIRED'), 2500);
      }
    }, 1500);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Procurement Node</Text>
        <Text style={styles.subtitle}>PFMS DISBURSEMENT TRACKING</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>PENDING TRANSACTIONS</Text>
        
        <View style={styles.transaction}>
          <View style={styles.transactionHeader}>
            <Text style={styles.txId}>TXN-8472-A</Text>
            <Text style={styles.txStatus}>BLOCKED</Text>
          </View>
          <Text style={styles.txDetail}>Contractor: L&T Infra</Text>
          <Text style={styles.txDetail}>Amount: ₹ 45.2 Cr</Text>
          <Text style={styles.txReason}>Reason: Utilization Certificate Missing</Text>
        </View>

        <View style={styles.authContainer}>
          <Text style={styles.authHeader}>[ FINANCIAL GOVERNANCE ]</Text>

          {overrideState === 'IDLE' && (
            <TouchableOpacity style={styles.idleButton} onPress={initiateOverride}>
              <Text style={styles.idleButtonText}>AUTHORIZE PFMS TRANCHE RELEASE</Text>
              <Text style={styles.idleButtonSub}>Requires Hardware Token Signature</Text>
            </TouchableOpacity>
          )}

          {(overrideState === 'PIN_REQUIRED' || overrideState === 'ERROR') && (
            <View style={styles.terminal}>
              <View style={styles.terminalHeader}>
                <View style={styles.dots}>
                  <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
                  <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
                  <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
                </View>
                <TouchableOpacity onPress={cancelOverride}>
                  <Text style={styles.abortText}>ABORT</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.terminalLabel}>AWAITING PMG HARDWARE TOKEN PIN</Text>
              <Text style={styles.terminalSubLabel}>ASSET: {selectedProject.project_name}</Text>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.pinInput}
                  value={authPin}
                  onChangeText={(text) => setAuthPin(text.replace(/\D/g, ''))}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholder="••••••"
                  placeholderTextColor="#334155"
                  secureTextEntry
                />
                <TouchableOpacity
                  style={[styles.signButton, authPin.length < 6 && styles.signButtonDisabled]}
                  onPress={executeCryptographicRelease}
                  disabled={authPin.length < 6}
                >
                  <Text style={styles.signButtonText}>SIGN</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.strengthContainer}>
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={[styles.strengthBar, i < authPin.length ? styles.strengthActive : styles.strengthInactive]} />
                ))}
              </View>

              {overrideState === 'ERROR' && (
                <Text style={styles.errorText}>INVALID SIGNATURE. CRYPTOGRAPHIC VERIFICATION REJECTED.</Text>
              )}
            </View>
          )}

          {overrideState === 'VERIFYING' && (
            <View style={styles.verifyingContainer}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={styles.verifyingText}>VERIFYING CRYPTOGRAPHIC SIGNATURE...</Text>
              <Text style={styles.verifyingSub}>Contacting HSM Gateway</Text>
            </View>
          )}

          {overrideState === 'SUCCESS' && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>TRANCHE RELEASE AUTHORIZED</Text>
              <Text style={styles.successSubText}>IMMUTABLE LEDGER UPDATED. PFMS GATEWAY UNLOCKED.</Text>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
              </View>
            </View>
          )}

        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#64748b',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  cardTitle: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  transaction: {
    borderWidth: 1,
    borderColor: '#b91c1c',
    backgroundColor: '#fef2f2',
    padding: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  txId: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 14,
    color: '#0f172a',
  },
  txStatus: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 12,
    color: '#b91c1c',
  },
  txDetail: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#0f172a',
    marginBottom: 4,
  },
  txReason: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#b91c1c',
    marginTop: 8,
  },
  authContainer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
  },
  authHeader: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 12,
  },
  idleButton: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
  },
  idleButtonText: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 12,
  },
  idleButtonSub: {
    color: '#94a3b8',
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: 4,
  },
  terminal: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
  },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 0,
  },
  abortText: {
    color: '#64748b',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  terminalLabel: {
    color: '#34d399',
    fontFamily: 'monospace',
    fontSize: 11,
    marginBottom: 4,
  },
  terminalSubLabel: {
    color: '#64748b',
    fontFamily: 'monospace',
    fontSize: 10,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pinInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
    color: '#34d399',
    fontFamily: 'monospace',
    textAlign: 'center',
    letterSpacing: 8,
    paddingVertical: 12,
  },
  signButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signButtonDisabled: {
    backgroundColor: '#334155',
  },
  signButtonText: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 12,
  },
  strengthContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 12,
  },
  strengthBar: {
    height: 2,
    flex: 1,
  },
  strengthActive: {
    backgroundColor: '#10b981',
  },
  strengthInactive: {
    backgroundColor: '#334155',
  },
  errorText: {
    color: '#f87171',
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: 12,
  },
  verifyingContainer: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 24,
    alignItems: 'center',
  },
  verifyingText: {
    color: '#34d399',
    fontFamily: 'monospace',
    fontSize: 11,
    marginTop: 12,
    marginBottom: 4,
  },
  verifyingSub: {
    color: '#64748b',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  successContainer: {
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#047857',
    padding: 20,
    alignItems: 'center',
  },
  successText: {
    color: '#34d399',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 4,
  },
  successSubText: {
    color: '#10b981',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  progressContainer: {
    width: '100%',
    height: 2,
    backgroundColor: '#065f46',
    marginTop: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
  },
});
