import React, { useState } from 'react';
import { StatusBar, TouchableOpacity, Text, View, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Menu } from 'lucide-react-native';

// Nodal Imports
import NodalDashboard from './src/components/NodalDashboard';
import CryptographicCamera from './src/components/CryptographicCamera';
import BiometricEscrow from './src/components/BiometricEscrow';
import NodalSectorPortfolios from './src/components/NodalSectorPortfolios';
import CommandCenter from './src/components/CommandCenter';
import NodalOfflineForm from './src/components/NodalOfflineForm';

// Ministry Imports
import MinistryAnalystDashboard from './src/components/MinistryAnalystDashboard';
import ProcurementNode from './src/components/ProcurementNode';
import ClearanceTimeline from './src/components/ClearanceTimeline';
import FiscalAnalyticsDashboard from './src/components/FiscalAnalyticsDashboard';

// Apex Imports
import ApexDecisionMakerDashboard from './src/components/ApexDecisionMakerDashboard';
import PredictiveRadar from './src/components/PredictiveRadar';
import OrbitalVerify from './src/components/OrbitalVerify';
import ImmutableAuditLedger from './src/components/ImmutableAuditLedger';

import ProjectDetails from './src/components/ProjectDetails';
import AiQueryChatDrawer from './src/components/AiQueryChatDrawer';

const Stack = createNativeStackNavigator();

// Theme Constants
const PAPER_BG = '#F9FAFB';
const INK = '#0f172a';
const MAHOGANY = '#b91c1c';
const BORDER = '#e2e8f0';

const MenuButton = () => {
  const { setIsSidebarOpen } = useSidebar();
  return (
    <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={{ paddingLeft: 10, paddingRight: 10 }}>
      <Menu color={INK} size={24} />
    </TouchableOpacity>
  );
};

