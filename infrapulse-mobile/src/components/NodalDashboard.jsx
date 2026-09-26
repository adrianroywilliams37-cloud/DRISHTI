import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkZoneEngine } from '../lib/DarkZoneEngine';
import Constants from 'expo-constants';
import { useProjects } from '../hooks/useProjects';

// We dynamically determine the web server IP based on the Expo bundler host (now in useProjects hook)

export default function NodalDashboard({ onNavigateToCamera, onNavigateToBiometric, onNavigateToTelemetry }) {
  const [isOffline, setIsOffline] = useState(false);
  const [vaultCount, setVaultCount] = useState(0);
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const { projects, loading } = useProjects();

  const checkNetworkAndVault = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      setIsOffline(!networkState.isConnected);

      const existingQueue = await AsyncStorage.getItem('@paimana_sync_queue');
      if (existingQueue) {
        const queue = JSON.parse(existingQueue);
        setVaultCount(queue.length);
      } else {
        setVaultCount(0);
      }
    } catch (e) {
      console.error('Failed to read vault', e);
      setVaultCount(0);
    }
  };

  useEffect(() => {
    checkNetworkAndVault();
    const interval = setInterval(checkNetworkAndVault, 3000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleForceFlush = async () => {
    if (isOffline) {
      Alert.alert('DARK ZONE ACTIVE', 'Cannot flush payload without uplink connection.');
      return;
    }
    const res = await DarkZoneEngine.syncWithSupabase();
    if (res.success) {
      Alert.alert('FLUSH COMPLETE', `Successfully synchronized ${res.count} payloads.`);
      setVaultCount(0);
    } else {
      Alert.alert('FLUSH FAILED', res.error?.message || res.reason || 'Unknown error');
    }
  };

  const getRiskColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'low': return '#3f6e64'; // Teal
      case 'medium': return '#9c7a2a'; // Ochre
      case 'high': return '#a43820'; // Mahogany
      default: return '#14253a'; // Ink
    }
  };

  const renderProjectCard = ({ item }) => {
    const isExpanded = expandedProjectId === item.id;
    const riskColor = getRiskColor(item.riskBand);
    
    // Map data structure from seedProjects.ts to UI
    const progress = item.physical_progress_pct || 0;
    const riskStatus = item.riskBand || 'Unknown';
    const type = item.sector || 'Infrastructure';

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.9}
        onPress={() => setExpandedProjectId(isExpanded ? null : item.id)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.projectId}>{item.id}</Text>
          <View style={[styles.riskBadge, { borderColor: riskColor, backgroundColor: riskColor + '15' }]}>
            <Text style={[styles.riskText, { color: riskColor }]}>
              {riskStatus.toUpperCase()} RISK
            </Text>
          </View>
        </View>

        <Text style={styles.projectType}>{item.name.toUpperCase()} • {type.toUpperCase()}</Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>PHYSICAL PROGRESS / BUDGET</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: riskStatus === 'High' ? '#a43820' : '#3f6e64' }]} />
          </View>
        </View>

        {/* Expanded Action Gateway */}
        {isExpanded && (
          <View style={styles.actionGateway}>
            <TouchableOpacity 
              style={styles.actionButtonPrimary}
              onPress={() => onNavigateToCamera(item.id)}
            >
              <Text style={styles.actionButtonText}>[ INITIATE CRYPTOGRAPHIC CAPTURE ]</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButtonSecondary}
              onPress={() => onNavigateToBiometric(item.id)}
            >
              <Text style={styles.actionButtonTextSecondary}>[ EXECUTE BIOMETRIC ESCROW ]</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButtonPrimary}
              onPress={() => onNavigateToTelemetry(item.id)}
            >
              <Text style={styles.actionButtonText}>[ UPDATE TELEMETRY ]</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButtonSecondary}
              onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id })}
            >
              <Text style={styles.actionButtonTextSecondary}>[ VIEW FULL PROJECT DETAILS ]</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#14253a" />
        <Text style={{ marginTop: 10, fontFamily: 'serif', color: '#14253a' }}>SYNCING WITH CENTRAL LEDGER...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HUD HEADER */}
      <View style={[styles.hud, isOffline ? styles.hudOffline : styles.hudOnline]}>
        <Text style={[styles.hudStatusText, isOffline ? { color: '#a43820' } : { color: '#3f6e64' }]}>
          {isOffline ? 'DARK ZONE ACTIVE' : 'UPLINK SECURE'}
        </Text>
        <View style={styles.hudDetails}>
          <Text style={styles.hudSubText}>CACHED PAYLOADS: {vaultCount}</Text>
          <TouchableOpacity style={styles.flushButton} onPress={handleForceFlush}>
            <Text style={styles.flushButtonText}>FORCE FLUSH</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FlatList of Projects */}
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderProjectCard}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>AWAITING PMG ASSIGNMENT</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef1f0', // Paper
  },
  hud: {
    padding: 16,
    borderBottomWidth: 1,
  },
  hudOnline: {
    backgroundColor: 'rgba(63, 110, 100, 0.05)',
    borderBottomColor: '#3f6e64',
  },
  hudOffline: {
    backgroundColor: 'rgba(164, 56, 32, 0.05)',
    borderBottomColor: '#a43820',
  },
  hudStatusText: {
    fontFamily: 'serif',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
    marginBottom: 8,
  },
  hudDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hudSubText: {
    fontFamily: 'monospace',
    color: '#14253a', // Ink
    fontSize: 12,
  },
  flushButton: {
    backgroundColor: '#14253a',
    borderWidth: 1,
    borderColor: '#14253a',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  flushButtonText: {
    fontFamily: 'monospace',
    color: '#eef1f0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff', // Clean white on paper
    borderWidth: 1,
    borderColor: '#d0d5d2',
    marginBottom: 16,
    padding: 16,
    borderRadius: 0, // Strict institutional (no rounded corners)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectId: {
    fontFamily: 'monospace',
    color: '#14253a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  riskBadge: {
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  riskText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
  },
  projectType: {
    fontFamily: 'serif',
    color: '#14253a',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: 'monospace',
    color: '#6b7f5b', // Cat2 Color from web
    fontSize: 10,
    marginBottom: 4,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#eef1f0',
    borderWidth: 1,
    borderColor: '#d0d5d2',
  },
  progressBarFill: {
    height: '100%',
  },
  actionGateway: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#d0d5d2',
  },
  actionButtonPrimary: {
    backgroundColor: 'rgba(20, 37, 58, 0.05)',
    borderWidth: 1,
    borderColor: '#14253a',
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    fontFamily: 'monospace',
    color: '#14253a',
    fontWeight: 'bold',
    fontSize: 12,
  },
  actionButtonSecondary: {
    backgroundColor: 'rgba(164, 56, 32, 0.05)',
    borderWidth: 1,
    borderColor: '#a43820',
    padding: 12,
    alignItems: 'center',
  },
  actionButtonTextSecondary: {
    fontFamily: 'monospace',
    color: '#a43820',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d5d2',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontFamily: 'monospace',
    color: '#14253a',
    fontSize: 14,
  }
});
