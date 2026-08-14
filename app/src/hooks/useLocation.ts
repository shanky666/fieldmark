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

export function formatGeocodeAddress(item: Location.LocationGeocodedAddress): string {
  if (!item) return '';
  
  // Filter out obscure POI/Gate/Site names like 'Site Gate 2'
  let namePart = item.name || '';
  if (/site|gate|plot|building|door|facility|unit|block|temp/i.test(namePart) || /^\d+$/.test(namePart)) {
    namePart = '';
  }
  if (namePart === item.street || namePart === item.city || namePart === item.district) {
    namePart = '';
  }

  const streetPart = [namePart, item.streetNumber, item.street].filter(Boolean).join(' ');
  const locality = item.district || item.subregion || item.city;
  const regionPart = [item.city, item.region].filter(Boolean).filter(x => x !== locality).join(', ');
  
  const parts = [streetPart, locality, regionPart, item.postalCode].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(', ');
  }
  return [item.city, item.region].filter(Boolean).join(', ');
}

export async function fetchLiveAddress(lat: number, lng: number): Promise<string> {
  // 1. Live OpenStreetMap Nominatim reverse geocode for exact street address
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: { 'User-Agent': 'FieldMarkApp/1.0 (contact@fieldmark.org)' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const a = data.address;
        const road = a.road || a.pedestrian || a.path || a.suburb || a.neighbourhood;
        const locality = a.suburb || a.neighbourhood || a.quarter || a.city_district || a.city || a.town;
        const city = a.city || a.town || a.county;
        const parts = [road, locality, city !== locality ? city : null, a.postcode].filter(Boolean);
        if (parts.length > 0) {
          return Array.from(new Set(parts)).join(', ');
        }
      }
    }
  } catch (e) {
    console.warn("Nominatim live geocode fetch failed, using fallback", e);
  }

  // 2. Native Expo reverse geocode fallback
  try {
    const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (geocode && geocode.length > 0) {
      return formatGeocodeAddress(geocode[0]);
    }
  } catch (geoErr) {
    console.warn("Expo reverse geocode failed", geoErr);
  }

  return `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;
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

      // Force fresh pinpoint GPS fix from satellite/cellular sensors
      let loc: Location.LocationObject | null = null;
      try {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
      } catch (err) {
        console.warn("Highest accuracy GPS fetch timed out, trying High accuracy", err);
        try {
          loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
        } catch (e) {
          loc = await Location.getLastKnownPositionAsync();
        }
      }

      if (loc) {
        setLocation(loc);
        const liveAddress = await fetchLiveAddress(loc.coords.latitude, loc.coords.longitude);
        setAddress(liveAddress);
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
