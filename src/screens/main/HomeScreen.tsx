import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

const { width, height } = Dimensions.get('window');

// TomTom API Base URL
const TOMTOM_BASE_URL = 'https://api.tomtom.com';
const TOMTOM_API_KEY = 'ylaazc0vefqp7v04y8xgjjlmkzpx8a0n7'; // Replace with your actual API key

// Demo safety data
const SAFETY_ZONES = [
  {
    id: 1,
    latitude: 28.6129,
    longitude: 77.2295,
    safetyScore: 85,
    type: 'safe',
    description: 'Well-lit area with police patrol'
  },
  {
    id: 2,
    latitude: 28.6139,
    longitude: 77.2095,
    safetyScore: 45,
    type: 'moderate',
    description: 'Moderately crowded area'
  },
  {
    id: 3,
    latitude: 28.6119,
    longitude: 77.2495,
    safetyScore: 25,
    type: 'unsafe',
    description: 'Poor lighting, limited visibility'
  }
];

export default function HomeScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  
  const [loading, setLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [route, setRoute] = useState<any>(null);
  const [safetyZones, setSafetyZones] = useState(SAFETY_ZONES);
  
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  
  const [region, setRegion] = useState({
    latitude: 28.6129,
    longitude: 77.2295,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  // Geocode address using TomTom Search API
  const geocodeAddress = async (address: string) => {
    try {
      const response = await fetch(
        `${TOMTOM_BASE_URL}/search/2/geocode/${encodeURIComponent(address)}.json?key=${TOMTOM_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const { lat, lon } = data.results[0].position;
        return { latitude: lat, longitude: lon };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Calculate route using TomTom Routing API
  const calculateRoute = async () => {
    if (!source.trim() || !destination.trim()) {
      Alert.alert('Error', 'Please enter both source and destination');
      return;
    }

    setRouteLoading(true);

    try {
      // For demo, we'll use mock data since we don't have real API key
      // In production, you would use:
      // const startCoords = await geocodeAddress(source);
      // const endCoords = await geocodeAddress(destination);

      // Demo route data
      const demoRoute = {
        coordinates: [
          { latitude: 28.6129, longitude: 77.2295 },
          { latitude: 28.6135, longitude: 77.2255 },
          { latitude: 28.6140, longitude: 77.2215 },
          { latitude: 28.6145, longitude: 77.2175 },
          { latitude: 28.6149, longitude: 77.2095 },
        ],
        distance: '2.5 km',
        duration: '15 mins',
        safetyScore: 72,
        warnings: ['Moderate safety zone encountered', 'Well-lit areas available'],
        alternativeRoutes: [
          {
            coordinates: [
              { latitude: 28.6129, longitude: 77.2295 },
              { latitude: 28.6130, longitude: 77.2275 },
              { latitude: 28.6132, longitude: 77.2235 },
              { latitude: 28.6140, longitude: 77.2155 },
              { latitude: 28.6149, longitude: 77.2095 },
            ],
            distance: '2.8 km',
            duration: '18 mins',
            safetyScore: 85,
            description: 'Safer route through well-lit areas'
          }
        ]
      };

      setRoute(demoRoute);
      
      // Fit map to show the entire route
      if (mapRef.current && demoRoute.coordinates.length > 0) {
        mapRef.current.fitToCoordinates(demoRoute.coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
          animated: true,
        });
      }
      
      Alert.alert(
        'Safe Route Found', 
        `Distance: ${demoRoute.distance}\nDuration: ${demoRoute.duration}\nSafety Score: ${demoRoute.safetyScore}/100\n\nAlternative safer route available with score: ${demoRoute.alternativeRoutes[0].safetyScore}/100`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate route. Please try again.');
    } finally {
      setRouteLoading(false);
    }
  };

  const getSafetyColor = (score: number) => {
    if (score >= 70) return '#4CAF50'; // Green - Safe
    if (score >= 40) return '#FFC107'; // Yellow - Moderate
    return '#F44336'; // Red - Unsafe
  };

  const getSafetyLabel = (score: number) => {
    if (score >= 70) return 'Safe';
    if (score >= 40) return 'Moderate';
    return 'Unsafe';
  };

  const clearRoute = () => {
    setRoute(null);
    setSource('');
    setDestination('');
  };

  const useAlternativeRoute = (altRoute: any) => {
    setRoute({
      ...route,
      coordinates: altRoute.coordinates,
      distance: altRoute.distance,
      duration: altRoute.duration,
      safetyScore: altRoute.safetyScore,
      warnings: ['Using safer alternative route']
    });
    
    if (mapRef.current && altRoute.coordinates.length > 0) {
      mapRef.current.fitToCoordinates(altRoute.coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
        animated: true,
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SafeRoute</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Search Section */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.searchContainer}
      >
        <View style={styles.searchBox}>
          <TextInput
            style={styles.input}
            placeholder="From: Enter starting location"
            placeholderTextColor="#666"
            value={source}
            onChangeText={setSource}
          />
          <TextInput
            style={styles.input}
            placeholder="To: Enter destination"
            placeholderTextColor="#666"
            value={destination}
            onChangeText={setDestination}
          />
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.searchButton, routeLoading && styles.buttonDisabled]} 
              onPress={calculateRoute}
              disabled={routeLoading}
            >
              {routeLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.searchButtonText}>Search Safe Route</Text>
              )}
            </TouchableOpacity>
            
            {route && (
              <TouchableOpacity style={styles.clearButton} onPress={clearRoute}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onRegionChangeComplete={setRegion}
      >
        {/* Safety Zone Markers */}
        {safetyZones.map(zone => (
          <Marker
            key={zone.id}
            coordinate={{
              latitude: zone.latitude,
              longitude: zone.longitude
            }}
          >
            <View style={[styles.marker, { backgroundColor: getSafetyColor(zone.safetyScore) }]}>
              <Text style={styles.markerText}>{zone.safetyScore}</Text>
            </View>
          </Marker>
        ))}

        {/* Main Route Polyline */}
        {route && (
          <Polyline
            coordinates={route.coordinates}
            strokeColor="#007bff"
            strokeWidth={6}
          />
        )}

        {/* Alternative Routes */}
        {route?.alternativeRoutes?.map((altRoute: any, index: number) => (
          <Polyline
            key={index}
            coordinates={altRoute.coordinates}
            strokeColor={getSafetyColor(altRoute.safetyScore)}
            strokeWidth={4}
            strokeColors={[getSafetyColor(altRoute.safetyScore)]}
            lineDashPattern={[5, 5]}
          />
        ))}
      </MapView>

      {/* Safety Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Safety Heatmap</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Safe (70-100)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFC107' }]} />
            <Text style={styles.legendText}>Moderate (40-69)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
            <Text style={styles.legendText}>Unsafe (0-39)</Text>
          </View>
        </View>
      </View>

      {/* Route Info Panel */}
      {route && (
        <View style={styles.routeInfo}>
          <Text style={styles.routeInfoTitle}>Route Details</Text>
          <View style={styles.routeDetails}>
            <View style={styles.routeDetail}>
              <Text style={styles.routeLabel}>Distance:</Text>
              <Text style={styles.routeValue}>{route.distance}</Text>
            </View>
            <View style={styles.routeDetail}>
              <Text style={styles.routeLabel}>Duration:</Text>
              <Text style={styles.routeValue}>{route.duration}</Text>
            </View>
            <View style={styles.routeDetail}>
              <Text style={styles.routeLabel}>Safety Score:</Text>
              <Text style={[styles.routeValue, { color: getSafetyColor(route.safetyScore) }]}>
                {route.safetyScore}/100 ({getSafetyLabel(route.safetyScore)})
              </Text>
            </View>
          </View>
          
          {route.warnings?.map((warning: string, index: number) => (
            <Text key={index} style={styles.warningText}>⚠️ {warning}</Text>
          ))}

          {/* Alternative Routes */}
          {route.alternativeRoutes && route.alternativeRoutes.length > 0 && (
            <View style={styles.alternativeRoutes}>
              <Text style={styles.alternativeTitle}>Alternative Routes:</Text>
              {route.alternativeRoutes.map((altRoute: any, index: number) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.alternativeRoute}
                  onPress={() => useAlternativeRoute(altRoute)}
                >
                  <View style={styles.alternativeRouteInfo}>
                    <Text style={styles.alternativeRouteText}>
                      Route {index + 1}: {altRoute.distance} • {altRoute.duration}
                    </Text>
                    <Text style={[styles.safetyScore, { color: getSafetyColor(altRoute.safetyScore) }]}>
                      Safety: {altRoute.safetyScore}/100
                    </Text>
                  </View>
                  <Text style={styles.useRouteText}>Use Route</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
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
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  logoutText: {
    color: '#666',
    fontWeight: '500',
  },
  searchContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  searchBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    paddingHorizontal: 16,
    height: 50,
    backgroundColor: '#6c757d',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  legend: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  routeInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: 300,
  },
  routeInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  routeDetails: {
    marginBottom: 12,
  },
  routeDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  routeLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  routeValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  warningText: {
    fontSize: 12,
    color: '#FF6B35',
    fontStyle: 'italic',
    marginTop: 4,
  },
  alternativeRoutes: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  alternativeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  alternativeRoute: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  alternativeRouteInfo: {
    flex: 1,
  },
  alternativeRouteText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  safetyScore: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  useRouteText: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: 'bold',
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  markerText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});