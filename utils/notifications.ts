import { Platform, Alert } from 'react-native';

// Simple alarm service that works reliably across platforms
class AlarmService {
  private activeTimers = new Map<string, NodeJS.Timeout>();
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      if (Platform.OS !== 'web') {
        // For mobile platforms, we'll use a hybrid approach
        // Try to import expo-notifications dynamically
        const Notifications = await import('expo-notifications');
        
        // Configure notification handler
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });

        // Request permissions
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Notification permissions not granted');
        } else {
          console.log('Notification permissions granted');
        }

        // Set up Android channel
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('reminders', {
            name: 'Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#14B8A6',
            sound: 'default',
          });
        }
      }
      
      this.isInitialized = true;
      console.log('Alarm service initialized successfully');
    } catch (error) {
      console.error('Error initializing alarm service:', error);
      // Continue without notifications if they fail to initialize
      this.isInitialized = true;
    }
  };

  scheduleAlarm = async (title: string, body: string, date: Date): Promise<string | null> => {
    try {
      await this.initialize();
      
      const now = new Date();
      const timeDifference = date.getTime() - now.getTime();
      
      console.log(`Scheduling alarm: ${title} for ${date.toISOString()}`);
      console.log(`Time difference: ${Math.round(timeDifference / 1000 / 60)} minutes`);

      if (timeDifference <= 0) {
        console.error('Cannot schedule alarm in the past');
        return null;
      }

      const alarmId = Math.random().toString(36).substring(7);

      if (Platform.OS === 'web') {
        // Web implementation with browser alert
        const timeoutId = setTimeout(() => {
          console.log(`Alarm triggered: ${title}`);
          alert(`🔔 ${title}\n\n${body}`);
          this.activeTimers.delete(alarmId);
        }, timeDifference);
        
        this.activeTimers.set(alarmId, timeoutId);
        console.log(`Web alarm scheduled with ID: ${alarmId}`);
        return alarmId;
      } else {
        // Mobile implementation
        try {
          const Notifications = await import('expo-notifications');
          
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: title,
              body: body,
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.HIGH,
              categoryIdentifier: 'reminder',
              data: { alarmId },
            },
            trigger: {
              date: date,
            },
          });
          
          this.activeTimers.set(alarmId, notificationId);
          console.log(`Mobile notification scheduled with ID: ${notificationId}`);
          return alarmId;
        } catch (notificationError) {
          console.error('Expo notifications failed, using fallback timer:', notificationError);
          
          // Fallback to simple timer with alert
          const timeoutId = setTimeout(() => {
            console.log(`Fallback alarm triggered: ${title}`);
            Alert.alert(title, body);
            this.activeTimers.delete(alarmId);
          }, timeDifference);
          
          this.activeTimers.set(alarmId, timeoutId);
          console.log(`Fallback alarm scheduled with ID: ${alarmId}`);
          return alarmId;
        }
      }
    } catch (error) {
      console.error('Error scheduling alarm:', error);
      return null;
    }
  };

  cancelAlarm = async (alarmId: string) => {
    try {
      console.log(`Cancelling alarm with ID: ${alarmId}`);
      
      const identifier = this.activeTimers.get(alarmId);
      if (!identifier) {
        console.log(`No active alarm found for ID: ${alarmId}`);
        return;
      }

      if (Platform.OS === 'web') {
        clearTimeout(identifier as NodeJS.Timeout);
        console.log(`Web timeout cleared for alarm: ${alarmId}`);
      } else {
        try {
          const Notifications = await import('expo-notifications');
          await Notifications.cancelScheduledNotificationAsync(identifier as string);
          console.log(`Notification cancelled for alarm: ${alarmId}`);
        } catch (error) {
          // If expo-notifications fails, try clearing as timeout
          clearTimeout(identifier as NodeJS.Timeout);
          console.log(`Fallback timeout cleared for alarm: ${alarmId}`);
        }
      }
      
      this.activeTimers.delete(alarmId);
    } catch (error) {
      console.error('Error cancelling alarm:', error);
    }
  };

  cancelAllAlarms = async () => {
    try {
      console.log('Cancelling all alarms');
      
      if (Platform.OS === 'web') {
        // Clear all web timeouts
        for (const [alarmId, timeoutId] of this.activeTimers.entries()) {
          clearTimeout(timeoutId as NodeJS.Timeout);
          console.log(`Cleared web timeout for alarm: ${alarmId}`);
        }
      } else {
        try {
          const Notifications = await import('expo-notifications');
          await Notifications.cancelAllScheduledNotificationsAsync();
          console.log('All scheduled notifications cancelled');
        } catch (error) {
          // Fallback: clear all as timeouts
          for (const [alarmId, identifier] of this.activeTimers.entries()) {
            clearTimeout(identifier as NodeJS.Timeout);
            console.log(`Fallback timeout cleared for alarm: ${alarmId}`);
          }
        }
      }
      
      this.activeTimers.clear();
    } catch (error) {
      console.error('Error cancelling all alarms:', error);
    }
  };

  // Get active alarm count for debugging
  getActiveAlarmCount = () => {
    return this.activeTimers.size;
  };
}

export const notificationManager = new AlarmService();