import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    // Initialize alarm service when app starts
    const initializeAlarms = async () => {
      try {
        const { notificationManager } = await import('@/utils/notifications');
        await notificationManager.initialize();
      } catch (error) {
        console.log('Alarm service initialization skipped:', error.message);
      }
    };
    
    initializeAlarms();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
