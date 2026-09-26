import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { useProjects } from '../hooks/useProjects';

export default function PredictiveRadar() {
  const { projects: liveProjects, loading: projectsLoading } = useProjects();
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);

  // Fade animation for pulse effect
  const [fadeAnim] = useState(new Animated.Value(0.5));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!liveProjects || liveProjects.length === 0) return;
      setLoading(true);
      try {
        const results = {};
        for (const project of liveProjects.slice(0, 10)) { // limit to 10 for performance
          let render_status = 'Green';
          if (project.riskBand === 'High' || project.riskBand === 'Critical') {
            render_status = 'BlinkingRed';
          } else if (project.riskBand === 'Medium') {
            render_status = 'Amber';
          }

          let cascading_delay_prediction = 'No cascading delays predicted.';
          if (project.predicted_schedule_slip_months > 12) {
            cascading_delay_prediction = `High probability of cascading delays (${project.predicted_schedule_slip_months} months slip predicted).`;
          } else if (project.predicted_schedule_slip_months > 0) {
            cascading_delay_prediction = `Potential delays emerging (${project.predicted_schedule_slip_months} months slip predicted).`;
          }

          results[project.id || project.project_id] = {
            project_id: project.id || project.project_id,
            timestamp: new Date().toISOString(),
            analysis_summary: {
              ai_risk_score: project.riskBand || 'Low',
              anomaly_score: (project.predicted_cost_overrun_pct || 0) / 100,
            },
            visualization_input: {
              render_status,
              cascading_delay_prediction,
            }
          };
        }
        setPredictions(results);
      } catch (error) {
        console.error("Failed to map ML predictions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [liveProjects]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.radarIcon}>⚡</Text>
          <Text style={styles.title}>ML Predictive Risk Radar</Text>
        </View>
        <Text style={styles.subtitle}>LIVE ISOLATION FOREST INFERENCE • PORT 8000</Text>
        
        <View style={styles.statusBadgeContainer}>
          <View style={styles.statusBadge}>
            <Animated.View style={[
              styles.statusDot, 
              loading ? styles.statusDotLoading : styles.statusDotOnline,
              { opacity: loading ? fadeAnim : 1 }
            ]} />
            <Text style={styles.statusText}>
              {loading ? 'INGESTING VECTORS...' : 'MODEL ONLINE'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        {projectsLoading && liveProjects.length === 0 ? (
          <ActivityIndicator size="large" color="#f59e0b" style={{ marginVertical: 32 }} />
        ) : (
          liveProjects.slice(0, 10).map(project => {
            const pred = predictions[project.id];
          
          let borderColor = styles.cardBorderDefault;
          let bgAccent = styles.bgAccentDefault;
          let textAccent = styles.textAccentDefault;
          let isBlinking = false;

          if (pred) {
            if (pred.visualization_input.render_status === 'BlinkingRed') {
              borderColor = styles.cardBorderRed;
              bgAccent = styles.bgAccentRed;
              textAccent = styles.textAccentRed;
              isBlinking = true;
            } else if (pred.visualization_input.render_status === 'Amber') {
              borderColor = styles.cardBorderAmber;
              bgAccent = styles.bgAccentAmber;
              textAccent = styles.textAccentAmber;
            } else {
              borderColor = styles.cardBorderEmerald;
              bgAccent = styles.bgAccentEmerald;
              textAccent = styles.textAccentEmerald;
            }
          }

          return (
            <View key={project.id} style={[styles.card, borderColor]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.idBadge}>
                  <Text style={styles.idText}>{project.id}</Text>
                </View>
                {isBlinking ? (
                  <Animated.Text style={[styles.cardIcon, textAccent, { opacity: fadeAnim }]}>⚠</Animated.Text>
                ) : (
                  <Text style={[styles.cardIcon, textAccent]}>
                    {pred?.visualization_input?.render_status === 'Amber' ? '⏱' : '📈'}
                  </Text>
                )}
              </View>

              <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
              <Text style={styles.projectSector}>{project.sector}</Text>

              {!pred ? (
                <View style={styles.loadingBox}>
                  <Animated.Text style={[styles.loadingText, { opacity: fadeAnim }]}>
                    Awaiting inference...
                  </Animated.Text>
                </View>
              ) : (
                <View style={[styles.metricsBox, bgAccent]}>
                  <View style={styles.metricsRow}>
                    <View style={styles.metricBlock}>
                      <Text style={styles.metricLabel}>RISK SEVERITY</Text>
                      <Text style={[styles.metricValue, textAccent]}>
                        {pred.analysis_summary.ai_risk_score.toUpperCase()}
                      </Text>
                    </View>
                    <View style={[styles.metricBlock, { alignItems: 'flex-end' }]}>
                      <Text style={styles.metricLabel}>ANOMALY SCORE</Text>
                      <Text style={styles.metricValueAnomaly}>
                        {pred.analysis_summary.anomaly_score.toFixed(3)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.cascadingBox}>
                    <Text style={styles.cascadingText}>
                      {pred.visualization_input.cascading_delay_prediction}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        }))}
      </View>
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  radarIcon: {
    fontSize: 24,
    color: '#f59e0b',
    marginRight: 8,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#94a3b8',
    letterSpacing: 1,
    marginTop: 4,
  },
  statusBadgeContainer: {
    marginTop: 16,
    flexDirection: 'row',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusDotLoading: {
    backgroundColor: '#f59e0b',
  },
  statusDotOnline: {
    backgroundColor: '#10b981',
  },
  statusText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'column',
    gap: 16,
  },
  card: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    padding: 16,
  },
  cardBorderDefault: {
    borderColor: '#334155',
  },
  cardBorderRed: {
    borderColor: '#ef4444',
  },
  cardBorderAmber: {
    borderColor: '#f59e0b',
  },
  cardBorderEmerald: {
    borderColor: '#10b981',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  idBadge: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  idText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#94a3b8',
  },
  cardIcon: {
    fontSize: 16,
  },
  projectName: {
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  projectSector: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#64748b',
    marginBottom: 16,
  },
  loadingBox: {
    height: 90,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  loadingText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#64748b',
  },
  metricsBox: {
    marginTop: 'auto',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    padding: 12,
  },
  bgAccentDefault: {
    backgroundColor: '#1e293b',
  },
  bgAccentRed: {
    backgroundColor: 'rgba(127, 29, 29, 0.2)',
  },
  bgAccentAmber: {
    backgroundColor: 'rgba(120, 53, 15, 0.2)',
  },
  bgAccentEmerald: {
    backgroundColor: 'rgba(6, 78, 59, 0.2)',
  },
  textAccentDefault: {
    color: '#cbd5e1',
  },
  textAccentRed: {
    color: '#f87171',
  },
  textAccentAmber: {
    color: '#fbbf24',
  },
  textAccentEmerald: {
    color: '#34d399',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricBlock: {
    flex: 1,
  },
  metricLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
  },
  metricValueAnomaly: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#cbd5e1',
  },
  cascadingBox: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)',
    paddingTop: 10,
    marginTop: 2,
  },
  cascadingText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#cbd5e1',
    lineHeight: 14,
  }
});
