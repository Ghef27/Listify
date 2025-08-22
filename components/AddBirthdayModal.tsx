import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useEffect } from 'react';
import { X, Camera, Calendar } from 'lucide-react-native';
import { Note } from '@/types';

interface AddBirthdayModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, month: number, day: number, image?: string) => void;
  editingBirthday?: Note | null;
}

export function AddBirthdayModal({ visible, onClose, onSave, editingBirthday }: AddBirthdayModalProps) {
  const [name, setName] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Populate fields when editing
  useEffect(() => {
    if (editingBirthday && visible) {
      setName(editingBirthday.text);
      setSelectedMonth(editingBirthday.birthdayMonth || null);
      setSelectedDay(editingBirthday.birthdayDay || null);
      setSelectedImage(editingBirthday.birthdayImage || null);
    } else if (!editingBirthday && visible) {
      // Reset for new birthday
      setName('');
      setSelectedMonth(null);
      setSelectedDay(null);
      setSelectedImage(null);
    }
  }, [editingBirthday, visible]);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (month: number) => {
    const daysInMonth = new Date(2024, month - 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const handleSave = () => {
    if (name.trim() && selectedMonth && selectedDay) {
      onSave(name.trim(), selectedMonth, selectedDay, selectedImage || undefined);
      handleClose();
    } else {
      Alert.alert('Missing Information', 'Please fill in the name, month, and day.');
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedMonth(null);
    setSelectedDay(null);
    setSelectedImage(null);
    onClose();
  };

  const handleImageUpload = () => {
    // For now, use sample images since expo-image-picker requires native modules
    const sampleImages = [
      'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1484794/pexels-photo-1484794.jpeg?auto=compress&cs=tinysrgb&w=400',
    ];

    Alert.alert(
      'Select Photo',
      'Choose how to add a photo',
      [
        { text: 'Cancel' },
        ...(selectedImage ? [{ 
          text: 'Remove Photo', 
          style: 'destructive' as const,
          onPress: () => setSelectedImage(null)
        }] : []),
        { 
          text: 'Use Sample Photo', 
          onPress: () => {
            const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
            setSelectedImage(randomImage);
          }
        },
      ]
    );
  };


  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {editingBirthday ? 'Edit Birthday' : 'Add Birthday'}
          </Text>
          <TouchableOpacity 
            onPress={handleSave}
            style={[styles.saveButton, (!name.trim() || !selectedMonth || !selectedDay) && styles.saveButtonDisabled]}
            disabled={!name.trim() || !selectedMonth || !selectedDay}
          >
            <Text style={[styles.saveButtonText, (!name.trim() || !selectedMonth || !selectedDay) && styles.saveButtonTextDisabled]}>
              {editingBirthday ? 'Update' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Person's Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter name"
              autoFocus
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo</Text>
            <TouchableOpacity style={styles.imageUpload} onPress={handleImageUpload}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.uploadedImage} />
              ) : (
                <>
                  <Camera size={32} color="#6B7280" />
                  <Text style={styles.imageUploadText}>
                    {selectedImage ? 'Tap to change photo' : 'Tap to add photo'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Birth Month</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthsContainer}>
              {months.map((month, index) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.monthChip,
                    selectedMonth === index + 1 && styles.monthChipSelected
                  ]}
                  onPress={() => {
                    setSelectedMonth(index + 1);
                    setSelectedDay(null); // Reset day when month changes
                  }}
                >
                  <Text style={[
                    styles.monthChipText,
                    selectedMonth === index + 1 && styles.monthChipTextSelected
                  ]}>
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {selectedMonth && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Birth Day</Text>
              <View style={styles.daysGrid}>
                {getDaysInMonth(selectedMonth).map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayChip,
                      selectedDay === day && styles.dayChipSelected
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text style={[
                      styles.dayChipText,
                      selectedDay === day && styles.dayChipTextSelected
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {selectedMonth && selectedDay && (
            <View style={styles.previewSection}>
              <View style={styles.previewCard}>
                <Calendar size={20} color="#EC4899" />
                <Text style={styles.previewText}>
                  {name || 'Person'}'s birthday is on {months[selectedMonth - 1]} {selectedDay}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#14B8A6',
  },
  saveButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imageUpload: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    minHeight: 120,
  },
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  imageUploadText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  monthsContainer: {
    flexDirection: 'row',
  },
  monthChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  monthChipSelected: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  monthChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  monthChipTextSelected: {
    color: '#fff',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  dayChipSelected: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  dayChipTextSelected: {
    color: '#fff',
  },
  previewSection: {
    marginTop: 16,
  },
  previewCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  previewText: {
    fontSize: 16,
    color: '#0F766E',
    marginLeft: 12,
    flex: 1,
  },
});