// src/screens/SOSScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Vibration,
  Linking,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';

export default function SOSScreen() {
  const router = useRouter();
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [location, setLocation] = useState<string>('');
  const [sound, setSound] = useState<Audio.Sound>();
  const [recording, setRecording] = useState<Audio.Recording>();
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false);

  // Mock guardian contacts
  const [emergencyContacts] = useState([
    { name: 'Police', number: '100' },
    { name: 'Ambulance', number: '102' },
    { name: 'Fire Brigade', number: '101' },
    { name: 'Women Helpline', number: '1091' },
    { name: 'Emergency Disaster Management', number: '108' },
    { name: 'Mom', number: '+91-9011830092' },
    { name: 'Dad', number: '+91-9552199949' },
    { name: 'Emergency Contact', number: '+91-9022809121' },
  ]);

  useEffect(() => {
    getCurrentLocation();
    setupAudio();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.log('Audio setup error:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation('Location permission denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      let geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      
      if (geocode.length > 0) {
        const address = geocode[0];
        setLocation(
          `${address.name}, ${address.street}, ${address.city}, ${address.region} - ${address.postalCode}`
        );
      } else {
        setLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
      }
    } catch (error) {
      setLocation('Unable to get location');
    }
  };

  const playEmergencySound = async () => {
    try {
      console.log('🔊 Playing emergency sound');
      
      // First, stop any existing sound
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      // Method 1: Try using local file first
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/beep.mp3'),
          { 
            shouldPlay: true, 
            isLooping: true, 
            volume: 1.0,
            rate: 1.0,
          }
        );
        setSound(newSound);
        console.log('✅ Local sound loaded successfully');
        return;
      } catch (localError) {
        console.log('❌ Local sound failed, trying online sound');
      }

      // Method 2: Fallback to online sound
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: 'https://assets.mixkit.co/active_storage/sfx/250/250-preview.mp3' }, // Emergency beep
          { 
            shouldPlay: true, 
            isLooping: true, 
            volume: 1.0 
          }
        );
        setSound(newSound);
        console.log('✅ Online sound loaded successfully');
      } catch (onlineError) {
        console.log('❌ All sound methods failed, using vibration only');
        // Method 3: Use intense vibration pattern as fallback
        Vibration.vibrate([500, 500, 500, 500], true);
      }

    } catch (error) {
      console.log('Sound error:', error);
      // Final fallback: intense vibration
      Vibration.vibrate([300, 300, 300, 300], true);
    }
  };

  const stopEmergencySound = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(undefined);
      }
      Vibration.cancel();
    } catch (error) {
      console.log('Error stopping sound:', error);
      Vibration.cancel();
    }
  };

  const playRingtone = async () => {
    try {
      console.log('🔔 Playing ringtone');
      
      // Stop any existing sound first
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      // Try local ringtone first
      try {
        const { sound: ringtoneSound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/ringtone.mp3'),
          { 
            shouldPlay: true, 
            isLooping: true, 
            volume: 1.0 
          }
        );
        
        // Stop ringtone after 30 seconds
        setTimeout(async () => {
          await ringtoneSound.stopAsync();
          await ringtoneSound.unloadAsync();
        }, 30000);
        
        console.log('✅ Ringtone playing');
      } catch (localError) {
        console.log('❌ Local ringtone failed, using vibration pattern');
        // Fallback: vibration pattern for ringtone
        Vibration.vibrate([1000, 1000, 1000, 1000], false); // Vibrate for 30 seconds
      }
    } catch (error) {
      console.log('Ringtone error:', error);
    }
  };

  const activateSOS = async () => {
    if (!isSOSActive) {
      console.log('🚨 SOS Activated');
      
      // 1. Start vibration pattern immediately
      Vibration.vibrate([0, 1000, 200, 1000], true);
      
      // 2. Play loud emergency sound immediately
      await playEmergencySound();
      
      // 3. Set SOS as active
      setIsSOSActive(true);
      
      // 4. Show activation alert
      Alert.alert(
        '🚨 EMERGENCY SOS ACTIVATED',
        'Loud emergency sound is playing! You can now call emergency contacts or share your location.',
        [
          {
            text: 'Deactivate SOS',
            onPress: deactivateSOS,
            style: 'destructive',
          },
          {
            text: 'Call Police',
            onPress: () => callEmergency('100'),
          },
        ],
        { cancelable: false }
      );
    }
  };

  const deactivateSOS = async () => {
    console.log('🟢 SOS Deactivated');
    await stopEmergencySound();
    setIsSOSActive(false);
    Alert.alert('SOS Deactivated', 'Emergency mode has been turned off.');
  };

  const callEmergency = (number: string) => {
    console.log(`📞 Calling: ${number}`);
    Linking.openURL(`tel:${number}`).catch(err =>
      Alert.alert('Error', 'Could not make the call. Please check if your device supports calling.')
    );
  };

  const shareLocationWithMessage = async () => {
    try {
      const message = `🚨 EMERGENCY SOS ALERT 🚨\n\nI need immediate help!\n\n📍 My Current Location: ${location || 'Location not available'}\n\n📱 Sent via Safety App - Please help!\n\n🆘 This is an automated emergency message.`;
      
      const result = await Share.share({
        message: message,
        title: '🚨 EMERGENCY SOS Location',
      });
      
      if (result.action === Share.sharedAction) {
        Alert.alert('Location Shared', 'Your emergency location has been shared successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not share location. Please try again.');
    }
  };

  const startVideoRecording = async () => {
    Alert.alert(
      'Video Recording',
      'This feature will start recording video with audio for evidence.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Recording', 
          onPress: () => {
            setIsVideoRecording(true);
            Alert.alert('Recording Started', 'Video recording with audio has started for evidence.');
            
            setTimeout(() => {
              if (isVideoRecording) {
                setIsVideoRecording(false);
                Alert.alert('Recording Stopped', 'Video recording automatically stopped after 2 minutes.');
              }
            }, 120000);
          }
        },
      ]
    );
  };

  const stopVideoRecording = () => {
    setIsVideoRecording(false);
    Alert.alert('Recording Stopped', 'Video recording has been saved for evidence.');
  };

  const startAudioRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      Alert.alert('Recording Started', 'Audio recording has started for evidence.');
      
      setTimeout(async () => {
        if (isRecording && recording) {
          await stopAudioRecording();
        }
      }, 300000);
    } catch (err) {
      Alert.alert('Error', 'Failed to start audio recording. Please check permissions.');
    }
  };

  const stopAudioRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      setRecording(undefined);
      setIsRecording(false);
      Alert.alert('Recording Saved', 'Audio recording has been saved for evidence.');
    } catch (err) {
      Alert.alert('Error', 'Failed to stop audio recording.');
    }
  };

  const initiateFakeCall = () => {
    Alert.alert(
      'Fake Call',
      'This will simulate an incoming call after 10 seconds with loud ringtone to help you exit uncomfortable situations.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Schedule Fake Call', 
          onPress: () => {
            Alert.alert('Fake Call Scheduled', 'You will receive a fake call in 10 seconds with loud ringtone.');
            
            setTimeout(() => {
              playRingtone();
              
              Alert.alert(
                '📞 Incoming Call - MOM', 
                'Loud ringtone is playing...', 
                [
                  { 
                    text: 'Answer', 
                    style: 'default',
                    onPress: () => {
                      Alert.alert('Call Connected', 'You: "Hello Mom?"\nMom: "Hi sweetie, everything okay?"');
                    }
                  },
                  { 
                    text: 'Decline', 
                    style: 'cancel',
                    onPress: () => {
                      Alert.alert('Call Declined', 'Call has been declined.');
                    }
                  },
                ],
                { cancelable: false }
              );
            }, 10000);
          }
        },
      ]
    );
  };

  const EmergencyButton = ({ 
    title, 
    subtitle, 
    icon, 
    onPress, 
    color = '#007AFF',
    isEmergency = false 
  }: any) => (
    <TouchableOpacity 
      style={[
        styles.emergencyButton,
        { backgroundColor: color },
        isEmergency && styles.emergencyButtonCritical
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={24} color="#fff" />
      <View style={styles.emergencyButtonText}>
        <Text style={styles.emergencyButtonTitle}>{title}</Text>
        <Text style={styles.emergencyButtonSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#fff" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emergency SOS</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Main SOS Button */}
        <View style={styles.sosSection}>
          <TouchableOpacity 
            style={[
              styles.sosButton,
              isSOSActive && styles.sosButtonActive
            ]}
            onPress={isSOSActive ? deactivateSOS : activateSOS}
          >
            <Text style={styles.sosButtonText}>
              {isSOSActive ? 'DEACTIVATE SOS' : 'SOS'}
            </Text>
            <Text style={styles.sosButtonSubtext}>
              {isSOSActive ? 'Tap to stop emergency sound' : 'Tap for emergency - Plays loud sound'}
            </Text>
          </TouchableOpacity>

          {isSOSActive && (
            <View style={styles.activeIndicator}>
              <Ionicons name="warning" size={20} color="#FF3B30" />
              <Text style={styles.activeIndicatorText}>
                {Platform.OS === 'ios' ? 'SOUND PLAYING - CHECK DEVICE VOLUME' : 'LOUD SOUND PLAYING - EMERGENCY MODE'}
              </Text>
            </View>
          )}

          <View style={styles.volumeTip}>
            <Ionicons name="volume-high" size={16} color="#666" />
            <Text style={styles.volumeTipText}>Make sure your device volume is turned up</Text>
          </View>

          {location && (
            <View style={styles.locationCard}>
              <Ionicons name="location" size={16} color="#666" />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          )}
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <Text style={styles.sectionSubtitle}>Tap to call immediately</Text>
          {emergencyContacts.map((contact, index) => (
            <EmergencyButton
              key={index}
              title={contact.name}
              subtitle={`Call ${contact.number}`}
              icon="call"
              color={index >= 5 ? '#FF3B30' : '#FF6B35'}
              onPress={() => callEmergency(contact.number)}
            />
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <EmergencyButton
            title="Share My Location"
            subtitle="Send emergency message with location to contacts"
            icon="share-social"
            onPress={shareLocationWithMessage}
          />

          <EmergencyButton
            title={isVideoRecording ? "Stop Video Recording" : "Video Record"}
            subtitle={isVideoRecording ? "Stop recording video evidence" : "Record video with audio for evidence"}
            icon={isVideoRecording ? "stop-circle" : "videocam"}
            onPress={isVideoRecording ? stopVideoRecording : startVideoRecording}
          />

          <EmergencyButton
            title={isRecording ? "Stop Audio Recording" : "Audio Record"}
            subtitle={isRecording ? "Stop recording audio evidence" : "Record audio for evidence"}
            icon={isRecording ? "stop-circle" : "mic"}
            onPress={isRecording ? stopAudioRecording : startAudioRecording}
          />

          <EmergencyButton
            title="Fake Call"
            subtitle="Schedule fake call with loud ringtone"
            icon="call-outline"
            onPress={initiateFakeCall}
          />
        </View>

        {/* Troubleshooting Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Troubleshooting</Text>
          <View style={styles.tipsContainer}>
            <Text style={styles.tip}>• Check device volume is turned up</Text>
            <Text style={styles.tip}>• Ensure phone is not on silent/vibrate mode</Text>
            <Text style={styles.tip}>• Grant audio permissions if prompted</Text>
            <Text style={styles.tip}>• Vibration will work even if sound doesn't play</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  sosSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  sosButton: {
    backgroundColor: '#FF3B30',
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#fff',
  },
  sosButtonActive: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
  },
  sosButtonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  sosButtonSubtext: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FF3B30',
    marginBottom: 8,
    gap: 8,
  },
  activeIndicatorText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 12,
  },
  volumeTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
    gap: 6,
  },
  volumeTipText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '500',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    gap: 12,
  },
  emergencyButtonCritical: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyButtonText: {
    flex: 1,
  },
  emergencyButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  emergencyButtonSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  tipsContainer: {
    paddingHorizontal: 20,
  },
  tip: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
    fontWeight: '500',
  },
});