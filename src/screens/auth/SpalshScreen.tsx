import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setTimeout(() => {
        router.replace(user ? '/(tabs)' : '/login');
      }, 1200); 
    });

    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>

      {/* LOGO */}
      <Image
        source={require('../../../assets/images/finallogo.png')}
        style={styles.logo}
      />

      {/* TITLE */}
      <Text style={styles.title}>Saarathi</Text>
      <Text style={styles.subtitle}>Walk Safe, Walk Smart!</Text>

      {/* LOADER */}
      <ActivityIndicator size="large" color="#f7d2ebff" style={styles.loader} />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(77, 4, 61, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  logo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 14,
  },

  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#f7f8f8ff',
  },

  subtitle: {
    fontSize: 16,
    color: '#f0f0f0ff',
    marginBottom: 25,
  },

  loader: {
    marginTop: 20,
  },
});