const commonHeaderOptions = {
  headerStyle: { backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTintColor: INK,
  headerTitleStyle: {
    fontFamily: 'serif',
    fontWeight: 'bold',
    letterSpacing: 1,
    fontSize: 16,
  },
  headerBackTitleVisible: false,
  headerTitleAlign: 'center',
  headerShadowVisible: false,
  headerRight: () => <MenuButton />,
};

// 1. Nodal Officer Stack
function NodalStack() {
  return (
    <Stack.Navigator screenOptions={commonHeaderOptions}>
      <Stack.Screen 
        name="NodalDashboard" 
        component={NodalDashboardScreen} 
        options={{ title: 'Field Node: Nodal Officer' }}
      />

      <Stack.Screen 
        name="Camera" 
        component={CameraScreen} 
        options={{ 
          title: 'CRYPTOGRAPHIC CAPTURE',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Biometrics" 
        component={BiometricScreen} 
        options={{ title: 'DBT ESCROW AUTHORIZATION' }}
      />
      <Stack.Screen 
        name="OfflineForm" 
        component={OfflineFormScreen} 
        options={{ title: 'OFFLINE TELEMETRY' }}
      />
      <Stack.Screen 
        name="ProjectDetails" 
        component={ProjectDetails} 
        options={{ title: 'PROJECT DETAILS' }}
      />
    </Stack.Navigator>
  );
}

// 2. Ministry Analyst Stack
function MinistryStack() {
  return (
    <Stack.Navigator screenOptions={commonHeaderOptions}>
      <Stack.Screen 
        name="MinistryDashboard" 
        component={MinistryDashboardScreen} 
        options={{ title: 'Ministry Analyst' }}
      />
      <Stack.Screen 
        name="SectorPortfolios" 
        component={NodalSectorPortfolios} 
        options={{ title: 'SECTOR PORTFOLIOS' }}
      />
      <Stack.Screen 
        name="PredictiveRadar" 
        component={PredictiveRadar} 
        options={{ title: 'PREDICTIVE RADAR (SAR)' }}
      />
      <Stack.Screen 
        name="OrbitalVerify" 
        component={OrbitalVerify} 
        options={{ title: 'ORBITAL VERIFY' }}
      />
      <Stack.Screen 
        name="ProcurementNode" 
        component={ProcurementNode} 
        options={{ title: 'PROCUREMENT NODE (PFMS)' }}
      />
      <Stack.Screen 
        name="ClearanceTimeline" 
        component={ClearanceTimeline} 
        options={{ title: 'CLEARANCE TIMELINE' }}
      />
      <Stack.Screen 
        name="FiscalAnalytics" 
        component={FiscalAnalyticsDashboard} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// 3. Apex Decision Maker Stack
function ApexStack() {
  return (
    <Stack.Navigator screenOptions={commonHeaderOptions}>
      <Stack.Screen 
        name="ApexDashboard" 
        component={ApexDashboardScreen} 
        options={{ title: 'Apex Decision Maker' }}
      />
      <Stack.Screen 
        name="SectorPortfolios" 
        component={NodalSectorPortfolios} 
        options={{ title: 'SECTOR PORTFOLIOS' }}
      />
      <Stack.Screen 
        name="PredictiveRadar" 
        component={PredictiveRadar} 
        options={{ title: 'PREDICTIVE RADAR (SAR)' }}
      />
      <Stack.Screen 
        name="OrbitalVerify" 
        component={OrbitalVerify} 
        options={{ title: 'ORBITAL VERIFY' }}
      />
      <Stack.Screen 
        name="ProcurementNode" 
        component={ProcurementNode} 
        options={{ title: 'PROCUREMENT NODE (PFMS)' }}
      />
      <Stack.Screen 
        name="ClearanceTimeline" 
        component={ClearanceTimeline} 
        options={{ title: 'CLEARANCE TIMELINE' }}
      />
      <Stack.Screen 
        name="AuditLedger" 
        component={ImmutableAuditLedger} 
        options={{ title: 'IMMUTABLE AUDIT LEDGER' }}
      />
      <Stack.Screen 
        name="FiscalAnalytics" 
        component={FiscalAnalyticsDashboard} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProjectDetails" 
        component={ProjectDetails} 
        options={{ title: 'PROJECT DETAILS' }}
      />
    </Stack.Navigator>
  );
}

// 4. Master Stack (All Access)
function MasterStack() {
  return (
    <Stack.Navigator screenOptions={commonHeaderOptions}>
      <Stack.Screen 
        name="MasterDashboard" 
        component={ApexDashboardScreen} 
        options={{ title: 'Master Control' }}
      />
      <Stack.Screen 
        name="ProjectDetails" 
        component={ProjectDetails} 
        options={{ title: 'PROJECT DETAILS' }}
      />
      {/* Nodal Features */}
      <Stack.Screen 
        name="Camera" 
        component={CameraScreen} 
        options={{ title: 'CRYPTOGRAPHIC CAPTURE', headerStyle: { backgroundColor: '#000' }, headerTintColor: '#fff' }}
      />
      <Stack.Screen 
        name="Biometrics" 
        component={BiometricScreen} 
        options={{ title: 'DBT ESCROW AUTHORIZATION' }}
      />
      <Stack.Screen 
        name="OfflineForm" 
        component={OfflineFormScreen} 
        options={{ title: 'OFFLINE TELEMETRY' }}
      />
      {/* Analyst/Apex Features */}
      <Stack.Screen name="SectorPortfolios" component={NodalSectorPortfolios} options={{ title: 'SECTOR PORTFOLIOS' }} />
      <Stack.Screen name="PredictiveRadar" component={PredictiveRadar} options={{ title: 'PREDICTIVE RADAR (SAR)' }} />
      <Stack.Screen name="OrbitalVerify" component={OrbitalVerify} options={{ title: 'ORBITAL VERIFY' }} />
      <Stack.Screen name="ProcurementNode" component={ProcurementNode} options={{ title: 'PROCUREMENT NODE (PFMS)' }} />
      <Stack.Screen name="ClearanceTimeline" component={ClearanceTimeline} options={{ title: 'CLEARANCE TIMELINE' }} />
      <Stack.Screen name="AuditLedger" component={ImmutableAuditLedger} options={{ title: 'IMMUTABLE AUDIT LEDGER' }} />
      <Stack.Screen name="FiscalAnalytics" component={FiscalAnalyticsDashboard} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

import { SessionProvider, useSession } from './src/context/SessionContext';
import { SidebarProvider, useSidebar } from './src/context/SidebarContext';
import ProfileSidebar from './src/components/ProfileSidebar';
import LoginScreen from './src/components/LoginScreen';

function RootNavigator() {
  const { activeUser, loading, logout } = useSession();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <Text style={{ color: '#f8fafc' }}>Establishing Uplink...</Text>
      </View>
    );
  }

  if (!activeUser) {
    return <LoginScreen />;
  }

  if (activeUser.role === 'nodal') {
    return (
      <NavigationContainer>
        <NodalStack />
      </NavigationContainer>
    );
  }

  if (activeUser.role === 'ministry') {
    return (
      <NavigationContainer>
        <MinistryStack />
      </NavigationContainer>
    );
  }

  if (activeUser.role === 'apex') {
    return (
      <NavigationContainer>
        <ApexStack />
      </NavigationContainer>
    );
  }

  if (activeUser.role === 'master') {
    return (
      <NavigationContainer>
        <MasterStack />
      </NavigationContainer>
    );
  }

  // Unknown role fallback
  return (
    <NavigationContainer>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', padding: 24 }}>
        <Text style={{ color: '#f8fafc', fontSize: 28, fontWeight: 'bold', marginBottom: 12, letterSpacing: 2 }}>DRISHTI</Text>
        <Text style={{ color: '#94a3b8', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 32 }}>
          Unauthorized access. Please contact support.
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#b91c1c', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }}
          onPress={logout}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>LOGOUT SESSION</Text>
        </TouchableOpacity>
      </View>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <SidebarProvider>
          <StatusBar barStyle="dark-content" backgroundColor={PAPER_BG} />
          <RootNavigator />
          <ProfileSidebar />
        </SidebarProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

// --- Screen Wrappers with Navigation Props Injected into existing un-connected Dashboards ---

const NodalDashboardScreen = ({ navigation }) => (
  <View style={{flex: 1}}>
    <NodalDashboard 
      onNavigateToCamera={(projectId) => navigation.navigate('Camera', { projectId })}
      onNavigateToBiometric={(projectId) => navigation.navigate('Biometrics', { projectId })}
      onNavigateToTelemetry={(projectId) => navigation.navigate('OfflineForm', { projectId })}
    />
  </View>
);

const MinistryDashboardScreen = ({ navigation }) => {
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <View style={{flex: 1, backgroundColor: '#ffffff'}}>
      <MinistryAnalystDashboard />
      <View style={{ padding: 16, backgroundColor: '#ffffff', borderTopWidth: 1, borderColor: '#e2e8f0' }}>
        <TouchableOpacity 
          style={{ backgroundColor: '#0f172a', padding: 14, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' }} 
          onPress={() => navigation.navigate('SectorPortfolios')}
        >
          <Text style={{ fontFamily: 'monospace', color: '#f8fafc', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 }}>[ SECTOR PORTFOLIOS ]</Text>
        </TouchableOpacity>
          <TouchableOpacity 
            style={{ backgroundColor: '#0f766e', padding: 14, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#115e59' }} 
            onPress={() => navigation.navigate('FiscalAnalytics')}
          >
            <Text style={{ fontFamily: 'monospace', color: '#f8fafc', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 }}>[ FISCAL ANALYTICS ]</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ backgroundColor: '#b91c1c', padding: 14, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#7f1d1d' }} 
            onPress={() => navigation.navigate('PredictiveRadar')}
          >
            <Text style={{ fontFamily: 'monospace', color: '#f8fafc', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 }}>[ SAR PREDICTIVE RADAR ]</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ backgroundColor: '#0f766e', padding: 14, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#115e59' }} 
            onPress={() => navigation.navigate('OrbitalVerify')}
          >
            <Text style={{ fontFamily: 'monospace', color: '#f8fafc', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 }}>[ ORBITAL VERIFY ]</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity 
              style={{ backgroundColor: '#0f172a', padding: 14, width: '48%', alignItems: 'center', borderWidth: 1, borderColor: '#334155' }} 
              onPress={() => navigation.navigate('ProcurementNode')}
            >
              <Text style={{ fontFamily: 'monospace', color: '#f8fafc', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 }}>[ PFMS NODE ]</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ backgroundColor: '#0f172a', padding: 14, width: '48%', alignItems: 'center', borderWidth: 1, borderColor: '#334155' }} 
              onPress={() => navigation.navigate('ClearanceTimeline')}
            >
              <Text style={{ fontFamily: 'monospace', color: '#f8fafc', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 }}>[ CLEARANCES ]</Text>
            </TouchableOpacity>
          </View>
        </View>
      <TouchableOpacity 
        style={{ position: 'absolute', bottom: 20, right: 20, backgroundColor: '#0f766e', width: 56, height: 56, borderRadius: 0, borderWidth: 2, borderColor: '#115e59', justifyContent: 'center', alignItems: 'center' }} 
        onPress={() => setChatOpen(true)}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12, fontFamily: 'monospace' }}>AI</Text>
      </TouchableOpacity>
      <AiQueryChatDrawer visible={chatOpen} onClose={() => setChatOpen(false)} />
    </View>
  );
};

const ApexDashboardScreen = ({ navigation }) => {
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <View style={{flex: 1, backgroundColor: '#ffffff'}}>
      <ApexDecisionMakerDashboard />
      <View style={{ padding: 16, backgroundColor: '#ffffff', borderTopWidth: 1, borderColor: '#e2e8f0' }}>
        <TouchableOpacity 
          style={{ backgroundColor: '#0f172a', padding: 14, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' }} 
          onPress={() => navigation.navigate('SectorPortfolios')}
        >
          <Text style={{ fontFamily: 'monospace', color: '#f8fafc', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 }}>[ SECTOR PORTFOLIOS ]</Text>
        </TouchableOpacity>
          <TouchableOpacity 
            style={{ backgroundColor: '#0f766e', padding: 14, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#115e59' }} 
            onPress={() => navigation.navigate('FiscalAnalytics')}
          >
            <Text style={{ fontFamily: 'monospace', color: '#f8fafc', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 }}>[ FISCAL ANALYTICS ]</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ backgroundColor: '#b91c1c', padding: 14, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#7f1d1d' }} 
            onPress={() => navigation.navigate('PredictiveRadar')}
          >
            <Text style={{ fontFamily: 'monospace', color: '#f8fafc', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 }}>[ SAR PREDICTIVE RADAR ]</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ backgroundColor: '#0f766e', padding: 14, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#115e59' }} 
            onPress={() => navigation.navigate('OrbitalVerify')}
          >
            <Text style={{ fontFamily: 'monospace', color: '#f8fafc', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 }}>[ ORBITAL VERIFY ]</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <TouchableOpacity 
              style={{ backgroundColor: '#0f172a', padding: 14, width: '48%', alignItems: 'center', borderWidth: 1, borderColor: '#334155' }} 
              onPress={() => navigation.navigate('ProcurementNode')}
            >
              <Text style={{ fontFamily: 'monospace', color: '#f8fafc', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 }}>[ PFMS NODE ]</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ backgroundColor: '#0f172a', padding: 14, width: '48%', alignItems: 'center', borderWidth: 1, borderColor: '#334155' }} 
              onPress={() => navigation.navigate('ClearanceTimeline')}
            >
              <Text style={{ fontFamily: 'monospace', color: '#f8fafc', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 }}>[ CLEARANCES ]</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={{ backgroundColor: '#0f172a', padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#334155' }} 
            onPress={() => navigation.navigate('AuditLedger')}
          >
            <Text style={{ fontFamily: 'monospace', color: '#f8fafc', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 }}>[ IMMUTABLE AUDIT LEDGER ]</Text>
          </TouchableOpacity>
        </View>
      <TouchableOpacity 
        style={{ position: 'absolute', bottom: 20, right: 20, backgroundColor: '#0f766e', width: 56, height: 56, borderRadius: 0, borderWidth: 2, borderColor: '#115e59', justifyContent: 'center', alignItems: 'center' }} 
        onPress={() => setChatOpen(true)}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12, fontFamily: 'monospace' }}>AI</Text>
      </TouchableOpacity>
      <AiQueryChatDrawer visible={chatOpen} onClose={() => setChatOpen(false)} />
    </View>
  );
};

const CameraScreen = ({ route, navigation }) => {
  const { projectId } = route.params || {};
  return (
    <CryptographicCamera 
      projectId={projectId}
      onBack={() => navigation.goBack()}
    />
  );
};

const BiometricScreen = ({ route, navigation }) => {
  const { projectId } = route.params || {};
  return (
    <BiometricEscrow 
      projectId={projectId}
      onBack={() => navigation.goBack()}
    />
  );
};

const OfflineFormScreen = ({ route, navigation }) => {
  const { projectId } = route.params || {};
  return (
    <NodalOfflineForm 
      projectId={projectId}
      onBack={() => navigation.goBack()}
    />
  );
};
