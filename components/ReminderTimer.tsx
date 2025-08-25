import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, TriangleAlert as AlertTriangle } from 'lucide-react-native';

interface ReminderTimerProps {
  reminderDate: Date;
  isExpired?: boolean;
  onExpire?: () => void;
}

export function ReminderTimer({ reminderDate, isExpired = false, onExpire }: ReminderTimerProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(isExpired);

  useEffect(() => {
    if (expired) return;

    const updateTimer = () => {
      const now = new Date();
      const timeDiff = reminderDate.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setExpired(true);
        setTimeLeft('Expired');
        onExpire?.();
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      let timeString = '';
      if (days > 0) {
        timeString += `${days}d `;
      }
      if (hours > 0 || days > 0) {
        timeString += `${hours}h `;
      }
      timeString += `${minutes}m`;

      setTimeLeft(timeString.trim());
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [reminderDate, expired, onExpire]);

  if (expired) {
    return (
      <View style={styles.expiredContainer}>
        <AlertTriangle size={14} color="#EF4444" />
        <Text style={styles.expiredText}>Expired</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Clock size={14} color="#14B8A6" />
      <Text style={styles.timeText}>Remaining: {timeLeft}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f9f9f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0FDF4',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#14B8A6',
    marginLeft: 4,
  },
  expiredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f9f9f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEF2F2',
  },
  expiredText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 4,
  },
});