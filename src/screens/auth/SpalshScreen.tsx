import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/(tabs)');
      } else {
        // @ts-ignore - Temporary ignore for hackathon
        router.replace('/(auth)/login');  // ← Fixed this line
      }
    });
    return unsubscribe;
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SafeRoute</Text>
      <Text style={styles.subtitle}>Your Safety, Our Priority</Text>
      <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
  },
  loader: {
    marginTop: 20,
  },
});