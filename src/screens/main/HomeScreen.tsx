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
  Platform,
  Linking
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { TomTomService, Location } from '../../services/tomtomService';
import SOSFab from '../../components/SOSFab';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [sourceLocation, setSourceLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'working' | 'failed'>('checking');
  
  const [region, setRegion] = useState({
    latitude: 28.6129,
    longitude: 77.2295,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Test API key on component mount
  useEffect(() => {
    checkTomTomAPI();
  }, []);

  const checkTomTomAPI = async () => {
    try {
      setApiStatus('checking');
      const testResult = await TomTomService.testAPIKey();
      
      if (testResult.working) {
        setApiStatus('working');
        console.log('✅ TomTom API is working');
      } else {
        setApiStatus('failed');
        console.log('❌ TomTom API failed:', testResult.message);
        
        // Show alert about API key issue
        Alert.alert(
          'TomTom API Configuration Required',
          testResult.message + '\n\nYou need a valid TomTom API key to use this app.',
          [
            {
              text: 'Get API Key',
              onPress: () => Linking.openURL('https://developer.tomtom.com/user/me/apps')
            },
            { 
              text: 'Try Anyway', 
              style: 'cancel',
              onPress: () => setApiStatus('failed')
            }
          ]
        );
      }
    } catch (error) {
      setApiStatus('failed');
      console.log('❌ API check failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const geocodeLocations = async () => {
    if (!source.trim() || !destination.trim()) {
      Alert.alert('Error', 'Please enter both source and destination');
      return;
    }

    // If API is known to be failed, show guidance
    if (apiStatus === 'failed') {
      Alert.alert(
        'TomTom API Required',
        'You need a valid TomTom API key to search locations.\n\nPlease set up your API key first.',
        [
          {
            text: 'Get API Key',
            onPress: () => Linking.openURL('https://developer.tomtom.com/user/me/apps')
          },
          { text: 'OK', style: 'cancel' }
        ]
      );
      return;
    }

    setLoading(true);

    try {
      console.log('📍 Searching for locations using TomTom API...');
      
      const [start, end] = await Promise.all([
        TomTomService.geocodeAddress(source),
        TomTomService.geocodeAddress(destination)
      ]);

      setSourceLocation(start);
      setDestinationLocation(end);
      setApiStatus('working'); // Mark API as working if we got here

      // Update map to show both locations
      if (mapRef.current) {
        const coordinates = [
          { latitude: start.latitude, longitude: start.longitude },
          { latitude: end.latitude, longitude: end.longitude }
        ];
        
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }

      Alert.alert('Success', 'Locations found using TomTom API! Click "AI Safe Route" to find safe routes.');

    } catch (error: any) {
      console.error('🚨 TomTom API Error:', error);
      
      // Handle specific error cases
      if (error.message.includes('403') || error.message.includes('API Key')) {
        setApiStatus('failed');
        Alert.alert(
          'TomTom API Key Issue',
          'Your TomTom API key is invalid or not configured properly.\n\nPlease check your API key in the TomTom developer portal.',
          [
            {
              text: 'Fix API Key',
              onPress: () => Linking.openURL('https://developer.tomtom.com/user/me/apps')
            },
            { text: 'OK', style: 'cancel' }
          ]
        );
      } else if (error.message.includes('No results found')) {
        Alert.alert(
          'Location Not Found',
          error.message + '\n\nPlease try:\n• More specific addresses\n• City names\n• Landmark names'
        );
      } else if (error.message.includes('Network request failed')) {
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Search Error', error.message || 'Failed to find locations. Please try different addresses.');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateRoute = async () => {
    if (!sourceLocation || !destinationLocation) {
      Alert.alert('Error', 'Please find locations first');
      return;
    }

    // Navigate to results screen with real coordinates
    router.push({
      pathname: '/route-results',
      params: {
        source: source,
        destination: destination,
        sourceLat: sourceLocation.latitude.toString(),
        sourceLng: sourceLocation.longitude.toString(),
        destLat: destinationLocation.latitude.toString(),
        destLng: destinationLocation.longitude.toString(),
      }
    });
  };

  const clearLocations = () => {
    setSourceLocation(null);
    setDestinationLocation(null);
    setSource('');
    setDestination('');
  };

  const openTomTomDashboard = () => {
    Linking.openURL('https://developer.tomtom.com/user/me/apps');
  };

  const getApiStatusColor = () => {
    switch (apiStatus) {
      case 'working': return '#4CAF50';
      case 'failed': return '#F44336';
      case 'checking': return '#FFC107';
      default: return '#6c757d';
    }
  };

  const getApiStatusText = () => {
    switch (apiStatus) {
      case 'working': return 'TomTom API: Connected ✅';
      case 'failed': return 'TomTom API: Not Configured ❌';
      case 'checking': return 'TomTom API: Checking...';
      default: return 'TomTom API: Unknown';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saarthi</Text>
         <SOSFab />
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* API Status Banner */}
      <View style={[styles.apiStatusBanner, { backgroundColor: getApiStatusColor() + '20' }]}>
        <Text style={[styles.apiStatusText, { color: getApiStatusColor() }]}>
          {getApiStatusText()}
        </Text>
        {apiStatus === 'failed' && (
          <TouchableOpacity onPress={openTomTomDashboard}>
            <Text style={styles.fixApiText}>Fix Now</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Section */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.searchContainer}
      >
        <View style={styles.searchBox}>
          <View style={styles.inputContainer}>
            <View style={styles.dot} />
            <TextInput
              style={styles.input}
              placeholder="Enter starting location"
              placeholderTextColor="#666"
              value={source}
              onChangeText={setSource}
              onSubmitEditing={geocodeLocations}
            />
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.inputContainer}>
            <View style={[styles.dot, styles.destinationDot]} />
            <TextInput
              style={styles.input}
              placeholder="Enter destination"
              placeholderTextColor="#666"
              value={destination}
              onChangeText={setDestination}
              onSubmitEditing={geocodeLocations}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[
                styles.findButton, 
                (loading || apiStatus === 'failed') && styles.buttonDisabled
              ]} 
              onPress={geocodeLocations}
              disabled={loading || apiStatus === 'failed'}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>
                  {apiStatus === 'failed' ? 'API Key Required' : 'Find Locations'}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.routeButton, 
                (!sourceLocation || !destinationLocation) && styles.buttonDisabled
              ]} 
              onPress={calculateRoute}
              disabled={!sourceLocation || !destinationLocation}
            >
              <Text style={styles.buttonText}>
                Safe Routes
              </Text>
            </TouchableOpacity>
          </View>

          {/* Help Text */}
          {apiStatus === 'failed' && (
            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>
                💡 You need a TomTom API key. Click "Fix Now" above to get one.
              </Text>
            </View>
          )}

          {/* Clear Button */}
          {(sourceLocation || destinationLocation) && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearLocations}
            >
              <Text style={styles.clearButtonText}>Clear Locations</Text>
            </TouchableOpacity>
          )}
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
        {/* Source Marker */}
        {sourceLocation && (
          <Marker
            coordinate={{
              latitude: sourceLocation.latitude,
              longitude: sourceLocation.longitude
            }}
            title="Start"
            description={sourceLocation.address}
            pinColor="#4CAF50"
          />
        )}

        {/* Destination Marker */}
        {destinationLocation && (
          <Marker
            coordinate={{
              latitude: destinationLocation.latitude,
              longitude: destinationLocation.longitude
            }}
            title="Destination"
            description={destinationLocation.address}
            pinColor="#F44336"
          />
        )}
      </MapView>

      {/* Demo Instructions */}
      {apiStatus === 'failed' && (
        <View style={styles.demoPanel}>
          <Text style={styles.demoTitle}>🚨 Action Required</Text>
          <Text style={styles.demoText}>
            To use SafeRoute, you need a TomTom API key:{'\n'}
            1. Click "Fix Now" above{'\n'}
            2. Create a TomTom account{'\n'}
            3. Get your free API key{'\n'}
            4. Update the API key in tomtomService.ts
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 1)',
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
    color: '#8b1757ff',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#a3abb3ff',
    borderRadius: 8,
  },
  logoutText: {
    color: '#8b1757ff',
    fontWeight: '500',
  },
  apiStatusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#803838ff',
  },
  apiStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fixApiText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  searchContainer: {
    position: 'absolute',
    top: 140,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  searchBox: {
    backgroundColor: 'rgba(255, 238, 251, 1)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginRight: 12,
  },
  destinationDot: {
    backgroundColor: '#F44336',
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
    borderWidth: 0,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginLeft: 6,
    marginVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  findButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  routeButton: {
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  clearButton: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clearButtonText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '500',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  demoPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 243, 205, 0.95)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 16,
  },
});