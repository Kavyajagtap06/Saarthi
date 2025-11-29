// src/services/walkService.ts
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  orderBy,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { ref, onValue, off, set, push, getDatabase } from 'firebase/database';
import { db, auth } from '../config/firebase';
import { WalkRoute, WalkMatch, CreateWalkRequest } from '../types/walk';

// Initialize Realtime Database
const database = getDatabase();

export class WalkService {
  private static walksCollection = collection(db, 'walks');
  private static matchesRef = ref(database, 'matches');

  // Create a new walk route
  static async createWalkRoute(walkData: CreateWalkRequest): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const walkRoute = {
        ...walkData,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userAvatar: '👤',
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(this.walksCollection, walkRoute);
      return docRef.id;
    } catch (error) {
      console.error('Error creating walk route:', error);
      throw error;
    }
  }

  // Get active walks in real-time
  static subscribeToActiveWalks(
    callback: (walks: WalkRoute[]) => void,
    userLocation?: { latitude: number; longitude: number },
    radius: number = 5000
  ): () => void {
    const q = query(
      this.walksCollection,
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const walks: WalkRoute[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        walks.push({
          id: doc.id,
          ...data,
          startTime: data.startTime?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as WalkRoute);
      });

      // Filter by location if provided
      if (userLocation) {
        const filteredWalks = walks.filter(walk => 
          this.calculateDistance(
            userLocation,
            walk.startLocation
          ) <= radius
        );
        callback(filteredWalks);
      } else {
        callback(walks);
      }
    });

    return unsubscribe;
  }

  // Find matching walks based on current user's location and route
  static async findMatchingWalks(
    userLocation: { latitude: number; longitude: number },
    userDestination: { latitude: number; longitude: number; address: string },
    maxDistance: number = 1000
  ): Promise<WalkMatch[]> {
    try {
      const q = query(
        this.walksCollection,
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);
      const matches: WalkMatch[] = [];
      const user = auth.currentUser;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const walk: WalkRoute = {
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userAvatar: data.userAvatar,
          startLocation: data.startLocation,
          endLocation: data.endLocation,
          routeCoordinates: data.routeCoordinates || [],
          startTime: data.startTime?.toDate() || new Date(),
          estimatedDuration: data.estimatedDuration || 20,
          walkingSpeed: data.walkingSpeed || 'normal',
          preferences: data.preferences || {
            groupSize: 2,
            genderPreference: 'any',
            ageRange: [20, 35],
          },
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };

        // Skip user's own walks
        if (walk.userId === user?.uid) return;

        // Calculate distances
        const startDistance = this.calculateDistance(userLocation, walk.startLocation);
        const endDistance = this.calculateDistance(userDestination, walk.endLocation);

        // Check if within acceptable distance
        if (startDistance <= maxDistance && endDistance <= maxDistance) {
          const matchScore = this.calculateMatchScore(
            startDistance,
            endDistance,
            walk
          );

          if (matchScore >= 50) {
            matches.push({
              id: `${user?.uid}_${walk.id}`,
              walkRoute: walk,
              matchScore: Math.round(matchScore),
              sharedRoutePercentage: this.calculateRouteSimilarity(userDestination, walk.endLocation),
              estimatedOverlapTime: walk.estimatedDuration,
              distanceFromYou: Math.round(startDistance)
            });
          }
        }
      });

      return matches.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      console.error('Error finding matching walks:', error);
      throw error;
    }
  }

  // Send connection request
  static async sendConnectionRequest(
    targetWalkId: string,
    message: string = "Hi! I'd like to walk with you."
  ): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const request = {
        fromUserId: user.uid,
        fromUserName: user.displayName || 'Anonymous',
        toWalkId: targetWalkId,
        message,
        status: 'pending',
        createdAt: Timestamp.now(),
      };

      const requestsRef = collection(db, 'connectionRequests');
      await addDoc(requestsRef, request);

      // Send real-time notification
      await this.sendRealTimeNotification(targetWalkId, user.uid);
    } catch (error) {
      console.error('Error sending connection request:', error);
      throw error;
    }
  }

  // Subscribe to connection requests
  static subscribeToConnectionRequests(
    callback: (requests: any[]) => void
  ): () => void {
    const user = auth.currentUser;
    if (!user) return () => {};

    const q = query(
      collection(db, 'connectionRequests'),
      where('toWalkId', '==', user.uid), // Fixed: use '==' instead of 'in' for single value
      where('status', '==', 'pending')
    );

    return onSnapshot(q, (snapshot) => {
      const requests: any[] = [];
      snapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        });
      });
      callback(requests);
    });
  }

  // Respond to connection request
  static async respondToConnectionRequest(
    requestId: string,
    accepted: boolean
  ): Promise<void> {
    try {
      const requestRef = doc(db, 'connectionRequests', requestId);
      await updateDoc(requestRef, {
        status: accepted ? 'accepted' : 'rejected',
        respondedAt: Timestamp.now(),
      });

      if (accepted) {
        // Create a walking session
        await this.createWalkingSession(requestId);
      }
    } catch (error) {
      console.error('Error responding to connection request:', error);
      throw error;
    }
  }

  // Create walking session when connection is accepted
  private static async createWalkingSession(requestId: string): Promise<void> {
    try {
      // Get request details
      const requestRef = doc(db, 'connectionRequests', requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (requestSnap.exists()) {
        const request = requestSnap.data();
        
        // Create session in Realtime Database for live tracking
        const sessionRef = push(ref(database, 'sessions'));
        await set(sessionRef, {
          walkId: request.toWalkId,
          participants: [request.fromUserId, request.toWalkId],
          status: 'active',
          startedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Error creating walking session:', error);
      throw error;
    }
  }

  // Update user's live location during walk
  static async updateLiveLocation(
    sessionId: string,
    location: { latitude: number; longitude: number }
  ): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const locationRef = ref(database, `sessions/${sessionId}/locations/${user.uid}`);
      await set(locationRef, {
        ...location,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error updating live location:', error);
      throw error;
    }
  }

  // Subscribe to walking partner's live location
  static subscribeToPartnerLocation(
    sessionId: string,
    partnerId: string,
    callback: (location: { latitude: number; longitude: number } | null) => void
  ): () => void {
    const locationRef = ref(database, `sessions/${sessionId}/locations/${partnerId}`);
    
    const unsubscribe = onValue(locationRef, (snapshot) => {
      const location = snapshot.val();
      callback(location);
    });

    return unsubscribe;
  }

  // Utility functions
  private static calculateDistance(
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number }
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private static calculateMatchScore(
    startDistance: number,
    endDistance: number,
    walk: WalkRoute
  ): number {
    let score = 0;

    // Distance factors (40% weight)
    const maxDistance = 1000;
    const startDistanceScore = Math.max(0, 100 - (startDistance / maxDistance) * 100);
    const endDistanceScore = Math.max(0, 100 - (endDistance / maxDistance) * 100);
    score += (startDistanceScore + endDistanceScore) * 0.2;

    // Route similarity (30% weight)
    const routeSimilarity = 70; // Simplified for now
    score += routeSimilarity * 0.3;

    // Time compatibility (20% weight)
    const timeScore = 80; // Simplified for now
    score += timeScore * 0.2;

    // Walking speed compatibility (10% weight)
    const speedScore = 90; // Simplified for now
    score += speedScore * 0.1;

    return Math.min(100, score);
  }

  private static calculateRouteSimilarity(
    dest1: { latitude: number; longitude: number },
    dest2: { latitude: number; longitude: number }
  ): number {
    const distance = this.calculateDistance(dest1, dest2);
    // Convert distance to similarity percentage (closer = higher percentage)
    return Math.max(0, 100 - (distance / 2000) * 100);
  }

  private static async sendRealTimeNotification(
    targetWalkId: string,
    fromUserId: string
  ): Promise<void> {
    try {
      const notificationRef = push(ref(database, `notifications/${targetWalkId}`));
      await set(notificationRef, {
        fromUserId,
        type: 'connection_request',
        message: 'Someone wants to walk with you!',
        timestamp: Date.now(),
        read: false,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}