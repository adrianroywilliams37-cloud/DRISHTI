import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useProjects } from '../hooks/useProjects';

export default function MinistryAnalystDashboard() {
  const { projects, loading } = useProjects();

  const stats = useMemo(() => {
    if (!projects || projects.length === 0) return null;
    
    const activeProjects = projects.length;
    const highRiskCount = projects.filter(p => p.riskBand?.toLowerCase() === 'high').length;
    
    const capitalAtRisk = projects
      .filter(p => p.riskBand?.toLowerCase() === 'high')
      .reduce((sum, p) => sum + (p.sanctioned_cost_cr || 0), 0);
      
    const avgSlippage = projects.reduce((sum, p) => sum + (p.scheduleSlipMonths || 0), 0) / activeProjects;

    const bottlenecks = {};
    projects.forEach(p => {
      if (Array.isArray(p.risk_reasons)) {
        p.risk_reasons.forEach(reason => {
          bottlenecks[reason] = (bottlenecks[reason] || 0) + 1;
        });
      }
    });

    const topBottlenecks = Object.entries(bottlenecks)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); 

    return {
      activeProjects,
      highRiskCount,
      capitalAtRisk,
      avgSlippage: avgSlippage.toFixed(1),
      topBottlenecks,
    };
  }, [projects]);

  if (loading && !stats) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#14253a" />
        <Text style={{ marginTop: 10, fontFamily: 'serif', color: '#14253a' }}>SYNCING WITH CENTRAL LEDGER...</Text>
      </View>
    );
  }

  const formatCurrency = (val) => {
    if (val >= 1000) return `₹ ${(val / 1000).toFixed(1)}k Cr`;
    return `₹ ${val} Cr`;
  };

  const getBarColor = (index) => {
    const colors = ['#a43820', '#9c7a2a', '#3f6e64'];
    return colors[index % colors.length];
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Ministry Analyst Overview</Text>
        <Text style={styles.subtitle}>PORTFOLIO RISK EXPOSURE</Text>
      </View>

      {stats ? (
        <>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.activeProjects}</Text>
              <Text style={styles.statLabel}>Active Projects</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.highRiskCount}</Text>
              <Text style={styles.statLabel}>High Risk</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(stats.capitalAtRisk)}</Text>
              <Text style={styles.statLabel}>Capital at Risk</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.avgSlippage} mo</Text>
              <Text style={styles.statLabel}>Avg Slippage</Text>
            </View>
          </View>

          {stats.topBottlenecks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CRITICAL BOTTLENECKS</Text>
              
              {stats.topBottlenecks.map(([reason, count], index) => {
                const maxCount = stats.topBottlenecks[0][1];
                const percentage = Math.max(10, (count / maxCount) * 100);
                
                return (
                  <View key={reason} style={styles.bottleneckCard}>
                    <View style={styles.bottleneckHeader}>
                      <Text style={styles.bottleneckName}>{reason}</Text>
                      <Text style={styles.bottleneckCount}>{count} Projects</Text>
                    </View>
                    <View style={styles.progressBarBackground}>
                      <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: getBarColor(index) }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ACTIVE PROJECTS LIST */}
          <View style={[styles.section, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>ACTIVE PROJECTS</Text>
            {projects && projects.length > 0 ? (
              projects.map(p => (
                <TouchableOpacity 
                  key={p.id || p.project_id} 
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#d0d5d2',
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onPress={() => navigation.navigate('ProjectDetails', { projectId: p.id || p.project_id })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'serif', fontSize: 16, fontWeight: 'bold', color: '#14253a', marginBottom: 4 }}>{p.project_name || p.name}</Text>
                    <Text style={{ fontFamily: 'monospace', fontSize: 12, color: '#3b5978' }}>{p.project_id || p.id} • {p.sector}</Text>
                  </View>
                  <View style={{ 
                    backgroundColor: p.riskBand === 'High' ? '#a43820' : '#3f6e64', 
                    paddingHorizontal: 8, 
                    paddingVertical: 4,
                    borderRadius: 4 
                  }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {p.riskBand || 'Unknown'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={{ fontFamily: 'monospace', color: '#6b7f5b', fontSize: 12 }}>No active projects found.</Text>
            )}
          </View>

        </>
      ) : (
        <View style={{ alignItems: 'center', padding: 20 }}>
          <Text style={{ fontFamily: 'monospace', color: '#a43820' }}>NO DATA AVAILABLE</Text>
        </View>
      )}
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
    color: '#6b7f5b',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d0d5d2',
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  statValue: {
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#14253a',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#14253a',
    textTransform: 'uppercase',
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
    marginBottom: 16,
  },
  bottleneckCard: {
    marginBottom: 16,
  },
  bottleneckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bottleneckName: {
    fontFamily: 'serif',
    fontSize: 14,
    color: '#14253a',
  },
  bottleneckCount: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#a43820',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#eef1f0',
    borderWidth: 1,
    borderColor: '#d0d5d2',
  },
  progressBarFill: {
    height: '100%',
  }
});
