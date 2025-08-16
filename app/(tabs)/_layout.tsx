import { Tabs } from 'expo-router';
import { List, Search, Settings, Bell } from 'lucide-react-native';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';

export default function TabLayout() {
  // This useEffect hook runs once when the app starts
  useEffect(() => {
    // We only need to configure this for Android
    if (Platform.OS === 'android') {
      // This configures the library
      PushNotification.configure({
        // (optional) Called when a remote is received or opened, or local notification is opened
        onNotification: function (notification) {
          console.log("NOTIFICATION:", notification);
        },

        // (optional) Called when Registered Action is pressed and invokeApp is false, if true onNotification will be called (Android)
        onAction: function (notification) {
          console.log("ACTION:", notification.action);
          console.log("NOTIFICATION:", notification);
        },

        // Should the initial notification be popped automatically
        // default: true
        popInitialNotification: true,

        /**
         * (optional) default: true
         * - Specified if permissions (ios) and channel (android) are requested or not,
         * - if not, you must call PushNotificationsHandler.requestPermissions() later
         * - if you are not using remote notification or do not have a firebase account, it is recommended to set to false
         */
        requestPermissions: true,
      });

      // You can also create a channel here, which is good practice for Android
      PushNotification.createChannel(
        {
          channelId: "default-channel-id", // (required)
          channelName: "Default Channel", // (required)
          channelDescription: "A default channel for app notifications", // (optional) default: undefined.
          soundName: "default", // (optional) See `soundName` parameter of `localNotification` function
          importance: 4, // (optional) default: 4. Int value of the Android notification importance
          vibrate: true, // (optional) default: true. Creates the default vibration pattern if true.
        },
        (created) => console.log(`createChannel 'default-channel-id' returned '${created}'`) // (optional) callback returns whether the channel was created, false means it already existed.
      );

// // ADD THIS TEST NOTIFICATION
//       PushNotification.localNotification({
//         channelId: "default-channel-id",
//         title: "App is Configured!",
//         message: "Notifications are working now!",
//         importance: 4,
//       });

    }
  }, []); // The empty array [] ensures this runs only once

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#14B8A6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Lists',
          tabBarIcon: ({ size, color }) => (
            <List size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ size, color }) => (
            <Search size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ size, color }) => (
            <Bell size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}