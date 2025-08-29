import { useEffect, useState } from 'react';
import { Slot, SplashScreen } from 'expo-router';
import { loadAsync as loadFontsAsync } from 'expo-font';

// Prevent the splash screen from auto-hiding before we are ready.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Add any font loading or other initial setup tasks here
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  // This <Slot /> will render the (tabs) layout as the root.
  return <Slot />;
}