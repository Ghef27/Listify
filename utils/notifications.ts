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

      if (Platform.OS === 'web') {
        // For web, use regular setTimeout with alert
        const alarmId = Math.random().toString(36).substring(7);
        
        setTimeout(() => {
          console.log(`Web alarm triggered for: ${title}`);
          alert(`${title}\n\n${body}`);
        }, timeDifference);
        
        console.log(`Web alarm scheduled with ID: ${alarmId}`);
        return alarmId;
      } else {
        // For mobile, use Expo Notifications
        await this.configure();
        
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: title,
            body: body,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
            categoryIdentifier: 'reminder',
          },
          trigger: {
            date: date,
          },
        });
        
        console.log(`Mobile alarm scheduled with notification ID: ${notificationId}`);
        return notificationId;
      }
    } catch (error) {
      console.error('Error scheduling alarm:', error);
      return null;
    }
  };

  cancelAlarm = async (alarmId: string) => {
    try {
      console.log(`Cancelling alarm with ID: ${alarmId}`);
      
      if (Platform.OS !== 'web') {
        await Notifications.cancelScheduledNotificationAsync(alarmId);
        console.log(`Notification cancelled for alarm: ${alarmId}`);
      }
    } catch (error) {
      console.error('Error cancelling alarm:', error);
    }
  };

  cancelAllAlarms = async () => {
    try {
      console.log('Cancelling all alarms and notifications');
      
      if (Platform.OS !== 'web') {
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('All scheduled notifications cancelled');
      }
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