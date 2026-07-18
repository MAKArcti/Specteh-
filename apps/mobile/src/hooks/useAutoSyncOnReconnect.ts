import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef } from 'react';

/**
 * Best-effort only: NetInfo's connectivity signal is unreliable in some
 * environments (e.g. this sandbox), so the app never relies on this alone —
 * every sync screen also exposes a manual "Sync now" button.
 */
export function useAutoSyncOnReconnect(onReconnect: () => void): void {
  const wasConnected = useRef<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = Boolean(state.isConnected && state.isInternetReachable !== false);
      if (isConnected && wasConnected.current === false) {
        onReconnect();
      }
      wasConnected.current = isConnected;
    });
    return unsubscribe;
  }, [onReconnect]);
}
