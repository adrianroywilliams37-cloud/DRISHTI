import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useProjects } from '../hooks/useProjects';
import { useSession } from '../context/SessionContext';
import { getApiUrl } from '../utils/network';
import CreateProjectModal from './CreateProjectModal';
import PasswordConfirmModal from './PasswordConfirmModal';

export default function ApexDecisionMakerDashboard() {
  const { projects, loading, refreshProjects } = useProjects();
  const { activeUser: user } = useSession();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProjectForComplete, setSelectedProjectForComplete] = useState(null);

  const sectorStats = useMemo(() => {
    if (!projects || projects.length === 0) return null;
    
    const stats = {};
    
    projects.forEach(p => {
      const sector = p.sector || 'Other';
      if (!stats[sector]) {
        stats[sector] = { high: 0, medium: 0, low: 0, total: 0 };
      }
      
      const risk = (p.riskBand || 'low').toLowerCase();
      if (risk === 'high') stats[sector].high++;
      else if (risk === 'medium') stats[sector].medium++;
      else stats[sector].low++;
      
      stats[sector].total++;
    });
    
    return Object.entries(stats)
      .map(([name, counts]) => ({ name, ...counts }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4); // Show top 4 sectors
  }, [projects]);

  const highRiskTotal = useMemo(() => {
    if (!projects) return 0;
    return projects.filter(p => p.riskBand?.toLowerCase() === 'high').length;
  }, [projects]);

  const handleCreateProject = async (data, password) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/projects/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-password': password
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create project');
      }
      
      setShowCreateModal(false);
      Alert.alert('Success', 'Project successfully created and added to the ledger.');
      if (refreshProjects) refreshProjects();
    } catch (err) {
      throw err;
    }
  };

  const handleMarkComplete = async (password) => {
    if (!selectedProjectForComplete) return;
    try {
      const response = await fetch(`${getApiUrl()}/api/projects/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-password': password
        },
        body: JSON.stringify({ id: selectedProjectForComplete.id || selectedProjectForComplete.project_id })
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to complete project');
      }
      
      setSelectedProjectForComplete(null);
      Alert.alert('Success', 'Project successfully marked as completed.');
      if (refreshProjects) refreshProjects();
    } catch (err) {
      throw err;
    }
  };

  if (loading && !sectorStats) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#14253a" />
        <Text style={{ marginTop: 10, fontFamily: 'serif', color: '#14253a' }}>SYNCING WITH CENTRAL LEDGER...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      <CreateProjectModal 
        visible={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
      />
      
      <PasswordConfirmModal
        visible={!!selectedProjectForComplete}
        actionName={`Mark Project ${selectedProjectForComplete?.project_id || selectedProjectForComplete?.id} as Complete`}
        onClose={() => setSelectedProjectForComplete(null)}
        onConfirm={handleMarkComplete}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Apex Decision Maker</Text>
          <Text style={styles.subtitle}>NATIONAL INFRASTRUCTURE COMMAND</Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
          <Text style={styles.createButtonText}>+ New Project</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.alertPanel}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertTitle}>SYSTEM ALERTS</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{highRiskTotal} CRITICAL</Text>
          </View>
        </View>
        <Text style={styles.alertBody}>
          {highRiskTotal > 0 
            ? `AI/ML models detect ${highRiskTotal} projects exhibiting high-risk patterns (schedule slippage, cost overrun, or persistent bottlenecks). Immediate PMG intervention recommended.` 
            : `All tracked projects are currently within acceptable risk parameters. No immediate intervention required.`}
        </Text>
      </View>

      {sectorStats ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECTORAL RISK DISTRIBUTION</Text>
          
          {sectorStats.map((sector) => (
            <View key={sector.name} style={styles.sectorRow}>
              <Text style={styles.sectorName} numberOfLines={1}>{sector.name}</Text>
              <View style={styles.sectorBar}>
                {sector.high > 0 && <View style={[styles.barSegment, { flex: sector.high, backgroundColor: '#a43820' }]} />}
                {sector.medium > 0 && <View style={[styles.barSegment, { flex: sector.medium, backgroundColor: '#9c7a2a' }]} />}
                {sector.low > 0 && <View style={[styles.barSegment, { flex: sector.low, backgroundColor: '#3f6e64' }]} />}
              </View>
            </View>
          ))}
          
          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#a43820' }]} /><Text style={styles.legendText}>High</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#9c7a2a' }]} /><Text style={styles.legendText}>Medium</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#3f6e64' }]} /><Text style={styles.legendText}>Low</Text></View>
          </View>
        </View>
      ) : (
        <View style={{ alignItems: 'center', padding: 20 }}>
          <Text style={{ fontFamily: 'monospace', color: '#a43820' }}>NO DATA AVAILABLE</Text>
        </View>
      )}

      {/* ACTIVE PROJECTS LIST */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACTIVE PROJECTS</Text>
        {projects && projects.length > 0 ? (
          projects.map(p => (
            <TouchableOpacity 
              key={p.id || p.project_id} 
              style={styles.projectCard}
              onPress={() => navigation.navigate('ProjectDetails', { projectId: p.id || p.project_id })}
            >
              <View style={styles.projectInfo}>
                <Text style={styles.projectName}>{p.project_name || p.name}</Text>
                <Text style={styles.projectSubtitle}>{p.project_id || p.id} • {p.sector}</Text>
              </View>
              <TouchableOpacity 
                style={styles.completeButton}
                onPress={() => setSelectedProjectForComplete(p)}
              >
                <Text style={styles.completeButtonText}>Mark Complete</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.alertBody}>No active projects found.</Text>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef1f0', // Paper
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#d0d5d2',
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#14253a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  createButtonText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 12,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#14253a', // Ink
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#3b5978',
    letterSpacing: 1,
  },
  alertPanel: {
    backgroundColor: 'rgba(164, 56, 32, 0.05)',
    borderWidth: 1,
    borderColor: '#a43820',
    padding: 16,
    marginBottom: 24,
    borderRadius: 0,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#a43820',
  },
  badge: {
    backgroundColor: '#a43820',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertBody: {
    fontFamily: 'serif',
    fontSize: 14,
    color: '#14253a',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d0d5d2',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  sectionTitle: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#14253a',
    marginBottom: 24,
  },
  sectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectorName: {
    width: 80,
    fontFamily: 'serif',
    fontSize: 14,
    color: '#14253a',
    fontWeight: '600',
  },
  sectorBar: {
    flex: 1,
    flexDirection: 'row',
    height: 12,
    backgroundColor: '#eef1f0',
    borderWidth: 1,
    borderColor: '#d0d5d2',
  },
  barSegment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#d0d5d2',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  legendText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#14253a',
  },
  projectCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eef1f0',
  },
  projectInfo: {
    flex: 1,
    marginRight: 10,
  },
  projectName: {
    fontFamily: 'serif',
    fontWeight: 'bold',
    color: '#14253a',
    fontSize: 14,
    marginBottom: 4,
  },
  projectSubtitle: {
    fontFamily: 'monospace',
    color: '#3b5978',
    fontSize: 10,
  },
  completeButton: {
    backgroundColor: '#fca5a5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ef4444'
  },
  completeButtonText: {
    color: '#991b1b',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  }
});
