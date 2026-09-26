import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';

export default function OrbitalVerify() {
  const [satelliteMode, setSatelliteMode] = useState('OPTICAL'); // OPTICAL | SAR | NDVI
  const [decision, setDecision] = useState(null); // 'VERIFIED' | 'FLAGGED'
  const [isMeasuring, setIsMeasuring] = useState(false);

  const telemetry = {
    project_id: 'PROJ-2024-MH-0042',
    gps: { lat: 19.0330, lon: 73.0297, timestamp: new Date().toISOString() },
    physical_progress_pct: 47.2,
    labor_headcount: 312,
    primary_bottleneck: 'Land Acquisition Dispute',
    nodal_officer_remarks: 'Construction halted due to ongoing litigation with local landowners.',
  };

  const handleConfirmAlignment = () => setDecision('VERIFIED');
  const handleDiscrepancyFlag = () => setDecision('FLAGGED');

  return (
    <View style={styles.container}>
      {/* Top Controls */}
      <View style={styles.toolbar}>
        <View style={styles.modeSelector}>
          {['OPTICAL', 'SAR', 'NDVI'].map(mode => (
            <TouchableOpacity 
              key={mode}
              style={[styles.modeBtn, satelliteMode === mode && styles.modeBtnActive]}
              onPress={() => setSatelliteMode(mode)}
            >
              <Text style={[styles.modeBtnText, satelliteMode === mode && styles.modeBtnTextActive]}>
                {mode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity 
          style={[styles.measureBtn, isMeasuring && styles.measureBtnActive]}
          onPress={() => setIsMeasuring(!isMeasuring)}
        >
          <Text style={[styles.measureBtnText, isMeasuring && styles.measureBtnTextActive]}>
            MEASURE
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Orbital Satellite Map Mock */}
        <View style={styles.mapContainer}>
          <View style={styles.mapOverlay}>
            <View style={styles.gridContainer}>
              {[...Array(64)].map((_, i) => (
                <View key={i} style={styles.gridCell} />
              ))}
            </View>
            <View style={styles.crosshair}>
              <View style={styles.crosshairH} />
              <View style={styles.crosshairV} />
              <View style={styles.crosshairCenter} />
            </View>
            <View style={styles.mapTooltip}>
              <Text style={styles.tooltipText}>TGT: {telemetry.gps.lat.toFixed(4)}, {telemetry.gps.lon.toFixed(4)}</Text>
              <Text style={styles.tooltipTextMuted}>DECLARED: {telemetry.physical_progress_pct}%</Text>
            </View>
            
            <View style={styles.satelliteStatus}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>LIVE SENTINEL-2 FEED</Text>
            </View>

            <View style={styles.scaleBarContainer}>
              <Text style={styles.scaleText}>5km</Text>
              <View style={styles.scaleBar} />
            </View>
          </View>
        </View>

        {/* Ground Truth Telemetry */}
        <View style={styles.telemetrySection}>
          <Text style={styles.sectionTitle}>GROUND TELEMETRY</Text>
          <Text style={styles.assetId}>ASSET: {telemetry.project_id}</Text>

          {/* Cryptographic Capture Mock */}
          <View style={styles.captureBox}>
            <View style={styles.captureImageMock}>
              <Text style={styles.captureImageText}>NO IMAGE CAPTURED IN OFFLINE MODE</Text>
              <View style={styles.cryptoStamp}>
                <Text style={styles.cryptoStampText}>
                  DRISHTI-CRIP | LAT:{telemetry.gps.lat.toFixed(4)} LON:{telemetry.gps.lon.toFixed(4)}
                </Text>
              </View>
            </View>
            <View style={styles.gpsBar}>
              <Text style={styles.gpsText}>LAT: {telemetry.gps.lat.toFixed(6)}</Text>
              <Text style={styles.gpsText}>LON: {telemetry.gps.lon.toFixed(6)}</Text>
            </View>
          </View>

          <View style={styles.metricsBox}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>PHYSICAL PROGRESS</Text>
              <Text style={styles.metricValue}>{telemetry.physical_progress_pct}%</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>LABOR HEADCOUNT</Text>
              <Text style={styles.metricValue}>{telemetry.labor_headcount}</Text>
            </View>
          </View>

          <View style={styles.bottleneckBox}>
            <Text style={styles.bottleneckLabel}>DECLARED BOTTLENECK</Text>
            <Text style={styles.bottleneckTitle}>{telemetry.primary_bottleneck}</Text>
            <Text style={styles.bottleneckNotes}>"{telemetry.nodal_officer_remarks}"</Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {decision === 'VERIFIED' ? (
              <View style={styles.verifiedBox}>
                <Text style={styles.verifiedText}>✓ GROUND-TO-ORBIT ALIGNMENT CONFIRMED</Text>
              </View>
            ) : decision === 'FLAGGED' ? (
              <View style={styles.flaggedBox}>
                <Text style={styles.flaggedText}>⚠ ESCALATED TO PMG QUEUE. TRANCHE FROZEN.</Text>
              </View>
            ) : (
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.btnVerify} onPress={handleConfirmAlignment}>
                  <Text style={styles.btnVerifyText}>✓ CONFIRM ALIGNMENT</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnFlag} onPress={handleDiscrepancyFlag}>
                  <Text style={styles.btnFlagText}>⚠ FLAG DISCREPANCY</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

        </View>
        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  toolbar: {
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  modeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modeBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  modeBtnText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#94a3b8',
  },
  modeBtnTextActive: {
    color: '#34d399',
    fontWeight: 'bold',
  },
  measureBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  measureBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  measureBtnText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#94a3b8',
  },
  measureBtnTextActive: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    height: 300,
    backgroundColor: '#000000',
    position: 'relative',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCell: {
    width: '12.5%',
    height: '12.5%',
    borderWidth: 0.5,
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 60,
    height: 60,
    marginLeft: -30,
    marginTop: -30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairH: {
    position: 'absolute',
    width: 20,
    height: 1,
    backgroundColor: '#10b981',
  },
  crosshairV: {
    position: 'absolute',
    width: 1,
    height: 20,
    backgroundColor: '#10b981',
  },
  crosshairCenter: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10b981',
  },
  mapTooltip: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: 20,
    marginTop: -20,
    backgroundColor: 'rgba(2, 44, 34, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.6)',
    padding: 8,
  },
  tooltipText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#34d399',
  },
  tooltipTextMuted: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: 'rgba(52, 211, 153, 0.7)',
    marginTop: 2,
  },
  satelliteStatus: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  statusText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#34d399',
    fontWeight: 'bold',
  },
  scaleBarContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    alignItems: 'center',
  },
  scaleText: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#64748b',
    marginBottom: 4,
  },
  scaleBar: {
    width: 60,
    height: 2,
    backgroundColor: '#64748b',
  },
  telemetrySection: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  assetId: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#64748b',
    marginBottom: 16,
  },
  captureBox: {
    marginBottom: 16,
  },
  captureImageMock: {
    height: 160,
    backgroundColor: '#cbd5e1',
    borderWidth: 1,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  captureImageText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#64748b',
  },
  cryptoStamp: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cryptoStampText: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#34d399',
  },
  gpsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: 8,
  },
  gpsText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#34d399',
  },
  metricsBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  metricLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
  },
  metricValue: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  bottleneckBox: {
    borderLeftWidth: 4,
    borderLeftColor: '#b91c1c',
    backgroundColor: '#fef2f2',
    padding: 12,
    marginBottom: 24,
  },
  bottleneckLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#b91c1c',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bottleneckTitle: {
    fontFamily: 'serif',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  bottleneckNotes: {
    fontStyle: 'italic',
    fontSize: 12,
    color: '#475569',
  },
  actionsContainer: {
    marginTop: 8,
  },
  verifiedBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 16,
    alignItems: 'center',
  },
  verifiedText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#047857',
  },
  flaggedBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 16,
    alignItems: 'center',
  },
  flaggedText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#b91c1c',
  },
  actionButtons: {
    gap: 12,
  },
  btnVerify: {
    backgroundColor: '#059669',
    padding: 16,
    alignItems: 'center',
  },
  btnVerifyText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  btnFlag: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#b91c1c',
    padding: 16,
    alignItems: 'center',
  },
  btnFlagText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#b91c1c',
  },
});
