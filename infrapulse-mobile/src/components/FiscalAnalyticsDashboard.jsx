import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useProjects } from '../hooks/useProjects';

export default function FiscalAnalyticsDashboard({ navigation }) {
  const { projects, loading } = useProjects();

  const stats = useMemo(() => {
    const totalSanctioned = projects.reduce((acc, p) => acc + (p.sanctioned_cost_cr || 0), 0);
    const totalRevised = projects.reduce((acc, p) => acc + (p.latest_revised_cost_cr || 0), 0);
    const totalOverrun = totalRevised - totalSanctioned;
    const fundUtilized = projects.reduce((acc, p) => acc + ((p.latest_revised_cost_cr || 0) * ((p.financial_progress_pct || 0) / 100)), 0);
    const utilizationPct = totalRevised > 0 ? (fundUtilized / totalRevised) * 100 : 0;
    return {
      totalSanctioned,
      totalRevised,
      totalOverrun,
      fundUtilized,
      utilizationPct: utilizationPct.toFixed(1)
    };
  }, [projects]);

  const overrunProjects = useMemo(() => {
    return [...projects]
      .filter(p => p.costOverrunCr > 0)
      .sort((a, b) => b.costOverrunCr - a.costOverrunCr)
      .slice(0, 4)
      .map(p => ({
        id: p.id.split('-')[0].toUpperCase(),
        name: p.name,
        sector: p.sector,
        overrunCr: p.costOverrunCr,
        overrunPct: p.costOverrunPct
      }));
  }, [projects]);

  if (loading && projects.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3f6e64" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color="#14253a" size={24} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>FISCAL ANALYTICS</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Capital & Burn Rate</Text>
          <Text style={styles.subtitle}>PORTFOLIO LEDGER MACRO</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Sanctioned</Text>
            <Text style={styles.statValue}>₹{stats.totalSanctioned.toLocaleString()}</Text>
            <Text style={styles.statSubValue}>Cr</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Revised Capex</Text>
            <Text style={[styles.statValue, { color: '#a43820' }]}>₹{stats.totalRevised.toLocaleString()}</Text>
            <Text style={[styles.statSubValue, { color: '#a43820' }]}>+₹{stats.totalOverrun.toLocaleString()} Cr</Text>
          </View>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View>
              <Text style={styles.statLabel}>Total Utilized Fund</Text>
              <Text style={[styles.statValue, { color: '#3f6e64' }]}>₹{Math.round(stats.fundUtilized).toLocaleString()} Cr</Text>
            </View>
            <View style={{ width: '40%' }}>
              <Text style={[styles.statLabel, { textAlign: 'right', marginBottom: 4 }]}>{stats.utilizationPct}% Burn</Text>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${Math.min(stats.utilizationPct, 100)}%`, backgroundColor: '#3f6e64' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Heatmap Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CAPITAL OVERRUN HEATMAP</Text>
            <Text style={styles.sectionSubtitle}>Top 4 Critical Assets</Text>
          </View>
          
          {overrunProjects.map((p, idx) => (
            <View key={idx} style={styles.heatmapCard}>
              <View style={styles.heatmapHeader}>
                <Text style={styles.projectName}>{p.name}</Text>
                <Text style={styles.projectId}>{p.id}</Text>
              </View>
              
              <View style={styles.heatmapDetails}>
                <View>
                  <Text style={styles.detailLabel}>Sector</Text>
                  <Text style={styles.detailValue}>{p.sector}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.detailValue, { color: '#a43820', fontFamily: 'monospace', fontWeight: 'bold' }]}>
                    +₹{p.overrunCr} Cr
                  </Text>
                  <Text style={[styles.detailLabel, { color: '#a43820' }]}>
                    +{p.overrunPct}%
                  </Text>
                </View>
              </View>

              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${Math.min(p.overrunPct, 100)}%`, backgroundColor: p.overrunPct > 15 ? '#a43820' : '#d97706' }]} />
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', 
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 4,
  },
  appBarTitle: {
    fontFamily: 'serif',
    fontWeight: 'bold',
    fontSize: 16,
    color: '#0f172a',
    letterSpacing: 1,
  },
  content: {
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
    fontSize: 11,
    color: '#64748b',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  statValue: {
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  statSubValue: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#64748b',
  },
  statLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  section: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
    marginBottom: 32,
  },
  sectionHeader: {
    backgroundColor: '#7f1d1d',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#450a0a',
  },
  sectionTitle: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fef2f2',
  },
  sectionSubtitle: {
    fontFamily: 'serif',
    fontSize: 10,
    color: '#fca5a5',
    marginTop: 2,
  },
  heatmapCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  heatmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectName: {
    fontFamily: 'serif',
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  projectId: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#64748b',
  },
  heatmapDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontFamily: 'sans-serif',
    fontSize: 13,
    color: '#0f172a',
    marginTop: 2,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#f1f5f9',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
  }
});
