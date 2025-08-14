import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ReminderModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (date: Date) => void;
  noteText: string;
}

export function ReminderModal({ visible, onClose, onSave, noteText }: ReminderModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSave = () => {
    // Combine date and time
    const reminderDateTime = new Date(selectedDate);
    reminderDateTime.setHours(selectedTime.getHours());
    reminderDateTime.setMinutes(selectedTime.getMinutes());
    
    onSave(reminderDateTime);
    
    // Auto-close after 1 second
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>Set Reminder</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.notePreview}>
            <Text style={styles.notePreviewLabel}>Note:</Text>
            <Text style={styles.notePreviewText} numberOfLines={3}>
              {noteText}
            </Text>
          </View>

          <View style={styles.dateTimeSection}>
            <Text style={styles.sectionTitle}>Select Date & Time</Text>
            
            <TouchableOpacity 
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeLabel}>Date</Text>
              <Text style={styles.dateTimeValue}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateTimeLabel}>Time</Text>
              <Text style={styles.dateTimeValue}>{formatTime(selectedTime)}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Activate Reminder</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) {
                setSelectedDate(date);
              }
            }}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, time) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (time) {
                setSelectedTime(time);
              }
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  notePreview: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notePreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  notePreviewText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
  },
  dateTimeSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  dateTimeButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateTimeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveButton: {
    backgroundColor: '#14B8A6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});