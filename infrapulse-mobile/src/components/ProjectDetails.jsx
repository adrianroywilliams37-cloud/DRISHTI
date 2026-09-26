import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useProjects } from '../hooks/useProjects';

export default function ProjectDetails({ route, navigation }) {
  const { projectId } = route.params;
  const { projects } = useProjects();

  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Project not found</Text>
      </View>
    );
  }

  const navigateTo = (screen) => {
    navigation.navigate(screen, { projectId: project.id });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      {/* Project Meta */}
      <View style={styles.metaCard}>
        <Text style={styles.title}>{project.name}</Text>
        <Text style={styles.subtitle}>{project.ministry} - {project.sector}</Text>
        
        <View style={styles.row}>
          <View style={styles.metaBadge}>
            <Text style={styles.metaLabel}>Budget</Text>
            <Text style={styles.metaValue}>₹{project.budget} Cr</Text>
          </View>
          <View style={styles.metaBadge}>
            <Text style={styles.metaLabel}>Progress</Text>
            <Text style={styles.metaValue}>{project.progress}%</Text>
          </View>
          <View style={[styles.metaBadge, { backgroundColor: project.riskBand === 'High' ? '#ef4444' : '#f59e0b' }]}>
            <Text style={[styles.metaLabel, { color: '#fff' }]}>Risk</Text>
            <Text style={[styles.metaValue, { color: '#fff' }]}>{project.riskBand}</Text>
          </View>
        </View>
      </View>

      {/* Field Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GROUND TRUTH (FIELD NODE)</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigateTo('Camera')}>
            <Text style={styles.actionIcon}>📸</Text>
            <Text style={styles.actionText}>Cryptographic Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigateTo('Biometrics')}>
            <Text style={styles.actionIcon}>🖐️</Text>
            <Text style={styles.actionText}>DBT Escrow Biometrics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigateTo('OfflineForm')}>
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionText}>Offline Telemetry</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Analytics & Clearance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ANALYTICS & COMPLIANCE</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigateTo('OrbitalVerify')}>
            <Text style={styles.actionIcon}>🛰️</Text>
            <Text style={styles.actionText}>Orbital Verify</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigateTo('PredictiveRadar')}>
            <Text style={styles.actionIcon}>📡</Text>
            <Text style={styles.actionText}>Predictive Radar (SAR)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigateTo('ProcurementNode')}>
            <Text style={styles.actionIcon}>💸</Text>
            <Text style={styles.actionText}>Procurement (PFMS)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigateTo('ClearanceTimeline')}>
            <Text style={styles.actionIcon}>⏳</Text>
            <Text style={styles.actionText}>Clearance Timeline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigateTo('ImmutableAuditLedger')}>
            <Text style={styles.actionIcon}>⛓️</Text>
            <Text style={styles.actionText}>Audit Ledger</Text>
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  metaCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  title: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 4,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaBadge: {
    backgroundColor: '#0f172a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  metaLabel: {
    color: '#64748b',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#1e293b',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionText: {
    color: '#f8fafc',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  }
});
