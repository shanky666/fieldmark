import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address: string | null;
  errorMsg: string | null;
  loading: boolean;
  requestPermission: () => Promise<boolean>;
  refreshLocation: () => Promise<void>;
}

export function useLocation(): LocationState {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function requestPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission denied. Please enable GPS in device settings.');
        setLoading(false);
        return false;
      }
      return true;
    } catch (e) {
      setErrorMsg('Failed to request location permission');
      setLoading(false);
      return false;
    }
  }

  async function fetchLocation() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const isGranted = await requestPermission();
      if (!isGranted) return;

      // 1. Try last known position for immediate fallback
      let loc = await Location.getLastKnownPositionAsync();

      // 2. Fetch high accuracy current position
      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        if (current) loc = current;
      } catch (err) {
        console.warn("High accuracy GPS fetch timed out, using fallback", err);
      }

      if (loc) {
        setLocation(loc);
        // Reverse geocode to get real readable location address name
        try {
          const geocode = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude
          });
          if (geocode && geocode.length > 0) {
            const item = geocode[0];
            const addrParts = [item.name, item.street, item.subregion || item.city, item.region].filter(Boolean);
            setAddress(addrParts.join(', '));
          }
        } catch (geoErr) {
          console.warn("Reverse geocode failed", geoErr);
        }
      } else {
        setErrorMsg("Unable to lock GPS position. Ensure location services are turned on.");
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to get current location", error);
      setErrorMsg("Failed to retrieve GPS location coordinates");
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLocation();
  }, []);

  return {
    latitude: location?.coords.latitude ?? null,
    longitude: location?.coords.longitude ?? null,
    accuracy: location?.coords.accuracy ?? null,
    address,
    errorMsg,
    loading,
    requestPermission,
    refreshLocation: fetchLocation
  };
}
