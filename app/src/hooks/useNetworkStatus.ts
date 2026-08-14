import { useState, useEffect } from 'react';
import * as Network from 'expo-network';

export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    async function checkNetwork() {
      try {
        const state = await Network.getNetworkStateAsync();
        // On Android, isInternetReachable can be false/null even with active connection.
        // If isConnected is true, we consider the device online.
        const online = state.isConnected !== false && (state.isInternetReachable !== false || state.isConnected === true);
        setIsOnline(online);
      } catch (e) {
        setIsOnline(true); // Fallback to online
      }
    }

    // Initial check
    checkNetwork();

    // Check periodically every 5 seconds (free fallback for NetInfo listener)
    const interval = setInterval(checkNetwork, 5000);

    return () => clearInterval(interval);
  }, []);

  return isOnline;
}
