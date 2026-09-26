import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useProjects } from '../hooks/useProjects';

export default function NodalSectorPortfolios({ navigation }) {
  const { projects } = useProjects();
  const [expandedSector, setExpandedSector] = useState(null);

  // Group projects by sector
  const sectors = useMemo(() => {
    if (!projects) return {};
    return projects.reduce((acc, project) => {
      const sectorName = project.sector || 'Uncategorized';
      if (!acc[sectorName]) {
        acc[sectorName] = {
          projects: [],
          totalBudget: 0,
          totalProgress: 0,
        };
      }
      acc[sectorName].projects.push(project);
      acc[sectorName].totalBudget += project.sanctioned_cost_cr || 0;
      acc[sectorName].totalProgress += project.physical_progress_pct || project.progress || 0;
      return acc;
    }, {});
  }, [projects]);

  const toggleSector = (sectorName) => {
    setExpandedSector(expandedSector === sectorName ? null : sectorName);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sector Portfolios</Text>
        <Text style={styles.subtitle}>REGIONAL ASSET ALLOCATION</Text>
      </View>

      {Object.keys(sectors).map((sectorName) => {
        const sectorData = sectors[sectorName];
        const isExpanded = expandedSector === sectorName;
        const avgProgress = sectorData.projects.length > 0 
          ? Math.round(sectorData.totalProgress / sectorData.projects.length) 
          : 0;

        return (
          <View key={sectorName} style={styles.card}>
            <TouchableOpacity 
              style={styles.cardHeader} 
              onPress={() => toggleSector(sectorName)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.sectorName}>{sectorName.toUpperCase()}</Text>
                <Text style={styles.projectCount}>{sectorData.projects.length} Active</Text>
              </View>
              <Text style={{ fontSize: 20, color: '#14253a' }}>
                {isExpanded ? '−' : '+'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.detailText}>Total Sanctioned: ₹ {sectorData.totalBudget.toLocaleString()} Cr</Text>
            <Text style={styles.detailText}>Avg Physical Progress: {avgProgress}%</Text>
            
            {isExpanded && (
              <View style={styles.projectList}>
                {sectorData.projects.map(p => (
                  <TouchableOpacity 
                    key={p.id || p.project_id}
                    style={styles.projectItem}
                    onPress={() => navigation.navigate('ProjectDetails', { projectId: p.id || p.project_id })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.projectName}>{p.project_name || p.name}</Text>
                      <Text style={styles.projectIdText}>{p.project_id || p.id}</Text>
                    </View>
                    <View style={[styles.riskBadge, { backgroundColor: p.riskBand === 'High' ? '#a43820' : '#3f6e64' }]}>
                      <Text style={styles.riskText}>{p.riskBand || 'Unknown'}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );
      })}

      {Object.keys(sectors).length === 0 && (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: '#6b7f5b', fontFamily: 'monospace' }}>No sectors found.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef1f0',
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
    color: '#14253a',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#6b7f5b',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d0d5d2',
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectorName: {
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#14253a',
  },
  projectCount: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#3f6e64',
    marginTop: 2,
  },
  detailText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#14253a',
    marginBottom: 4,
  },
  projectList: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eef1f0',
    paddingTop: 12,
  },
  projectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eef1f0',
  },
  projectName: {
    fontFamily: 'serif',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#14253a',
    marginBottom: 4,
  },
  projectIdText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#3b5978',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  riskText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  }
});
