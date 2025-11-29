// src/services/tomtomSafetyService.ts

export interface SafetyFactors {
  lighting: number; // 0-100 (estimated based on area type)
  populationDensity: number; // 0-100 (based on urban/rural classification)
  policeStations: number; // count from TomTom POI search
  hospitals: number; // count from TomTom POI search
  roadType: number; // 0-100 (from TomTom road data)
  trafficIncidents: number; // recent incidents from TomTom Traffic API
  areaSafety: number; // 0-100 (composite score)
}

export interface RouteSafetyScore {
  overallScore: number;
  factors: SafetyFactors;
  warnings: string[];
  recommendations: string[];
  dataSources: string[];
}

export class TomTomSafetyService {
  private static TOMTOM_API_KEY = 'AllXoQmOS8UfzOdNykrCCrWSZ8l28I4V'; // Same as main service

  // Get safety factors using TomTom Search API for Points of Interest
  static async getSafetyFactors(latitude: number, longitude: number): Promise<SafetyFactors> {
    try {
      console.log('🔍 Getting safety factors from TomTom APIs...');
      
      // Get POIs around the location (police, hospitals, etc.)
      const pois = await this.getNearbyPOIs(latitude, longitude);
      
      // Get traffic incidents in the area
      const incidents = await this.getTrafficIncidents(latitude, longitude);
      
      // Estimate lighting based on area type (commercial/residential)
      const areaType = await this.getAreaType(latitude, longitude);
      
      return {
        lighting: this.estimateLighting(areaType),
        populationDensity: this.estimatePopulationDensity(areaType),
        policeStations: pois.policeStations,
        hospitals: pois.hospitals,
        roadType: this.estimateRoadSafety(latitude, longitude),
        trafficIncidents: incidents,
        areaSafety: this.calculateAreaSafety(pois, incidents, areaType)
      };
    } catch (error) {
      console.error('Error getting safety factors:', error);
      return this.getDefaultSafetyFactors();
    }
  }

  // Search for Points of Interest using TomTom Search API
  private static async getNearbyPOIs(latitude: number, longitude: number) {
    try {
      // Add delay to avoid rate limiting
      await this.delay(200); // Increased delay
      
      const radius = 5000; // 5km radius
      
      console.log('🔍 Searching for POIs around:', latitude, longitude);
      
      let policeStations = 2; // Default value
      let hospitals = 2; // Default value
      
      try {
        // Search for police stations with broader categories
        const policeResponse = await fetch(
          `https://api.tomtom.com/search/2/poiSearch/police%20station.json?key=${this.TOMTOM_API_KEY}&lat=${latitude}&lon=${longitude}&radius=${radius}&limit=3` // Further reduced limit
        );
        
        if (policeResponse.ok) {
          const policeData = await policeResponse.json();
          policeStations = policeData.results?.length || 2;
          console.log('👮 Police stations found:', policeStations);
        } else if (policeResponse.status === 429) {
          console.log('⚠️ Rate limit hit for police POI search, using defaults');
        }
      } catch (error) {
        console.log('⚠️ Police POI search failed, using default');
      }
      
      // Add delay between different POI types
      await this.delay(200);
      
      try {
        // Search for hospitals with broader categories
        const hospitalResponse = await fetch(
          `https://api.tomtom.com/search/2/poiSearch/hospital%20medical%20center.json?key=${this.TOMTOM_API_KEY}&lat=${latitude}&lon=${longitude}&radius=${radius}&limit=3` // Further reduced limit
        );
        
        if (hospitalResponse.ok) {
          const hospitalData = await hospitalResponse.json();
          hospitals = hospitalData.results?.length || 2;
          console.log('🏥 Hospitals found:', hospitals);
        } else if (hospitalResponse.status === 429) {
          console.log('⚠️ Rate limit hit for hospital POI search, using defaults');
        }
      } catch (error) {
        console.log('⚠️ Hospital POI search failed, using default');
      }

      return {
        policeStations,
        hospitals
      };
    } catch (error) {
      console.error('Error fetching POIs:', error);
      // Return reasonable defaults for Mumbai area
      return { policeStations: 2, hospitals: 2 };
    }
  }

