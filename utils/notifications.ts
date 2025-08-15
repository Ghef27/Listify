import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';

class NotificationService {
  constructor() {
    this.configure();
  }

  configure = () => {
    PushNotification.configure({
      onNotification: function (notification) {
        console.log('LOCAL NOTIFICATION ==>', notification);
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    PushNotification.createChannel(
      {
        channelId: 'default-channel-id',
        channelName: 'Default Channel',
        channelDescription: 'A default channel for app notifications',
        soundName: 'default',
        importance: 4, // Importance.HIGH
        vibrate: true,
      },
      (created) => console.log(`createChannel 'default-channel-id' returned '${created}'`)
    );
  };

  scheduleNotification = (title: string, body: string, date: Date): string | null => {
    try {
      const notificationId = Math.random().toString(36).substring(7);
      console.log(`--- Scheduling notification with new library ---`);
      console.log(`ID: ${notificationId}, Title: ${title}, Date: ${date.toISOString()}`);

      PushNotification.localNotificationSchedule({
        channelId: 'default-channel-id',
        id: notificationId,
        title: title,
        message: body,
        date: date,
        allowWhileIdle: true,
        playSound: true,
        soundName: 'default',
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification with new library:', error);
      return null;
    }
  };

  cancelNotification = (notificationId: string) => {
    console.log(`Cancelling notification with ID: ${notificationId}`);
    PushNotification.cancelLocalNotification(notificationId);
  };

  cancelAllNotifications = () => {
    console.log('Cancelling all local notifications');
    PushNotification.cancelAllLocalNotifications();
  };
}

export const notificationManager = new NotificationService();