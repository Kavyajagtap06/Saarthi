import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        console.log('Auth state changed, user:', user ? user.email : 'No user');
        
        // Use setTimeout to ensure navigation happens after component mount
        setTimeout(() => {
          if (user) {
            console.log('Navigating to tabs');
            router.replace('/(tabs)');
          } else {
            console.log('Navigating to login');
            router.replace('/login');
          }
        }, 1000); // 1 second delay to show splash screen
      },
      (error) => {
        console.error('Auth state error:', error);
        // On error, go to login screen
        setTimeout(() => {
          router.replace('/login');
        }, 1000);
      }
    );

    // Fallback timeout in case auth state never resolves
    const fallbackTimeout = setTimeout(() => {
      console.log('Auth timeout, going to login');
      unsubscribe();
      router.replace('/login');
    }, 5000); // 5 second timeout

    return () => {
      unsubscribe();
      clearTimeout(fallbackTimeout);
    };
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