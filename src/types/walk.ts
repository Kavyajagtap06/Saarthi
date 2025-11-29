// src/types/walk.ts
export interface WalkRoute {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  startLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  endLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  routeCoordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  startTime: Date;
  estimatedDuration: number;
  walkingSpeed: 'slow' | 'normal' | 'fast';
  preferences: {
    groupSize: number;
    genderPreference: 'any' | 'same' | 'mixed';
    ageRange: [number, number];
  };
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface WalkMatch {
  id: string;
  walkRoute: WalkRoute;
  matchScore: number;
  sharedRoutePercentage: number;
  estimatedOverlapTime: number;
  distanceFromYou: number;
}

export interface CreateWalkRequest {
  startLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  endLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  routeCoordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  startTime: Date;
  estimatedDuration: number;
  walkingSpeed: 'slow' | 'normal' | 'fast';
  preferences: {
    groupSize: number;
    genderPreference: 'any' | 'same' | 'mixed';
    ageRange: [number, number];
  };
}