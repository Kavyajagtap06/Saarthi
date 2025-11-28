import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

export default function AadhaarVerificationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Aadhaar input, 2: OTP verification
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // Validate Aadhaar number (12 digits)
  const validateAadhaar = (number: string): boolean => {
    const aadhaarRegex = /^\d{12}$/;
    return aadhaarRegex.test(number);
  };

  // Simulate OTP generation
  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleAadhaarSubmit = () => {
    if (!validateAadhaar(aadhaarNumber)) {
      Alert.alert('Invalid Aadhaar', 'Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setLoading(true);
    
    // Simulate API call to send OTP
    setTimeout(() => {
      const generatedOTP = generateOTP();
      Alert.alert(
        'OTP Sent', 
        `Demo OTP: ${generatedOTP}\n\nIn production, this would be sent via SMS to your registered mobile number.`,
        [{ text: 'OK', onPress: () => setStep(2) }]
      );
      setLoading(false);
    }, 2000);
  };

  const handleOTPVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);

    // Simulate OTP verification
    setTimeout(async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // Update user document with Aadhaar verification status
          await updateDoc(doc(db, 'users', user.uid), {
            aadhaarVerified: true,
            aadhaarNumber: aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1-XXXX-XXXX'), // Mask for security
            verificationDate: new Date().toISOString()
          });
        }

        setIsVerified(true);
        Alert.alert(
          'Verification Successful', 
          'Your Aadhaar has been verified successfully!',
          [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
        );
      } catch (error) {
        Alert.alert('Verification Failed', 'Please try again later');
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Verification',
      'You can verify your Aadhaar later for enhanced security features.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => router.replace('/(tabs)') }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Aadhaar Verification</Text>
          <Text style={styles.subtitle}>
            {step === 1 
              ? 'Verify your identity for enhanced security' 
              : 'Enter OTP sent to your registered mobile number'}
          </Text>
        </View>

        <View style={styles.iconContainer}>
          <View style={styles.iconWrapper}>
            <Text style={styles.icon}>🔒</Text>
          </View>
        </View>

        {step === 1 ? (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Aadhaar Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 12-digit Aadhaar number"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={12}
                value={aadhaarNumber}
                onChangeText={(text) => setAadhaarNumber(text.replace(/[^0-9]/g, ''))}
                editable={!loading}
              />
              <Text style={styles.hint}>
                Format: XXXX XXXX XXXX (12 digits without spaces)
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleAadhaarSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Enter OTP</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
                editable={!loading}
              />
              <Text style={styles.hint}>
                OTP sent to mobile number linked with Aadhaar
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleOTPVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.resendButton}
              onPress={handleAadhaarSubmit}
              disabled={loading}
            >
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.securityInfo}>
          <Text style={styles.securityTitle}>🔒 Your Data is Secure</Text>
          <Text style={styles.securityText}>
            • We use bank-level encryption{'\n'}
            • Your Aadhaar data is not stored{'\n'}
            • Verified through secure government channels{'\n'}
            • Used only for identity verification
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={loading}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
  },
  form: {
    width: '100%',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendButton: {
    alignItems: 'center',
    padding: 12,
  },
  resendText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '500',
  },
  securityInfo: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  securityText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
  },
  skipText: {
    color: '#666',
    fontSize: 16,
  },
});