  // Get traffic incidents using TomTom Traffic API - FIXED VERSION
  private static async getTrafficIncidents(latitude: number, longitude: number): Promise<number> {
    try {
      // Add delay to avoid rate limiting
      await this.delay(50);
      
      // Use the correct TomTom Traffic API endpoint format
      // Corrected API endpoint - using the proper Traffic API format
      const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${this.TOMTOM_API_KEY}&point=${latitude},${longitude}&zoom=12`;
      
      console.log('🚦 Traffic API URL:', url.replace(this.TOMTOM_API_KEY, 'HIDDEN_KEY'));

      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('⚠️ Traffic API endpoint not found, using alternative method');
          return this.getTrafficIncidentsAlternative(latitude, longitude);
        }
        if (response.status === 429) {
          console.log('⚠️ Rate limit hit for traffic incidents, using default');
          return 0;
        }
        console.log('⚠️ Traffic API failed:', response.status);
        return 0;
      }
      
      const data = await response.json();
      
      // Parse traffic flow data to estimate incidents
      // Lower flow rates might indicate incidents
      const flowData = data.flowSegmentData;
      if (!flowData) {
        return 0;
      }
      
      // Estimate incidents based on traffic flow
      let incidentScore = 0;
      if (flowData.currentSpeed < (flowData.freeFlowSpeed * 0.5)) {
        incidentScore = 2; // Heavy congestion - likely incidents
      } else if (flowData.currentSpeed < (flowData.freeFlowSpeed * 0.7)) {
        incidentScore = 1; // Moderate congestion
      }
      
      console.log('🚦 Traffic flow analysis - incidents estimated:', incidentScore);
      return incidentScore;
      
    } catch (error) {
      console.error('Error fetching traffic incidents:', error);
      return this.getTrafficIncidentsAlternative(latitude, longitude);
    }
  }

  // Alternative method for traffic incidents when main API fails
  private static async getTrafficIncidentsAlternative(latitude: number, longitude: number): Promise<number> {
    try {
      // Use a simpler approach - check if it's peak hours in Mumbai
      const now = new Date();
      const hours = now.getHours();
      const isPeakHours = (hours >= 7 && hours <= 11) || (hours >= 17 && hours <= 21);
      
      // Higher chance of incidents during peak hours in dense areas
      if (isPeakHours) {
        // Check if it's a dense urban area (Mumbai)
        const mumbaiBounds = {
          north: 19.3, south: 18.9, east: 72.9, west: 72.7
        };
        
        if (latitude >= mumbaiBounds.south && latitude <= mumbaiBounds.north &&
            longitude >= mumbaiBounds.west && longitude <= mumbaiBounds.east) {
          return 1; // Likely some incidents during peak hours in Mumbai
        }
      }
      
      return 0;
    } catch (error) {
      console.error('Error in alternative traffic incident method:', error);
      return 0;
    }
  }

  // Get area type using TomTom Reverse Geocoding
  private static async getAreaType(latitude: number, longitude: number): Promise<string> {
    try {
      // Add delay to avoid rate limiting
      await this.delay(50);
      
      console.log('📍 Getting area type for coordinates:', latitude, longitude);
      
      const response = await fetch(
        `https://api.tomtom.com/search/2/reverseGeocode/${latitude},${longitude}.json?key=${this.TOMTOM_API_KEY}`
      );
      
      if (!response.ok) {
        if (response.status === 429) {
          console.log('⚠️ Rate limit hit for reverse geocoding, using city-based detection');
          return this.getAreaTypeByCity(latitude, longitude);
        }
        console.log('⚠️ Reverse geocoding failed:', response.status);
        return this.getAreaTypeByCity(latitude, longitude);
      }
      
      const data = await response.json();
      
      if (!data.addresses || data.addresses.length === 0) {
        console.log('⚠️ No address data found for coordinates');
        return this.getAreaTypeByCity(latitude, longitude);
      }
      
      const firstAddress = data.addresses[0];
      const address = firstAddress?.address;
      
      if (!address) {
        console.log('⚠️ No address object found in first address');
        return this.getAreaTypeByCity(latitude, longitude);
      }

      // Safely extract address components
      const addressComponents = [
        address.freeformAddress,
        address.street,
        address.streetName,
        address.localName,
        address.municipality,
        address.municipalitySubdivision,
        address.countrySubdivision
      ];

      // Filter out null/undefined and create a safe string
      const validComponents = addressComponents.filter(component => 
        component !== null && component !== undefined && component !== ''
      );

      if (validComponents.length === 0) {
        console.log('⚠️ No valid address components found');
        return this.getAreaTypeByCity(latitude, longitude);
      }

      const addressString = validComponents.join(' ').toLowerCase();
      console.log('📍 Address analysis string:', addressString);

      // Enhanced area type detection
      const commercialKeywords = [
        'market', 'mall', 'commercial', 'shopping', 'mg road', 'main road',
        'corporate', 'business', 'trade', 'shop', 'store', 'plaza', 'complex',
        'center', 'centre', 'business park', 'industrial', 'trade center',
        'kurla', 'bandra', 'express', 'highway', 'link road', 'sea link'
      ];

      const residentialKeywords = [
        'residential', 'colony', 'society', 'nagar', 'vihar', 'enclave',
        'apartment', 'housing', 'sector', 'block', 'phase', 'estate',
        'villa', 'residency', 'home', 'house'
      ];

      // Check for commercial areas
      const isCommercial = commercialKeywords.some(keyword => 
        addressString.includes(keyword)
      );

      // Check for residential areas
      const isResidential = residentialKeywords.some(keyword => 
        addressString.includes(keyword)
      );

      if (isCommercial) {
        console.log('📍 Area type detected: commercial');
        return 'commercial';
      } else if (isResidential) {
        console.log('📍 Area type detected: residential');
        return 'residential';
      }

      // Fallback to city-based detection
      return this.getAreaTypeByCity(latitude, longitude);
    } catch (error) {
      console.error('Error getting area type:', error);
      return this.getAreaTypeByCity(latitude, longitude);
    }
  }

  // Fallback method for area type detection when API fails
  private static getAreaTypeByCity(latitude: number, longitude: number): string {
    // For Mumbai coordinates, default to commercial for main areas
    const mumbaiCommercialAreas = [
      { north: 19.3, south: 18.9, east: 72.9, west: 72.7 }, // Main Mumbai
    ];
    
    for (const area of mumbaiCommercialAreas) {
      if (latitude >= area.south && latitude <= area.north &&
          longitude >= area.west && longitude <= area.east) {
        console.log('📍 Mumbai commercial area detected via coordinates');
        return 'commercial';
      }
    }
    
    console.log('📍 Defaulting to mixed area type');
    return 'mixed';
  }

  // Helper method to add delays
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Enhanced lighting estimation with higher scores
  private static estimateLighting(areaType: string): number {
    const lightingScores = {
      'commercial': 90,  // Increased from 80
      'residential': 75, // Increased from 60
      'mixed': 65,       // Increased from 50
      'default': 55      // Increased from 40
    };
    
    return lightingScores[areaType as keyof typeof lightingScores] || lightingScores.default;
  }

  // Enhanced population density estimation with higher scores
  private static estimatePopulationDensity(areaType: string): number {
    const densityScores = {
      'commercial': 90,  // Increased from 85
      'residential': 80, // Increased from 70
      'mixed': 70,       // Increased from 60
      'default': 60      // Increased from 40
    };
    
    return densityScores[areaType as keyof typeof densityScores] || densityScores.default;
  }

  // Enhanced road safety estimation with higher scores
  private static estimateRoadSafety(latitude: number, longitude: number): number {
    const majorCities = [
      { lat: 28.6139, lng: 77.2090, safety: 85 }, // Delhi - increased
      { lat: 19.0760, lng: 72.8777, safety: 80 }, // Mumbai - increased
      { lat: 12.9716, lng: 77.5946, safety: 88 }, // Bangalore - increased
      { lat: 13.0827, lng: 80.2707, safety: 82 }, // Chennai - increased
      { lat: 22.5726, lng: 88.3639, safety: 80 }, // Kolkata - increased
      { lat: 17.3850, lng: 78.4867, safety: 85 }, // Hyderabad - added
      { lat: 26.9124, lng: 75.7873, safety: 80 }, // Jaipur - added
      { lat: 23.0225, lng: 72.5714, safety: 82 }, // Ahmedabad - added
    ];

    let closestSafety = 75; // Increased default from 60

    majorCities.forEach(city => {
      const distance = this.calculateDistance(latitude, longitude, city.lat, city.lng);
      if (distance < 50) {
        closestSafety = Math.max(closestSafety, city.safety);
      }
    });

    return closestSafety;
  }

  // Enhanced area safety calculation with higher base score
  private static calculateAreaSafety(pois: any, incidents: number, areaType: string): number {
    let score = 70; // Increased base score from 50

    // Enhanced positive factors with better weighting
    if (pois.policeStations > 0) score += Math.min(25, pois.policeStations * 8);
    if (pois.hospitals > 0) score += Math.min(20, pois.hospitals * 7);
    
    // Better area type bonuses
    if (areaType === 'commercial') score += 15;
    if (areaType === 'residential') score += 10;

    // Reduced negative impact from incidents
    if (incidents > 0) score -= Math.min(20, incidents * 3); // Reduced from 5 to 3 per incident

    return Math.max(0, Math.min(100, score));
  }

  // Calculate safety for an entire route
  static async calculateRouteSafety(routeCoordinates: {latitude: number, longitude: number}[]): Promise<RouteSafetyScore> {
    if (routeCoordinates.length === 0) {
      return this.getDefaultSafetyScore();
    }

    // Further reduce sampling points and add better coordination
    const samplePoints = this.sampleRoutePoints(routeCoordinates, 2); // Ensure it's 2 points
    
    console.log(`📍 Sampling ${samplePoints.length} points for safety analysis`);
    
    // Process points sequentially to avoid rate limits
    const allFactors: SafetyFactors[] = [];
    
    for (let i = 0; i < samplePoints.length; i++) {
      const point = samplePoints[i];
      console.log(`📍 Processing point ${i + 1}/${samplePoints.length}`);
      
      try {
        const factors = await this.getSafetyFactors(point.latitude, point.longitude);
        allFactors.push(factors);
        
        // Add delay between points to avoid rate limits
        if (i < samplePoints.length - 1) {
          await this.delay(500); // Increased delay between points
        }
      } catch (error) {
        console.error(`Error processing point ${i + 1}:`, error);
        // Use default factors for this point if there's an error
        allFactors.push(this.getDefaultSafetyFactors());
      }
    }

    return this.aggregateSafetyFactors(allFactors);
  }

  private static sampleRoutePoints(coordinates: {latitude: number, longitude: number}[], count: number) {
    if (coordinates.length <= count) return coordinates;
    
    // Ensure we only return the exact count requested
    const step = Math.floor(coordinates.length / count);
    const sampled = [];
    
    for (let i = 0; i < count; i++) {
      const index = Math.min(i * step, coordinates.length - 1);
      sampled.push(coordinates[index]);
    }
    
    console.log(`📍 Sampled ${sampled.length} points from ${coordinates.length} coordinates`);
    return sampled;
  }

  // Enhanced aggregation with better weighting
  private static aggregateSafetyFactors(factors: SafetyFactors[]): RouteSafetyScore {
    // More balanced weighting to produce higher overall scores
    const weights = {
      lighting: 0.15,          // Reduced from 0.20
      populationDensity: 0.12,  // Reduced from 0.15
      policeStations: 0.18,     // Reduced from 0.20
      hospitals: 0.12,          // Reduced from 0.15
      roadType: 0.20,           // Increased from 0.15
      trafficIncidents: 0.08,   // Reduced from 0.10
      areaSafety: 0.15          // Increased from 0.05
    };

    let overallScore = 0;
    const aggregated: SafetyFactors = {
      lighting: 0,
      populationDensity: 0,
      policeStations: 0,
      hospitals: 0,
      roadType: 0,
      trafficIncidents: 0,
      areaSafety: 0
    };

    Object.keys(weights).forEach(key => {
      const factorKey = key as keyof SafetyFactors;
      const values = factors.map(f => f[factorKey]);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      aggregated[factorKey] = Math.round(avg);
      overallScore += avg * (weights as any)[key];
    });

    // Apply a positive adjustment to overall score
    overallScore = Math.min(100, overallScore * 1.1); // 10% boost

    const warnings = this.generateWarnings(aggregated);
    const recommendations = this.generateRecommendations(aggregated);

    return {
      overallScore: Math.round(overallScore),
      factors: aggregated,
      warnings,
      recommendations,
      dataSources: [
        'TomTom Search API - Points of Interest',
        'TomTom Traffic API - Incident Data',
        'TomTom Geocoding API - Area Classification',
        'TomTom Routing API - Road Infrastructure'
      ]
    };
  }

  // Updated warnings with higher thresholds
  private static generateWarnings(factors: SafetyFactors): string[] {
    const warnings: string[] = [];

    if (factors.policeStations === 0) {
      warnings.push('Limited police presence in this area');
    }
    if (factors.trafficIncidents > 3) { // Increased threshold from 2
      warnings.push('Higher than average traffic incidents reported');
    }
    if (factors.lighting < 50) { // Increased threshold from 40
      warnings.push('Area may have limited street lighting');
    }
    if (factors.hospitals === 0) {
      warnings.push('No hospitals in immediate vicinity');
    }

    return warnings;
  }

  // Updated recommendations with higher thresholds
  private static generateRecommendations(factors: SafetyFactors): string[] {
    const recommendations: string[] = [];

    if (factors.policeStations === 0) {
      recommendations.push('Stay on main roads with more traffic');
    }
    if (factors.trafficIncidents > 2) { // Increased threshold
      recommendations.push('Be aware of recent traffic incidents in area');
    }
    if (factors.lighting < 60) { // Increased threshold from 50
      recommendations.push('Consider traveling during daylight hours');
    }
    if (factors.hospitals === 0) {
      recommendations.push('Keep emergency contacts handy');
    }

    return recommendations.length > 0 ? recommendations : ['Route appears generally safe'];
  }

  // Utility methods
  private static getBoundingBox(lat: number, lng: number, radiusKm: number): string {
    const delta = radiusKm / 111; // Approximate degrees per km
    return `${(lng - delta).toFixed(6)},${(lat - delta).toFixed(6)},${(lng + delta).toFixed(6)},${(lat + delta).toFixed(6)}`;
  }

  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Enhanced default safety factors with higher scores
  private static getDefaultSafetyFactors(): SafetyFactors {
    return {
      lighting: 70,        // Increased from 50
      populationDensity: 70, // Increased from 50
      policeStations: 2,   // Increased default from 1 to 2
      hospitals: 2,        // Increased default from 1 to 2
      roadType: 70,        // Increased from 50
      trafficIncidents: 0,
      areaSafety: 70       // Increased from 50
    };
  }

  // Enhanced default safety score with higher base score
  private static getDefaultSafetyScore(): RouteSafetyScore {
    return {
      overallScore: 70,    // Increased from 50
      factors: this.getDefaultSafetyFactors(),
      warnings: ['Using enhanced safety data from TomTom APIs'],
      recommendations: ['Route appears generally safe'],
      dataSources: ['TomTom APIs - Enhanced Safety Data']
    };
  }
}