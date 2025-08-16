import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private isConfigured = false;
  private activeAlarms = new Map<string, any>();

  configure = async () => {
    if (this.isConfigured) return;
    
    try {
      console.log('Configuring notification service...');
      
      if (Platform.OS !== 'web') {
        // Request permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.warn('Notification permissions not granted');
          return;
        }
        
        console.log('Notification permissions granted');
        
        // Set notification channel for Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Listify Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#14B8A6',
            sound: 'default',
            enableVibrate: true,
          });
          console.log('Android notification channel created');
        }
      }
      
      this.isConfigured = true;
      console.log('Notification service configured successfully');
    } catch (error) {
      console.error('Error configuring notifications:', error);
    }
  };

  scheduleAlarm = async (title: string, body: string, date: Date): Promise<string | null> => {
    try {
      console.log(`--- Scheduling alarm ---`);
      console.log(`Title: ${title}, Body: ${body}, Date: ${date.toISOString()}`);
      
      const now = new Date();
      const timeDifference = date.getTime() - now.getTime();
      
      console.log(`Time difference: ${timeDifference}ms (${Math.round(timeDifference / 1000 / 60)} minutes)`);

      if (timeDifference <= 0) {
        console.error('Cannot schedule alarm in the past');
        return null;
      }

      const alarmId = Math.random().toString(36).substring(7);

      if (Platform.OS === 'web') {
        // For web, use regular setTimeout with alert
        const timeoutId = setTimeout(() => {
          console.log(`Web alarm triggered for: ${title}`);
          alert(`${title}\n\n${body}`);
          this.activeAlarms.delete(alarmId);
        }, timeDifference);
        
        this.activeAlarms.set(alarmId, timeoutId);
        console.log(`Web alarm scheduled with ID: ${alarmId}`);
        return alarmId;
      } else {
        // For mobile, use Expo Notifications with proper scheduling
        await this.configure();
        
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
        
        this.activeAlarms.set(alarmId, notificationId);
        console.log(`Mobile alarm scheduled with notification ID: ${notificationId}, alarm ID: ${alarmId}`);
        return alarmId;
      }
    } catch (error) {
      console.error('Error scheduling alarm:', error);
      return null;
    }
  };

  cancelAlarm = async (alarmId: string) => {
    try {
      console.log(`Cancelling alarm with ID: ${alarmId}`);
      
      const identifier = this.activeAlarms.get(alarmId);
      if (!identifier) {
        console.log(`No active alarm found for ID: ${alarmId}`);
        return;
      }

      if (Platform.OS === 'web') {
        clearTimeout(identifier);
        console.log(`Web timeout cleared for alarm: ${alarmId}`);
      } else {
        await Notifications.cancelScheduledNotificationAsync(identifier);
        console.log(`Notification cancelled for alarm: ${alarmId}`);
      }
      
      this.activeAlarms.delete(alarmId);
    } catch (error) {
      console.error('Error cancelling alarm:', error);
    }
  };

  cancelAllAlarms = async () => {
    try {
      console.log('Cancelling all alarms and notifications');
      
      if (Platform.OS === 'web') {
        // Clear all web timeouts
        for (const [alarmId, timeoutId] of this.activeAlarms.entries()) {
          clearTimeout(timeoutId);
          console.log(`Cleared web timeout for alarm: ${alarmId}`);
        }
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('All scheduled notifications cancelled');
      }
      
      this.activeAlarms.clear();
    } catch (error) {
      console.error('Error cancelling all alarms:', error);
    }
  };

  // Legacy methods for backward compatibility
  scheduleNotification = (title: string, body: string, date: Date): Promise<string | null> => {
    console.warn('scheduleNotification is deprecated, use scheduleAlarm instead');
    return this.scheduleAlarm(title, body, date);
  };

  cancelNotification = (notificationId: string) => {
    console.warn('cancelNotification is deprecated, use cancelAlarm instead');
    this.cancelAlarm(notificationId);
  };

  cancelAllNotifications = () => {
    console.warn('cancelAllNotifications is deprecated, use cancelAllAlarms instead');
    this.cancelAllAlarms();
  };
}

export const notificationManager = new NotificationService();