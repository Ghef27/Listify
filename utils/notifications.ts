import PushNotification from 'react-native-push-notification';
import BackgroundTimer from 'react-native-background-timer';
import { Platform } from 'react-native';

class NotificationService {
  private activeTimers: Map<string, number> = new Map();

  constructor() {
    this.configure();
  }

  configure = () => {
    if (Platform.OS !== 'web') {
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
          importance: 4,
          vibrate: true,
        },
        (created) => console.log(`createChannel 'default-channel-id' returned '${created}'`)
      );
    }
  };

  scheduleAlarm = (title: string, body: string, date: Date): string | null => {
    try {
      const alarmId = Math.random().toString(36).substring(7);
      const timeDifference = date.getTime() - new Date().getTime();
      
      console.log(`--- Scheduling alarm with BackgroundTimer ---`);
      console.log(`ID: ${alarmId}, Title: ${title}, Date: ${date.toISOString()}`);
      console.log(`Time difference: ${timeDifference}ms (${Math.round(timeDifference / 1000 / 60)} minutes)`);

      if (timeDifference > 0) {
        if (Platform.OS === 'web') {
          // For web, use regular setTimeout
          const timerId = window.setTimeout(() => {
            console.log(`Alarm triggered for: ${title}`);
            alert(`Reminder: ${body}`);
            this.activeTimers.delete(alarmId);
          }, timeDifference);
          
          this.activeTimers.set(alarmId, timerId);
        } else {
          // For mobile, use BackgroundTimer
          const timerId = BackgroundTimer.setTimeout(() => {
            console.log(`Alarm triggered for: ${title}`);
            
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

            this.activeTimers.delete(alarmId);
          }, timeDifference);

          this.activeTimers.set(alarmId, timerId);
        }
        
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
      
      const timerId = this.activeTimers.get(alarmId);
      if (timerId) {
        if (Platform.OS === 'web') {
          window.clearTimeout(timerId);
        } else {
          BackgroundTimer.clearTimeout(timerId);
        }
        this.activeTimers.delete(alarmId);
        console.log(`Timer cancelled for alarm: ${alarmId}`);
      }
      
      if (Platform.OS !== 'web') {
        PushNotification.cancelLocalNotification(alarmId);
      }
      
    } catch (error) {
      console.error('Error cancelling alarm:', error);
    }
  };

  cancelAllAlarms = () => {
    try {
      console.log('Cancelling all alarms and notifications');
      
      this.activeTimers.forEach((timerId, alarmId) => {
        if (Platform.OS === 'web') {
          window.clearTimeout(timerId);
        } else {
          BackgroundTimer.clearTimeout(timerId);
        }
        console.log(`Cancelled timer for alarm: ${alarmId}`);
      });
      this.activeTimers.clear();
      
      if (Platform.OS !== 'web') {
        PushNotification.cancelAllLocalNotifications();
      }
      
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