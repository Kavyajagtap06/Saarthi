import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  TomTomService,
  Location,
  RouteSafetyScore,
} from "../../services/tomtomService";

const { width, height } = Dimensions.get("window");

interface Route {
  id: string;
  coordinates: Location[];
  distance: string;
  duration: string;
  safety: RouteSafetyScore; // Changed from safetyScore to safety object
  description: string;
  color: string;
}

export default function RouteResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);

  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState("");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [sourceLocation, setSourceLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] =
    useState<Location | null>(null);

  // Add this navigation handler function
  const handleSelectRoute = (route: Route) => {
    console.log("🚀 Starting navigation for route:", route.description);

    // Navigate to navigation screen with route data
    router.push({
      pathname: "/navigation",
      params: {
        route: JSON.stringify(route),
        startLocation: JSON.stringify(sourceLocation),
        endLocation: JSON.stringify(destinationLocation),
        routeName: route.description,
        totalDistance: route.distance,
        totalDuration: route.duration,
      },
    });
  };

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
        address: source,
      };

      const endLocation: Location = {
        latitude: destLat,
        longitude: destLng,
        address: destination,
      };

      setSourceLocation(startLocation);
      setDestinationLocation(endLocation);

      // Get real routes with safety data from TomTom
      const routesWithSafety = await TomTomService.calculateRoutes(
        startLocation,
        endLocation
      );

      // Convert to our route format
      const formattedRoutes: Route[] = routesWithSafety.map(
        ({ route, safety }, index) => {
          const routeTypeNames = ["Safest", "Balanced", "Fastest"];

          return {
            id: `route-${index}`,
            coordinates: route.coordinates,
            distance: `${(route.distance / 1000).toFixed(1)} km`,
            duration: `${Math.round(route.duration / 60)} mins`,
            safety, // Real safety data from TomTom APIs
            description: `${routeTypeNames[index]} Route`,
            color:
              index === 0 ? "#4CAF50" : index === 1 ? "#FFC107" : "#FF9800",
          };
        }
      );

      setRoutes(formattedRoutes);
      setSelectedRoute(formattedRoutes[0]?.id || "");

      // Fit map to show all routes
      if (mapRef.current && formattedRoutes.length > 0) {
        const allCoordinates = formattedRoutes.flatMap(
          (route) => route.coordinates
        );
        mapRef.current.fitToCoordinates(allCoordinates, {
          edgePadding: { top: 50, right: 50, bottom: 300, left: 50 },
          animated: true,
        });
      }
    } catch (error: any) {
      Alert.alert(
        "Routing Error",
        error.message || "Failed to calculate routes"
      );
      console.error("Routing error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSafetyColor = (score: number) => {
    if (score >= 80) return "#4CAF50";
    if (score >= 60) return "#FFC107";
    return "#F44336";
  };

  const getSafetyLabel = (score: number) => {
    if (score >= 80) return "Very Safe";
    if (score >= 60) return "Moderately Safe";
    return "Use Caution";
  };

  // Return a light tint background for the color (used for selected card bg)
  const getTintForColor = (hex: string) => {
    // Map known route hexs to soft tints (keeps visual consistent)
    switch (hex.toUpperCase()) {
      case "#4CAF50":
        return "rgba(76,175,80,0.12)"; // green tint
      case "#FFC107":
        return "rgba(255,193,7,0.12)"; // amber tint
      case "#FF9800":
        return "rgba(255,152,0,0.12)"; // orange tint
      case "#F44336":
        return "rgba(244,67,54,0.12)"; // red tint fallback
      default:
        return "rgba(85,7,78,0.06)"; // subtle purple fallback
    }
  };
  const getSelectedCardBackground = (route: Route) => {
    if (route.description.includes("Safest")) return "rgba(76,175,80,0.15)"; // Green
    if (route.description.includes("Balanced")) return "rgba(255,152,0,0.15)"; // Orange
    if (route.description.includes("Fastest")) return "rgba(244,67,54,0.15)"; // Red
    return "rgba(0,0,0,0.05)";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>
          Calculating safest routes with TomTom data...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
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
          {routes.map((route) => (
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
                longitude: sourceLocation.longitude,
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
                longitude: destinationLocation.longitude,
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
            {routes.map((route) => (
              <TouchableOpacity
                key={route.id}
                style={[
                  styles.routeCard,
                  selectedRoute === route.id && {
                    backgroundColor: getSelectedCardBackground(route),
                  },
                  { borderLeftColor: route.color },
                ]}
                onPress={() => setSelectedRoute(route.id)}
              >
                <View style={styles.routeHeader}>
                  <Text style={styles.routeDescription}>
                    {route.description}
                  </Text>
                  <View
                    style={[
                      styles.safetyBadge,
                      {
                        backgroundColor: getSafetyColor(
                          route.safety.overallScore
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.safetyScore}>
                      {route.safety.overallScore}
                    </Text>
                  </View>
                </View>

                <View style={styles.routeDetails}>
                  <Text style={styles.detailText}>📏 {route.distance}</Text>
                  <Text style={styles.detailText}>⏱️ {route.duration}</Text>
                </View>

                <Text style={styles.safetyLabel}>
                  {TomTomService.getRouteDescription(route.safety.overallScore)}
                </Text>
              </TouchableOpacity>
            ))}
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
              {routes
                .filter((route) => route.id === selectedRoute)
                .map((route) => (
                  <View key={route.id}>
                    <Text style={styles.detailsTitle}>Safety Analysis</Text>

                    {/* Overall Safety Score */}
                    <View style={styles.safetyScoreSection}>
                      <Text style={styles.safetyScoreLabel}>
                        Overall Safety Score
                      </Text>
                      <Text
                        style={[
                          styles.safetyScoreValue,
                          { color: getSafetyColor(route.safety.overallScore) },
                        ]}
                      >
                        {route.safety.overallScore}/100
                      </Text>
                      <Text style={styles.safetyScoreDescription}>
                        {TomTomService.getRouteDescription(
                          route.safety.overallScore
                        )}
                      </Text>
                    </View>

                    {/* Safety Factors Breakdown */}
                    <View style={styles.factorsSection}>
                      <Text style={styles.sectionTitle}>
                        📊 Safety Factors (TomTom Data)
                      </Text>

                      <View style={styles.factorItem}>
                        <Text style={styles.factorLabel}>
                          💡 Street Lighting
                        </Text>
                        <Text style={styles.factorValue}>
                          {route.safety.factors.lighting}/100
                        </Text>
                      </View>

                      <View style={styles.factorItem}>
                        <Text style={styles.factorLabel}>
                          👥 Population Density
                        </Text>
                        <Text style={styles.factorValue}>
                          {route.safety.factors.populationDensity}/100
                        </Text>
                      </View>

                      <View style={styles.factorItem}>
                        <Text style={styles.factorLabel}>
                          🚓 Police Stations
                        </Text>
                        <Text style={styles.factorValue}>
                          {route.safety.factors.policeStations} in area
                        </Text>
                      </View>

                      <View style={styles.factorItem}>
                        <Text style={styles.factorLabel}>🏥 Hospitals</Text>
                        <Text style={styles.factorValue}>
                          {route.safety.factors.hospitals} nearby
                        </Text>
                      </View>

                      <View style={styles.factorItem}>
                        <Text style={styles.factorLabel}>🛣️ Road Safety</Text>
                        <Text style={styles.factorValue}>
                          {route.safety.factors.roadType}/100
                        </Text>
                      </View>

                      <View style={styles.factorItem}>
                        <Text style={styles.factorLabel}>
                          🚦 Traffic Incidents
                        </Text>
                        <Text style={styles.factorValue}>
                          {route.safety.factors.trafficIncidents} recent
                        </Text>
                      </View>

                      <View style={styles.factorItem}>
                        <Text style={styles.factorLabel}>📍 Area Safety</Text>
                        <Text style={styles.factorValue}>
                          {route.safety.factors.areaSafety}/100
                        </Text>
                      </View>
                    </View>

                    {/* Data Sources */}
                    <View style={styles.dataSourceSection}>
                      <Text style={styles.dataSourceTitle}>
                        🔍 Data Sources (TomTom APIs)
                      </Text>
                      {route.safety.dataSources.map((source, index) => (
                        <Text key={index} style={styles.dataSourceItem}>
                          • {source}
                        </Text>
                      ))}
                    </View>

                    {/* Advantages & Disadvantages */}
                    <View style={styles.advantagesSection}>
                      <Text style={styles.sectionTitle}>
                        ✅ Route Advantages
                      </Text>
                      {TomTomService.getRouteAdvantages(
                        route.safety.overallScore,
                        route.safety.factors
                      ).map((advantage, index) => (
                        <Text key={index} style={styles.listItem}>
                          • {advantage}
                        </Text>
                      ))}
                    </View>

                    <View style={styles.disadvantagesSection}>
                      <Text style={styles.sectionTitle}>
                        ⚠️ Safety Considerations
                      </Text>
                      {TomTomService.getRouteDisadvantages(
                        route.safety.overallScore,
                        route.safety.factors
                      ).map((disadvantage, index) => (
                        <Text key={index} style={styles.listItem}>
                          • {disadvantage}
                        </Text>
                      ))}
                    </View>

                    {/* Warnings */}
                    {route.safety.warnings.length > 0 && (
                      <View style={styles.warningsSection}>
                        <Text style={styles.warningTitle}>
                          🚨 Safety Alerts
                        </Text>
                        {route.safety.warnings.map((warning, index) => (
                          <Text key={index} style={styles.warningText}>
                            • {warning}
                          </Text>
                        ))}
                      </View>
                    )}

                    {/* Recommendations */}
                    {route.safety.recommendations.length > 0 && (
                      <View style={styles.recommendationsSection}>
                        <Text style={styles.recommendationTitle}>
                          💡 Safety Recommendations
                        </Text>
                        {route.safety.recommendations.map(
                          (recommendation, index) => (
                            <Text key={index} style={styles.recommendationText}>
                              • {recommendation}
                            </Text>
                          )
                        )}
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.selectRouteButton}
                      onPress={() => handleSelectRoute(route)}
                    >
                      <Text style={styles.selectRouteText}>
                        Start Navigation
                      </Text>
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
    backgroundColor: "rgba(255, 238, 251, 1)",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 238, 251, 1)",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: "rgba(255, 238, 251, 1)",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ccec",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#8b1757ff",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#55074eff",
  },
  placeholder: {
    width: 60,
  },
  mapContainer: {
    height: "45%",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  bottomPanel: {
    flex: 1,
    backgroundColor: "#fff",
  },
  routeSelectionSection: {
    backgroundColor: "#f3e9f9",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    minHeight: 160,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#55074eff",
  },
  routeSummary: {
    fontSize: 14,
    color: "#8b1757ff",
    marginBottom: 16,
  },
  routesScroll: {
    flexGrow: 0,
  },
  routesScrollContent: {
    paddingRight: 16,
  },
  routeCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 180,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedRouteCard: {
    backgroundColor: "rgba(139, 23, 87, 0.08)",
    shadowColor: "#8b1757ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  routeDescription: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#55074eff",
    flex: 1,
  },
  safetyBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  safetyScore: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  routeDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: "#55074eff",
  },
  safetyLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#55074eff",
  },
  detailsScroll: {
    flex: 1,
  },
  selectedRouteDetails: {
    backgroundColor: "rgba(255, 238, 251, 1)",
    padding: 16,
    paddingBottom: 30,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#55074eff",
  },
  safetyScoreSection: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  safetyScoreLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  safetyScoreValue: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 4,
  },
  safetyScoreDescription: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  factorsSection: {
    backgroundColor: "#e8f5e8",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  factorItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 4,
  },
  factorLabel: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  factorValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  dataSourceSection: {
    backgroundColor: "#e3f2fd",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  dataSourceTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1565c0",
  },
  dataSourceItem: {
    fontSize: 12,
    color: "#1565c0",
    marginBottom: 4,
    lineHeight: 16,
  },
  advantagesSection: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  disadvantagesSection: {
    backgroundColor: "#fff3cd",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  listItem: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
    marginLeft: 8,
    lineHeight: 18,
  },
  warningsSection: {
    backgroundColor: "#f8d7da",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#721c24",
  },
  warningText: {
    fontSize: 14,
    color: "#721c24",
    marginBottom: 6,
    marginLeft: 8,
    lineHeight: 18,
  },
  recommendationsSection: {
    backgroundColor: "#d1ecf1",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#0c5460",
  },
  recommendationText: {
    fontSize: 14,
    color: "#0c5460",
    marginBottom: 6,
    marginLeft: 8,
    lineHeight: 18,
  },
  selectRouteButton: {
    backgroundColor: "#8b1757ff",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  selectRouteText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
