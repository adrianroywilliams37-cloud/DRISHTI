import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

const QUEUE_KEY = '@paimana_offline_queue';

export function useOfflineSync(syncEndpoint) {
  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);

  // Check network status periodically (since expo-network doesn't have an event listener for raw state changes)
  useEffect(() => {
    let interval;
    
    const checkNetwork = async () => {
      const networkState = await Network.getNetworkStateAsync();
      const connected = !!(networkState.isConnected && networkState.isInternetReachable);
      setIsOnline(connected);
      
      // Update queue count
      const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
      if (queueStr) {
        const queue = JSON.parse(queueStr);
        setQueueCount(queue.length);
      } else {
        setQueueCount(0);
      }
    };

    checkNetwork();
    interval = setInterval(checkNetwork, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Try to sync whenever we come back online
  useEffect(() => {
    if (isOnline) {
      flushQueue();
    }
  }, [isOnline]);

  const flushQueue = async () => {
    try {
      const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
      if (!queueStr) return;
      
      const queue = JSON.parse(queueStr);
      if (queue.length === 0) return;

      console.log(`[Sync] Attempting to sync ${queue.length} items...`);
      
      const successfulIds = [];
      
      for (const item of queue) {
        try {
          // Add a retry block or simple fetch
          const res = await fetch(syncEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Bypass-Tunnel-Reminder': '1',
            },
            body: JSON.stringify(item.payload)
          });
          
          if (res.ok) {
            successfulIds.push(item.id);
          } else {
            console.warn('[Sync] Server rejected item:', item.id, await res.text());
          }
        } catch (e) {
          console.warn('[Sync] Failed to sync item:', item.id, e);
          // Stop processing if the network actually died during flush
          break;
        }
      }

      // Remove successful items from queue
      const remainingQueue = queue.filter(q => !successfulIds.includes(q.id));
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
      setQueueCount(remainingQueue.length);
      
      if (successfulIds.length > 0) {
        console.log(`[Sync] Successfully synced ${successfulIds.length} items.`);
      }

    } catch (e) {
      console.error('[Sync] Error flushing queue', e);
    }
  };

  const enqueueData = async (payload) => {
    try {
      const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
      const queue = queueStr ? JSON.parse(queueStr) : [];
      
      const newItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        payload
      };
      
      const newQueue = [...queue, newItem];
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
      setQueueCount(newQueue.length);
      console.log('[Sync] Added to offline queue. Total items:', newQueue.length);
      
      // If we are online, try to flush immediately
      if (isOnline) {
        flushQueue();
      }
      
      return true;
    } catch (e) {
      console.error('[Sync] Failed to enqueue data', e);
      return false;
    }
  };

  return {
    isOnline,
    queueCount,
    enqueueData,
    flushQueue
  };
}
