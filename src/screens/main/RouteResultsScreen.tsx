import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TomTomService, Location } from '../../services/tomtomService';

const { width, height } = Dimensions.get('window');

interface Route {
  id: string;
  coordinates: Location[];
  distance: string;
  duration: string;
  safetyScore: number;
  description: string;
  color: string;
  advantages: string[];
  disadvantages: string[];
  warnings: string[];
}

export default function RouteResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [sourceLocation, setSourceLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);

  const source = params.source as string;
  const destination = params.destination as string;
  const sourceLat = parseFloat(params.sourceLat as string);
  const sourceLng = parseFloat(params.sourceLng as string);
  const destLat = parseFloat(params.destLat as string);
  const destLng = parseFloat(params.destLng as string);

  useEffect(() => {
    calculateRealRoutes();
  }, []);

  const calculateRealRoutes = async () => {
    try {
      setLoading(true);

      // Create location objects from coordinates
      const startLocation: Location = {
        latitude: sourceLat,
        longitude: sourceLng,
        address: source
      };

      const endLocation: Location = {
        latitude: destLat,
        longitude: destLng,
        address: destination
      };

      setSourceLocation(startLocation);
      setDestinationLocation(endLocation);

      // Get real routes from TomTom
      const tomtomRoutes = await TomTomService.calculateRoutes(startLocation, endLocation);
      
      // Convert to our route format with safety scoring
      const formattedRoutes: Route[] = tomtomRoutes.slice(0, 3).map((route, index) => {
        const safetyScore = TomTomService.calculateRouteSafety(route, index);
        
        return {
          id: `route-${index}`,
          coordinates: route.coordinates,
          distance: `${(route.distance / 1000).toFixed(1)} km`,
          duration: `${Math.round(route.duration / 60)} mins`,
          safetyScore,
          description: TomTomService.getRouteDescription(safetyScore, index),
          // keep same color mapping as before
          color: index === 0 ? '#4CAF50' : index === 1 ? '#FFC107' : '#FF9800',
          advantages: TomTomService.getRouteAdvantages(safetyScore, index),
          disadvantages: TomTomService.getRouteDisadvantages(safetyScore, index),
          warnings: safetyScore < 60 ? ['Use extra caution in poorly lit areas'] : []
        };
      });

      setRoutes(formattedRoutes);
      setSelectedRoute(formattedRoutes[0]?.id || '');

      // Fit map to show all routes
      if (mapRef.current && formattedRoutes.length > 0) {
        const allCoordinates = formattedRoutes.flatMap(route => route.coordinates);
        mapRef.current.fitToCoordinates(allCoordinates, {
          edgePadding: { top: 50, right: 50, bottom: 300, left: 50 },
          animated: true,
        });
      }

    } catch (error: any) {
      Alert.alert('Routing Error', error.message || 'Failed to calculate routes');
      console.error('Routing error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSafetyColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    return '#F44336';
  };

  const getSafetyLabel = (score: number) => {
    if (score >= 80) return 'Very Safe';
    if (score >= 60) return 'Moderately Safe';
    return 'Use Caution';
  };

  // Return a light tint background for the color (used for selected card bg)
  const getTintForColor = (hex: string) => {
    // Map known route hexs to soft tints (keeps visual consistent)
    switch (hex.toUpperCase()) {
      case '#4CAF50':
        return 'rgba(76,175,80,0.12)'; // green tint
      case '#FFC107':
        return 'rgba(255,193,7,0.12)'; // amber tint
      case '#FF9800':
        return 'rgba(255,152,0,0.12)'; // orange tint
      case '#F44336':
        return 'rgba(244,67,54,0.12)'; // red tint fallback
      default:
        return 'rgba(85,7,78,0.06)'; // subtle purple fallback
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Calculating safest routes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route Results</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Map - Fixed height */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true}
        >
          {/* Real Route Polylines */}
          {routes.map(route => (
            <Polyline
              key={route.id}
              coordinates={route.coordinates}
              strokeColor={route.color}
              strokeWidth={selectedRoute === route.id ? 6 : 4}
            />
          ))}

          {/* Real Start and End Markers */}
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
      </View>

      {/* Bottom Panel - Fixed height with internal scrolling */}
      <View style={styles.bottomPanel}>
        {/* Route Selection Cards - Fixed height section */}
        <View style={styles.routeSelectionSection}>
          <Text style={styles.panelTitle}>Available Routes</Text>
          <Text style={styles.routeSummary}>
            From: {source} → To: {destination}
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.routesScroll}
            contentContainerStyle={styles.routesScrollContent}
          >
            {routes.map(route => {
              const isSelected = selectedRoute === route.id;
              return (
                <TouchableOpacity
                  key={route.id}
                  activeOpacity={0.85}
                  style={[
                    styles.routeCard,
                    isSelected && {
                      backgroundColor: getTintForColor(route.color),
                      borderWidth: 2,
                      borderColor: route.color,
                      shadowColor: route.color,
                      elevation: 6,
                    },
                    // keep left color strip consistent
                    { borderLeftColor: route.color }
                  ]}
                  onPress={() => setSelectedRoute(route.id)}
                >
                  <View style={styles.routeHeader}>
                    <Text style={[styles.routeDescription, isSelected && { color: route.color }]}>
                      {route.description}
                    </Text>
                    <View style={[styles.safetyBadge, { backgroundColor: getSafetyColor(route.safetyScore) }]}>
                      <Text style={styles.safetyScore}>{route.safetyScore}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.routeDetails}>
                    <Text style={[styles.detailText, isSelected && { color: route.color }]}>📏 {route.distance}</Text>
                    <Text style={[styles.detailText, isSelected && { color: route.color }]}>⏱️ {route.duration}</Text>
                  </View>
                  
                  <Text style={[styles.safetyLabel, isSelected && { color: route.color }]}>
                    {getSafetyLabel(route.safetyScore)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Route Details - Scrollable section */}
        <ScrollView 
          style={styles.detailsScroll}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {selectedRoute && (
            <View style={styles.selectedRouteDetails}>
              {routes.filter(route => route.id === selectedRoute).map(route => (
                <View key={route.id}>
                  <Text style={styles.detailsTitle}>Route Details</Text>
                  
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Safety Score</Text>
                      <Text style={[styles.detailValue, { color: getSafetyColor(route.safetyScore) }]}>
                        {route.safetyScore}/100
                      </Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Distance</Text>
                      <Text style={styles.detailValue}>{route.distance}</Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Duration</Text>
                      <Text style={styles.detailValue}>{route.duration}</Text>
                    </View>
                  </View>

                  <View style={styles.advantagesSection}>
                    <Text style={styles.sectionTitle}>✅ Advantages</Text>
                    {route.advantages.map((advantage, index) => (
                      <Text key={index} style={styles.listItem}>• {advantage}</Text>
                    ))}
                  </View>

                  <View style={styles.disadvantagesSection}>
                    <Text style={styles.sectionTitle}>⚠️ Considerations</Text>
                    {route.disadvantages.map((disadvantage, index) => (
                      <Text key={index} style={styles.listItem}>• {disadvantage}</Text>
                    ))}
                  </View>

                  {route.warnings.length > 0 && (
                    <View style={styles.warningsSection}>
                      <Text style={styles.warningTitle}>🚨 Important</Text>
                      {route.warnings.map((warning, index) => (
                        <Text key={index} style={styles.warningText}>• {warning}</Text>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity style={[styles.selectRouteButton, { backgroundColor: route.color }]}>
                    <Text style={styles.selectRouteText}>Select This Route</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 238, 251, 1)',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 238, 251, 1)',
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: 'rgba(255, 238, 251, 1)',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ccec',
  },

  backButton: {
    padding: 8,
  },

  backButtonText: {
    fontSize: 16,
    color: '#8b1757ff',
    fontWeight: '600',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#55074eff',
  },

  placeholder: {
    width: 60,
  },

  mapContainer: {
    height: '45%',
    backgroundColor: 'rgba(255, 238, 251, 1)',
  },

  map: {
    width: '100%',
    height: '100%',
  },

  bottomPanel: {
    flex: 1,
    backgroundColor: 'rgba(255, 238, 251, 1)',
  },

  routeSelectionSection: {
    backgroundColor: '#f3e9f9',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ccec',
    minHeight: 160,
  },

  panelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#55074eff',
  },

  routeSummary: {
    fontSize: 14,
    color: '#8b1757ff',
    marginBottom: 16,
  },

  routesScroll: {
    flexGrow: 0,
  },

  routesScrollContent: {
    paddingRight: 16,
  },

  routeCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 180,
    borderLeftWidth: 4,
    // default subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },

  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  routeDescription: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#55074eff',
    flex: 1,
  },

  safetyBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  safetyScore: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  detailText: {
    fontSize: 12,
    color: '#55074eff',
  },

  safetyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#55074eff',
  },

  detailsScroll: {
    flex: 1,
  },

  selectedRouteDetails: {
    backgroundColor: 'rgba(255, 238, 251, 1)',
    padding: 16,
    paddingBottom: 30,
  },

  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#55074eff',
  },

  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#f3e9f9',
    padding: 12,
    borderRadius: 8,
  },

  detailItem: {
    alignItems: 'center',
    flex: 1,
  },

  detailLabel: {
    fontSize: 12,
    color: '#8b1757ff',
    marginBottom: 4,
  },

  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#55074eff',
  },

  advantagesSection: {
    marginBottom: 16,
    backgroundColor: '#f3e9f9',
    padding: 12,
    borderRadius: 8,
  },

  disadvantagesSection: {
    marginBottom: 16,
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#55074eff',
  },

  listItem: {
    fontSize: 12,
    color: '#8b1757ff',
    marginBottom: 4,
    marginLeft: 8,
    lineHeight: 16,
  },

  warningsSection: {
    marginBottom: 16,
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 8,
  },

  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#721c24',
  },

  warningText: {
    fontSize: 12,
    color: '#721c24',
    marginBottom: 4,
    marginLeft: 8,
    lineHeight: 16,
  },

  selectRouteButton: {
    backgroundColor: '#8b1757ff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },

  selectRouteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
