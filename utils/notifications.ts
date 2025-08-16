import PushNotification from 'react-native-push-notification';
import BackgroundTimer from 'react-native-background-timer';
import { Platform } from 'react-native';

class NotificationService {
  private activeTimers: Map<string, number> = new Map();

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

  scheduleAlarm = (title: string, body: string, date: Date): string | null => {
    try {
      const alarmId = Math.random().toString(36).substring(7);
      const timeDifference = date.getTime() - new Date().getTime();
      
      console.log(`--- Scheduling alarm with BackgroundTimer ---`);
      console.log(`ID: ${alarmId}, Title: ${title}, Date: ${date.toISOString()}`);
      console.log(`Time difference: ${timeDifference}ms (${Math.round(timeDifference / 1000 / 60)} minutes)`);

      // The timer can only be started if the time is in the future
      if (timeDifference > 0) {
        const timerId = BackgroundTimer.setTimeout(() => {
          console.log(`Alarm triggered for: ${title}`);
          
          // Trigger the local notification when alarm fires
          PushNotification.localNotification({
            channelId: 'default-channel-id',
            id: alarmId,
            title: title,
            message: body,
            importance: 4,
            priority: 'high',
            allowWhileIdle: true,
            playSound: true,
            soundName: 'default',
            vibrate: true,
            vibration: 300,
            ongoing: false,
            autoCancel: true,
          });

          // Clean up the timer reference
          this.activeTimers.delete(alarmId);
        }, timeDifference);

        // Store the timer ID so we can cancel it later if needed
        this.activeTimers.set(alarmId, timerId);
        
        console.log(`Alarm scheduled successfully with ID: ${alarmId}`);
        return alarmId;
      } else {
        console.error('Cannot schedule alarm in the past');
        return null;
      }
    } catch (error) {
      console.error('Error scheduling alarm:', error);
      return null;
    }
  };

  cancelAlarm = (alarmId: string) => {
    try {
      console.log(`Cancelling alarm with ID: ${alarmId}`);
      
      // Cancel the background timer
      const timerId = this.activeTimers.get(alarmId);
      if (timerId) {
        BackgroundTimer.clearTimeout(timerId);
        this.activeTimers.delete(alarmId);
        console.log(`Background timer cancelled for alarm: ${alarmId}`);
      }
      
      // Also cancel any existing notification with this ID
      PushNotification.cancelLocalNotification(alarmId);
      
    } catch (error) {
      console.error('Error cancelling alarm:', error);
    }
  };

  cancelAllAlarms = () => {
    try {
      console.log('Cancelling all alarms and notifications');
      
      // Cancel all background timers
      this.activeTimers.forEach((timerId, alarmId) => {
        BackgroundTimer.clearTimeout(timerId);
        console.log(`Cancelled timer for alarm: ${alarmId}`);
      });
      this.activeTimers.clear();
      
      // Cancel all local notifications
      PushNotification.cancelAllLocalNotifications();
      
    } catch (error) {
      console.error('Error cancelling all alarms:', error);
    }
  };

  // Legacy methods for backward compatibility
  scheduleNotification = (title: string, body: string, date: Date): string | null => {
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