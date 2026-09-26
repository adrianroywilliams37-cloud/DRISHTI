import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, View, Text } from 'react-native';
import CryptographicCamera from '../components/CryptographicCamera';
import NodalDashboard from '../components/NodalDashboard';
import BiometricEscrow from '../components/BiometricEscrow';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [activeProjectId, setActiveProjectId] = useState(null);

  const handleNavigateToCamera = (projectId) => {
    setActiveProjectId(projectId);
    setCurrentScreen('camera');
  };

  const handleNavigateToBiometric = (projectId) => {
    setActiveProjectId(projectId);
    setCurrentScreen('biometric');
  };

  const handleNavigateToDashboard = () => {
    setActiveProjectId(null);
    setCurrentScreen('dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Top HUD specific to the Field Node */}
      <View style={styles.header}>
        <Text style={styles.headerText}>PAIMANA FIELD NODE</Text>
        <Text style={styles.subText}>OFFICER ID: NODAL-883</Text>
      </View>

      {currentScreen === 'dashboard' && (
        <NodalDashboard 
          onNavigateToCamera={handleNavigateToCamera} 
          onNavigateToBiometric={handleNavigateToBiometric}
        />
      )}
      
      {currentScreen === 'camera' && (
        <CryptographicCamera 
          projectId={activeProjectId || "NHAI-SIH-2026-849"} 
          onBack={handleNavigateToDashboard}
        />
      )}

      {currentScreen === 'biometric' && (
        <BiometricEscrow 
          projectId={activeProjectId || "NHAI-SIH-2026-849"} 
          onBack={handleNavigateToDashboard}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    backgroundColor: '#0f172a',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    alignItems: 'center'
  },
  headerText: {
    color: 'white',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 2
  },
  subText: {
    color: '#10b981', // Emerald green
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: 4
  }
});
