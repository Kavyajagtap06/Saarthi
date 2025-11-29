import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onHandleLogin = () => {
    if (email !== '' && password !== '') {
      setLoading(true);
      signInWithEmailAndPassword(auth, email, password)
        .then(() => {
          router.replace('/(tabs)');
        })
        .catch((err) => {
          Alert.alert('Login error', err.message);
        })
        .finally(() => setLoading(false));
    } else {
      Alert.alert('Error', 'Please fill in all fields');
    }
  };

  return (
    <View style={styles.container}>

      {/* LOGO */}
      <Image
        source={require('../../../assets/images/finallogo.png')}
        style={styles.logo}
      />

      {/* TITLE */}
      <Text style={styles.title}>Saarathi</Text>
      <Text style={styles.subtitle}>Walk Safe,Walk Smart!</Text>

      {/* EMAIL INPUT */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        editable={!loading}
      />

      {/* PASSWORD INPUT */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!loading}
      />

      {/* LOGIN BUTTON */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onHandleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login →</Text>
        )}
      </TouchableOpacity>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Don’t have an account?</Text>
        <TouchableOpacity onPress={() => router.push('/signup')}>
          <Text style={styles.footerLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(77, 4, 61, 1)',  
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },

  logo: {
    width: 130,
    height: 130,
    borderRadius: 65,
    marginBottom: 10,
  },

  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#f7f8f8ff',
    marginTop: 10,
  },

  subtitle: {
    fontSize: 16,
    color: '#f0f0f0ff',
    marginBottom: 35,
  },

  input: {
    width: '100%',
    height: 55,
    backgroundColor: '#f7d2ebff',
    borderRadius: 14,
    paddingHorizontal: 15,
    marginBottom: 18,
    fontSize: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },

  button: {
    width: '100%',
    height: 55,
    backgroundColor: '#8b1757ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 8,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },

  footer: {
    flexDirection: 'row',
    marginTop: 25,
  },

  footerText: {
    color: '#ecf3f3ff',
    fontSize: 15,
  },

  footerLink: {
    color: '#df1fcfff',
    fontWeight: '700',
    fontSize: 15,
  },
});
