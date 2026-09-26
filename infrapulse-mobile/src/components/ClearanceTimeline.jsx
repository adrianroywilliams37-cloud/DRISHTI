import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useProjects } from '../hooks/useProjects';

const mockEvents = [
  {
    id: 'EVT-001',
    agency: 'Ministry of Environment',
    action: 'Forest Clearance Phase 1',
    date: '2025-01-15',
    status: 'approved',
    delayDays: 0,
    notes: 'Initial clearance granted based on preliminary environmental impact assessment.'
  },
  {
    id: 'EVT-002',
    agency: 'State Land Authority',
    action: 'Land Acquisition Request',
    date: '2025-03-10',
    status: 'approved',
    delayDays: 14,
    notes: 'Approved after a 14-day delay due to local panchayat disputes.'
  },
  {
    id: 'EVT-003',
    agency: 'Ministry of Finance',
    action: 'Tranche 2 Fund Disbursal',
    date: '2025-08-05',
    status: 'pending',
    delayDays: 45,
    notes: 'Pending review of utilization certificates from Tranche 1.'
  },
  {
    id: 'EVT-004',
    agency: 'National Highways Authority',
    action: 'Utility Shifting Clearance',
    date: '2025-09-20',
    status: 'in_progress',
    delayDays: 12,
  }
];

export default function ClearanceTimeline() {
  const { projects } = useProjects();
  const projectName = projects && projects.length > 0 ? projects[0].name : 'Loading...';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Immutable Audit Ledger</Text>
        <Text style={styles.subtitle}>{projectName} • Inter-ministerial requests, clearances, and bottlenecks.</Text>
      </View>

      <View style={styles.timelineContainer}>
        <View style={styles.timelineLine} />
        
        {mockEvents.map((event, idx) => (
          <View key={event.id} style={styles.eventItem}>
            {/* Timeline Node Marker */}
            <View style={[
              styles.nodeMarker,
              event.status === 'approved' ? styles.nodeApproved :
              event.status === 'pending' ? styles.nodePending :
              event.status === 'in_progress' ? styles.nodeInProgress :
              styles.nodeDefault
            ]}>
              {event.status === 'approved' && <Text style={[styles.nodeIcon, {color: '#10b981'}]}>✓</Text>}
              {event.status === 'pending' && <Text style={[styles.nodeIcon, {color: '#ef4444'}]}>!</Text>}
              {event.status === 'in_progress' && <Text style={[styles.nodeIcon, {color: '#f59e0b'}]}>↻</Text>}
            </View>

            {/* Event Content Card */}
            <View style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <View style={styles.eventHeaderLeft}>
                  <Text style={styles.agencyText}>{event.agency}</Text>
                  <Text style={styles.actionText}>{event.action}</Text>
                </View>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateText}>{event.date}</Text>
                </View>
              </View>
              
              <View style={styles.statusRow}>
                <View style={[
                  styles.statusBadge,
                  event.status === 'approved' ? styles.statusBadgeApproved :
                  event.status === 'pending' ? styles.statusBadgePending :
                  event.status === 'in_progress' ? styles.statusBadgeInProgress :
                  styles.statusBadgeDefault
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    event.status === 'approved' ? styles.statusTextApproved :
                    event.status === 'pending' ? styles.statusTextPending :
                    event.status === 'in_progress' ? styles.statusTextInProgress :
                    styles.statusTextDefault
                  ]}>
                    {event.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>

                {event.delayDays > 0 && (
                  <View style={styles.delayContainer}>
                    <Text style={styles.delayText}>🕒 {event.delayDays} Days Delay</Text>
                  </View>
                )}
              </View>

              {event.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesText}>
                    <Text style={styles.notesLabel}>Audit Note:</Text> {event.notes}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#64748b',
  },
  timelineContainer: {
    paddingLeft: 12,
    position: 'relative',
    paddingBottom: 24,
  },
  timelineLine: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  eventItem: {
    paddingLeft: 24,
    marginBottom: 24,
    position: 'relative',
  },
  nodeMarker: {
    position: 'absolute',
    left: -11,
    top: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  nodeApproved: {
    borderColor: '#10b981',
  },
  nodePending: {
    borderColor: '#ef4444',
  },
  nodeInProgress: {
    borderColor: '#f59e0b',
  },
  nodeDefault: {
    borderColor: '#94a3b8',
  },
  nodeIcon: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  eventHeaderLeft: {
    flex: 1,
    paddingRight: 8,
  },
  agencyText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionText: {
    fontFamily: 'serif',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  dateBadge: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dateText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#64748b',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 12,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeApproved: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  statusBadgePending: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  statusBadgeInProgress: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  statusBadgeDefault: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  statusBadgeText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusTextApproved: {
    color: '#047857',
  },
  statusTextPending: {
    color: '#b91c1c',
  },
  statusTextInProgress: {
    color: '#b45309',
  },
  statusTextDefault: {
    color: '#475569',
  },
  delayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  delayText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  notesText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  notesLabel: {
    fontWeight: 'bold',
    color: '#0f172a',
  }
});
