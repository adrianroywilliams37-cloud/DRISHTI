import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CommandCenter() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>DIAGNOSTIC MODE: 3D MODULE ISOLATED.</Text>
      <Text style={styles.subtext}>If you can see this screen, the app is fixed and the crash was originating from the 3D Fiber library on mobile.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05080f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  text: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center'
  },
  subtext: {
    color: '#94a3b8',
    marginTop: 10,
    textAlign: 'center'
  }
});
