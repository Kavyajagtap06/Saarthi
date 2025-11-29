import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useRouter } from 'expo-router';
import PurplePopup from '../../../components/PurplePopup';

export default function SignupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupTitle, setPopupTitle] = useState('Success 🎉');

  const showPopup = (title: string, message: string) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupVisible(true);
  };

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      showPopup('Error ❗', 'Please enter your full name');
      return false;
    }

    if (!formData.email.trim()) {
      showPopup('Error ❗', 'Please enter your email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showPopup('Error ❗', 'Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      showPopup('Error ❗', 'Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showPopup('Error ❗', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const onHandleSignup = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: formData.fullName,
      });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: formData.fullName,
        email: formData.email,
        createdAt: new Date().toISOString(),
        aadhaarVerified: false,
        preferences: {
          notifications: true,
          safeRouteEnabled: true,
          emergencyContacts: [],
        },
      });

      showPopup(
        'Success 🎉',
        'Account created successfully! Please verify your Aadhaar to continue.'
      );
    } catch (error: any) {
      console.error('Signup error:', error);

      let errorMessage = 'Failed to create account. Please try again.';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage =
            'This email is already registered. Please use a different email or login.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'The email address is invalid.';
          break;
        case 'auth/weak-password':
          errorMessage = 'The password is too weak. Please use a stronger password.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          errorMessage = error.message || 'An unexpected error occurred.';
      }

      showPopup('Signup Failed ❗', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Purple Custom Popup */}
      <PurplePopup
        visible={popupVisible}
        onClose={() => setPopupVisible(false)}
        onContinue={() => {
          setPopupVisible(false);
          router.replace('/verification');
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.innerContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join Saarathi for safer journeys</Text>
            </View>

            <View style={styles.securityBadge}>
              <Text style={styles.securityBadgeText}>🔒 Secure & Encrypted</Text>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#999"
                value={formData.fullName}
                onChangeText={text => handleInputChange('fullName', text)}
                autoCapitalize="words"
                editable={!loading}
              />

              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={text => handleInputChange('email', text)}
                editable={!loading}
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry={true}
                value={formData.password}
                onChangeText={text => handleInputChange('password', text)}
                editable={!loading}
              />

              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                secureTextEntry={true}
                value={formData.confirmPassword}
                onChangeText={text => handleInputChange('confirmPassword', text)}
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={onHandleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.push('/login')}
                  disabled={loading}
                >
                  <Text style={styles.footerLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.verificationInfo}>
              <Text style={styles.verificationTitle}>Why Aadhaar Verification?</Text>
              <Text style={styles.verificationText}>
                • Enhanced security for your account{'\n'}
                • Faster emergency response{'\n'}
                • Access to premium safety features{'\n'}
                • Verified user community
              </Text>
            </View>

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(77, 4, 61, 1)',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingVertical: 40,
    justifyContent: 'flex-start',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f7f8f8ff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#f0f0f0ff',
    textAlign: 'center',
  },
  securityBadge: {
    backgroundColor: '#f7d2ebff',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#8b1757ff',
  },
  securityBadgeText: {
    color: '#8b1757ff',
    fontWeight: '600',
    fontSize: 14,
  },
  form: {
    width: '100%',
    marginBottom: 25,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: '#f7d2ebff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#4a2c5a',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#8b1757ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  footerText: {
    color: '#ecf3f3ff',
    fontSize: 16,
  },
  footerLink: {
    color: '#df1fcfff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verificationInfo: {
    backgroundColor: '#f7d2ebff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5c154aff',
    marginBottom: 12,
  },
  verificationText: {
    fontSize: 14,
    color: '#5c154aff',
    lineHeight: 20,
  },
  termsContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  termsText: {
    fontSize: 14,
    color: '#ecf3f3ff',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#df1fcfff',
    fontWeight: '500',
  },
});
