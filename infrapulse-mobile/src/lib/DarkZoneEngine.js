import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import * as Network from 'expo-network';

const SYNC_QUEUE_KEY = '@paimana_sync_queue';

export const DarkZoneEngine = {
  async saveOfflineData(data) {
    try {
      const existingQueue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      let queue = existingQueue ? JSON.parse(existingQueue) : [];
      
      const payload = { ...data, timestamp: new Date().toISOString() };
      queue.push(payload);

      // Implement Queue Management: Max 50 items. Evict oldest if exceeding limit.
      const MAX_QUEUE_SIZE = 50;
      if (queue.length > MAX_QUEUE_SIZE) {
        console.warn(`[DarkZoneEngine] Queue size exceeded ${MAX_QUEUE_SIZE}, evicting oldest ${queue.length - MAX_QUEUE_SIZE} items.`);
        queue = queue.slice(queue.length - MAX_QUEUE_SIZE);
      }
      
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      return { success: true, message: 'Saved offline' };
    } catch (e) {
      console.error('Failed to save offline data', e);
      return { success: false, error: e };
    }
  },

  async syncWithSupabase() {
    try {
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) return { success: false, reason: 'offline' };

      const existingQueue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (!existingQueue) return { success: true, count: 0 };
      
      let queue = JSON.parse(existingQueue);
      if (queue.length === 0) return { success: true, count: 0 };

      // Check if the user hasn't configured Supabase yet
      if (supabase.supabaseUrl && supabase.supabaseUrl.includes('your-project-url')) {
        console.log('[SIMULATED SYNC] Simulating flush to server since Supabase keys are placeholders...');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network latency
      } else {
        // Actual sync logic to Supabase
        const { error } = await supabase.from('field_reports').insert(queue);
        if (error) throw error;
      }
      
      // Clear queue on success
      await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
      return { success: true, count: queue.length };
    } catch (e) {
      console.error('Failed to sync', e);
      return { success: false, error: e };
    }
  }
};
