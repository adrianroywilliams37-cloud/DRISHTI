import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Modal } from 'react-native';
import { useSidebar } from '../context/SidebarContext';
import { useSession } from '../context/SessionContext';
import { User, LogOut, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ProfileSidebar() {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { activeUser, logout } = useSession();

  if (!isSidebarOpen) return null;

  return (
    <Modal visible={isSidebarOpen} transparent={true} animationType="fade" onRequestClose={() => setIsSidebarOpen(false)}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={() => setIsSidebarOpen(false)} activeOpacity={1} />
        <View style={styles.sidebar}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>DRISHTI</Text>
            <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
              <X color="#14253a" size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <User color="#fff" size={32} />
            </View>
            <Text style={styles.userName}>{activeUser?.name || 'Authorized Personnel'}</Text>
            <Text style={styles.userRole}>
              {activeUser?.role === 'nodal' ? 'Field Nodal Officer' : activeUser?.role === 'ministry' ? 'Ministry Analyst' : activeUser?.role === 'apex' ? 'Apex Decision Maker' : 'Guest'}
            </Text>
            {activeUser?.region && (
              <Text style={styles.userRegion}>Region: {activeUser.region}</Text>
            )}
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.sectionLabel}>SYSTEM CONTROLS</Text>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => {
                setIsSidebarOpen(false);
                logout();
              }}
            >
              <LogOut color="#f8fafc" size={20} style={{ marginRight: 12 }} />
              <Text style={styles.logoutText}>TERMINATE SESSION</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>SECURE UPLINK ACTIVE</Text>
            <Text style={styles.footerSub}>v2.0.4-rc</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  sidebar: {
    width: width * 0.75,
    maxWidth: 320,
    backgroundColor: '#ffffff',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontFamily: 'serif',
    fontWeight: 'bold',
    fontSize: 18,
    color: '#14253a',
    letterSpacing: 2,
  },
  profileSection: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  userRole: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  userRegion: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#0f766e',
  },
  menuSection: {
    padding: 24,
    flex: 1,
  },
  sectionLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#b91c1c',
    padding: 14,
    borderRadius: 4,
  },
  logoutText: {
    fontFamily: 'monospace',
    color: '#f8fafc',
    fontWeight: 'bold',
    fontSize: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#0f766e',
    letterSpacing: 1,
    marginBottom: 4,
  },
  footerSub: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#94a3b8',
  }
});
