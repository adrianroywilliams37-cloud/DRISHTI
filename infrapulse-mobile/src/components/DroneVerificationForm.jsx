import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';

export default function DroneVerificationForm({ projectId, onBack }) {
  const [photoUri, setPhotoUri] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Simulated camera capture
  const takePhoto = () => {
    // In a real app we'd use expo-camera or expo-image-picker here.
    // For this prototype, we simulate a successful capture.
    setPhotoUri('https://via.placeholder.com/600x400.png?text=Audit+Capture');
    setCoordinates({ lat: 19.0330, lon: 73.0297 });
  };

  const submitAudit = async () => {
    if (!photoUri || !coordinates) {
      Alert.alert('Incomplete', 'Please capture geotagged proof before submitting.');
      return;
    }

    setIsUploading(true);
    try {
      // Simulate API upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert('SUCCESS', 'Cryptographic Capture uploaded to Orbital Verifier.');
      onBack();
    } catch (e) {
      Alert.alert('ERROR', 'Upload failed. Satellite link offline?');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>[X] ABORT ORBITAL VERIFY</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>DRONE VERIFICATION</Text>
        <Text style={styles.subHeaderText}>ASSET: {projectId}</Text>
      </View>

      <View style={styles.content}>
        {!photoUri ? (
          <TouchableOpacity style={styles.captureArea} onPress={takePhoto}>
            <Text style={styles.captureText}>[ INITIALIZE CAMERA SENSOR ]</Text>
            <Text style={styles.captureSubText}>Awaiting visual telemetry...</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.previewContainer}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
            <View style={styles.overlay}>
              <Text style={styles.overlayText}>
                LAT: {coordinates.lat.toFixed(6)} | LON: {coordinates.lon.toFixed(6)}
              </Text>
              <Text style={styles.overlayText}>
                TIMESTAMP: {new Date().toISOString()}
              </Text>
            </View>
          </View>
        )}

        {photoUri && (
          <TouchableOpacity 
            style={[styles.submitButton, isUploading && styles.submitButtonDisabled]}
            onPress={submitAudit}
            disabled={isUploading}
          >
            <Text style={styles.submitButtonText}>
              {isUploading ? 'UPLOADING...' : 'TRANSMIT TO COMMAND CENTER'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Slate-900
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#020617',
  },
  backButton: {
    marginBottom: 16,
    padding: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  backButtonText: {
    color: '#f59e0b',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 12,
  },
  headerText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 1,
  },
  subHeaderText: {
    color: '#94a3b8',
    fontFamily: 'monospace',
    fontSize: 12,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  captureArea: {
    borderWidth: 2,
    borderColor: '#10b981',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  captureText: {
    color: '#10b981',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
  },
  captureSubText: {
    color: '#64748b',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  previewContainer: {
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
    position: 'relative',
    height: 250,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 8,
  },
  overlayText: {
    color: '#10b981',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#000',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
