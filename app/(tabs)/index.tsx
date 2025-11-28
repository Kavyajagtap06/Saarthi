import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../src/config/firebase';

export default function MapScreen() {
  const handleLogout = () => {
    signOut(auth).catch(error => console.log('Error logging out: ', error));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Safe Route Map</Text>
      <Text>Main map with TomTom integration will go here</Text>
      {/* Add logout button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#ff4444',
    borderRadius: 5,
  },
  logoutText: {
    color: 'white',
  },
});