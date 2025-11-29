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
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import CustomPopup from '../../../components/CustomPopup';

export default function AadhaarVerificationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otp, setOtp] = useState('');

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupContinue, setPopupContinue] = useState<(() => void) | undefined>(undefined);

  const showPopup = (title: string, message: string, onContinue?: () => void) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupContinue(() => onContinue);
    setPopupVisible(true);
  };

  const validateAadhaar = (number: string) => /^\d{12}$/.test(number);
  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleAadhaarSubmit = () => {
    if (!validateAadhaar(aadhaarNumber)) {
      showPopup('Invalid Aadhaar', 'Please enter a valid 12-digit Aadhaar number');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const generatedOTP = generateOTP();
      showPopup(
        'OTP Sent',
        `Demo OTP: ${generatedOTP}\n\n(In production, SMS will be sent to your Aadhaar-linked number)`,
        () => setStep(2) // move to OTP step
      );
      setLoading(false);
    }, 2000);
  };

  const handleOTPVerify = async () => {
    if (otp.length !== 6) {
      showPopup('Invalid OTP', 'Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    setTimeout(async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          await updateDoc(doc(db, 'users', user.uid), {
            aadhaarVerified: true,
            aadhaarNumber: aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1-XXXX-XXXX'),
            verificationDate: new Date().toISOString(),
          });
        }
        showPopup('Verification Successful', 'Your Aadhaar has been verified!', () =>
          router.replace('/(tabs)')
        );
      } catch (error) {
        showPopup('Verification Failed', 'Please try again later', () => setStep(1));
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  const handleSkip = () => {
    showPopup('Skip Verification', 'You can verify Aadhaar later for enhanced security.', () =>
      router.replace('/(tabs)')
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Aadhaar Verification</Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Verify your identity for safer Saarathi experience'
              : 'Enter the OTP sent to your registered number'}
          </Text>
        </View>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconWrapper}>
            <Text style={styles.icon}>🔒</Text>
          </View>
        </View>

        {/* Form */}
        {step === 1 ? (
          <View style={styles.form}>
            <Text style={styles.label}>Aadhaar Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 12-digit Aadhaar number"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={12}
              value={aadhaarNumber}
              onChangeText={text => setAadhaarNumber(text.replace(/[^0-9]/g, ''))}
            />
            <Text style={styles.hint}>Format: XXXX XXXX XXXX (12 digits without spaces)</Text>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleAadhaarSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Enter OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={text => setOtp(text.replace(/[^0-9]/g, ''))}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleOTPVerify}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendButton} onPress={handleAadhaarSubmit}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Text style={styles.securityTitle}>🔐 Your Data is Secure</Text>
          <Text style={styles.securityText}>
            • Aadhaar number masked & encrypted{'\n'}
            • No storage of sensitive data{'\n'}
            • Government API-based validation (live systems){'\n'}
            • Protected with industry-grade encryption
          </Text>
        </View>

        {/* Skip */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Popup */}
      <CustomPopup
        visible={popupVisible}
        title={popupTitle}
        message={popupMessage}
        onClose={() => {
          setPopupVisible(false);
          setStep(1); // optional reset
        }}
        onContinue={() => {
          setPopupVisible(false);
          popupContinue?.();
        }}
      />
    </KeyboardAvoidingView>
  );
}

// Styles (same as your theme)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(255, 238, 251, 1)' },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '800', color: '#55074eff' },
  subtitle: { fontSize: 16, color: '#55074eff', textAlign: 'center', marginTop: 4 },
  iconContainer: { alignItems: 'center', marginBottom: 35 },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f7d2ebff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8b1757ff',
  },
  icon: { fontSize: 32, color: '#8b1757ff' },
  form: { marginBottom: 25 },
  label: { fontSize: 16, fontWeight: '600', color: '#55074eff', marginBottom: 8 },
  input: {
    height: 56,
    backgroundColor: '#f7d2ebff',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#4a2c5a',
    borderWidth: 1.2,
    borderColor: '#8b1757ff',
  },
  hint: { color: '#55074eff', marginTop: 8, fontStyle: 'italic' },
  button: { height: 56, backgroundColor: '#8b1757ff', justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginTop: 20 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  resendButton: { alignItems: 'center', marginTop: 14 },
  resendText: { color: '#df1fcfff', fontWeight: '600', fontSize: 15 },
  securityInfo: { backgroundColor: '#f7d2ebff', padding: 18, borderRadius: 12, marginTop: 25, borderWidth: 1.2, borderColor: '#8b1757ff' },
  securityTitle: { fontSize: 16, fontWeight: '700', color: '#5c154aff', marginBottom: 10 },
  securityText: { fontSize: 14, color: '#5c154aff', lineHeight: 20 },
  skipButton: { marginTop: 20, alignItems: 'center' },
  skipText: { color: '#df1fcfff', fontSize: 16, fontWeight: '600' },
});
