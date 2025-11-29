// src/screens/WalkWithMeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Mock companions data
const mockCompanions = [
  {
    id: '1',
    name: 'Priya Sharma',
    avatar: '👩',
    destination: 'Rajiv Chowk Metro Station',
    walkingSpeed: 'normal',
    distance: 120,
    matchScore: 92,
    startTime: '2:30 PM',
    estimatedDuration: 15,
  },
  {
    id: '2',
    name: 'Anjali Patel',
    avatar: '👩',
    destination: 'Karol Bagh Market',
    walkingSpeed: 'slow',
    distance: 200,
    matchScore: 79,
    startTime: '3:00 PM',
    estimatedDuration: 18,
  },
  {
    id: '3',
    name: 'Neha Gupta',
    avatar: '👩',
    destination: 'Select Citywalk Mall',
    walkingSpeed: 'fast',
    distance: 300,
    matchScore: 72,
    startTime: '3:30 PM',
    estimatedDuration: 25,
  },
];

export default function WalkWithMeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [companions, setCompanions] = useState(mockCompanions);

  const connectWithWalker = (companion: any) => {
    Alert.alert(
      'Connect with ' + companion.name,
      `Send a walking request to ${companion.name} who is going to ${companion.destination}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Request', 
          onPress: () => {
            // Simulate sending request
            setTimeout(() => {
              const isAccepted = Math.random() > 0.3; // 70% chance of acceptance
              if (isAccepted) {
                Alert.alert(
                  'Request Accepted! 🎉',
                  `${companion.name} accepted your walking request! You can now walk together.`,
                  [{ text: 'Great!', style: 'default' }]
                );
              } else {
                Alert.alert(
                  'Request Pending',
                  `${companion.name} will respond shortly. We'll notify you when they accept.`,
                  [{ text: 'OK', style: 'cancel' }]
                );
              }
            }, 1500);
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Walking Companions</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="people" size={16} color="#1976D2" />
        <Text style={styles.infoText}>
          People walking nearby who you can join
        </Text>
      </View>

      {/* Companions List */}
      <ScrollView style={styles.content}>
        <View style={styles.companionsList}>
          <Text style={styles.sectionTitle}>
            {companions.length} Companions Available
          </Text>
          <Text style={styles.sectionSubtitle}>
            Connect with people walking similar routes
          </Text>

          {companions.map((companion) => (
            <CompanionCard 
              key={companion.id} 
              companion={companion} 
              onConnect={connectWithWalker}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Companion Card Component
const CompanionCard = ({ companion, onConnect }: { companion: any; onConnect: (companion: any) => void }) => (
  <View style={styles.companionCard}>
    <View style={styles.cardHeader}>
      <Text style={styles.userAvatar}>{companion.avatar}</Text>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{companion.name}</Text>
        <View style={styles.matchInfo}>
          <Text style={styles.matchScore}>{companion.matchScore}% Match</Text>
          <View style={styles.distanceBadge}>
            <Ionicons name="location" size={12} color="#666" />
            <Text style={styles.distanceText}>{companion.distance}m away</Text>
          </View>
        </View>
      </View>
    </View>

    <View style={styles.destinationInfo}>
      <View style={styles.destinationItem}>
        <Ionicons name="flag" size={16} color="#FF6B35" />
        <Text style={styles.destinationText}>Going to {companion.destination}</Text>
      </View>
    </View>

    <View style={styles.companionDetails}>
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>Start Time</Text>
        <Text style={styles.detailValue}>{companion.startTime}</Text>
      </View>
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>Walking Pace</Text>
        <Text style={styles.detailValue}>
          {companion.walkingSpeed.charAt(0).toUpperCase() + companion.walkingSpeed.slice(1)}
        </Text>
      </View>
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>Duration</Text>
        <Text style={styles.detailValue}>{companion.estimatedDuration} min</Text>
      </View>
    </View>

    <TouchableOpacity 
      style={styles.connectButton}
      onPress={() => onConnect(companion)}
    >
      <Ionicons name="walk" size={18} color="#fff" />
      <Text style={styles.connectButtonText}>Connect & Walk Together</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
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
  headerRight: {
    width: 40, // For balance
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    gap: 8,
  },
  infoText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  companionsList: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  companionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  matchScore: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  distanceText: {
    fontSize: 10,
    color: '#666',
  },
  destinationInfo: {
    marginBottom: 12,
  },
  destinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  destinationText: {
    fontSize: 14,
    color: '#666',
  },
  companionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    gap: 8,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});