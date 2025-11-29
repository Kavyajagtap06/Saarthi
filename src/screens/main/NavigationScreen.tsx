// src/screens/main/NavigationScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Location, Route } from '../../services/tomtomService';

const { width, height } = Dimensions.get('window');

export default function NavigationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(true);
  const [distanceRemaining, setDistanceRemaining] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isDemoComplete, setIsDemoComplete] = useState(false);
  
  // Parse route data from params
  const route = JSON.parse(params.route as string) as Route;
  const startLocation = JSON.parse(params.startLocation as string) as Location;
  const endLocation = JSON.parse(params.endLocation as string) as Location;
  const routeName = params.routeName as string;
  const totalDistance = parseFloat(params.totalDistance as string);
  const totalDuration = parseFloat(params.totalDuration as string);

 const [isMapReady, setIsMapReady] = useState(false);

useEffect(() => {
  if (route?.coordinates?.length > 0) {
    // Create array that includes both route path and marker locations
    const allCoordinates = [
      startLocation,          // Start marker
      ...route.coordinates,   // Entire route path
      endLocation             // End marker
    ];

    // Fit map to show the entire route with markers, focusing on the main path
    mapRef.current?.fitToCoordinates(allCoordinates, {
      edgePadding: { 
        top: 80,     // Space for header
        right: 50, 
        bottom: 280, // More space for instruction card (increased from 100)
        left: 50 
      },
      animated: true,
    });
    
    // Calculate initial remaining distance and time (start with full values)
    setDistanceRemaining(totalDistance);
    setTimeRemaining(totalDuration);
    
    // Mark map as ready after a short delay to ensure zoom animation completes
    setTimeout(() => {
      setIsMapReady(true);
    }, 1500);
  }
}, [route, totalDistance, totalDuration, startLocation, endLocation]);

// Auto-navigation simulation for demo - starts only when map is ready
useEffect(() => {
  if (!isNavigating || isDemoComplete || !isMapReady) return;

  const demoDuration = 20000; // 20 seconds for demo
  const steps = route.coordinates.length;
  const intervalTime = demoDuration / steps;
  
  const navigationInterval = setInterval(() => {
    setCurrentStep(prev => {
      const newStep = prev + 1;
      
      if (newStep >= steps) {
        clearInterval(navigationInterval);
        setIsDemoComplete(true);
        Alert.alert('🎉 Arrived!', 'You have reached your destination!', [
          { 
            text: 'OK', 
            onPress: () => router.replace('/(tabs)')
          }
        ]);
        return prev;
      }
      
      // Update remaining distance and time based on progress
      const progress = newStep / steps;
      setDistanceRemaining(totalDistance * (1 - progress));
      setTimeRemaining(totalDuration * (1 - progress));
      
      // Optional: Smoothly animate camera to current position without zooming out
      if (route.coordinates[newStep]) {
        mapRef.current?.animateCamera({
          center: {
            latitude: route.coordinates[newStep].latitude,
            longitude: route.coordinates[newStep].longitude,
          },
          zoom: 15, // Fixed zoom level to prevent zooming out
        });
      }
      
      return newStep;
    });
  }, intervalTime);

  return () => clearInterval(navigationInterval);
}, [isNavigating, isDemoComplete, isMapReady, route.coordinates.length, totalDistance, totalDuration, router]);
  const handleEndNavigation = () => {
    Alert.alert(
      'End Navigation',
      'Are you sure you want to end navigation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Navigation', 
          style: 'destructive',
          onPress: () => router.replace('/(tabs)')
        },
      ]
    );
  };

  const getNextInstruction = () => {
    const instructions = [
      'Start navigation',
      'Continue straight for 2 km',
      'Prepare to turn right',
      'Turn right onto Main Road',
      'Keep left at the fork',
      'Continue on Highway',
      'Take exit 45B',
      'Turn left at traffic lights',
      'Destination on your right'
    ];
    
    // Show different instructions based on progress
    const instructionIndex = Math.min(
      Math.floor((currentStep / route.coordinates.length) * instructions.length),
      instructions.length - 1
    );
    
    return instructions[instructionIndex];
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Calculate progress percentage (0% to 100%)
  const progressPercentage = (currentStep / route.coordinates.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleEndNavigation}>
          <Text style={styles.backButtonText}>End</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Navigation - {routeName}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true}
          showsCompass={true}
          showsScale={true}
          zoomEnabled={true}
          rotateEnabled={true}
          followsUserLocation={true}
        >
          {/* Route Polyline */}
          <Polyline
            coordinates={route.coordinates}
            strokeColor="#007AFF"
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />

          {/* Start Marker */}
          <Marker
            coordinate={{
              latitude: startLocation.latitude,
              longitude: startLocation.longitude
            }}
            title="Start"
            description={startLocation.address}
            pinColor="#4CAF50"
          />

          {/* End Marker */}
          <Marker
            coordinate={{
              latitude: endLocation.latitude,
              longitude: endLocation.longitude
            }}
            title="Destination"
            description={endLocation.address}
            pinColor="#F44336"
          />

          {/* Current Position Marker (simulated) */}
          {route.coordinates[currentStep] && (
            <Marker
              coordinate={{
                latitude: route.coordinates[currentStep].latitude,
                longitude: route.coordinates[currentStep].longitude
              }}
              title="Your position"
              pinColor="#007AFF"
            />
          )}
        </MapView>
      </View>

      {/* Navigation Instructions Card */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionText}>{getNextInstruction()}</Text>
        
        <View style={styles.distanceTimeContainer}>
          <View style={styles.distanceTimeItem}>
            <Text style={styles.distanceTimeLabel}>Distance</Text>
            <Text style={styles.distanceTimeValue}>
              {formatDistance(distanceRemaining)}
            </Text>
          </View>
          
          <View style={styles.distanceTimeItem}>
            <Text style={styles.distanceTimeLabel}>Time</Text>
            <Text style={styles.distanceTimeValue}>
              {formatTime(timeRemaining)}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progressPercentage)}% complete
          </Text>
        </View>

        {/* Demo Status */}
        <View style={styles.demoStatusContainer}>
          <Text style={styles.demoStatusText}>
            {isDemoComplete ? '✅ Demo Complete' : '🚗 Demo in progress...'}
          </Text>
          {!isDemoComplete && (
            <Text style={styles.demoSubText}>
              Navigation completing automatically in {Math.round((6000 - (currentStep * (6000 / route.coordinates.length))) / 1000)}s
            </Text>
          )}
        </View>
      </View>

      {/* Demo Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.controlButton, styles.primaryButton]}
          onPress={() => {
            if (isDemoComplete) {
              router.replace('/(tabs)');
            } else {
              Alert.alert(
                'Demo Navigation',
                'The navigation demo will complete automatically in a few seconds. You can watch the progress bar fill and the map update automatically.',
                [{ text: 'OK' }]
              );
            }
          }}
        >
          <Text style={[styles.controlButtonText, styles.primaryButtonText]}>
            {isDemoComplete ? 'Return to Home' : 'View Demo Info'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  placeholder: {
    width: 60,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  instructionsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  instructionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  distanceTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  distanceTimeItem: {
    alignItems: 'center',
  },
  distanceTimeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  distanceTimeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  demoStatusContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  demoStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  demoSubText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  controlsContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  controlButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  primaryButtonText: {
    color: '#fff',
  },
  disabledButtonText: {
    color: '#999',
  },
});