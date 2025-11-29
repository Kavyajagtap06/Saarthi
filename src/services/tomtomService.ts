// src/services/tomtomService.ts

// ⚠️ REPLACE THIS WITH YOUR NEW TOMTOM API KEY ⚠️
const TOMTOM_API_KEY = 'AllXoQmOS8UfzOdNykrCCrWSZ8l28I4V'; // ← Get this from TomTom dashboard

const BASE_URL = 'https://api.tomtom.com';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Route {
  coordinates: Location[];
  distance: number;
  duration: number;
  summary: string;
}

export class TomTomService {
  // Enhanced geocoding with proper TomTom API format
  static async geocodeAddress(address: string): Promise<Location> {
    try {
      console.log('🔍 Geocoding address:', address);
      
      if (!address.trim()) {
        throw new Error('Address cannot be empty');
      }

      // Clean the address
      const cleanAddress = address.trim();
      const encodedAddress = encodeURIComponent(cleanAddress);
      
      // TomTom Search API v2 format
      const url = `${BASE_URL}/search/2/geocode/${encodedAddress}.json?key=${TOMTOM_API_KEY}&limit=1&countrySet=IN`;
      
      console.log('🌐 API Request URL:', url.replace(TOMTOM_API_KEY, 'HIDDEN_KEY'));

      const response = await fetch(url);
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      if (!response.ok) {
        // Try to get detailed error message
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData);
          console.log('❌ Error details:', errorData);
        } catch (e) {
          errorDetails = await response.text();
        }
        
        if (response.status === 403) {
          throw new Error(`TomTom API Key Error (403): Your API key is invalid or not activated. Please check your TomTom dashboard.`);
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else {
          throw new Error(`TomTom API Error ${response.status}: ${errorDetails}`);
        }
      }
      
      const data = await response.json();
      console.log('✅ Geocoding successful. Results:', data);
      
      if (!data.results || data.results.length === 0) {
        throw new Error(`No results found for "${address}". Please try a more specific address.`);
      }
      
      const result = data.results[0];
      const location = {
        latitude: result.position.lat,
        longitude: result.position.lon,
        address: result.address.freeformAddress || cleanAddress
      };
      
      console.log('📍 Location found:', location);
      return location;
      
    } catch (error: any) {
      console.error('🚨 Geocoding failed:', error);
      throw error;
    }
  }

  // Test the API key with a simple request
  static async testAPIKey(): Promise<{ working: boolean; message: string }> {
    try {
      console.log('🧪 Testing TomTom API key...');
      
      const testUrl = `${BASE_URL}/search/2/geocode/mumbai.json?key=${TOMTOM_API_KEY}&limit=1`;
      
      const response = await fetch(testUrl);
      console.log('🔑 API Test - Status:', response.status);
      
      if (response.status === 200) {
        return { working: true, message: '✅ API Key is working correctly!' };
      } else if (response.status === 403) {
        return { working: false, message: '❌ API Key is invalid or not activated' };
      } else {
        return { working: false, message: `⚠️ API returned status: ${response.status}` };
      }
    } catch (error: any) {
      return { working: false, message: `🚨 API test failed: ${error.message}` };
    }
  }

  // Routing method
  static async calculateRoutes(
    start: Location, 
    end: Location, 
    travelMode: string = 'car'
  ): Promise<Route[]> {
    try {
      console.log('🗺️ Calculating routes between locations...');
      
      const url = `${BASE_URL}/routing/1/calculateRoute/${start.latitude},${start.longitude}:${end.latitude},${end.longitude}/json?key=${TOMTOM_API_KEY}&travelMode=${travelMode}&routeType=fastest&maxAlternatives=2`;
      
      console.log('🌐 Routing URL:', url.replace(TOMTOM_API_KEY, 'HIDDEN_KEY'));

      const response = await fetch(url);
      
      console.log('📡 Routing response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Routing failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Routing successful:', data);
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No routes found between these locations');
      }
      
      return data.routes.map((route: any, index: number) => {
        const coordinates = route.legs[0].points.map((point: any) => ({
          latitude: point.latitude,
          longitude: point.longitude,
          address: ''
        }));
        
        return {
          coordinates,
          distance: route.summary.lengthInMeters,
          duration: route.summary.travelTimeInSeconds,
          summary: route.summary
        };
      });
    } catch (error) {
      console.error('🚨 Routing error:', error);
      throw error;
    }
  }

  // Safety calculation methods (unchanged)
  static calculateRouteSafety(route: Route, routeIndex: number): number {
    const baseSafety = 70;
    const routeTypeBonus = { 0: 15, 1: 5, 2: -5 };
    const distanceKm = route.distance / 1000;
    const distanceBonus = Math.max(0, 20 - distanceKm * 2);
    const currentHour = new Date().getHours();
    const timeBonus = (currentHour >= 6 && currentHour <= 18) ? 10 : -10;
    
    const safetyScore = baseSafety + 
      (routeTypeBonus[routeIndex as keyof typeof routeTypeBonus] || 0) +
      distanceBonus + timeBonus;
    
    return Math.max(0, Math.min(100, safetyScore));
  }

  static getRouteDescription(safetyScore: number, routeIndex: number): string {
    if (safetyScore >= 85) return 'Very Safe Route';
    if (safetyScore >= 70) return 'Safe Route';
    if (safetyScore >= 55) return 'Moderately Safe';
    return 'Use Caution';
  }

  static getRouteAdvantages(safetyScore: number, routeIndex: number): string[] {
    const advantages = [];
    if (safetyScore >= 80) {
      advantages.push('Well-lit areas throughout', 'Frequent police patrols', 'Good CCTV coverage');
    }
    if (routeIndex === 0) advantages.push('Most popular route', 'Well-maintained roads');
    if (safetyScore >= 70) advantages.push('Adequate street lighting', 'Busy main roads');
    return advantages.length > 0 ? advantages : ['Direct route available'];
  }

  static getRouteDisadvantages(safetyScore: number, routeIndex: number): string[] {
    const disadvantages = [];
    if (safetyScore < 60) disadvantages.push('Some poorly lit areas', 'Less crowded streets');
    if (routeIndex === 2) disadvantages.push('May pass through isolated areas');
    if (safetyScore < 70) disadvantages.push('Limited surveillance in some sections');
    return disadvantages.length > 0 ? disadvantages : ['Standard route precautions apply'];
  }
}