import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';

const initialLedgerEntries = [
  {
    id: 'blk-9382',
    action_type: 'CLEARANCE_APPROVED',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    notes: 'Environmental clearance granted by Ministry of Environment. Conditions apply for river basin section.',
    initiated_by: 'MoEFCC',
    hash: '0x39f82d...9a12'
  },
  {
    id: 'blk-4721',
    action_type: 'CLEARANCE_REQUESTED',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    notes: 'Stage II Environmental clearance requested with attached EIA report.',
    initiated_by: 'NHAI Nodal',
    hash: '0x112fa3...8b44'
  }
];

export default function ImmutableAuditLedger() {
  const [ledgerEntries, setLedgerEntries] = useState(initialLedgerEntries);
  const [isSimulating, setIsSimulating] = useState(false);

  const getNodeStyle = (actionType) => {
    switch (actionType) {
      case 'MINISTRY_SUMMONED':
        return { dot: styles.dotSummoned, badge: styles.badgeSummoned, badgeText: styles.badgeTextSummoned };
      case 'CLEARANCE_APPROVED':
        return { dot: styles.dotApproved, badge: styles.badgeApproved, badgeText: styles.badgeTextApproved };
      case 'CLEARANCE_REQUESTED':
        return { dot: styles.dotRequested, badge: styles.badgeRequested, badgeText: styles.badgeTextRequested };
      case 'DRONE_TELEMETRY':
        return { dot: styles.dotTelemetry, badge: styles.badgeTelemetry, badgeText: styles.badgeTextTelemetry };
      default:
        return { dot: styles.dotDefault, badge: styles.badgeDefault, badgeText: styles.badgeTextDefault };
    }
  };

  const handleSimulateConsensus = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const newBlock = {
        id: `blk-${Math.floor(Math.random() * 10000)}`,
        action_type: 'DRONE_TELEMETRY',
        timestamp: new Date().toISOString(),
        notes: 'Automated topographical survey completed. No encroachment detected on Right of Way (RoW). Cryptographic hash verified.',
        initiated_by: 'Drone-Alpha-9',
        hash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`
      };
      setLedgerEntries([newBlock, ...ledgerEntries]);
      setIsSimulating(false);
    }, 1500);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Immutable Audit Ledger</Text>
          <Text style={styles.subtitle}>CRYPTOGRAPHICALLY LOGGED INTER-DEPARTMENTAL TIMELINE</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.btnSimulate, isSimulating && styles.btnSimulateDisabled]}
            onPress={handleSimulateConsensus}
            disabled={isSimulating}
          >
            {isSimulating ? (
              <ActivityIndicator size="small" color="#115e59" style={{marginRight: 4}} />
            ) : (
              <Text style={styles.btnSimulateIcon}>💾</Text>
            )}
            <Text style={styles.btnSimulateText}>{isSimulating ? 'SYNCING...' : 'SIMULATE CONSENSUS'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.timelineContainer}>
        <View style={styles.timelineLine} />
        
        {ledgerEntries.map((entry) => {
          const nodeStyle = getNodeStyle(entry.action_type);
          
          return (
            <View key={entry.id} style={styles.timelineItem}>
              <View style={[styles.timelineDot, nodeStyle.dot]} />
              
              <View style={styles.contentBox}>
                <View style={styles.contentHeader}>
                  <View style={[styles.badge, nodeStyle.badge]}>
                    {entry.action_type === 'CLEARANCE_APPROVED' && <Text style={styles.badgeIcon}>✓ </Text>}
                    <Text style={[styles.badgeText, nodeStyle.badgeText]}>
                      {entry.action_type.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <Text style={styles.timestamp}>
                    {new Date(entry.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' })}
                  </Text>
                </View>

                <Text style={styles.notesText}>{entry.notes}</Text>

                <View style={styles.metadataBox}>
                  <View style={styles.metadataLeft}>
                    <Text style={styles.metadataLabel}>AUTHOR: <Text style={styles.metadataValue}>{entry.initiated_by}</Text></Text>
                    <Text style={styles.metadataLabel}>LOG ID: <Text style={styles.metadataValue}>{entry.id.split('-')[0].toUpperCase()}</Text></Text>
                  </View>
                  <View style={styles.hashBadge}>
                    <Text style={styles.hashIcon}>🔗</Text>
                    <Text style={styles.hashText}>{entry.hash}</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>
      <View style={{height: 40}} />
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
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 16,
    marginBottom: 24,
  },
  headerTextContainer: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8a3324',
  },
  subtitle: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  btnSimulate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#0d9488',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnSimulateDisabled: {
    opacity: 0.5,
  },
  btnSimulateIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  btnSimulateText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#115e59',
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: 16,
  },
  timelineLine: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  timelineItem: {
    position: 'relative',
    paddingLeft: 20,
    marginBottom: 24,
  },
  timelineDot: {
    position: 'absolute',
    left: -5,
    top: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 3,
    backgroundColor: '#ffffff',
  },
  dotSummoned: { borderColor: '#8a3324' },
  dotApproved: { borderColor: '#059669' },
  dotRequested: { borderColor: '#d97706' },
  dotTelemetry: { borderColor: '#0d9488' },
  dotDefault: { borderColor: '#94a3b8' },
  
  contentBox: {
    flex: 1,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  badgeIcon: {
    fontSize: 10,
    color: '#065f46',
  },
  badgeText: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
  },
  badgeSummoned: { backgroundColor: 'rgba(138, 51, 36, 0.1)', borderColor: 'rgba(138, 51, 36, 0.2)' },
  badgeTextSummoned: { color: '#8a3324' },
  
  badgeApproved: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  badgeTextApproved: { color: '#065f46' },
  
  badgeRequested: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  badgeTextRequested: { color: '#92400e' },
  
  badgeTelemetry: { backgroundColor: '#f0fdfa', borderColor: '#99f6e4' },
  badgeTextTelemetry: { color: '#115e59' },
  
  badgeDefault: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  badgeTextDefault: { color: '#475569' },
  
  timestamp: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#94a3b8',
  },
  notesText: {
    fontFamily: 'serif',
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 12,
  },
  metadataBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 8,
  },
  metadataLeft: {
    flex: 1,
  },
  metadataLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
  },
  metadataValue: {
    fontWeight: 'bold',
    color: '#475569',
  },
  hashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  hashIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  hashText: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#64748b',
  },
});
