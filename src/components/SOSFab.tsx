import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SOSFab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const topPosition = insets.top + 10;
  const rightPosition = insets.right + 16;

  return (
    <TouchableOpacity 
      style={[
        styles.sosFab,
        { 
          top: topPosition,
          right: rightPosition,
        }
      ]}
      onPress={() => router.push('/sos')}
      activeOpacity={0.8}
    >
      <Ionicons name="warning" size={18} color="#fff" />
      <Text style={styles.sosText}>SOS</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sosFab: {
    position: 'absolute',
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 9999,
    gap: 6,
  },
  sosText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});