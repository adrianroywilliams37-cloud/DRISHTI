import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { DarkZoneEngine } from '../lib/DarkZoneEngine';

export default function CryptographicCamera({ projectId, onBack }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      
      // Attempt sync on boot
      DarkZoneEngine.syncWithSupabase();
    })();
  }, []);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', color: 'white' }}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.text}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      
      const payload = {
        projectId,
        imageUri: photo.uri,
        latitude: location?.coords?.latitude,
        longitude: location?.coords?.longitude,
        accuracy: location?.coords?.accuracy,
        altitude: location?.coords?.altitude,
      };

      // Save locally (DarkZoneEngine will handle offline buffering or online sync when requested)
      const res = await DarkZoneEngine.saveOfflineData(payload);
      if (res.success) {
        Alert.alert('Capture Secured', 'Cryptographic signature saved to local node storage.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing="back">
        <View style={styles.overlay}>
          {/* Top HUD */}
          <View style={styles.hudTop}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>[X] ABORT CAPTURE</Text>
            </TouchableOpacity>
            <Text style={styles.hudText}>PROJECT: {projectId}</Text>
            {location && (
              <>
                <Text style={styles.hudText}>LAT: {location.coords.latitude.toFixed(6)}</Text>
                <Text style={styles.hudText}>LNG: {location.coords.longitude.toFixed(6)}</Text>
                <Text style={styles.hudText}>ALT: {location.coords.altitude?.toFixed(2) || 'N/A'} m</Text>
              </>
            )}
            <Text style={styles.hudText}>ATOMIC CLOCK: {new Date().toISOString()}</Text>
          </View>

          {/* Crosshair */}
          <View style={styles.crosshair}>
            <View style={styles.crosshairLineHorizontal} />
            <View style={styles.crosshairLineVertical} />
          </View>

          {/* Capture Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  hudTop: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    marginTop: 20,
    marginHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  hudText: {
    color: '#10b981',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 2,
  },
  backButton: {
    marginBottom: 8,
    padding: 4,
    backgroundColor: 'rgba(138, 51, 36, 0.2)', // Mahogany tint
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#8a3324',
  },
  backButtonText: {
    color: '#8a3324', // Mahogany
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 12,
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
  crosshairLineHorizontal: {
    position: 'absolute',
    width: 60,
    height: 2,
    backgroundColor: '#10b981',
    opacity: 0.8,
  },
  crosshairLineVertical: {
    position: 'absolute',
    width: 2,
    height: 60,
    backgroundColor: '#10b981',
    opacity: 0.8,
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  captureInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#10b981',
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  }
});
