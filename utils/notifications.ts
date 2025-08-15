    import * as Notifications from 'expo-notifications';
    import { Platform } from 'react-native';

// Add this block at the top of notifications.ts
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
        // --- DIAGNOSTIC LOGGING ---
        console.log('--- NotificationService: scheduleNotification triggered ---');
        console.log(`[10] Received date to schedule: ${date.toISOString()}`);
        
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
            console.error('[!] Notification permissions not granted');
            throw new Error('Notification permissions not granted');
        }

        const trigger = {
            date: date,
            channelId: 'default',
        };
        console.log(`[11] Final trigger object being sent to Expo:`, JSON.stringify(trigger, null, 2));
        console.log("[11] Date type:", typeof trigger.date, trigger.date instanceof Date);
console.log("[11] Raw trigger object:", trigger);


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
