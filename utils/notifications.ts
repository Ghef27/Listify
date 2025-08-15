import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// This block explicitly creates the notification channel for Android. Leave it here.
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  }

  static async scheduleNotification(
    title: string,
    body: string,
    date: Date
  ): Promise<string | null> {
    try {
      console.log('--- NotificationService: scheduleNotification triggered ---');
      console.log(`[10] Received date to schedule: ${date.toISOString()}`);
      
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.error('[!] Notification permissions not granted');
        throw new Error('Notification permissions not granted');
      }

      // --- FINAL FIX FROM STACK OVERFLOW ---
      // Calculate the difference in seconds between now and the future date.
      const seconds = (date.getTime() - new Date().getTime()) / 1000;

      // Use the 'seconds' trigger instead of the 'date' trigger.
      // We ensure it's at least 1 second in the future.
      const trigger = {
        seconds: seconds > 1 ? seconds : 1,
        channelId: 'default',
      };
      // --- END OF FIX ---
      
      console.log(`[11] Final trigger object being sent to Expo:`, JSON.stringify(trigger, null, 2));

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: title || 'Listify Reminder',
          body: body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Error in scheduleNotification:', error);
      return null;
    }
  }

  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }
}
