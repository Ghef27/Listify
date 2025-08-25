import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, Trash2, Bell } from 'lucide-react-native';
import { Note } from '@/types';

interface NoteItemProps {
  note: Note;
  onToggleComplete: (noteId: string) => void;
  onDelete?: (noteId: string) => void;
  onSetReminder?: (note: Note) => void;
  onPress?: (note: Note) => void;
  showDeleteButton?: boolean;
  showReminderButton?: boolean;
}

export function NoteItem({ 
  note, 
  onToggleComplete, 
  onDelete, 
  onSetReminder,
  onPress, 
  showDeleteButton = false,
  showReminderButton = false 
}: NoteItemProps) {
  const isExpired = note.reminderDate && new Date(note.reminderDate) < new Date();
  
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        note.completed && styles.containerCompleted,
        isExpired && styles.containerExpired
      ]} 
      onPress={() => onPress?.(note)}
      activeOpacity={0.7}
    >
      <TouchableOpacity
        style={[styles.checkbox, note.completed && styles.checkboxCompleted]}
        onPress={() => onToggleComplete(note.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {note.completed && <Check size={16} color="#fff" strokeWidth={3} />}
      </TouchableOpacity>
      
      <View style={styles.content}>
        <Text style={[
          styles.text, 
          note.completed && styles.textCompleted
        ]}>
          {note.text}
        </Text>
        <View style={styles.listNameContainer}>
          <Text style={styles.listName}>{note.listName}</Text>
          {note.reminderDate && new Date(note.reminderDate) < new Date() && (
            <Text style={styles.expiredText}> </Text> // AICI ERA "! Expired" text dar daca il stergeam crapa aplicatia
           )}
        </View>
        <Text style={styles.creationDate}>
          {new Date(note.createdAt).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        {showReminderButton && onSetReminder && (
          <TouchableOpacity 
            style={styles.reminderButton}
            onPress={() => onSetReminder(note)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Bell size={18} color={note.reminderDate ? "#14B8A6" : "#9CA3AF"} />
          </TouchableOpacity>
        )}
        
        {showDeleteButton && onDelete && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => onDelete(note.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  containerCompleted: {
    backgroundColor: '#F3F4F6',
  },
  containerExpired: {
    backgroundColor: '#FEF2F2',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
  },
  textCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  listName: {
    fontSize: 12,
    color: '#6B7280',
  },
  listNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  expiredText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  creationDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  reminderButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
});