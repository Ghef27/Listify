import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';

// Conditionally import BackgroundTimer only for native platforms
let BackgroundTimer: any = null;
if (Platform.OS !== 'web') {
  try {
    BackgroundTimer = require('react-native-background-timer');
  } catch (error) {
    console.warn('BackgroundTimer not available:', error);
  }
}

class NotificationService {
  private activeTimers: Map<string, number> = new Map();

  constructor() {
    // Don't configure immediately, wait for proper initialization
  }

  configure = () => {
    if (Platform.OS !== 'web') {
      try {
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
      } catch (error) {
        console.warn('Failed to configure push notifications:', error);
      }
    }
  };

  scheduleAlarm = (title: string, body: string, date: Date): string | null => {
    try {
      const alarmId = Math.random().toString(36).substring(7);
      const timeDifference = date.getTime() - new Date().getTime();
      
      console.log(`--- Scheduling alarm with timer ---`);
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
          // For mobile, use BackgroundTimer if available, otherwise fallback to regular setTimeout
          if (BackgroundTimer) {
            const timerId = BackgroundTimer.setTimeout(() => {
              console.log(`Alarm triggered for: ${title}`);
              
              try {
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
              } catch (error) {
                console.error('Error showing notification:', error);
              }

              this.activeTimers.delete(alarmId);
            }, timeDifference);

            this.activeTimers.set(alarmId, timerId);
          } else {
            // Fallback to regular setTimeout
            console.warn('BackgroundTimer not available, using regular setTimeout');
            const timerId = setTimeout(() => {
              console.log(`Alarm triggered for: ${title}`);
              this.activeTimers.delete(alarmId);
            }, timeDifference);
            
            this.activeTimers.set(alarmId, timerId);
          }
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
        } else if (BackgroundTimer) {
          BackgroundTimer.clearTimeout(timerId);
        } else {
          clearTimeout(timerId);
        }
        this.activeTimers.delete(alarmId);
        console.log(`Timer cancelled for alarm: ${alarmId}`);
      }
      
      if (Platform.OS !== 'web') {
        try {
          PushNotification.cancelLocalNotification(alarmId);
        } catch (error) {
          console.warn('Error cancelling push notification:', error);
        }
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
        } else if (BackgroundTimer) {
          BackgroundTimer.clearTimeout(timerId);
        } else {
          clearTimeout(timerId);
        }
        console.log(`Cancelled timer for alarm: ${alarmId}`);
      });
      this.activeTimers.clear();
      
      if (Platform.OS !== 'web') {
        try {
          PushNotification.cancelAllLocalNotifications();
        } catch (error) {
          console.warn('Error cancelling all push notifications:', error);
        }
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